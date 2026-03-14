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
      
      /* 现代浏览器原生滚动条属性 (支持继承到 Shadow DOM 内部) */
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--md-sys-color-on-surface) 30%, transparent) transparent;
    }
    
    /* 统一滚动条样式，使其更现代化且融入深浅色模式 */
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
      bottom: 24px;
      right: 24px;
      width: min(360px, calc(100vw - 32px));
      max-width: 360px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--md-sys-color-surface-container-high) 85%, transparent),
        color-mix(in srgb, var(--md-sys-color-surface-container) 80%, transparent)
      );
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      color: var(--md-sys-color-on-surface);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 40%, transparent);
      border-top: 1px solid color-mix(in srgb, var(--md-sys-color-surface-tint, var(--md-sys-color-primary)) 20%, rgba(255, 255, 255, 0.1));
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transform: translateY(120%);
      opacity: 0;
      overflow: hidden;
      animation: slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }

    .banner::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in srgb, var(--md-sys-color-primary) 80%, transparent) 50%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: sheen 4s ease-in-out infinite;
      opacity: 0.8;
    }

    .banner.closing {
      animation: slideDown 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
    }

    @keyframes slideUp {
      0% {
        transform: translateY(120%) scale(0.95);
        opacity: 0;
      }
      100% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    @keyframes slideDown {
      0% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translateY(120%) scale(0.95);
        opacity: 0;
      }
    }

    @keyframes sheen {
      0% { background-position: 200% 50%; }
      100% { background-position: -200% 50%; }
    }

    .banner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      font-size: 1rem;
      gap: 12px;
    }

    .banner-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--md-sys-color-primary);
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--md-sys-color-primary) 60%, transparent);
      animation: pulse 2.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
      flex: none;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--md-sys-color-primary) 60%, transparent);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px transparent;
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 transparent;
      }
    }

    .banner-content {
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--md-sys-color-on-surface-variant);
    }

    .banner-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }

    .close-btn {
      margin-right: -8px;
      margin-top: -8px;
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
      padding: 16px 18px;
      border-radius: 16px;
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--md-sys-color-error-container) 40%, transparent), transparent 140%),
        var(--md-sys-color-surface-container-low);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-error) 15%, var(--md-sys-color-outline-variant));
    }

    .dialog-hero md-icon {
      color: var(--md-sys-color-error);
      font-size: 26px;
      flex: none;
      margin-top: 2px;
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
      line-height: 1.5;
      color: var(--md-sys-color-on-surface-variant);
    }

    .dialog-content {
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.6;
      font-size: 0.95rem;
      /* 给 dialog-content 内部的滚动容器加上自定义滚动条 */
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
      padding: 12px 14px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--md-sys-color-surface-container-low) 88%, transparent);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 30%, transparent);
    }

    /* 深色模式专门适配，确保对比度和纯净度 */
    @media (prefers-color-scheme: dark) {
      .dialog-item {
        background: color-mix(in srgb, var(--md-sys-color-surface-container) 60%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 40%, transparent);
      }
      
      .dialog-hero {
        background:
          linear-gradient(135deg, color-mix(in srgb, var(--md-sys-color-error-container) 15%, transparent), transparent 100%),
          var(--md-sys-color-surface-container);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-error) 20%, var(--md-sys-color-outline-variant));
      }
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
      font-size: 0.82rem;
      line-height: 1.55;
      color: var(--md-sys-color-on-surface-variant);
      padding: 0 2px;
    }

    @media (max-width: 640px) {
      .banner {
        right: 16px;
        bottom: 16px;
        width: min(100vw - 20px, 360px);
        border-radius: 18px;
      }

      .dialog-hero {
        padding: 12px 14px;
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
    if (this.closing && e.animationName === 'slideDown') {
      localStorage.setItem('crd_disclaimer_banner_closed', 'true');
      this.showBanner = false;
      this.closing = false;
    }
  }

  private preventClose(e: Event) {
    // 阻止用户通过点击遮罩层或按 ESC 关闭弹窗，强制要求点击同意
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
                    本网站<strong>非 Roblox 官方网站</strong>，仅为缓解下载慢、更新失败等问题而提供公益分流服务。
                  </div>
                </div>
                <div class="dialog-item">
                  <div class="dialog-index">2</div>
                  <div class="dialog-copy">
                    本站提供的客户端文件与第三方启动器均来自其<strong>官方发布渠道</strong>，本站不进行逆向、修改或注入。
                  </div>
                </div>
                <div class="dialog-item">
                  <div class="dialog-index">3</div>
                  <div class="dialog-copy">
                    “Roblox” 及其相关商标、名称、Logo 均归 <strong>Roblox Corporation</strong> 所有。
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
          <div slot="actions">
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
              免责提示
            </div>
            <md-icon-button class="close-btn" @click=${this.handleCloseBanner}>
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