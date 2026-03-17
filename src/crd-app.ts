import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { setupDynamicColor } from './theme-utils.js';

import './components/crd-navbar.js';
import './components/crd-announcements.js';
import './components/crd-hero.js';
import './components/crd-footer.js';
import './components/crd-disclaimer.js';
import './components/crd-rdd-dialog.js';

@customElement('crd-app')
export class CrdApp extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    // 自动读取系统/浏览器的强调色 (AccentColor) 进行动态配色
    setupDynamicColor();
  }
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      width: 100%;
    }
    
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `;

  render() {
    return html`
      <crd-navbar></crd-navbar>
      <main>
        <crd-announcements></crd-announcements>
        <crd-hero></crd-hero>
        <!-- 可以后续在此加入更多模块，比如 FAQ、版本列表等 -->
      </main>
      <crd-footer></crd-footer>
      <crd-disclaimer></crd-disclaimer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crd-app': CrdApp;
  }
}
