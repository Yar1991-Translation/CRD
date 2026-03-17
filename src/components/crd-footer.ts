import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('crd-footer')
export class CrdFooter extends LitElement {
  private static readonly repoUrl = 'https://github.com/Yar1991-Translation/CRD';

  static styles = css`
    :host {
      display: block;
      color: var(--md-sys-color-on-surface-variant);
      padding: 24px;
      margin-top: auto;
    }

    .footer-container {
      max-width: 1120px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: center;
      font-size: 0.875rem;
      padding: 24px clamp(18px, 4vw, 28px);
      border-radius: 28px;
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-high) 84%, transparent),
          var(--md-sys-color-surface-container-low)
        );
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 82%, transparent);
    }

    .disclaimer {
      font-family: var(--crd-font-small);
      font-weight: 700;
      font-size: 0.75rem;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.6;
      color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 92%, transparent);
    }

    .font-note {
      font-family: var(--crd-font-small);
      font-weight: 700;
      font-size: 0.78rem;
      color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 88%, transparent);
    }

    .footer-links {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px 16px;
      flex-wrap: wrap;
    }

    a {
      color: var(--md-sys-color-primary);
      text-decoration: none;
      font-weight: 600;
    }

    a:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    @media (max-width: 640px) {
      :host {
        padding: 16px;
      }

      .footer-container {
        gap: 12px;
        font-size: 0.82rem;
        padding: 20px 16px;
        border-radius: 24px;
      }

      .disclaimer {
        font-size: 0.72rem;
      }

      .footer-links {
        flex-direction: column;
        gap: 8px;
      }
    }
  `;

  render() {
    return html`
      <div class="footer-container">
        <div>
          &copy; ${new Date().getFullYear()} CRD (China Roblox Download). All rights reserved.
        </div>
        <div class="font-note">界面字体：MiSans Bold</div>
        <div class="disclaimer">
          免责声明：本站仅提供 Roblox 客户端相关下载分流入口，不隶属于 Roblox 官方。
          “Roblox” 及相关商标、Logo 均归 Roblox Corporation 所有。下载文件均来自官方或对应项目的原始发布地址，
          本站不对使用过程中产生的任何连带责任负责。
        </div>
        <div class="footer-links">
          <a href=${CrdFooter.repoUrl} target="_blank">获取源码</a>
          <a href="#">问题反馈</a>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crd-footer': CrdFooter;
  }
}
