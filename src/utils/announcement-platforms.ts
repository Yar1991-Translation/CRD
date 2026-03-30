import type {
  AnnouncementItem,
  PlatformCard,
  SupportedPlatform,
} from './announcement-types.js';

export const announcementLinkPattern =
  /(https?:\/\/[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;

export const platformDisplayNames: Record<SupportedPlatform, string> = {
  github: 'GitHub',
  youtube: 'YouTube',
  bilibili: 'Bilibili',
  'qq-channel': 'QQ 频道',
  'roblox-game': 'Roblox Game',
  'roblox-group': 'Roblox Group',
  'roblox-profile': 'Roblox Profile',
  'roblox-devforum': 'Roblox DevForum',
};

const qqChannelReferencePattern =
  /(?:QQ\s*(?:频道|頻道)(?:号|號)?|QQ\s*Channel(?:\s*ID)?|频道号|頻道號)\s*[:：#]?\s*([A-Za-z0-9_-]{4,64})/gi;

function normalizeQqChannelReference(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^qq-channel:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const explicitMatch = trimmed.match(/^qq-channel\s*[:：]\s*([A-Za-z0-9_-]{4,64})$/i);
  if (explicitMatch?.[1]) {
    return `qq-channel://${explicitMatch[1]}`;
  }

  const labelledMatch = trimmed.match(
    /^(?:QQ\s*(?:频道|頻道)(?:号|號)?|QQ\s*Channel(?:\s*ID)?|频道号|頻道號)\s*[:：#]?\s*([A-Za-z0-9_-]{4,64})$/i,
  );
  if (labelledMatch?.[1]) {
    return `qq-channel://${labelledMatch[1]}`;
  }

  if (/^(?=.*\d)[A-Za-z0-9_-]{5,64}$/i.test(trimmed)) {
    return `qq-channel://${trimmed}`;
  }

  return '';
}

function extractQqChannelReferences(value: string) {
  const matches = [...value.matchAll(qqChannelReferencePattern)];
  return matches.map((match) => `qq-channel://${match[1]}`);
}

function buildQqChannelUrl(reference: string) {
  return /^https?:\/\//i.test(reference) ? reference : `https://pd.qq.com/s/${reference}`;
}

export function normalizeAnnouncementHref(value: string) {
  const normalizedQqChannel = normalizeQqChannelReference(value);
  if (normalizedQqChannel) {
    return normalizedQqChannel;
  }

  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function collectAnnouncementLinks(item: AnnouncementItem) {
  const discovered = [
    ...(item.links || []),
    ...(item.link ? [item.link] : []),
    ...((item.content.match(announcementLinkPattern) || []) as string[]),
    ...extractQqChannelReferences(item.content),
  ];

  return [...new Set(discovered.map((entry) => normalizeAnnouncementHref(entry)))];
}

export function buildPlatformCards(item: AnnouncementItem) {
  const cards = item.platformCards?.length
    ? item.platformCards
    : collectAnnouncementLinks(item)
        .map((url) => buildFallbackPlatformCard(url))
        .filter((card): card is PlatformCard => Boolean(card));

  return dedupePlatformCards(cards);
}

export function deriveSupportPlatforms(item: AnnouncementItem, cards?: PlatformCard[]) {
  const discoveredCards = cards || buildPlatformCards(item);
  const explicit = item.supportPlatforms || [];
  return [...new Set([...explicit, ...discoveredCards.map((card) => card.platform)])];
}

export function dedupePlatformCards(cards: PlatformCard[]) {
  const seen = new Set<string>();

  return cards.filter((card) => {
    if (seen.has(card.url)) {
      return false;
    }

    seen.add(card.url);
    return true;
  });
}

export function buildFallbackPlatformCard(url: string): PlatformCard | null {
  try {
    const target = new URL(url);
    if (target.protocol === 'qq-channel:') {
      return buildQqChannelCard(target);
    }

    const host = target.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'github.com') {
      return buildGitHubCard(target);
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
      return buildYouTubeCard(target);
    }

    if (host === 'bilibili.com' || host.endsWith('.bilibili.com')) {
      return buildBilibiliCard(target);
    }

    if (host === 'pd.qq.com' || host === 'qun.qq.com') {
      return buildQqChannelCard(target);
    }

    if (host.endsWith('roblox.com')) {
      return buildRobloxCard(target);
    }

    if (host === 'devforum.roblox.com') {
      return buildRobloxDevForumCard(target);
    }
  } catch {
    return null;
  }

  return null;
}

function buildQqChannelCard(target: URL): PlatformCard {
  const isReferenceOnly = target.protocol === 'qq-channel:';
  const segments = target.pathname.split('/').filter(Boolean);
  const reference =
    (isReferenceOnly ? `${target.hostname}${target.pathname}` : '')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/')
      || target.searchParams.get('channel_id')
      || target.searchParams.get('guild_id')
      || target.searchParams.get('inviteCode')
      || segments[1]
      || segments[0]
      || target.hostname;

  const resolvedUrl = isReferenceOnly ? buildQqChannelUrl(reference) : target.toString();
  const subtitle = reference ? `频道号 ${reference}` : 'QQ 频道链接';

  return {
    id: `qq-channel-${sanitizeId(reference)}`,
    url: resolvedUrl,
    platform: 'qq-channel',
    entityType: 'channel',
    title: 'QQ 频道',
    subtitle,
    badge: 'Channel',
    actions: [{ label: '打开频道', url: resolvedUrl }],
  };
}

function buildGitHubCard(target: URL): PlatformCard | null {
  const segments = target.pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const owner = segments[0];
  const avatar = `https://github.com/${owner}.png?size=120`;

  if (segments.length === 1) {
    return {
      id: `github-user-${owner}`,
      url: target.toString(),
      platform: 'github',
      entityType: 'user',
      title: `@${owner}`,
      subtitle: 'GitHub 个人主页',
      thumbnail: avatar,
      badge: 'Profile',
      actions: [{ label: '打开主页', url: target.toString() }],
    };
  }

  const repo = segments[1];
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const repoName = `${owner}/${repo}`;
  const section = segments[2];
  const number = segments[3];

  if (section === 'issues' && number) {
    return {
      id: `github-issue-${owner}-${repo}-${number}`,
      url: target.toString(),
      platform: 'github',
      entityType: 'issue',
      title: repoName,
      subtitle: `Issue #${number}`,
      thumbnail: avatar,
      badge: 'Issue',
      actions: [
        { label: '仓库', url: repoUrl },
        { label: 'Issues', url: `${repoUrl}/issues` },
      ],
    };
  }

  if (section === 'pull' && number) {
    return {
      id: `github-pull-${owner}-${repo}-${number}`,
      url: target.toString(),
      platform: 'github',
      entityType: 'pull',
      title: repoName,
      subtitle: `Pull Request #${number}`,
      thumbnail: avatar,
      badge: 'PR',
      actions: [
        { label: '仓库', url: repoUrl },
        { label: 'Pulls', url: `${repoUrl}/pulls` },
      ],
    };
  }

  if (section === 'releases') {
    return {
      id: `github-release-${owner}-${repo}`,
      url: target.toString(),
      platform: 'github',
      entityType: 'release',
      title: repoName,
      subtitle: 'GitHub Releases',
      thumbnail: avatar,
      badge: 'Release',
      actions: [
        { label: '仓库', url: repoUrl },
        { label: 'Releases', url: `${repoUrl}/releases` },
      ],
    };
  }

  return {
    id: `github-repo-${owner}-${repo}`,
    url: target.toString(),
    platform: 'github',
    entityType: 'repo',
    title: repoName,
    subtitle: 'GitHub 仓库',
    thumbnail: avatar,
    badge: 'Repo',
    actions: [
      { label: '仓库', url: repoUrl },
      { label: 'Issues', url: `${repoUrl}/issues` },
      { label: 'Releases', url: `${repoUrl}/releases` },
    ],
  };
}

function buildYouTubeCard(target: URL): PlatformCard {
  const videoId = extractYouTubeVideoId(target);
  const channelHandle = target.pathname.startsWith('/@') ? target.pathname.slice(2) : '';
  const playlistId = target.searchParams.get('list') || '';

  if (videoId) {
    return {
      id: `youtube-video-${videoId}`,
      url: target.toString(),
      platform: 'youtube',
      entityType: 'video',
      title: 'YouTube 视频',
      subtitle: videoId,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      badge: 'Video',
      actions: [{ label: '打开视频', url: target.toString() }],
    };
  }

  if (channelHandle) {
    return {
      id: `youtube-channel-${channelHandle}`,
      url: target.toString(),
      platform: 'youtube',
      entityType: 'channel',
      title: `@${channelHandle}`,
      subtitle: 'YouTube 频道',
      badge: 'Channel',
      actions: [{ label: '打开频道', url: target.toString() }],
    };
  }

  if (playlistId) {
    return {
      id: `youtube-playlist-${playlistId}`,
      url: target.toString(),
      platform: 'youtube',
      entityType: 'playlist',
      title: 'YouTube 播放列表',
      subtitle: playlistId,
      badge: 'Playlist',
      actions: [{ label: '打开列表', url: target.toString() }],
    };
  }

  return {
    id: `youtube-link-${sanitizeId(target.toString())}`,
    url: target.toString(),
    platform: 'youtube',
    entityType: 'link',
    title: 'YouTube 链接',
    subtitle: target.pathname || target.hostname,
    badge: 'Link',
    actions: [{ label: '打开链接', url: target.toString() }],
  };
}

function buildBilibiliCard(target: URL): PlatformCard {
  const pathname = target.pathname;
  const bvMatch = pathname.match(/\/video\/(BV[0-9A-Za-z]+)/i);
  const avMatch = pathname.match(/\/video\/av(\d+)/i);
  const uidMatch = target.hostname.startsWith('space.') ? pathname.match(/\/(\d+)(?:\/|$)/) : null;
  const articleMatch = pathname.match(/\/read\/cv(\d+)/i);

  if (bvMatch) {
    return {
      id: `bilibili-video-${bvMatch[1].toUpperCase()}`,
      url: target.toString(),
      platform: 'bilibili',
      entityType: 'video',
      title: 'Bilibili 视频',
      subtitle: bvMatch[1].toUpperCase(),
      badge: 'Video',
      actions: [{ label: '打开视频', url: target.toString() }],
    };
  }

  if (avMatch) {
    return {
      id: `bilibili-video-av${avMatch[1]}`,
      url: target.toString(),
      platform: 'bilibili',
      entityType: 'video',
      title: 'Bilibili 视频',
      subtitle: `av${avMatch[1]}`,
      badge: 'Video',
      actions: [{ label: '打开视频', url: target.toString() }],
    };
  }

  if (uidMatch) {
    return {
      id: `bilibili-space-${uidMatch[1]}`,
      url: target.toString(),
      platform: 'bilibili',
      entityType: 'space',
      title: 'Bilibili 空间',
      subtitle: `UID ${uidMatch[1]}`,
      badge: 'Space',
      actions: [{ label: '打开空间', url: target.toString() }],
    };
  }

  if (articleMatch) {
    return {
      id: `bilibili-article-${articleMatch[1]}`,
      url: target.toString(),
      platform: 'bilibili',
      entityType: 'article',
      title: 'Bilibili 专栏',
      subtitle: `cv${articleMatch[1]}`,
      badge: 'Article',
      actions: [{ label: '打开专栏', url: target.toString() }],
    };
  }

  return {
    id: `bilibili-link-${sanitizeId(target.toString())}`,
    url: target.toString(),
    platform: 'bilibili',
    entityType: 'link',
    title: 'Bilibili 链接',
    subtitle: pathname || target.hostname,
    badge: 'Link',
    actions: [{ label: '打开链接', url: target.toString() }],
  };
}

function buildRobloxCard(target: URL): PlatformCard | null {
  const pathname = target.pathname;
  const placeMatch = pathname.match(/\/games\/(\d+)/i);
  const groupMatch = pathname.match(/\/(?:groups|communities)\/(\d+)/i);
  const userMatch = pathname.match(/\/users\/(\d+)\/profile/i);

  if (placeMatch) {
    const placeId = placeMatch[1];
    return {
      id: `roblox-game-${placeId}`,
      url: target.toString(),
      platform: 'roblox-game',
      entityType: 'place',
      title: 'Roblox 游戏',
      subtitle: `Place ID ${placeId}`,
      badge: 'Game',
      actions: [
        { label: '打开游戏页', url: target.toString() },
        { label: 'Roblox', url: 'https://www.roblox.com/games/' + placeId },
      ],
    };
  }

  if (groupMatch) {
    const groupId = groupMatch[1];
    return {
      id: `roblox-group-${groupId}`,
      url: target.toString(),
      platform: 'roblox-group',
      entityType: 'group',
      title: 'Roblox 群组',
      subtitle: `Group ID ${groupId}`,
      badge: 'Group',
      actions: [{ label: '打开群组', url: target.toString() }],
    };
  }

  if (userMatch) {
    const userId = userMatch[1];
    return {
      id: `roblox-profile-${userId}`,
      url: target.toString(),
      platform: 'roblox-profile',
      entityType: 'profile',
      title: 'Roblox 用户',
      subtitle: `User ID ${userId}`,
      badge: 'Profile',
      actions: [{ label: '打开资料', url: target.toString() }],
    };
  }

  return null;
}

function buildRobloxDevForumCard(target: URL): PlatformCard | null {
  const topicMatch = target.pathname.match(/\/t\/[^/]+\/(\d+)/i);
  const categoryMatch = target.pathname.match(/\/c\/[^/]+(?:\/(\d+))?/i);

  if (topicMatch) {
    const topicId = topicMatch[1];
    return {
      id: `roblox-devforum-topic-${topicId}`,
      url: target.toString(),
      platform: 'roblox-devforum',
      entityType: 'topic',
      title: 'Roblox DevForum 话题',
      subtitle: `Topic ID ${topicId}`,
      badge: 'Topic',
      actions: [{ label: '打开讨论', url: target.toString() }],
    };
  }

  if (categoryMatch) {
    const categoryId = categoryMatch[1] || 'unknown';
    return {
      id: `roblox-devforum-category-${categoryId}`,
      url: target.toString(),
      platform: 'roblox-devforum',
      entityType: 'category',
      title: 'Roblox DevForum 分类',
      subtitle: `Category ${categoryId}`,
      badge: 'Category',
      actions: [{ label: '打开分类', url: target.toString() }],
    };
  }

  return null;
}

function extractYouTubeVideoId(target: URL) {
  if (target.hostname === 'youtu.be') {
    return target.pathname.split('/').filter(Boolean)[0] || '';
  }

  if (target.pathname === '/watch') {
    return target.searchParams.get('v') || '';
  }

  return target.pathname.match(/\/(embed|shorts)\/([^/?]+)/)?.[2] || '';
}

function sanitizeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
