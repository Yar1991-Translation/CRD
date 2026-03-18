export type AnnouncementLevel = 'info' | 'success' | 'warning' | 'danger';

export type AnnouncementStatus =
  | 'draft'
  | 'in_review'
  | 'published'
  | 'archived';

export type AdminRole = 'owner' | 'editor' | 'reviewer';

export type SupportedPlatform =
  | 'github'
  | 'youtube'
  | 'bilibili'
  | 'roblox-game'
  | 'roblox-group'
  | 'roblox-profile'
  | 'roblox-devforum';

export type PlatformCardAction = {
  label: string;
  url: string;
};

export type PlatformCard = {
  id: string;
  url: string;
  platform: SupportedPlatform;
  entityType: string;
  title: string;
  subtitle: string;
  thumbnail?: string;
  badge?: string;
  actions: PlatformCardAction[];
};

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  publishedAt?: string;
  expiresAt?: string;
  link?: string;
  linkText?: string;
  links?: string[];
  pinned?: boolean;
  level?: AnnouncementLevel;
  supportPlatforms?: SupportedPlatform[];
  platformCards?: PlatformCard[];
};

export type AnnouncementsResponse = {
  title?: string;
  subtitle?: string;
  items?: AnnouncementItem[];
};

export type AdminAnnouncementRecord = AnnouncementItem & {
  status: AnnouncementStatus;
  authorId?: string;
  reviewerId?: string;
  publishedBy?: string;
  scheduledAt?: string;
  version: number;
  internalNotes?: string;
  auditTrail?: AnnouncementAuditEntry[];
};

export type AnnouncementAuditEntry = {
  at: string;
  actorId: string;
  action: string;
  note?: string;
};

export type AdminUserSummary = {
  id: string;
  username: string;
  role: AdminRole;
  displayName: string;
};

export type AdminSession = {
  authenticated: boolean;
  csrfToken?: string;
  user?: AdminUserSummary;
};

export type AdminSettings = {
  siteTitle: string;
  subtitle: string;
  platformSupport: SupportedPlatform[];
};
