import { mkdir, readFile, readdir, writeFile, appendFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { hashPassword } from './auth.mjs';

const moduleDir = dirname(fileURLToPath(import.meta.url));
export const dataDir = join(moduleDir, 'data');
export const announcementsDir = join(dataDir, 'announcements');
const publishedFile = join(dataDir, 'published.json');
const usersFile = join(dataDir, 'users.json');
const settingsFile = join(dataDir, 'settings.json');
const platformCacheFile = join(dataDir, 'platform-cache.json');
const auditLogFile = join(dataDir, 'audit-log.ndjson');

function nowIso() {
  return new Date().toISOString();
}

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, fallback) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function seedDefaultUsers() {
  return [
    {
      id: 'owner',
      username: process.env.CRD_ADMIN_OWNER_USERNAME || 'owner',
      displayName: 'CRD Owner',
      role: 'owner',
      passwordHash: hashPassword(process.env.CRD_ADMIN_OWNER_PASSWORD || 'ChangeMe-2026!'),
    },
    {
      id: 'editor',
      username: process.env.CRD_ADMIN_EDITOR_USERNAME || 'editor',
      displayName: 'CRD Editor',
      role: 'editor',
      passwordHash: hashPassword(process.env.CRD_ADMIN_EDITOR_PASSWORD || 'ChangeMe-2026!'),
    },
    {
      id: 'reviewer',
      username: process.env.CRD_ADMIN_REVIEWER_USERNAME || 'reviewer',
      displayName: 'CRD Reviewer',
      role: 'reviewer',
      passwordHash: hashPassword(process.env.CRD_ADMIN_REVIEWER_PASSWORD || 'ChangeMe-2026!'),
    },
  ];
}

function seedDefaultSettings() {
  return {
    siteTitle: '公告中心',
    subtitle: '这里会显示站点通知、线路维护和版本提醒。',
    platformSupport: [
      'github',
      'bilibili',
      'youtube',
      'roblox-game',
      'roblox-group',
      'roblox-profile',
      'roblox-devforum',
    ],
  };
}

function seedDefaultAnnouncements() {
  return [
    {
      id: 'welcome-admin',
      title: 'Platform-aware announcements are online',
      content:
        'You can now sign in at /admin to draft, review, publish, and archive announcements.\n' +
        'The seeded demo supports GitHub, Bilibili, YouTube, Roblox Game, Roblox Group, Roblox Profile, and Roblox DevForum links.',
      publishedAt: nowIso(),
      link: 'https://github.com/Yar1991-Translation/CRD',
      linkText: '查看项目',
      links: [
        'https://github.com/Yar1991-Translation/CRD',
        'https://www.bilibili.com/video/BV1GJ411x7h7',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.roblox.com/games/920587237/Adopt-Me',
        'https://www.roblox.com/groups/1200769/Roblox',
        'https://www.roblox.com/users/1/profile',
        'https://devforum.roblox.com/t/example/1234567',
      ],
      pinned: true,
      level: 'success',
      supportPlatforms: [
        'github',
        'bilibili',
        'youtube',
        'roblox-game',
        'roblox-group',
        'roblox-profile',
        'roblox-devforum',
      ],
      platformCards: [],
      status: 'published',
      authorId: 'owner',
      reviewerId: 'reviewer',
      publishedBy: 'reviewer',
      version: 1,
      internalNotes: '默认演示公告。',
      auditTrail: [
        {
          at: nowIso(),
          actorId: 'system',
          action: 'seeded',
          note: 'Seeded default published announcement.',
        },
      ],
    },
    {
      id: 'draft-example',
      title: 'Draft example',
      content: 'This is a seeded draft used to test submit-review, publish, and archive flows.',
      links: ['https://devforum.roblox.com/t/example/1234567'],
      pinned: false,
      level: 'info',
      supportPlatforms: ['roblox-devforum'],
      platformCards: [],
      status: 'draft',
      authorId: 'editor',
      version: 1,
      internalNotes: '默认草稿示例。',
      auditTrail: [
        {
          at: nowIso(),
          actorId: 'system',
          action: 'seeded',
          note: 'Seeded default draft announcement.',
        },
      ],
    },
  ];
}

function toPublicRecord(record) {
  const {
    id,
    title,
    content,
    publishedAt,
    expiresAt,
    link,
    linkText,
    links,
    pinned,
    level,
    supportPlatforms,
    platformCards,
  } = record;

  return {
    id,
    title,
    content,
    publishedAt,
    expiresAt,
    link,
    linkText,
    links,
    pinned,
    level,
    supportPlatforms,
    platformCards,
  };
}

function isActivePublished(record, referenceDate = new Date()) {
  if (record.status !== 'published') {
    return false;
  }

  if (record.scheduledAt) {
    const scheduledAt = new Date(record.scheduledAt);
    if (!Number.isNaN(scheduledAt.getTime()) && scheduledAt.getTime() > referenceDate.getTime()) {
      return false;
    }
  }

  if (record.expiresAt) {
    const expiresAt = new Date(record.expiresAt);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < referenceDate.getTime()) {
      return false;
    }
  }

  return true;
}

export async function ensureStorage() {
  await mkdir(announcementsDir, { recursive: true });

  if (!await exists(settingsFile)) {
    await writeJson(settingsFile, seedDefaultSettings());
  }

  if (!await exists(usersFile)) {
    await writeJson(usersFile, seedDefaultUsers());
  }

  if (!await exists(platformCacheFile)) {
    await writeJson(platformCacheFile, {});
  }

  if (!await exists(auditLogFile)) {
    await writeFile(auditLogFile, '', 'utf8');
  }

  const existingAnnouncements = await readdir(announcementsDir).catch(() => []);
  if (existingAnnouncements.length === 0) {
    const seeded = seedDefaultAnnouncements();
    for (const record of seeded) {
      await writeAnnouncement(record);
    }
  }

  await syncPublishedAggregate();
}

export async function listAnnouncements() {
  const files = (await readdir(announcementsDir)).filter((fileName) => fileName.endsWith('.json'));
  const records = await Promise.all(
    files.map((fileName) => readJson(join(announcementsDir, fileName), null)),
  );

  return records
    .filter(Boolean)
    .sort((left, right) => {
      const pinnedDelta = Number(Boolean(right.pinned)) - Number(Boolean(left.pinned));
      if (pinnedDelta !== 0) {
        return pinnedDelta;
      }

      return String(right.publishedAt || right.scheduledAt || '').localeCompare(
        String(left.publishedAt || left.scheduledAt || ''),
      );
    });
}

export async function getAnnouncement(id) {
  return await readJson(join(announcementsDir, `${id}.json`), null);
}

export async function writeAnnouncement(record) {
  await writeJson(join(announcementsDir, `${record.id}.json`), record);
  return record;
}

export async function appendAudit(recordId, entry) {
  const line = JSON.stringify({ recordId, ...entry });
  await appendFile(auditLogFile, `${line}\n`, 'utf8');
}

export async function getUsers() {
  return await readJson(usersFile, []);
}

export async function saveUsers(users) {
  await writeJson(usersFile, users);
}

export async function getSettings() {
  return await readJson(settingsFile, seedDefaultSettings());
}

export async function saveSettings(settings) {
  await writeJson(settingsFile, settings);
}

export async function getPlatformCache() {
  return await readJson(platformCacheFile, {});
}

export async function savePlatformCache(cache) {
  await writeJson(platformCacheFile, cache);
}

export async function readPublishedSnapshot() {
  return await readJson(publishedFile, {
    title: '公告中心',
    subtitle: '这里会显示站点通知、线路维护和版本提醒。',
    items: [],
  });
}

export async function syncPublishedAggregate() {
  const [records, settings] = await Promise.all([listAnnouncements(), getSettings()]);
  const activeRecords = records
    .filter((record) => isActivePublished(record))
    .map((record) => toPublicRecord(record));

  const snapshot = {
    title: settings.siteTitle || '公告中心',
    subtitle: settings.subtitle || '这里会显示站点通知、线路维护和版本提醒。',
    items: activeRecords,
  };

  await writeJson(publishedFile, snapshot);
  return snapshot;
}
