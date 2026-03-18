import { writeFile } from 'node:fs/promises';

import { resolvePlatformCards, deriveSupportPlatforms } from './platform-registry.mjs';
import { listAnnouncements, writeAnnouncement, syncPublishedAggregate } from './storage.mjs';

await writeFile(new URL('./data/platform-cache.json', import.meta.url), '{}\n', 'utf8');

const records = await listAnnouncements();
for (const record of records) {
  const links = [...new Set([...(record.links || []), ...(record.link ? [record.link] : [])].filter(Boolean))];
  const platformCards = await resolvePlatformCards(links);
  const supportPlatforms = [...new Set([...(record.supportPlatforms || []), ...deriveSupportPlatforms(platformCards)])];

  await writeAnnouncement({
    ...record,
    platformCards,
    supportPlatforms,
    version: Number(record.version || 1) + 1,
    auditTrail: [
      ...(record.auditTrail || []),
      {
        at: new Date().toISOString(),
        actorId: 'system',
        action: 'refreshed-platform-cards',
        note: 'Refreshed platform cards and thumbnails.',
      },
    ],
  });
}

await syncPublishedAggregate();
console.log(`Refreshed ${records.length} announcement record(s).`);
