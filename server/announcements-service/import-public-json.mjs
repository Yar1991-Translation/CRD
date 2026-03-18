import { readFile, readdir, rm } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

import { resolvePlatformCards, deriveSupportPlatforms } from './platform-registry.mjs';
import {
  announcementsDir,
  ensureStorage,
  getSettings,
  saveSettings,
  syncPublishedAggregate,
  writeAnnouncement,
} from './storage.mjs';

function usage() {
  console.log('Usage: node import-public-json.mjs <json-path> [--replace]');
}

async function clearAnnouncements() {
  const files = await readdir(announcementsDir);
  await Promise.all(
    files
      .filter((fileName) => fileName.endsWith('.json'))
      .map((fileName) => rm(resolve(announcementsDir, fileName), { force: true })),
  );
}

async function main() {
  const [, , inputPath, ...flags] = process.argv;
  if (!inputPath) {
    usage();
    process.exit(1);
  }

  const shouldReplace = flags.includes('--replace');
  const sourcePath = isAbsolute(inputPath) ? inputPath : resolve(process.cwd(), inputPath);

  await ensureStorage();
  if (shouldReplace) {
    await clearAnnouncements();
  }

  const raw = await readFile(sourcePath, 'utf8');
  const payload = JSON.parse(raw);
  const items = Array.isArray(payload) ? payload : payload.items || [];
  const settings = await getSettings();

  await saveSettings({
    ...settings,
    siteTitle: payload.title || settings.siteTitle,
    subtitle: payload.subtitle || settings.subtitle,
  });

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const links = [
      ...(Array.isArray(item.links) ? item.links : []),
      ...(item.link ? [item.link] : []),
    ].filter(Boolean);
    const platformCards = await resolvePlatformCards(links);
    await writeAnnouncement({
      id: item.id || `imported-${index + 1}`,
      title: item.title,
      content: item.content,
      publishedAt: item.publishedAt,
      expiresAt: item.expiresAt,
      link: item.link,
      linkText: item.linkText || 'View Details',
      links,
      pinned: Boolean(item.pinned),
      level: item.level || 'info',
      supportPlatforms: item.supportPlatforms || deriveSupportPlatforms(platformCards),
      platformCards,
      status: 'published',
      authorId: 'owner',
      reviewerId: 'owner',
      publishedBy: 'owner',
      version: 1,
      internalNotes: 'Imported from public announcements JSON.',
      auditTrail: [
        {
          at: new Date().toISOString(),
          actorId: 'system',
          action: 'imported',
          note: `Imported from ${sourcePath}.`,
        },
      ],
    });
  }

  await syncPublishedAggregate();
  console.log(`Imported ${items.length} announcement(s) from ${sourcePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
