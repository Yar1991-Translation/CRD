import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.startsWith('scrypt$')) {
    return false;
  }

  const [, salt, hash] = storedHash.split('$');
  if (!salt || !hash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}

export function createToken(size = 32) {
  return randomBytes(size).toString('hex');
}

export function parseCookies(headerValue) {
  const result = {};
  if (!headerValue) {
    return result;
  }

  const parts = headerValue.split(';');
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split('=');
    if (!rawName || rest.length === 0) {
      continue;
    }

    result[rawName] = decodeURIComponent(rest.join('='));
  }

  return result;
}

export function serializeSessionCookie(sessionId, secure) {
  const attributes = [
    `crd_admin_session=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
  ];

  if (secure) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

export function clearSessionCookie(secure) {
  const attributes = [
    'crd_admin_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ];

  if (secure) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}
