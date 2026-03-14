import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('crd-footer')
export class CrdFooter extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface-variant);
      padding: 32px 24px;
      margin-top: auto;
    }
    
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: center;
      font-size: 0.875rem;
    }
    
    .disclaimer {
      font-size: 0.75rem;
      opacity: 0.8;
      max-width: 800px;
      margin: 0 auto;
    }
    
    a {
      color: var(--md-sys-color-primary);
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
  `;

  render() {
    return html`
      <div class="footer-container">
        <div>
          &copy; ${new Date().getFullYear()} CRD (China Roblox Download) 分流计划. All rights reserved.
        </div>
        <div class="disclaimer">
          免责声明：本网站仅提供 Roblox 客户端的下载分流服务，非 Roblox 官方网站。
          "Roblox" 及相关商标、Logo 均属于 Roblox Corporation 所有。
          下载的文件均直接来源于官方服务器，本站不承担由于使用客户端产生的任何连带责任。
        </div>
        <div>
          <a href="https://github.com" target="_blank">获取源码</a> |
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