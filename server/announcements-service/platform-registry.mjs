const platformDisplayNames = {
  github: 'GitHub',
  youtube: 'YouTube',
  bilibili: 'Bilibili',
  'qq-channel': 'QQ 频道',
  'roblox-game': 'Roblox Game',
  'roblox-group': 'Roblox Group',
  'roblox-profile': 'Roblox Profile',
  'roblox-devforum': 'Roblox DevForum',
};

const requestHeaders = {
  'User-Agent': 'CRD-Announcements/1.0 (+https://service.forsaken-zh.wiki)',
  Accept: 'application/json, text/html;q=0.9, */*;q=0.8',
};

function normalizeUrl(value) {
  if (/^qq-channel:\/\//i.test(value)) {
    return value;
  }

  const qqChannelMatch = String(value).trim().match(/^qq-channel\s*[:：]\s*([A-Za-z0-9_-]{4,64})$/i);
  if (qqChannelMatch?.[1]) {
    return `qq-channel://${qqChannelMatch[1]}`;
  }

  if (/^(?=.*\d)[A-Za-z0-9_-]{5,64}$/i.test(String(value).trim())) {
    return `qq-channel://${String(value).trim()}`;
  }

  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function sanitizeId(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function uniqueByUrl(cards) {
  const seen = new Set();
  return cards.filter((card) => {
    if (!card || seen.has(card.url)) {
      return false;
    }

    seen.add(card.url);
    return true;
  });
}

function createCard(base, meta) {
  return {
    id: meta.id,
    url: base.url,
    platform: base.platform,
    entityType: meta.entityType,
    title: meta.title,
    subtitle: meta.subtitle,
    thumbnail: meta.thumbnail,
    badge: meta.badge,
    actions: meta.actions || [],
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: requestHeaders });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: requestHeaders });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.text();
}

function extractMetaContent(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1]
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }
  }

  return '';
}

async function fetchOpenGraphImage(url) {
  try {
    const html = await fetchText(url);
    return extractMetaContent(html, 'og:image') || extractMetaContent(html, 'twitter:image');
  } catch {
    return '';
  }
}

async function fetchBilibiliSpaceMeta(uid) {
  try {
    const payload = await fetchJson(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`);
    const data = payload?.data?.card || {};
    return {
      title: data.name || '',
      subtitle: data.sign || '',
      thumbnail: data.face || '',
    };
  } catch {
    return {};
  }
}

async function fetchBilibiliVideoMetaByBvid(bvid) {
  try {
    const payload = await fetchJson(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`);
    const data = payload?.data || {};
    return {
      title: data.title || '',
      subtitle: data.owner?.name ? `UP ${data.owner.name}` : '',
      thumbnail: data.pic || data.owner?.face || '',
    };
  } catch {
    return {};
  }
}

async function fetchBilibiliVideoMetaByAid(aid) {
  try {
    const payload = await fetchJson(`https://api.bilibili.com/x/web-interface/view?aid=${encodeURIComponent(aid)}`);
    const data = payload?.data || {};
    return {
      title: data.title || '',
      subtitle: data.owner?.name ? `UP ${data.owner.name}` : '',
      thumbnail: data.pic || data.owner?.face || '',
    };
  } catch {
    return {};
  }
}

async function fetchRobloxUserAvatar(userId) {
  try {
    const payload = await fetchJson(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
    return payload?.data?.[0]?.imageUrl || '';
  } catch {
    return '';
  }
}

async function fetchRobloxGroupIcon(groupId) {
  try {
    const payload = await fetchJson(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=150x150&format=Png&isCircular=false`);
    return payload?.data?.[0]?.imageUrl || '';
  } catch {
    return '';
  }
}

async function fetchRobloxGameThumbnail(placeId) {
  return fetchOpenGraphImage(`https://www.roblox.com/games/${placeId}`);
}

function buildQqChannelUrl(reference) {
  return /^https?:\/\//i.test(reference) ? reference : `https://pd.qq.com/s/${reference}`;
}

const githubProvider = {
  key: 'github',
  match(target) {
    return target.hostname.replace(/^www\./, '').toLowerCase() === 'github.com';
  },
  parse(target) {
    const segments = target.pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return null;
    }

    return {
      url: target.toString(),
      platform: 'github',
      owner: segments[0],
      repo: segments[1] || '',
      section: segments[2] || '',
      number: segments[3] || '',
    };
  },
  async resolveMeta(parsed) {
    const avatar = `https://github.com/${parsed.owner}.png?size=120`;
    if (!parsed.repo) {
      return {
        id: `github-user-${parsed.owner}`,
        entityType: 'user',
        title: `@${parsed.owner}`,
        subtitle: 'GitHub 用户主页',
        thumbnail: avatar,
        badge: 'Profile',
        actions: [{ label: '打开主页', url: parsed.url }],
      };
    }

    const repoName = `${parsed.owner}/${parsed.repo}`;
    const repoUrl = `https://github.com/${repoName}`;
    if (parsed.section === 'issues' && parsed.number) {
      return {
        id: `github-issue-${parsed.owner}-${parsed.repo}-${parsed.number}`,
        entityType: 'issue',
        title: repoName,
        subtitle: `Issue #${parsed.number}`,
        thumbnail: avatar,
        badge: 'Issue',
        actions: [
          { label: '仓库', url: repoUrl },
          { label: 'Issues', url: `${repoUrl}/issues` },
        ],
      };
    }

    if (parsed.section === 'pull' && parsed.number) {
      return {
        id: `github-pull-${parsed.owner}-${parsed.repo}-${parsed.number}`,
        entityType: 'pull',
        title: repoName,
        subtitle: `Pull Request #${parsed.number}`,
        thumbnail: avatar,
        badge: 'PR',
        actions: [
          { label: '仓库', url: repoUrl },
          { label: 'Pulls', url: `${repoUrl}/pulls` },
        ],
      };
    }

    if (parsed.section === 'releases') {
      return {
        id: `github-release-${parsed.owner}-${parsed.repo}`,
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
      id: `github-repo-${parsed.owner}-${parsed.repo}`,
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
  },
};

const youtubeProvider = {
  key: 'youtube',
  match(target) {
    const host = target.hostname.replace(/^www\./, '').toLowerCase();
    return host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
  },
  parse(target) {
    let videoId = '';
    if (target.hostname === 'youtu.be') {
      videoId = target.pathname.split('/').filter(Boolean)[0] || '';
    } else if (target.pathname === '/watch') {
      videoId = target.searchParams.get('v') || '';
    } else {
      videoId = target.pathname.match(/\/(embed|shorts)\/([^/?]+)/)?.[2] || '';
    }

    const channelHandle = target.pathname.startsWith('/@') ? target.pathname.slice(2) : '';
    const playlistId = target.searchParams.get('list') || '';

    return {
      url: target.toString(),
      platform: 'youtube',
      videoId,
      channelHandle,
      playlistId,
      pathname: target.pathname,
      hostname: target.hostname,
    };
  },
  async resolveMeta(parsed) {
    const thumbnail = parsed.videoId
      ? `https://i.ytimg.com/vi/${parsed.videoId}/mqdefault.jpg`
      : await fetchOpenGraphImage(parsed.url);

    if (parsed.videoId) {
      return {
        id: `youtube-video-${parsed.videoId}`,
        entityType: 'video',
        title: 'YouTube 视频',
        subtitle: parsed.videoId,
        thumbnail,
        badge: 'Video',
        actions: [{ label: '打开视频', url: parsed.url }],
      };
    }

    if (parsed.channelHandle) {
      return {
        id: `youtube-channel-${parsed.channelHandle}`,
        entityType: 'channel',
        title: `@${parsed.channelHandle}`,
        subtitle: 'YouTube 频道',
        thumbnail,
        badge: 'Channel',
        actions: [{ label: '打开频道', url: parsed.url }],
      };
    }

    if (parsed.playlistId) {
      return {
        id: `youtube-playlist-${parsed.playlistId}`,
        entityType: 'playlist',
        title: 'YouTube 播放列表',
        subtitle: parsed.playlistId,
        thumbnail,
        badge: 'Playlist',
        actions: [{ label: '打开列表', url: parsed.url }],
      };
    }

    return {
      id: `youtube-link-${sanitizeId(parsed.url)}`,
      entityType: 'link',
      title: 'YouTube 链接',
      subtitle: parsed.pathname || parsed.hostname,
      thumbnail,
      badge: 'Link',
      actions: [{ label: '打开链接', url: parsed.url }],
    };
  },
};

const bilibiliProvider = {
  key: 'bilibili',
  match(target) {
    const host = target.hostname.replace(/^www\./, '').toLowerCase();
    return host === 'bilibili.com' || host.endsWith('.bilibili.com');
  },
  parse(target) {
    const pathname = target.pathname;
    const bvMatch = pathname.match(/\/video\/(BV[0-9A-Za-z]+)/i);
    const avMatch = pathname.match(/\/video\/av(\d+)/i);
    const uidMatch = target.hostname.startsWith('space.') ? pathname.match(/\/(\d+)(?:\/|$)/) : null;
    const articleMatch = pathname.match(/\/read\/cv(\d+)/i);

    return {
      url: target.toString(),
      platform: 'bilibili',
      pathname,
      bvId: bvMatch?.[1]?.toUpperCase() || '',
      avId: avMatch?.[1] || '',
      uid: uidMatch?.[1] || '',
      articleId: articleMatch?.[1] || '',
      hostname: target.hostname,
    };
  },
  async resolveMeta(parsed) {
    const uidMeta = parsed.uid ? await fetchBilibiliSpaceMeta(parsed.uid) : {};
    const bvMeta = parsed.bvId ? await fetchBilibiliVideoMetaByBvid(parsed.bvId) : {};
    const avMeta = parsed.avId ? await fetchBilibiliVideoMetaByAid(parsed.avId) : {};
    const openGraphThumbnail = await fetchOpenGraphImage(parsed.url);
    const articleThumbnail = parsed.articleId ? openGraphThumbnail : '';

    if (parsed.bvId) {
      return {
        id: `bilibili-video-${parsed.bvId}`,
        entityType: 'video',
        title: bvMeta.title || 'Bilibili 视频',
        subtitle: bvMeta.subtitle || parsed.bvId,
        thumbnail: bvMeta.thumbnail || openGraphThumbnail,
        badge: 'Video',
        actions: [{ label: '打开视频', url: parsed.url }],
      };
    }

    if (parsed.avId) {
      return {
        id: `bilibili-video-av${parsed.avId}`,
        entityType: 'video',
        title: avMeta.title || 'Bilibili 视频',
        subtitle: avMeta.subtitle || `av${parsed.avId}`,
        thumbnail: avMeta.thumbnail || openGraphThumbnail,
        badge: 'Video',
        actions: [{ label: '打开视频', url: parsed.url }],
      };
    }

    if (parsed.uid) {
      return {
        id: `bilibili-space-${parsed.uid}`,
        entityType: 'space',
        title: uidMeta.title || 'Bilibili 空间',
        subtitle: uidMeta.subtitle || `UID ${parsed.uid}`,
        thumbnail: uidMeta.thumbnail || openGraphThumbnail,
        badge: 'Space',
        actions: [{ label: '打开空间', url: parsed.url }],
      };
    }

    if (parsed.articleId) {
      return {
        id: `bilibili-article-${parsed.articleId}`,
        entityType: 'article',
        title: 'Bilibili 专栏',
        subtitle: `cv${parsed.articleId}`,
        thumbnail: articleThumbnail,
        badge: 'Article',
        actions: [{ label: '打开专栏', url: parsed.url }],
      };
    }

    return {
      id: `bilibili-link-${sanitizeId(parsed.url)}`,
      entityType: 'link',
      title: 'Bilibili 链接',
      subtitle: parsed.pathname || parsed.hostname,
      thumbnail: openGraphThumbnail,
      badge: 'Link',
      actions: [{ label: '打开链接', url: parsed.url }],
    };
  },
};

const qqChannelProvider = {
  key: 'qq-channel',
  match(target) {
    const host = target.hostname.replace(/^www\./, '').toLowerCase();
    return target.protocol === 'qq-channel:' || host === 'pd.qq.com' || host === 'qun.qq.com';
  },
  parse(target) {
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

    return {
      url: isReferenceOnly ? buildQqChannelUrl(reference) : target.toString(),
      platform: 'qq-channel',
      entityType: 'channel',
      reference,
      isReferenceOnly,
    };
  },
  async resolveMeta(parsed) {
    const thumbnail = parsed.isReferenceOnly ? '' : await fetchOpenGraphImage(parsed.url);

    return {
      id: `qq-channel-${sanitizeId(parsed.reference)}`,
      entityType: parsed.entityType,
      title: 'QQ 频道',
      subtitle: parsed.reference ? `频道号 ${parsed.reference}` : 'QQ 频道链接',
      thumbnail,
      badge: 'Channel',
      actions: [{ label: '打开频道', url: parsed.url }],
    };
  },
};

const robloxProvider = {
  key: 'roblox',
  match(target) {
    const host = target.hostname.replace(/^www\./, '').toLowerCase();
    return host.endsWith('roblox.com');
  },
  parse(target) {
    const pathname = target.pathname;
    const placeMatch = pathname.match(/\/games\/(\d+)/i);
    const groupMatch = pathname.match(/\/(?:groups|communities)\/(\d+)/i);
    const userMatch = pathname.match(/\/users\/(\d+)\/profile/i);

    if (placeMatch) {
      return {
        url: target.toString(),
        platform: 'roblox-game',
        entityType: 'place',
        id: placeMatch[1],
      };
    }

    if (groupMatch) {
      return {
        url: target.toString(),
        platform: 'roblox-group',
        entityType: 'group',
        id: groupMatch[1],
      };
    }

    if (userMatch) {
      return {
        url: target.toString(),
        platform: 'roblox-profile',
        entityType: 'profile',
        id: userMatch[1],
      };
    }

    return null;
  },
  async resolveMeta(parsed) {
    const profileThumbnail = parsed.platform === 'roblox-profile' ? await fetchRobloxUserAvatar(parsed.id) : '';
    const groupThumbnail = parsed.platform === 'roblox-group' ? await fetchRobloxGroupIcon(parsed.id) : '';
    const gameThumbnail = parsed.platform === 'roblox-game' ? await fetchRobloxGameThumbnail(parsed.id) : '';

    if (parsed.platform === 'roblox-game') {
      return {
        id: `roblox-game-${parsed.id}`,
        entityType: parsed.entityType,
        title: 'Roblox 游戏',
        subtitle: `Place ID ${parsed.id}`,
        thumbnail: gameThumbnail,
        badge: 'Game',
        actions: [
          { label: '打开游戏页', url: parsed.url },
          { label: 'Roblox', url: `https://www.roblox.com/games/${parsed.id}` },
        ],
      };
    }

    if (parsed.platform === 'roblox-group') {
      return {
        id: `roblox-group-${parsed.id}`,
        entityType: parsed.entityType,
        title: 'Roblox 群组',
        subtitle: `Group ID ${parsed.id}`,
        thumbnail: groupThumbnail,
        badge: 'Group',
        actions: [{ label: '打开群组', url: parsed.url }],
      };
    }

    return {
      id: `roblox-profile-${parsed.id}`,
      entityType: parsed.entityType,
      title: 'Roblox 用户',
      subtitle: `User ID ${parsed.id}`,
      thumbnail: profileThumbnail,
      badge: 'Profile',
      actions: [{ label: '打开资料', url: parsed.url }],
    };
  },
};

const devForumProvider = {
  key: 'roblox-devforum',
  match(target) {
    return target.hostname.replace(/^www\./, '').toLowerCase() === 'devforum.roblox.com';
  },
  parse(target) {
    const topicMatch = target.pathname.match(/\/t\/[^/]+\/(\d+)/i);
    const categoryMatch = target.pathname.match(/\/c\/[^/]+(?:\/(\d+))?/i);

    if (topicMatch) {
      return {
        url: target.toString(),
        platform: 'roblox-devforum',
        entityType: 'topic',
        id: topicMatch[1],
      };
    }

    if (categoryMatch) {
      return {
        url: target.toString(),
        platform: 'roblox-devforum',
        entityType: 'category',
        id: categoryMatch[1] || 'unknown',
      };
    }

    return null;
  },
  async resolveMeta(parsed) {
    const thumbnail = await fetchOpenGraphImage(parsed.url);

    if (parsed.entityType === 'topic') {
      return {
        id: `roblox-devforum-topic-${parsed.id}`,
        entityType: parsed.entityType,
        title: 'Roblox DevForum 话题',
        subtitle: `Topic ID ${parsed.id}`,
        thumbnail,
        badge: 'Topic',
        actions: [{ label: '打开讨论', url: parsed.url }],
      };
    }

    return {
      id: `roblox-devforum-category-${parsed.id}`,
      entityType: parsed.entityType,
      title: 'Roblox DevForum 分类',
      subtitle: `Category ${parsed.id}`,
      thumbnail,
      badge: 'Category',
      actions: [{ label: '打开分类', url: parsed.url }],
    };
  },
};

export const platformRegistry = [
  githubProvider,
  youtubeProvider,
  bilibiliProvider,
  qqChannelProvider,
  devForumProvider,
  robloxProvider,
];

export async function resolvePlatformCard(value) {
  try {
    const target = new URL(normalizeUrl(value));
    const provider = platformRegistry.find((entry) => entry.match(target));
    if (!provider) {
      return null;
    }

    const parsed = provider.parse(target);
    if (!parsed) {
      return null;
    }

    const meta = await provider.resolveMeta(parsed);
    return createCard(parsed, meta);
  } catch {
    return null;
  }
}

export async function resolvePlatformCards(urls) {
  const normalized = [...new Set((urls || []).filter(Boolean).map((url) => normalizeUrl(url)))];
  const cards = await Promise.all(normalized.map((url) => resolvePlatformCard(url)));
  return uniqueByUrl(cards);
}

export function deriveSupportPlatforms(cards) {
  return [...new Set(cards.map((card) => card.platform))];
}

export function getPlatformDisplayName(platform) {
  return platformDisplayNames[platform] || platform;
}
