import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@material/web/button/filled-button.js';
import '@material/web/button/text-button.js';
import '@material/web/dialog/dialog.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';

type AnnouncementLevel = 'info' | 'success' | 'warning' | 'danger';

type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  publishedAt?: string;
  link?: string;
  linkText?: string;
  pinned?: boolean;
  level?: AnnouncementLevel;
};

type AnnouncementsResponse = {
  title?: string;
  subtitle?: string;
  items?: AnnouncementItem[];
};

@customElement('crd-announcements')
export class CrdAnnouncements extends LitElement {
  private static readonly endpoint =
    import.meta.env.VITE_ANNOUNCEMENTS_API_URL
    || import.meta.env.VITE_ANNOUNCEMENTS_URL
    || '/api/announcements';

  @state()
  private isLoading = true;

  @state()
  private error = '';

  @state()
  private sectionTitle = '公告中心';

  @state()
  private sectionSubtitle = '这里会显示站点通知、线路维护和版本提醒。';

  @state()
  private items: AnnouncementItem[] = [];

  @state()
  private showBanner = false;

  @state()
  private closing = false;

  @state()
  private showDialog = false;

  static styles = css`
    :host {
      display: block;
    }

    md-dialog {
      --md-dialog-container-color: var(--md-sys-color-surface-container-high, var(--md-sys-color-surface));
      width: min(720px, 92vw);
      max-width: 92vw;
    }

    .banner-shell {
      position: fixed;
      top: 84px;
      right: 24px;
      width: min(400px, calc(100vw - 32px));
      z-index: 90;
      pointer-events: none;
    }

    .banner-stack {
      position: relative;
      pointer-events: auto;
    }

    .banner-shadow,
    .banner {
      border-radius: 20px;
    }

    .banner-shadow {
      display: none;
    }

    .banner {
      position: relative;
      overflow: hidden;
      padding: 18px 18px 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      color: var(--md-sys-color-on-surface);
      background:
        radial-gradient(circle at top right, color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent), transparent 36%),
        linear-gradient(
          135deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-high) 88%, transparent),
          color-mix(in srgb, var(--md-sys-color-surface-container) 82%, transparent)
        );
      backdrop-filter: blur(18px) saturate(160%);
      -webkit-backdrop-filter: blur(18px) saturate(160%);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 42%, transparent);
      box-shadow:
        0 20px 48px rgba(0, 0, 0, 0.16),
        0 6px 14px rgba(0, 0, 0, 0.08);
      transform: translateY(-18px) scale(0.95) rotate(-1.2deg);
      opacity: 0;
      animation: announcementEnter 0.72s cubic-bezier(0.2, 0.9, 0.18, 1) forwards;
    }

    .banner::before {
      content: '';
      position: absolute;
      inset: -14%;
      background:
        radial-gradient(
          circle at 20% 26%,
          color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent),
          transparent 32%
        ),
        radial-gradient(
          circle at 82% 18%,
          color-mix(in srgb, var(--md-sys-color-tertiary) 12%, transparent),
          transparent 28%
        ),
        radial-gradient(
          circle at 58% 82%,
          color-mix(in srgb, white 8%, transparent),
          transparent 34%
        );
      opacity: 0.22;
      pointer-events: none;
    }

    .banner::after {
      content: '';
      position: absolute;
      inset: 0 auto auto 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in srgb, var(--md-sys-color-primary) 82%, transparent) 20%,
        color-mix(in srgb, var(--md-sys-color-tertiary) 72%, transparent) 80%,
        transparent 100%
      );
      transform: scaleX(0.2);
      transform-origin: left center;
      opacity: 0;
      animation: accentLineEnter 0.56s linear 0.1s forwards;
      pointer-events: none;
    }

    .banner.closing {
      animation: announcementExit 0.42s cubic-bezier(0.4, 0, 1, 1) forwards;
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
      gap: 12px;
      min-width: 0;
    }

    .title-copy {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--crd-font-small);
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--md-sys-color-primary);
      font-weight: 700;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-primary);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
      flex: none;
      margin-top: 2px;
    }

    .title-copy h2 {
      margin: 0;
      font-size: 1.06rem;
      line-height: 1.45;
      color: var(--md-sys-color-on-surface);
      word-break: break-word;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      font-family: var(--crd-font-small);
      font-size: 0.78rem;
      color: var(--md-sys-color-on-surface-variant);
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
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 88%, transparent);
      color: var(--md-sys-color-on-primary-container);
    }

    .badge.info {
      background: color-mix(in srgb, var(--md-sys-color-secondary-container) 88%, transparent);
      color: var(--md-sys-color-on-secondary-container);
    }

    .badge.success {
      background: color-mix(in srgb, #d6f5de 88%, transparent);
      color: #0d6b2f;
    }

    .badge.warning {
      background: color-mix(in srgb, #fff0c2 88%, transparent);
      color: #805b00;
    }

    .badge.danger {
      background: color-mix(in srgb, #ffd9d7 88%, transparent);
      color: #a12622;
    }

    .close-btn {
      margin: -8px -8px 0 0;
      color: var(--md-sys-color-on-surface-variant);
      flex: none;
    }

    .banner-content {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.9rem;
      line-height: 1.65;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .banner-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      flex-wrap: wrap;
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
      padding: 16px 18px;
      border-radius: 16px;
      background:
        radial-gradient(circle at top right, color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent), transparent 42%),
        var(--md-sys-color-surface-container-low);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 30%, transparent);
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

    .dialog-hero-copy strong {
      color: var(--md-sys-color-on-surface);
      font-size: 1rem;
    }

    .dialog-hero-copy span {
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.55;
      font-size: 0.9rem;
    }

    .dialog-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .dialog-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px 18px;
      border-radius: 16px;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 35%, transparent);
    }

    .dialog-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .dialog-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .dialog-card-title strong {
      color: var(--md-sys-color-on-surface);
      font-size: 0.98rem;
    }

    .dialog-card-content {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.65;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .detail-link {
      color: var(--md-sys-color-primary);
      text-decoration: none;
      font-weight: 600;
      width: fit-content;
    }

    .detail-link:hover {
      text-decoration: underline;
    }

    @keyframes announcementEnter {
      0% {
        transform: translateY(-18px) scale(0.95) rotate(-1.2deg);
        opacity: 0;
      }
      65% {
        transform: translateY(6px) scale(1.01) rotate(0.35deg);
        opacity: 1;
      }
      100% {
        transform: translateY(0) scale(1) rotate(0deg);
        opacity: 1;
      }
    }

    @keyframes announcementExit {
      0% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translateY(-16px) scale(0.96);
        opacity: 0;
      }
    }

    @keyframes accentLineEnter {
      0% {
        opacity: 0;
        transform: scaleX(0.2);
      }
      100% {
        opacity: 0.68;
        transform: scaleX(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .banner-shadow,
      .banner,
      .banner::before,
      .banner::after,
      .banner-header,
      .banner-content,
      .banner-actions {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }

    @media (max-width: 640px) {
      .banner-shell {
        top: 74px;
        right: 16px;
        width: calc(100vw - 32px);
      }

      .banner {
        padding: 16px;
        border-radius: 18px;
      }

      .dialog-card,
      .dialog-hero {
        padding: 14px 16px;
      }

      .dialog-card-header {
        flex-direction: column;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    void this.fetchAnnouncements();
  }

  private get featuredAnnouncement() {
    return this.items[0] ?? null;
  }

  private async fetchAnnouncements() {
    this.isLoading = true;
    this.error = '';

    try {
      const response = await fetch(CrdAnnouncements.endpoint, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as AnnouncementsResponse | AnnouncementItem[];
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

  private normalizeResponse(data: AnnouncementsResponse | AnnouncementItem[]) {
    const fallback = {
      title: '公告中心',
      subtitle: '这里会显示站点通知、线路维护和版本提醒。',
      items: [] as AnnouncementItem[],
    };

    if (Array.isArray(data)) {
      return {
        ...fallback,
        items: this.normalizeItems(data),
      };
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
      .map((item, index) => ({
        id: item.id || `announcement-${index}`,
        title: item.title,
        content: item.content,
        publishedAt: item.publishedAt,
        link: item.link,
        linkText: item.linkText || '查看详情',
        pinned: Boolean(item.pinned),
        level: item.level || 'info',
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
    }, 420);
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

  private renderBanner() {
    const item = this.featuredAnnouncement;
    if (!item || !this.showBanner || this.isLoading || this.error) {
      return nothing;
    }

    return html`
      <div class="banner-shell" aria-live="polite">
        <div class="banner-stack">
          <div class="banner-shadow"></div>
          <section class="banner ${this.closing ? 'closing' : ''}">
            <div class="banner-header">
              <div class="banner-title">
                <span class="pulse-dot"></span>
                <div class="title-copy">
                  <div class="eyebrow">站点公告</div>
                  <h2>${item.title}</h2>
                  <div class="meta-row">
                    ${this.renderBadge(item)}
                    ${item.publishedAt
                      ? html`<span>发布时间：${this.formatDate(item.publishedAt)}</span>`
                      : nothing}
                  </div>
                </div>
              </div>

              <md-icon-button
                class="close-btn"
                aria-label="关闭公告提示"
                @click=${() => this.closeBanner()}
              >
                <md-icon>close</md-icon>
              </md-icon-button>
            </div>

            <p class="banner-content">${item.content}</p>

            <div class="banner-actions">
              <md-text-button @click=${() => { this.showDialog = true; }}>
                查看全部
              </md-text-button>
              ${item.link
                ? html`
                    <md-filled-button @click=${() => window.open(item.link, '_blank', 'noopener,noreferrer')}>
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
    if (this.isLoading || this.error || this.items.length === 0) {
      return nothing;
    }

    return html`
      <md-dialog
        ?open=${this.showDialog}
        @close=${() => { this.showDialog = false; }}
      >
        <div slot="headline">${this.sectionTitle}</div>

        <div slot="content" class="dialog-content">
          <div class="dialog-hero">
            <md-icon>campaign</md-icon>
            <div class="dialog-hero-copy">
              <strong>${this.sectionTitle}</strong>
              <span>${this.sectionSubtitle}</span>
            </div>
          </div>

          <div class="dialog-list">
            ${this.items.map((item) => html`
              <article class="dialog-card">
                <div class="dialog-card-header">
                  <div class="dialog-card-title">
                    <strong>${item.title}</strong>
                    ${this.renderBadge(item)}
                  </div>
                  ${item.publishedAt
                    ? html`<span class="meta-row">发布时间：${this.formatDate(item.publishedAt)}</span>`
                    : nothing}
                </div>

                <p class="dialog-card-content">${item.content}</p>

                ${item.link
                  ? html`
                      <a class="detail-link" href=${item.link} target="_blank" rel="noopener noreferrer">
                        ${item.linkText}
                      </a>
                    `
                  : nothing}
              </article>
            `)}
          </div>
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
