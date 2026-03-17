import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

@customElement('crd-navbar')
export class CrdNavbar extends LitElement {
  private static readonly homeUrl = import.meta.env.BASE_URL;
  private static readonly repoUrl = 'https://github.com/Yar1991-Translation/CRD';

  static styles = css`
    :host {
      display: block;
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-high) 82%, transparent),
          color-mix(in srgb, var(--md-sys-color-surface-container-low) 92%, transparent)
        );
      color: var(--md-sys-color-on-surface);
      border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 78%, transparent);
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(18px) saturate(120%);
      -webkit-backdrop-filter: blur(18px) saturate(120%);
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 72px;
      padding: 12px 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: var(--crd-font-brand);
      font-optical-sizing: auto;
      font-weight: 700;
      font-size: clamp(1.05rem, 2.8vw, 1.28rem);
      font-style: normal;
      font-variation-settings: "GRAD" 120;
      color: var(--md-sys-color-on-surface);
      text-decoration: none;
      white-space: nowrap;
      letter-spacing: -0.02em;
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

    md-icon-button {
      border-radius: 16px;
      background: var(--md-sys-color-surface-container-high);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 84%, transparent);
      --md-icon-button-state-layer-width: 48px;
      --md-icon-button-state-layer-height: 48px;
      --md-icon-button-state-layer-shape: 16px;
      --md-icon-button-icon-color: var(--md-sys-color-on-surface-variant);
      --md-icon-button-hover-icon-color: var(--md-sys-color-on-surface);
      --md-icon-button-focus-icon-color: var(--md-sys-color-on-surface);
      --md-icon-button-pressed-icon-color: var(--md-sys-color-on-surface);
      --md-icon-button-hover-state-layer-color: var(--md-sys-color-on-surface);
      --md-icon-button-pressed-state-layer-color: var(--md-sys-color-on-surface);
      transition:
        background-color 180ms ease,
        border-color 180ms ease;
    }

    md-icon-button:hover {
      background: var(--md-sys-color-surface-container-highest);
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 24%, var(--md-sys-color-outline-variant));
    }

    @media (max-width: 640px) {
      header {
        padding: 10px 16px;
        min-height: 64px;
      }
    }
  `;

  render() {
    return html`
      <header>
        <a href=${CrdNavbar.homeUrl} class="brand">
          CRD.
        </a>
        <div class="actions">
          <md-icon-button aria-label="GitHub" href=${CrdNavbar.repoUrl} target="_blank" touch-target="wrapper">
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
