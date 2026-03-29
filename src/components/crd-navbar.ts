import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { getEffectiveColorScheme, toggleColorScheme } from '../theme-utils.js';
import { renderCrdLogo } from './crd-logo.js';

import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

@customElement('crd-navbar')
export class CrdNavbar extends LitElement {
  private static readonly homeUrl = import.meta.env.BASE_URL;
  private static readonly repoUrl = 'https://github.com/Yar1991-Translation/CRD';

  @state()
  private isDarkMode = getEffectiveColorScheme() === 'dark';

  private readonly handleColorSchemeChange = (event: Event) => {
    const detail = (event as CustomEvent<{ dark: boolean }>).detail;
    this.isDarkMode = detail.dark;
  };

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
      gap: 0;
      color: var(--crd-brand-color);
      text-decoration: none;
      white-space: nowrap;
      line-height: 0;
    }

    .brand-logo {
      display: block;
      width: clamp(74px, 10vw, 94px);
      height: auto;
      color: inherit;
      flex: none;
    }

    .brand-label {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
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

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('crd-color-scheme-changed', this.handleColorSchemeChange);
  }

  disconnectedCallback() {
    window.removeEventListener('crd-color-scheme-changed', this.handleColorSchemeChange);
    super.disconnectedCallback();
  }

  private openAnnouncements() {
    window.dispatchEvent(new Event('crd-open-announcements'));
  }

  private toggleTheme() {
    toggleColorScheme();
    this.isDarkMode = getEffectiveColorScheme() === 'dark';
  }

  render() {
    return html`
      <header>
        <a href=${CrdNavbar.homeUrl} class="brand">
          ${renderCrdLogo('brand-logo')}
          <span class="brand-label">CRD</span>
        </a>
        <div class="actions">
          <md-icon-button
            aria-label="公告"
            title="公告"
            touch-target="wrapper"
            @click=${this.openAnnouncements}
          >
            <md-icon>campaign</md-icon>
          </md-icon-button>
          <md-icon-button
            aria-label=${this.isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
            title=${this.isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
            touch-target="wrapper"
            @click=${this.toggleTheme}
          >
            <md-icon>${this.isDarkMode ? 'light_mode' : 'dark_mode'}</md-icon>
          </md-icon-button>
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
