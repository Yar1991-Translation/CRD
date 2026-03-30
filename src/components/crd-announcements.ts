import { LitElement, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@material/web/button/filled-button.js';
import '@material/web/button/text-button.js';
import '@material/web/dialog/dialog.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import {
  announcementLinkPattern,
  buildPlatformCards,
  deriveSupportPlatforms,
  normalizeAnnouncementHref,
  platformDisplayNames,
} from '../utils/announcement-platforms.js';
import type {
  AnnouncementItem,
  AnnouncementLevel,
  AnnouncementsResponse,
  PlatformCard,
  SupportedPlatform,
} from '../utils/announcement-types.js';

type NormalizedAnnouncementsResponse = {
  title: string;
  subtitle: string;
  items: AnnouncementItem[];
};

@customElement('crd-announcements')
export class CrdAnnouncements extends LitElement {
  private static readonly endpoint =
    import.meta.env.VITE_ANNOUNCEMENTS_API_URL
    || import.meta.env.VITE_ANNOUNCEMENTS_URL
    || '/api/announcements';

  private static readonly fallbackEndpoint = '/announcements.json';

  private static readonly defaultTitle = '公告中心';

  private static readonly defaultSubtitle = '这里会显示站点通知、线路维护和版本提醒。';

  private static readonly renderLinkPattern = new RegExp(
    announcementLinkPattern.source,
    announcementLinkPattern.flags,
  );

  @state() private isLoading = true;
  @state() private error = '';
  @state() private sectionTitle = CrdAnnouncements.defaultTitle;
  @state() private sectionSubtitle = CrdAnnouncements.defaultSubtitle;
  @state() private items: AnnouncementItem[] = [];
  @state() private showBanner = false;
  @state() private closing = false;
  @state() private showDialog = false;

  private readonly handleOpenRequest = () => {
    if (!this.isLoading && (this.error || this.visibleItems.length === 0)) {
      void this.fetchAnnouncements();
    }

    this.showDialog = true;
  };

  static styles = css`
    :host {
      display: block;
    }

    md-dialog {
      --md-dialog-container-color:
        color-mix(
          in srgb,
          var(--md-sys-color-surface-container-high) 96%,
          var(--md-sys-color-primary) 4%
        );
      width: min(760px, 92vw);
      max-width: 92vw;
    }

    .banner-shell {
      position: fixed;
      top: calc(var(--crd-navbar-safe-height, 104px) + env(safe-area-inset-top, 0px));
      right: 24px;
      width: min(432px, calc(100vw - 32px));
      z-index: 90;
      pointer-events: none;
    }

    .banner-stack {
      position: relative;
      pointer-events: auto;
    }

    .banner {
      position: relative;
      overflow: hidden;
      padding: 22px 22px 18px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      color: var(--md-sys-color-on-surface);
      border-radius: 24px;
      background:
        radial-gradient(
          circle at top right,
          color-mix(in srgb, var(--md-sys-color-primary) 9%, transparent),
          transparent 46%
        ),
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-highest) 98%, transparent),
          color-mix(in srgb, var(--md-sys-color-surface-container-high) 98%, var(--md-sys-color-primary) 2%)
        );
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.08);
      transform: translateY(-10px);
      opacity: 0;
      animation: announcement-enter 260ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }

    .banner::after {
      content: '';
      position: absolute;
      top: 0;
      left: 20px;
      right: 20px;
      height: 2px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--md-sys-color-primary) 52%, transparent);
      transform: scaleX(0.24);
      transform-origin: left center;
      opacity: 0;
      animation: accent-enter 240ms ease 70ms forwards;
    }

    .banner.closing {
      animation: announcement-exit 220ms cubic-bezier(0.4, 0, 1, 1) forwards;
    }

    .banner-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }

    .banner-title {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      min-width: 0;
    }

    .title-copy {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }

    .eyebrow,
    .published-at,
    .preview-kicker,
    .support-chip,
    .preview-action {
      font-family: var(--crd-font-small);
      font-weight: 700;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      color: var(--md-sys-color-primary);
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--md-sys-color-primary);
      flex: none;
      margin-top: 1px;
    }

    .title-copy h2 {
      margin: 0;
      font-size: 1.12rem;
      line-height: 1.38;
      color: var(--md-sys-color-on-surface);
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .published-at {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.76rem;
      color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 88%, transparent);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 10px;
      border-radius: 999px;
      font-family: var(--crd-font-small);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .badge.pinned {
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 90%, transparent);
      color: var(--md-sys-color-on-primary-container);
    }

    .badge.info {
      background: color-mix(in srgb, var(--md-sys-color-secondary-container) 90%, transparent);
      color: var(--md-sys-color-on-secondary-container);
    }

    .badge.success {
      background: var(--crd-status-success-container);
      color: var(--crd-status-on-success-container);
    }

    .badge.warning {
      background: var(--crd-status-warning-container);
      color: var(--crd-status-on-warning-container);
    }

    .badge.danger {
      background: var(--crd-status-danger-container);
      color: var(--crd-status-on-danger-container);
    }

    .support-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .banner .support-row {
      max-height: 54px;
      overflow: hidden;
    }

    .support-chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 10px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--md-sys-color-secondary-container) 76%, transparent);
      color: var(--md-sys-color-on-secondary-container);
      font-size: 0.7rem;
      letter-spacing: 0.03em;
    }

    .support-chip--more {
      background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 92%, transparent);
      color: var(--md-sys-color-on-surface-variant);
    }

    .close-btn {
      margin: -8px -8px 0 0;
      opacity: 0.48;
      transition: opacity 180ms ease;
      --md-icon-button-state-layer-width: 40px;
      --md-icon-button-state-layer-height: 40px;
      --md-icon-button-state-layer-shape: 999px;
      --md-icon-button-icon-color: var(--md-sys-color-on-surface-variant);
      --md-icon-button-hover-icon-color: var(--md-sys-color-on-surface);
      --md-icon-button-focus-icon-color: var(--md-sys-color-on-surface);
      --md-icon-button-hover-state-layer-color: var(--md-sys-color-primary);
      --md-icon-button-pressed-state-layer-color: var(--md-sys-color-primary);
      --md-icon-button-focus-state-layer-color: var(--md-sys-color-primary);
    }

    .banner:hover .close-btn,
    .banner:focus-within .close-btn {
      opacity: 0.92;
    }

    .banner-content,
    .dialog-card-content {
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.92rem;
      line-height: 1.62;
      word-break: break-word;
    }

    .banner-content {
      margin: 2px 0 10px;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .dialog-card-content {
      margin: 2px 0 10px;
    }

    .inline-link {
      color: var(--md-sys-color-primary);
      text-decoration: none;
      font-weight: 700;
    }

    .inline-link:hover,
    .detail-link:hover {
      text-decoration: underline;
      text-underline-offset: 0.12em;
    }

    .inline-link-chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 8px;
      margin: 0 2px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 72%, transparent);
      color: var(--md-sys-color-primary);
      font-family: var(--crd-font-small);
      font-size: 0.76rem;
    }

    .preview-grid {
      display: grid;
      gap: 10px;
    }

    .banner .preview-grid {
      max-height: 228px;
      overflow: hidden;
    }

    .preview-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      border-radius: 18px;
      background:
        linear-gradient(
          180deg,
          color-mix(
            in srgb,
            var(--md-sys-color-surface-container-high) 96%,
            var(--preview-accent, var(--md-sys-color-primary)) 4%
          ),
          color-mix(
            in srgb,
            var(--md-sys-color-surface-container) 98%,
            var(--preview-accent, var(--md-sys-color-primary)) 2%
          )
        );
      border: 1px solid color-mix(
        in srgb,
        var(--md-sys-color-outline-variant) 84%,
        var(--preview-accent, var(--md-sys-color-primary)) 16%
      );
      transition:
        transform 160ms ease,
        border-color 160ms ease,
        background-color 160ms ease;
    }

    .preview-card:hover {
      transform: translateY(-1px);
      border-color: color-mix(
        in srgb,
        var(--md-sys-color-outline-variant) 66%,
        var(--preview-accent, var(--md-sys-color-primary)) 34%
      );
    }

    .preview-card--github { --preview-accent: #1f6feb; }
    .preview-card--youtube { --preview-accent: #ff0033; }
    .preview-card--bilibili { --preview-accent: #00a1d6; }
    .preview-card--qq-channel { --preview-accent: #12b7f5; }
    .preview-card--roblox-game,
    .preview-card--roblox-group,
    .preview-card--roblox-profile,
    .preview-card--roblox-devforum { --preview-accent: #1465d9; }

    .preview-main {
      display: grid;
      grid-template-columns: 52px 1fr;
      gap: 12px;
      align-items: center;
      color: inherit;
      text-decoration: none;
    }

    .preview-thumb {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      overflow: hidden;
      background: color-mix(
        in srgb,
        var(--preview-accent, var(--md-sys-color-primary)) 12%,
        var(--md-sys-color-surface-container-highest)
      );
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--preview-accent, var(--md-sys-color-primary));
      font-family: var(--crd-font-small);
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .preview-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .preview-thumb--qq-channel {
      position: relative;
      flex-direction: column;
      gap: 2px;
      border: 1px solid color-mix(
        in srgb,
        var(--preview-accent, var(--md-sys-color-primary)) 22%,
        transparent
      );
      background:
        radial-gradient(
          circle at top left,
          color-mix(in srgb, var(--preview-accent, var(--md-sys-color-primary)) 22%, transparent),
          transparent 54%
        ),
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--preview-accent, var(--md-sys-color-primary)) 16%, transparent),
          color-mix(in srgb, var(--preview-accent, var(--md-sys-color-primary)) 8%, transparent)
        );
      text-transform: none;
    }

    .preview-thumb--qq-channel::before {
      content: '';
      position: absolute;
      inset: 5px;
      border-radius: 11px;
      border: 1px solid color-mix(
        in srgb,
        var(--preview-accent, var(--md-sys-color-primary)) 16%,
        transparent
      );
      opacity: 0.72;
    }

    .preview-thumb-qq {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1;
      letter-spacing: 0;
    }

    .preview-thumb-qq strong {
      font-size: 0.98rem;
      font-weight: 800;
    }

    .preview-thumb-qq span {
      margin-top: 2px;
      font-size: 0.48rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      opacity: 0.88;
    }

    .preview-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .preview-kicker {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      min-height: 22px;
      padding: 0 8px;
      border-radius: 999px;
      background: color-mix(
        in srgb,
        var(--preview-accent, var(--md-sys-color-primary)) 14%,
        transparent
      );
      color: var(--preview-accent, var(--md-sys-color-primary));
      font-size: 0.7rem;
    }

    .preview-title,
    .preview-subtitle {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .preview-title {
      color: var(--md-sys-color-on-surface);
      font-size: 0.88rem;
      line-height: 1.35;
    }

    .preview-subtitle {
      color: var(--md-sys-color-on-surface-variant);
      font-family: var(--crd-font-small);
      font-size: 0.75rem;
    }

    .preview-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .banner .preview-card {
      padding: 10px;
      gap: 10px;
    }

    .preview-overflow-note {
      padding: 2px 2px 0;
      color: var(--md-sys-color-on-surface-variant);
      font-family: var(--crd-font-small);
      font-size: 0.74rem;
      line-height: 1.5;
    }

    .preview-action {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      background: color-mix(
        in srgb,
        var(--preview-accent, var(--md-sys-color-primary)) 10%,
        transparent
      );
      color: var(--preview-accent, var(--md-sys-color-primary));
      font-size: 0.72rem;
      text-decoration: none;
      transition: background-color 160ms ease;
    }

    .preview-action:hover {
      background: color-mix(
        in srgb,
        var(--preview-accent, var(--md-sys-color-primary)) 16%,
        transparent
      );
    }

    .banner-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 2px;
    }

    .primary-action {
      --md-filled-button-container-shape: 999px;
      --md-filled-button-container-height: 42px;
      --md-filled-button-container-color: var(--md-sys-color-primary);
      --md-filled-button-label-text-color: var(--md-sys-color-on-primary);
      --md-filled-button-hover-state-layer-color: var(--md-sys-color-on-primary);
      --md-filled-button-focus-state-layer-color: var(--md-sys-color-on-primary);
      --md-filled-button-pressed-state-layer-color: var(--md-sys-color-on-primary);
    }

    .secondary-action {
      --md-text-button-container-shape: 999px;
      --md-text-button-container-height: 40px;
      --md-text-button-label-text-color: var(--md-sys-color-primary);
      --md-text-button-hover-state-layer-color: var(--md-sys-color-primary);
      --md-text-button-focus-state-layer-color: var(--md-sys-color-primary);
      --md-text-button-pressed-state-layer-color: var(--md-sys-color-primary);
    }

    md-text-button.secondary-action {
      border-radius: 999px;
      transition: background-color 160ms ease;
    }

    md-text-button.secondary-action:hover,
    md-text-button.secondary-action:focus-visible {
      background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 6px;
    }

    .dialog-hero {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 18px 20px;
      border-radius: 20px;
      background:
        radial-gradient(
          circle at top right,
          color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent),
          transparent 42%
        ),
        var(--md-sys-color-surface-container);
    }

    .dialog-hero md-icon {
      color: var(--md-sys-color-primary);
      font-size: 26px;
      flex: none;
      margin-top: 2px;
    }

    .dialog-hero-copy {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .dialog-hero-copy strong,
    .dialog-state strong,
    .dialog-card-title strong {
      color: var(--md-sys-color-on-surface);
    }

    .dialog-hero-copy span,
    .dialog-state {
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.55;
      font-size: 0.9rem;
    }

    .dialog-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .dialog-card,
    .dialog-state {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 18px;
      border-radius: 18px;
      background: var(--md-sys-color-surface-container-low);
    }

    .dialog-state.error strong {
      color: var(--md-sys-color-error);
    }

    .dialog-card-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .dialog-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .detail-link {
      color: var(--md-sys-color-primary);
      text-decoration: none;
      font-weight: 700;
      width: fit-content;
    }

    @keyframes announcement-enter {
      from {
        transform: translateY(-10px);
        opacity: 0;
      }

      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes announcement-exit {
      from {
        transform: translateY(0);
        opacity: 1;
      }

      to {
        transform: translateY(-10px);
        opacity: 0;
      }
    }

    @keyframes accent-enter {
      from {
        opacity: 0;
        transform: scaleX(0.24);
      }

      to {
        opacity: 0.72;
        transform: scaleX(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .banner,
      .banner::after {
        animation: none;
        opacity: 1;
        transform: none;
      }

      .preview-card,
      .preview-action {
        transition: none;
      }
    }

    @media (max-width: 640px) {
      .banner-shell {
        top: calc(var(--crd-navbar-safe-height-mobile, 88px) + env(safe-area-inset-top, 0px));
        right: 16px;
        width: calc(100vw - 32px);
      }

      .banner {
        padding: 16px;
        border-radius: 20px;
      }

      .preview-main {
        grid-template-columns: 48px 1fr;
      }

      .preview-thumb {
        width: 48px;
        height: 48px;
      }

      .dialog-card,
      .dialog-state,
      .dialog-hero {
        padding: 14px 16px;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('crd-open-announcements', this.handleOpenRequest);
    void this.fetchAnnouncements();
  }

  disconnectedCallback() {
    window.removeEventListener('crd-open-announcements', this.handleOpenRequest);
    super.disconnectedCallback();
  }

  private get visibleItems() {
    return this.items.filter((item) => !this.isExpired(item));
  }

  private get featuredAnnouncement() {
    return this.visibleItems[0] ?? null;
  }

  private isExpired(item: AnnouncementItem) {
    if (!item.expiresAt) {
      return false;
    }

    const expiresAt = new Date(item.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      return false;
    }

    return expiresAt.getTime() < Date.now();
  }

  private async fetchAnnouncements() {
    this.isLoading = true;
    this.error = '';

    try {
      let data: AnnouncementsResponse | AnnouncementItem[];

      try {
        data = await this.fetchAnnouncementsFrom(CrdAnnouncements.endpoint);
      } catch (primaryError) {
        if (CrdAnnouncements.endpoint === CrdAnnouncements.fallbackEndpoint) {
          throw primaryError;
        }

        data = await this.fetchAnnouncementsFrom(CrdAnnouncements.fallbackEndpoint);
      }

      const normalized = this.normalizeResponse(data);
      this.sectionTitle = normalized.title;
      this.sectionSubtitle = normalized.subtitle;
      this.items = normalized.items;
      this.showBanner = normalized.items.length > 0;
    } catch (error) {
      console.error('Failed to load announcements', error);
      this.error = '公告暂时无法加载，请稍后刷新重试。';
      this.items = [];
      this.showBanner = false;
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchAnnouncementsFrom(endpoint: string) {
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json() as AnnouncementsResponse | AnnouncementItem[];
  }

  private normalizeResponse(data: AnnouncementsResponse | AnnouncementItem[]): NormalizedAnnouncementsResponse {
    const fallback: NormalizedAnnouncementsResponse = {
      title: CrdAnnouncements.defaultTitle,
      subtitle: CrdAnnouncements.defaultSubtitle,
      items: [],
    };

    if (Array.isArray(data)) {
      return { ...fallback, items: this.normalizeItems(data) };
    }

    return {
      title: data.title || fallback.title,
      subtitle: data.subtitle || fallback.subtitle,
      items: this.normalizeItems(data.items || []),
    };
  }

  private normalizeItems(items: AnnouncementItem[]) {
    return [...items]
      .filter((item) => item && item.title && item.content)
      .map((item, index): AnnouncementItem => ({
        id: item.id || `announcement-${index}`,
        title: item.title,
        content: item.content,
        publishedAt: item.publishedAt,
        expiresAt: item.expiresAt,
        link: item.link ? normalizeAnnouncementHref(item.link) : undefined,
        linkText: item.linkText || '查看详情',
        links: Array.isArray(item.links)
          ? item.links.filter(Boolean).map((entry) => normalizeAnnouncementHref(entry))
          : [],
        pinned: Boolean(item.pinned),
        level: item.level || 'info',
        supportPlatforms: Array.isArray(item.supportPlatforms) ? item.supportPlatforms : [],
        platformCards: Array.isArray(item.platformCards) ? item.platformCards : [],
      }))
      .sort((left, right) => {
        const pinnedDelta = Number(Boolean(right.pinned)) - Number(Boolean(left.pinned));
        if (pinnedDelta !== 0) {
          return pinnedDelta;
        }

        return String(right.publishedAt || '').localeCompare(String(left.publishedAt || ''));
      });
  }

  private formatDate(value?: string) {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }

  private closeBanner() {
    this.closing = true;
    window.setTimeout(() => {
      this.showBanner = false;
      this.closing = false;
    }, 220);
  }

  private getPlatformMeta(item: AnnouncementItem) {
    const cards = buildPlatformCards(item).slice(0, 4);
    const platforms = deriveSupportPlatforms(item, cards);

    return { cards, platforms };
  }

  private renderRichText(value: string) {
    const lines = value.split(/\r?\n/);

    return lines.map((line, lineIndex) => html`
      ${this.renderInlineText(line)}
      ${lineIndex < lines.length - 1 ? html`<br />` : nothing}
    `);
  }

  private renderInlineText(value: string) {
    const matches = [...value.matchAll(CrdAnnouncements.renderLinkPattern)];
    if (matches.length === 0) {
      return value;
    }

    const fragments: Array<string | ReturnType<typeof html>> = [];
    let cursor = 0;

    matches.forEach((match) => {
      const rawMatch = match[0];
      const start = match.index ?? 0;
      if (start > cursor) {
        fragments.push(value.slice(cursor, start));
      }

      const href = normalizeAnnouncementHref(rawMatch);
      fragments.push(html`
        <a class="inline-link" href=${href} target="_blank" rel="noopener noreferrer">
          <span class="inline-link-chip">${rawMatch}</span>
        </a>
      `);

      cursor = start + rawMatch.length;
    });

    if (cursor < value.length) {
      fragments.push(value.slice(cursor));
    }

    return fragments;
  }

  private renderBadge(item: AnnouncementItem) {
    const level = item.level || 'info';
    const levelLabelMap: Record<AnnouncementLevel, string> = {
      info: '通知',
      success: '正常',
      warning: '提醒',
      danger: '重要',
    };

    return html`
      ${item.pinned ? html`<span class="badge pinned">置顶</span>` : nothing}
      <span class="badge ${level}">${levelLabelMap[level]}</span>
    `;
  }

  private renderPublishedAt(item: AnnouncementItem) {
    if (!item.publishedAt) {
      return nothing;
    }

    return html`
      <div class="published-at">
        <span>发布时间:</span>
        <span>${this.formatDate(item.publishedAt)}</span>
      </div>
    `;
  }

  private renderSupportPlatforms(platforms: SupportedPlatform[], compact = false) {
    if (platforms.length === 0) {
      return nothing;
    }

    const visiblePlatforms = compact ? platforms.slice(0, 4) : platforms;
    const hiddenCount = compact ? Math.max(platforms.length - visiblePlatforms.length, 0) : 0;

    return html`
      <div class="support-row">
        ${visiblePlatforms.map((platform) => html`
          <span class="support-chip">${platformDisplayNames[platform]}</span>
        `)}
        ${hiddenCount > 0
          ? html`<span class="support-chip support-chip--more">+${hiddenCount}</span>`
          : nothing}
      </div>
    `;
  }

  private openItemLink(item: AnnouncementItem) {
    if (item.link) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    }
  }

  private normalizeThumbnailUrl(url: string) {
    if (!url) {
      return '';
    }

    if (url.startsWith('//')) {
      return `https:${url}`;
    }

    return url;
  }

  private buildThumbnailProxyUrl(url: string) {
    const normalized = this.normalizeThumbnailUrl(url);
    if (!normalized) {
      return '';
    }

    const stripped = normalized.replace(/^https?:\/\//i, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}&w=160&h=160&fit=cover`;
  }

  private renderPreviewThumb(card: PlatformCard) {
    if (card.thumbnail) {
      return html`
        <div class="preview-thumb">
          <img
            src=${this.normalizeThumbnailUrl(card.thumbnail)}
            alt=${card.title}
            loading="lazy"
            @error=${(event: Event) => this.handleThumbnailError(event, card.thumbnail!)}
          />
        </div>
      `;
    }

    if (card.platform === 'qq-channel') {
      return html`
        <div class="preview-thumb preview-thumb--qq-channel" aria-hidden="true">
          <div class="preview-thumb-qq">
            <strong>QQ</strong>
            <span>频道</span>
          </div>
        </div>
      `;
    }

    return html`
      <div class="preview-thumb">${platformDisplayNames[card.platform]}</div>
    `;
  }

  private handleThumbnailError(event: Event, originalUrl: string) {
    const image = event.currentTarget as HTMLImageElement | null;
    if (!image) {
      return;
    }

    const fallbackUrl = this.buildThumbnailProxyUrl(originalUrl);
    const currentUrl = image.currentSrc || image.src;
    const hasRetried = image.dataset.retryState === 'proxy';

    if (!hasRetried && fallbackUrl && currentUrl !== fallbackUrl) {
      image.dataset.retryState = 'proxy';
      image.src = fallbackUrl;
      return;
    }

    image.style.display = 'none';
  }

  private renderPreviewCards(cards: PlatformCard[], compact = false) {
    if (cards.length === 0) {
      return nothing;
    }

    const visibleCards = compact ? cards.slice(0, 2) : cards;
    const hiddenCount = compact ? Math.max(cards.length - visibleCards.length, 0) : 0;

    return html`
      <div class="preview-grid">
        ${visibleCards.map((card) => html`
          <article class="preview-card preview-card--${card.platform}">
            <a class="preview-main" href=${card.url} target="_blank" rel="noopener noreferrer">
              ${this.renderPreviewThumb(card)}
              <div class="preview-copy">
                <span class="preview-kicker">${card.badge || platformDisplayNames[card.platform]}</span>
                <strong class="preview-title">${card.title}</strong>
                <span class="preview-subtitle">${card.subtitle}</span>
              </div>
            </a>
            ${card.actions.length > 0 ? html`
              <div class="preview-actions">
                ${card.actions.slice(0, compact ? 1 : 3).map((action) => html`
                  <a class="preview-action" href=${action.url} target="_blank" rel="noopener noreferrer">
                    ${action.label}
                  </a>
                `)}
              </div>
            ` : nothing}
          </article>
        `)}
        ${hiddenCount > 0
          ? html`
              <div class="preview-overflow-note">
                还有 ${hiddenCount} 个平台卡片，点击“查看全部”查看完整内容。
              </div>
            `
          : nothing}
      </div>
    `;
  }

  private renderBanner() {
    const item = this.featuredAnnouncement;
    if (!item || !this.showBanner || this.isLoading || this.error) {
      return nothing;
    }

    const { cards, platforms } = this.getPlatformMeta(item);

    return html`
      <div class="banner-shell" aria-live="polite">
        <div class="banner-stack">
          <section class="banner ${this.closing ? 'closing' : ''}">
            <div class="banner-header">
              <div class="banner-title">
                <span class="pulse-dot"></span>
                <div class="title-copy">
                  <div class="eyebrow">站点公告</div>
                  <h2>${item.title}</h2>
                  <div class="meta-row">${this.renderBadge(item)}</div>
                  ${this.renderSupportPlatforms(platforms, true)}
                </div>
              </div>

              <md-icon-button
                class="close-btn"
                aria-label="关闭公告提示"
                touch-target="wrapper"
                @click=${() => this.closeBanner()}
              >
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>

            ${this.renderPublishedAt(item)}
            <p class="banner-content">${this.renderRichText(item.content)}</p>
            ${this.renderPreviewCards(cards, true)}

            <div class="banner-actions">
              <md-text-button class="secondary-action" @click=${() => { this.showDialog = true; }}>
                查看全部
              </md-text-button>
              ${item.link
                ? html`
                    <md-filled-button class="primary-action" @click=${() => this.openItemLink(item)}>
                      ${item.linkText}
                    </md-filled-button>
                  `
                : nothing}
            </div>
          </section>
        </div>
      </div>
    `;
  }

  private renderDialog() {
    return html`
      <md-dialog ?open=${this.showDialog} @close=${() => { this.showDialog = false; }}>
        <div slot="headline">${this.sectionTitle}</div>

        <div slot="content" class="dialog-content">
          <div class="dialog-hero">
            <md-icon>campaign</md-icon>
            <div class="dialog-hero-copy">
              <strong>${this.sectionTitle}</strong>
              <span>${this.sectionSubtitle}</span>
            </div>
          </div>

          ${this.isLoading ? html`
            <div class="dialog-state">
              <strong>正在加载公告</strong>
              <span>稍等片刻，我们正在获取最新公告内容。</span>
            </div>
          ` : this.error ? html`
            <div class="dialog-state error">
              <strong>公告暂时无法加载</strong>
              <span>${this.error}</span>
            </div>
          ` : this.visibleItems.length === 0 ? html`
            <div class="dialog-state">
              <strong>当前没有公告</strong>
              <span>暂时没有新的站点通知、线路维护或版本提醒。</span>
            </div>
          ` : html`
            <div class="dialog-list">
              ${this.visibleItems.map((item) => {
                const { cards, platforms } = this.getPlatformMeta(item);

                return html`
                  <article class="dialog-card">
                    <div class="dialog-card-header">
                      <div class="dialog-card-title">
                        <strong>${item.title}</strong>
                        ${this.renderBadge(item)}
                      </div>
                      ${this.renderSupportPlatforms(platforms)}
                      ${this.renderPublishedAt(item)}
                    </div>

                    <p class="dialog-card-content">${this.renderRichText(item.content)}</p>
                    ${this.renderPreviewCards(cards)}

                    ${item.link
                      ? html`
                          <a class="detail-link" href=${item.link} target="_blank" rel="noopener noreferrer">
                            ${item.linkText}
                          </a>
                        `
                      : nothing}
                  </article>
                `;
              })}
            </div>
          `}
        </div>

        <div slot="actions">
          <md-text-button @click=${() => { this.showDialog = false; }}>
            关闭
          </md-text-button>
        </div>
      </md-dialog>
    `;
  }

  render() {
    return html`
      ${this.renderBanner()}
      ${this.renderDialog()}
    `;
  }
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_ANNOUNCEMENTS_API_URL?: string;
    readonly VITE_ANNOUNCEMENTS_URL?: string;
  }

  interface HTMLElementTagNameMap {
    'crd-announcements': CrdAnnouncements;
  }
}
