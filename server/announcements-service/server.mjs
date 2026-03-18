import http from 'node:http';

import {
  clearSessionCookie,
  createToken,
  hashPassword,
  parseCookies,
  serializeSessionCookie,
  verifyPassword,
} from './auth.mjs';
import {
  deriveSupportPlatforms,
  resolvePlatformCards,
} from './platform-registry.mjs';
import {
  appendAudit,
  ensureStorage,
  getAnnouncement,
  getPlatformCache,
  getSettings,
  getUsers,
  listAnnouncements,
  readPublishedSnapshot,
  savePlatformCache,
  saveSettings,
  saveUsers,
  syncPublishedAggregate,
  writeAnnouncement,
} from './storage.mjs';

const port = Number(process.env.CRD_ANNOUNCEMENTS_PORT || 3001);
const host = process.env.CRD_ANNOUNCEMENTS_HOST || '127.0.0.1';
const sessions = new Map();
const linkPattern = /(https?:\/\/[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;
const announcementLevels = new Set(['info', 'success', 'warning', 'danger']);
const announcementStatuses = new Set(['draft', 'in_review', 'published', 'archived']);
const adminRoles = new Set(['owner', 'editor', 'reviewer']);
const supportedPlatforms = new Set([
  'github',
  'bilibili',
  'youtube',
  'roblox-game',
  'roblox-group',
  'roblox-profile',
  'roblox-devforum',
]);

function json(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

function isSecureRequest(request) {
  return request.socket.encrypted || request.headers['x-forwarded-proto'] === 'https';
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

function nowIso() {
  return new Date().toISOString();
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function normalizeUrl(value) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function toStringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function collectLinks(payload) {
  const links = [];

  if (Array.isArray(payload.links)) {
    for (const entry of payload.links) {
      const value = toStringValue(entry);
      if (value) {
        links.push(normalizeUrl(value));
      }
    }
  } else if (typeof payload.links === 'string') {
    for (const entry of payload.links.split(/\r?\n|,/)) {
      const value = toStringValue(entry);
      if (value) {
        links.push(normalizeUrl(value));
      }
    }
  }

  const content = toStringValue(payload.content);
  const discovered = content.match(linkPattern) || [];
  for (const entry of discovered) {
    links.push(normalizeUrl(entry));
  }

  return [...new Set(links)];
}

async function resolveAnnouncementPlatforms(payload) {
  const normalizedLink = toStringValue(payload.link);
  const links = collectLinks(payload);
  const candidates = [
    ...links,
    ...(normalizedLink ? [normalizeUrl(normalizedLink)] : []),
  ];

  const cache = await getPlatformCache();
  const cachedCards = [];
  const missing = [];

  for (const url of [...new Set(candidates)]) {
    if (cache[url]?.card) {
      cachedCards.push(cache[url].card);
    } else {
      missing.push(url);
    }
  }

  const freshCards = await resolvePlatformCards(missing);
  if (freshCards.length > 0) {
    for (const card of freshCards) {
      cache[card.url] = {
        cachedAt: nowIso(),
        card,
      };
    }
    await savePlatformCache(cache);
  }

  const platformCards = [...cachedCards, ...freshCards];
  return {
    links,
    supportPlatforms: deriveSupportPlatforms(platformCards),
    platformCards,
  };
}

function getSessionFromRequest(request) {
  const cookies = parseCookies(request.headers.cookie || '');
  const sessionId = cookies.crd_admin_session;
  if (!sessionId) {
    return null;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return { ...session, sessionId };
}

async function getAuthenticatedUser(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return { session: null, user: null };
  }

  const users = await getUsers();
  const user = users.find((entry) => entry.id === session.userId);
  if (!user) {
    sessions.delete(session.sessionId);
    return { session: null, user: null };
  }

  return {
    session,
    user,
  };
}

function requireSession(response, session, user) {
  if (!session || !user) {
    json(response, 401, { error: 'Authentication required.' });
    return false;
  }

  return true;
}

function requireCsrf(request, response, session) {
  const csrfToken = request.headers['x-csrf-token'];
  if (!session || !csrfToken || csrfToken !== session.csrfToken) {
    json(response, 403, { error: 'Invalid CSRF token.' });
    return false;
  }

  return true;
}

function hasRole(user, roles) {
  return user && roles.includes(user.role);
}

function canEditAnnouncement(user, record) {
  if (!user) {
    return false;
  }

  if (user.role === 'owner') {
    return true;
  }

  if (user.role === 'editor') {
    return record.authorId === user.id && record.status !== 'archived';
  }

  return false;
}

function recordAudit(record, actorId, action, note) {
  const entry = {
    at: nowIso(),
    actorId,
    action,
    note,
  };

  return {
    ...record,
    auditTrail: [...(record.auditTrail || []), entry],
  };
}

async function persistRecordWithAudit(record, actorId, action, note) {
  const nextRecord = recordAudit(record, actorId, action, note);
  await writeAnnouncement(nextRecord);
  await appendAudit(nextRecord.id, nextRecord.auditTrail.at(-1));
  await syncPublishedAggregate();
  return nextRecord;
}

async function buildAnnouncementRecord(payload, existingRecord, actorId) {
  const title = toStringValue(payload.title) || existingRecord?.title || '';
  const content = toStringValue(payload.content) || existingRecord?.content || '';
  if (!title || !content) {
    throw new Error('Title and content are required.');
  }

  const link = toStringValue(payload.link) || existingRecord?.link || '';
  const linkText = toStringValue(payload.linkText) || existingRecord?.linkText || '查看详情';
  const publishedAt = toStringValue(payload.publishedAt) || existingRecord?.publishedAt || '';
  const scheduledAt = toStringValue(payload.scheduledAt) || existingRecord?.scheduledAt || '';
  const expiresAt = toStringValue(payload.expiresAt) || existingRecord?.expiresAt || '';
  const internalNotes = toStringValue(payload.internalNotes) || existingRecord?.internalNotes || '';
  const level = announcementLevels.has(payload.level) ? payload.level : (existingRecord?.level || 'info');
  const status = announcementStatuses.has(payload.status) ? payload.status : (existingRecord?.status || 'draft');
  const pinned = payload.pinned === undefined ? Boolean(existingRecord?.pinned) : toBoolean(payload.pinned);
  const id = existingRecord?.id
    || toStringValue(payload.id)
    || `${slugify(title) || 'announcement'}-${Date.now()}`;

  const resolved = await resolveAnnouncementPlatforms({ ...payload, content, links: payload.links, link });

  return {
    ...(existingRecord || {}),
    id,
    title,
    content,
    link: link ? normalizeUrl(link) : undefined,
    linkText,
    links: resolved.links,
    pinned,
    level,
    publishedAt: publishedAt || undefined,
    scheduledAt: scheduledAt || undefined,
    expiresAt: expiresAt || undefined,
    supportPlatforms: resolved.supportPlatforms,
    platformCards: resolved.platformCards,
    status,
    authorId: existingRecord?.authorId || actorId,
    reviewerId: existingRecord?.reviewerId,
    publishedBy: existingRecord?.publishedBy,
    version: Number(existingRecord?.version || 0) + 1,
    internalNotes,
    auditTrail: existingRecord?.auditTrail || [],
  };
}

function filterAnnouncementsBySection(records, section) {
  if (!section) {
    return records;
  }

  return records.filter((record) => record.status === section);
}

async function handleLogin(request, response) {
  const body = await readBody(request);
  const username = toStringValue(body.username);
  const password = toStringValue(body.password);

  const users = await getUsers();
  const user = users.find((entry) => entry.username === username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    json(response, 401, { error: '用户名或密码错误。' });
    return;
  }

  const sessionId = createToken(24);
  const csrfToken = createToken(24);
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12;
  sessions.set(sessionId, {
    userId: user.id,
    csrfToken,
    expiresAt,
  });

  json(
    response,
    200,
    {
      authenticated: true,
      csrfToken,
      user: sanitizeUser(user),
    },
    {
      'Set-Cookie': serializeSessionCookie(sessionId, isSecureRequest(request)),
    },
  );
}

async function handleLogout(request, response) {
  const session = getSessionFromRequest(request);
  if (session) {
    sessions.delete(session.sessionId);
  }

  json(
    response,
    200,
    { authenticated: false },
    { 'Set-Cookie': clearSessionCookie(isSecureRequest(request)) },
  );
}

async function handleSession(request, response) {
  const { session, user } = await getAuthenticatedUser(request);
  if (!session || !user) {
    json(response, 200, { authenticated: false });
    return;
  }

  json(response, 200, {
    authenticated: true,
    csrfToken: session.csrfToken,
    user: sanitizeUser(user),
  });
}

async function handleListAnnouncements(request, response, user) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const section = toStringValue(url.searchParams.get('status'));
  const records = filterAnnouncementsBySection(await listAnnouncements(), section);
  json(response, 200, { items: records, user: sanitizeUser(user) });
}

async function handleGetAnnouncement(response, announcementId) {
  const record = await getAnnouncement(announcementId);
  if (!record) {
    json(response, 404, { error: 'Announcement not found.' });
    return;
  }

  json(response, 200, record);
}

async function handleCreateAnnouncement(request, response, user) {
  if (!hasRole(user, ['owner', 'editor'])) {
    json(response, 403, { error: 'Only owner or editor can create announcements.' });
    return;
  }

  const body = await readBody(request);
  const record = await buildAnnouncementRecord(body, null, user.id);
  const created = await persistRecordWithAudit(record, user.id, 'created', 'Created draft announcement.');
  json(response, 201, created);
}

async function handlePatchAnnouncement(request, response, user) {
  if (!hasRole(user, ['owner', 'editor'])) {
    json(response, 403, { error: 'Only owner or editor can update announcements.' });
    return;
  }

  const body = await readBody(request);
  const id = toStringValue(body.id);
  if (!id) {
    json(response, 400, { error: 'Announcement id is required.' });
    return;
  }

  const existing = await getAnnouncement(id);
  if (!existing) {
    json(response, 404, { error: 'Announcement not found.' });
    return;
  }

  if (!canEditAnnouncement(user, existing)) {
    json(response, 403, { error: 'You do not have permission to edit this announcement.' });
    return;
  }

  const record = await buildAnnouncementRecord(body, existing, existing.authorId || user.id);
  const updated = await persistRecordWithAudit(record, user.id, 'updated', 'Updated announcement content.');
  json(response, 200, updated);
}

async function handleWorkflowAction(response, user, announcementId, action, note) {
  const record = await getAnnouncement(announcementId);
  if (!record) {
    json(response, 404, { error: 'Announcement not found.' });
    return;
  }

  if (action === 'submit-review' && !hasRole(user, ['owner', 'editor'])) {
    json(response, 403, { error: 'Only owner or editor can submit for review.' });
    return;
  }

  if (action !== 'submit-review' && !hasRole(user, ['owner', 'reviewer'])) {
    json(response, 403, { error: 'Only owner or reviewer can manage publishing states.' });
    return;
  }

  let nextRecord = { ...record };
  if (action === 'submit-review') {
    nextRecord.status = 'in_review';
  } else if (action === 'publish') {
    nextRecord.status = 'published';
    nextRecord.reviewerId = user.id;
    nextRecord.publishedBy = user.id;
    nextRecord.publishedAt = nextRecord.publishedAt || nowIso();
  } else if (action === 'archive') {
    nextRecord.status = 'archived';
  } else if (action === 'restore') {
    nextRecord.status = 'draft';
  }

  nextRecord.version = Number(nextRecord.version || 0) + 1;
  const persisted = await persistRecordWithAudit(nextRecord, user.id, action, note);
  json(response, 200, persisted);
}

async function handlePlatformResolve(request, response) {
  const body = await readBody(request);
  const link = toStringValue(body.link);
  const links = collectLinks(body);
  const cards = await resolvePlatformCards([...links, ...(link ? [link] : [])]);
  const cache = await getPlatformCache();
  for (const card of cards) {
    cache[card.url] = {
      cachedAt: nowIso(),
      card,
    };
  }
  await savePlatformCache(cache);

  json(response, 200, {
    cards,
    supportPlatforms: deriveSupportPlatforms(cards),
  });
}

async function handleGetUsers(response) {
  const users = await getUsers();
  json(response, 200, {
    items: users.map((user) => sanitizeUser(user)),
  });
}

async function handlePatchUsers(request, response) {
  const body = await readBody(request);
  const users = await getUsers();
  const target = body.user || {};
  const existing = users.find((entry) => entry.id === target.id || entry.username === target.username);
  const role = adminRoles.has(target.role) ? target.role : (existing?.role || 'editor');

  if (existing) {
    existing.displayName = toStringValue(target.displayName) || existing.displayName;
    existing.role = role;
    if (toStringValue(target.password)) {
      existing.passwordHash = hashPassword(toStringValue(target.password));
    }
  } else {
    const username = toStringValue(target.username);
    if (!username) {
      json(response, 400, { error: 'Username is required for new users.' });
      return;
    }

    users.push({
      id: target.id || username,
      username,
      displayName: toStringValue(target.displayName) || username,
      role,
      passwordHash: hashPassword(toStringValue(target.password) || 'ChangeMe-2026!'),
    });
  }

  await saveUsers(users);
  json(response, 200, {
    items: users.map((user) => sanitizeUser(user)),
  });
}

async function handleGetSettings(response) {
  json(response, 200, await getSettings());
}

async function handlePatchSettings(request, response) {
  const body = await readBody(request);
  const existing = await getSettings();
  const nextSettings = {
    siteTitle: toStringValue(body.siteTitle) || existing.siteTitle,
    subtitle: toStringValue(body.subtitle) || existing.subtitle,
    platformSupport: Array.isArray(body.platformSupport)
      ? body.platformSupport.filter((platform) => supportedPlatforms.has(platform))
      : existing.platformSupport,
  };

  await saveSettings(nextSettings);
  await syncPublishedAggregate();
  json(response, 200, nextSettings);
}

async function routeRequest(request, response) {
  if (!request.url) {
    json(response, 400, { error: 'Invalid request.' });
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-CSRF-Token',
    });
    response.end();
    return;
  }

  if (request.method === 'GET' && pathname === '/api/health') {
    json(response, 200, { ok: true, service: 'crd-announcements' });
    return;
  }

  if (request.method === 'GET' && pathname === '/api/announcements') {
    json(response, 200, await syncPublishedAggregate(), {
      'Access-Control-Allow-Origin': '*',
    });
    return;
  }

  if (request.method === 'POST' && pathname === '/api/admin/auth/login') {
    await handleLogin(request, response);
    return;
  }

  if (request.method === 'POST' && pathname === '/api/admin/auth/logout') {
    await handleLogout(request, response);
    return;
  }

  if (request.method === 'GET' && pathname === '/api/admin/session') {
    await handleSession(request, response);
    return;
  }

  const { session, user } = await getAuthenticatedUser(request);
  if (pathname.startsWith('/api/admin')) {
    if (!requireSession(response, session, user)) {
      return;
    }

    if (request.method !== 'GET' && !requireCsrf(request, response, session)) {
      return;
    }
  }

  if (request.method === 'GET' && pathname === '/api/admin/announcements') {
    await handleListAnnouncements(request, response, user);
    return;
  }

  if (request.method === 'POST' && pathname === '/api/admin/announcements') {
    await handleCreateAnnouncement(request, response, user);
    return;
  }

  if (request.method === 'PATCH' && pathname === '/api/admin/announcements') {
    await handlePatchAnnouncement(request, response, user);
    return;
  }

  const announcementRoute = pathname.match(/^\/api\/admin\/announcements\/([^/]+)$/);
  if (request.method === 'GET' && announcementRoute) {
    await handleGetAnnouncement(response, decodeURIComponent(announcementRoute[1]));
    return;
  }

  const workflowRoute = pathname.match(
    /^\/api\/admin\/announcements\/([^/]+)\/(submit-review|publish|archive|restore)$/,
  );
  if (request.method === 'POST' && workflowRoute) {
    const action = workflowRoute[2];
    const noteMap = {
      'submit-review': 'Submitted announcement for review.',
      publish: 'Published announcement.',
      archive: 'Archived announcement.',
      restore: 'Restored announcement to draft.',
    };
    await handleWorkflowAction(
      response,
      user,
      decodeURIComponent(workflowRoute[1]),
      action,
      noteMap[action],
    );
    return;
  }

  if (request.method === 'POST' && pathname === '/api/admin/platform-resolve') {
    await handlePlatformResolve(request, response);
    return;
  }

  if (request.method === 'GET' && pathname === '/api/admin/users') {
    if (!hasRole(user, ['owner'])) {
      json(response, 403, { error: 'Only owner can view users.' });
      return;
    }

    await handleGetUsers(response);
    return;
  }

  if (request.method === 'PATCH' && pathname === '/api/admin/users') {
    if (!hasRole(user, ['owner'])) {
      json(response, 403, { error: 'Only owner can update users.' });
      return;
    }

    await handlePatchUsers(request, response);
    return;
  }

  if (request.method === 'GET' && pathname === '/api/admin/settings') {
    await handleGetSettings(response);
    return;
  }

  if (request.method === 'PATCH' && pathname === '/api/admin/settings') {
    if (!hasRole(user, ['owner'])) {
      json(response, 403, { error: 'Only owner can update settings.' });
      return;
    }

    await handlePatchSettings(request, response);
    return;
  }

  if (request.method === 'GET' && pathname === '/api/admin/published') {
    json(response, 200, await readPublishedSnapshot());
    return;
  }

  json(response, 404, { error: 'Not Found' });
}

await ensureStorage();

const server = http.createServer((request, response) => {
  routeRequest(request, response).catch((error) => {
    console.error('Unhandled announcements service error:', error);
    json(response, 500, { error: 'Internal Server Error' });
  });
});

server.listen(port, host, () => {
  console.log(`CRD announcements service listening at http://${host}:${port}`);
});
