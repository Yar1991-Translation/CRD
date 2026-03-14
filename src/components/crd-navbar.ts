import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

@customElement('crd-navbar')
export class CrdNavbar extends LitElement {
  private static readonly homeUrl = import.meta.env.BASE_URL;

  static styles = css`
    :host {
      display: block;
      background-color: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      border-bottom: 1px solid var(--md-sys-color-surface-variant);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      font-size: 1.25rem;
      color: var(--md-sys-color-primary);
      text-decoration: none;
    }
    
    .brand img {
      height: 32px;
      width: 32px;
    }
    
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `;

  render() {
    return html`
      <header>
        <a href=${CrdNavbar.homeUrl} class="brand">
          CRD.
        </a>
        <div class="actions">
          <md-icon-button aria-label="GitHub" href="https://github.com" target="_blank">
            <md-icon>code</md-icon>
          </md-icon-button>
        </div>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crd-navbar': CrdNavbar;
  }
}
