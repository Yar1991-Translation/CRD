import { resolvePlatformCards } from './platform-registry.mjs';

const cards = await resolvePlatformCards([
  'https://space.bilibili.com/517013017',
  'https://www.youtube.com/@yatmt',
  'https://www.roblox.com/users/3233863489/profile',
]);

console.log(JSON.stringify(cards, null, 2));
