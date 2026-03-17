import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@material/web/button/filled-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/dialog/dialog.js';

@customElement('crd-disclaimer')
export class CrdDisclaimer extends LitElement {
  @state()
  private showDialog = false;

  @state()
  private showBanner = false;

  @state()
  private closing = false;

  @state()
  private dialogStrict = true;

  static styles = css`
    :host {
      display: block;
    }

    md-dialog {
      --md-dialog-container-color: var(--md-sys-color-surface-container-high, var(--md-sys-color-surface));
      --md-dialog-headline-color: var(--md-sys-color-on-surface);
      --md-dialog-supporting-text-color: var(--md-sys-color-on-surface-variant);
      width: min(680px, 92vw);
      max-width: 92vw;
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--md-sys-color-on-surface) 30%, transparent) transparent;
    }

    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 20%, transparent);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 40%, transparent);
    }

    .banner {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 1000;
      width: min(360px, calc(100vw - 32px));
      max-width: 360px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      border-radius: 24px;
      color: var(--md-sys-color-on-surface);
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-highest) 88%, transparent),
          var(--md-sys-color-surface-container-high)
        );
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 82%, transparent);
      overflow: hidden;
      opacity: 0;
      transform: translateY(14px);
      animation: disclaimerEnter 320ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }

    .banner::after {
      content: '';
      position: absolute;
      top: 0;
      left: 18px;
      right: 18px;
      height: 2px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--md-sys-color-primary) 60%, transparent);
      transform: scaleX(0.24);
      transform-origin: left center;
      opacity: 0;
      animation: accentEnter 260ms ease 80ms forwards;
    }

    .banner.closing {
      animation: disclaimerExit 220ms cubic-bezier(0.4, 0, 1, 1) forwards;
    }

    @keyframes disclaimerEnter {
      from {
        opacity: 0;
        transform: translateY(14px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes disclaimerExit {
      from {
        opacity: 1;
        transform: translateY(0);
      }

      to {
        opacity: 0;
        transform: translateY(14px);
      }
    }

    @keyframes accentEnter {
      from {
        opacity: 0;
        transform: scaleX(0.24);
      }

      to {
        opacity: 0.72;
        transform: scaleX(1);
      }
    }

    .banner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      font-size: 1rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }

    .banner-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      flex: none;
      border-radius: 50%;
      background: var(--md-sys-color-primary);
    }

    .banner-content {
      font-size: 0.88rem;
      line-height: 1.6;
      color: var(--md-sys-color-on-surface-variant);
    }

    .banner-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .close-btn {
      margin-top: -8px;
      margin-right: -8px;
      border-radius: 14px;
      transition: background-color 180ms ease;
      --md-icon-button-state-layer-width: 40px;
      --md-icon-button-state-layer-height: 40px;
      --md-icon-button-state-layer-shape: 14px;
      --md-icon-button-icon-color: var(--md-sys-color-on-surface-variant);
      --md-icon-button-hover-icon-color: var(--md-sys-color-on-surface);
      --md-icon-button-focus-icon-color: var(--md-sys-color-on-surface);
      --md-icon-button-pressed-icon-color: var(--md-sys-color-on-surface);
      --md-icon-button-hover-state-layer-color: var(--md-sys-color-on-surface);
      --md-icon-button-pressed-state-layer-color: var(--md-sys-color-on-surface);
    }

    .close-btn:hover {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      width: 100%;
    }

    .dialog-shell {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding-top: 2px;
    }

    .dialog-hero {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 18px 20px;
      border-radius: 24px;
      background:
        radial-gradient(circle at top right, color-mix(in srgb, var(--md-sys-color-error) 10%, transparent), transparent 42%),
        var(--md-sys-color-surface-container-high);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 82%, transparent);
    }

    .dialog-hero md-icon {
      flex: none;
      margin-top: 2px;
      font-size: 26px;
      color: var(--md-sys-color-error);
    }

    .dialog-hero-text {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .dialog-hero-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--md-sys-color-on-surface);
    }

    .dialog-hero-subtitle {
      font-size: 0.88rem;
      line-height: 1.55;
      color: var(--md-sys-color-on-surface-variant);
    }

    .dialog-content {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--md-sys-color-on-surface-variant);
    }

    .dialog-content::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .dialog-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .dialog-content::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 20%, transparent);
      border-radius: 4px;
    }

    .dialog-content::-webkit-scrollbar-thumb:hover {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 40%, transparent);
    }

    .dialog-list {
      display: grid;
      gap: 10px;
    }

    .dialog-item {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 12px;
      align-items: start;
      padding: 14px 16px;
      border-radius: 18px;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 74%, transparent);
    }

    .dialog-index {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 88%, white);
      color: var(--md-sys-color-on-primary-container);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .dialog-copy {
      padding-top: 3px;
      color: var(--md-sys-color-on-surface);
    }

    .dialog-content strong {
      color: var(--md-sys-color-error);
    }

    .dialog-note {
      padding: 0 2px;
      font-size: 0.82rem;
      line-height: 1.6;
      color: var(--md-sys-color-on-surface-variant);
    }

    @media (max-width: 640px) {
      .banner {
        left: 12px;
        right: 12px;
        bottom: 16px;
        width: auto;
        max-width: none;
        border-radius: 22px;
      }

      .dialog-shell {
        gap: 14px;
      }

      .dialog-hero {
        padding: 14px 16px;
      }

      .dialog-item {
        grid-template-columns: 24px 1fr;
        gap: 10px;
        padding: 10px 12px;
      }

      .dialog-index {
        width: 24px;
        height: 24px;
        font-size: 0.76rem;
      }

      .dialog-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .dialog-actions md-text-button,
      .dialog-actions md-filled-button {
        width: 100%;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    const agreed = localStorage.getItem('crd_disclaimer_agreed');
    const bannerClosed = localStorage.getItem('crd_disclaimer_banner_closed');

    if (!agreed) {
      this.dialogStrict = true;
      this.showDialog = true;
    } else if (!bannerClosed) {
      this.showBanner = true;
    }
  }

  private handleAgree() {
    localStorage.setItem('crd_disclaimer_agreed', 'true');
    this.showDialog = false;
    this.dialogStrict = false;
    this.showBanner = true;
  }

  private handleDisagree() {
    window.location.href = 'https://www.roblox.com';
  }

  private handleCloseBanner() {
    this.closing = true;
  }

  private handleOpenDetails() {
    this.dialogStrict = false;
    this.showDialog = true;
  }

  private handleDialogClosed() {
    if (!this.dialogStrict) {
      this.showDialog = false;
    }
  }

  private onBannerAnimationEnd(e: AnimationEvent) {
    if (this.closing && e.animationName === 'disclaimerExit') {
      localStorage.setItem('crd_disclaimer_banner_closed', 'true');
      this.showBanner = false;
      this.closing = false;
    }
  }

  private preventClose(e: Event) {
    e.preventDefault();
  }

  render() {
    return html`
      ${this.showDialog ? html`
        <md-dialog
          open
          @cancel=${this.dialogStrict ? this.preventClose : this.handleDialogClosed}
          @close=${this.dialogStrict ? this.preventClose : this.handleDialogClosed}
        >
          <div slot="headline">免责声明与使用须知</div>
          <div slot="content" class="dialog-content">
            <div class="dialog-shell">
              <div class="dialog-hero">
                <md-icon>shield</md-icon>
                <div class="dialog-hero-text">
                  <div class="dialog-hero-title">下载前请确认您已知悉以下事项</div>
                  <div class="dialog-hero-subtitle">
                    CRD 仅提供中国大陆网络环境下的 Roblox 分流与下载聚合服务，不代表 Roblox 官方立场。
                  </div>
                </div>
              </div>

              <div class="dialog-list">
                <div class="dialog-item">
                  <div class="dialog-index">1</div>
                  <div class="dialog-copy">
                    本网站 <strong>并非 Roblox 官方网站</strong>，仅为缓解下载慢、更新失败等问题而提供公益分流服务。
                  </div>
                </div>
                <div class="dialog-item">
                  <div class="dialog-index">2</div>
                  <div class="dialog-copy">
                    本站提供的客户端文件与第三方启动器均来自公开 <strong>官方发布渠道</strong>，本站不进行逆向、修改或注入。
                  </div>
                </div>
                <div class="dialog-item">
                  <div class="dialog-index">3</div>
                  <div class="dialog-copy">
                    “Roblox”及其相关商标、名称、Logo 均归 <strong>Roblox Corporation</strong> 所有。
                  </div>
                </div>
                <div class="dialog-item">
                  <div class="dialog-index">4</div>
                  <div class="dialog-copy">
                    因下载、安装、账号使用或第三方启动器带来的任何风险与连带责任，均需由用户自行判断并承担。
                  </div>
                </div>
              </div>

              <div class="dialog-note">
                继续使用本站，即表示您理解并接受上述说明。
              </div>
            </div>
          </div>
          <div slot="actions" class="dialog-actions">
            ${this.dialogStrict ? html`
              <md-text-button @click=${this.handleDisagree}>不同意并离开</md-text-button>
            ` : html`
              <md-text-button @click=${this.handleDialogClosed}>关闭</md-text-button>
            `}
            <md-filled-button @click=${this.handleAgree}>
              ${this.dialogStrict ? '我已阅读并同意' : '我已知悉'}
            </md-filled-button>
          </div>
        </md-dialog>
      ` : ''}

      ${this.showBanner ? html`
        <div class="banner ${this.closing ? 'closing' : ''}" @animationend=${this.onBannerAnimationEnd}>
          <div class="banner-header">
            <div class="banner-title">
              <span class="pulse-dot"></span>
              <md-icon>info</md-icon>
              免责声明
            </div>
            <md-icon-button class="close-btn" @click=${this.handleCloseBanner} touch-target="wrapper">
              <md-icon>close</md-icon>
            </md-icon-button>
          </div>
          <div class="banner-content">
            本站为第三方公益分流服务，非 Roblox 官方。下载内容来自官方发布渠道，使用相关客户端或启动器的风险需由用户自行判断。
          </div>
          <div class="banner-actions">
            <md-text-button @click=${this.handleOpenDetails}>查看完整说明</md-text-button>
          </div>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crd-disclaimer': CrdDisclaimer;
  }
}
