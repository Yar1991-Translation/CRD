import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { setupDynamicColor } from './theme-utils.js';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

import '@material/web/icon/icon.js';

import './components/crd-navbar.js';
import './components/crd-announcements.js';
import './components/crd-hero.js';
import './components/crd-changelog-page.js';
import './components/crd-footer.js';
import './components/crd-disclaimer.js';
import './components/crd-rdd-dialog.js';

type AppView = 'home' | 'updates';
type TransitionState = 'forward-out' | 'forward-in' | 'backward-out' | 'backward-in';

@customElement('crd-app')
export class CrdApp extends LitElement {
  private static readonly transitionSwapMs = 220;

  private static readonly transitionTotalMs = 560;

  @state()
  private activeView: AppView = 'home';

  @state()
  private transitionState: TransitionState | null = null;

  private transitionSwapTimer: number | null = null;

  private transitionCleanupTimer: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.activeView = this.resolveViewFromHash(window.location.hash);
    setupDynamicColor();
    inject();
    injectSpeedInsights();
    window.addEventListener('hashchange', this.handleHashChange);
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.handleHashChange);
    this.clearTransitionTimers();
    super.disconnectedCallback();
  }

  private readonly handleHashChange = () => {
    const nextView = this.resolveViewFromHash(window.location.hash);
    if (nextView === this.activeView || this.transitionState) {
      return;
    }

    this.startViewTransition(nextView);
  };

  private clearTransitionTimers() {
    if (this.transitionSwapTimer !== null) {
      window.clearTimeout(this.transitionSwapTimer);
      this.transitionSwapTimer = null;
    }

    if (this.transitionCleanupTimer !== null) {
      window.clearTimeout(this.transitionCleanupTimer);
      this.transitionCleanupTimer = null;
    }
  }

  private resolveViewFromHash(hash: string): AppView {
    return hash.startsWith('#updates') ? 'updates' : 'home';
  }

  private navigateTo(view: AppView) {
    if (this.transitionState) {
      return;
    }

    const targetHash = view === 'updates' ? '#updates' : '#home';
    if (window.location.hash === targetHash) {
      if (view !== this.activeView) {
        this.startViewTransition(view);
      }
      return;
    }

    window.location.hash = targetHash;
  }

  private startViewTransition(nextView: AppView) {
    const movingForward = nextView === 'updates';
    this.clearTransitionTimers();
    this.transitionState = movingForward ? 'forward-out' : 'backward-out';

    this.transitionSwapTimer = window.setTimeout(() => {
      this.activeView = nextView;
      window.scrollTo(0, 0);
      this.transitionState = movingForward ? 'forward-in' : 'backward-in';
    }, CrdApp.transitionSwapMs);

    this.transitionCleanupTimer = window.setTimeout(() => {
      this.transitionState = null;
    }, CrdApp.transitionTotalMs);
  }

  private renderActiveView() {
    if (this.activeView === 'updates') {
      return html`<crd-changelog-page></crd-changelog-page>`;
    }

    return html`<crd-hero></crd-hero>`;
  }

  private renderEdgeNavigator() {
    const isHome = this.activeView === 'home';
    const side = isHome ? 'right' : 'left';
    const nextView: AppView = isHome ? 'updates' : 'home';
    const title = isHome ? '打开更新历史' : '返回首页';
    const icon = isHome ? 'arrow_forward_ios' : 'arrow_back_ios_new';

    return html`
      <div class="edge-switch edge-switch--${side}">
        <button
          class="edge-switch__button"
          type="button"
          title=${title}
          aria-label=${title}
          ?disabled=${Boolean(this.transitionState)}
          @click=${() => this.navigateTo(nextView)}
        >
          <md-icon>${icon}</md-icon>
        </button>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      width: 100%;
      position: relative;
    }

    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .view-stage {
      flex: 1;
      overflow-x: clip;
    }

    .view-shell {
      min-height: 100%;
      transform-origin: center center;
      will-change: transform, opacity, filter;
    }

    .view-shell.forward-out {
      animation: viewSlideOutLeft 220ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .view-shell.forward-in {
      animation: viewSlideInRight 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .view-shell.backward-out {
      animation: viewSlideOutRight 220ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .view-shell.backward-in {
      animation: viewSlideInLeft 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .edge-switch {
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      width: 96px;
      height: 168px;
      display: flex;
      align-items: center;
      z-index: 140;
      pointer-events: none;
    }

    .edge-switch--right {
      right: 0;
      justify-content: flex-end;
    }

    .edge-switch--left {
      left: 0;
      justify-content: flex-start;
    }

    .edge-switch__button {
      pointer-events: auto;
      width: 58px;
      height: 94px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 88%, transparent);
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-high) 90%, transparent),
          var(--md-sys-color-surface-container)
        );
      color: var(--md-sys-color-on-surface);
      box-shadow: 0 12px 26px rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(16px) saturate(120%);
      -webkit-backdrop-filter: blur(16px) saturate(120%);
      cursor: pointer;
      opacity: 0.34;
      transition:
        transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
        opacity 220ms ease,
        border-color 220ms ease,
        background-color 220ms ease,
        box-shadow 220ms ease;
    }

    .edge-switch--right .edge-switch__button {
      border-radius: 24px 0 0 24px;
      transform: translateX(24px);
    }

    .edge-switch--left .edge-switch__button {
      border-radius: 0 24px 24px 0;
      transform: translateX(-24px);
    }

    .edge-switch:hover .edge-switch__button,
    .edge-switch__button:focus-visible {
      transform: translateX(0);
      opacity: 1;
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 26%, var(--md-sys-color-outline-variant));
      box-shadow: 0 18px 32px rgba(0, 0, 0, 0.12);
    }

    .edge-switch__button:hover {
      background: var(--md-sys-color-surface-container-high);
    }

    .edge-switch__button:disabled {
      cursor: default;
      opacity: 0.18;
    }

    .edge-switch__button md-icon {
      font-size: 24px;
    }

    @keyframes viewSlideOutLeft {
      from {
        opacity: 1;
        transform: translateX(0) scale(1);
        filter: blur(0);
      }

      to {
        opacity: 0.12;
        transform: translateX(-34px) scale(0.992);
        filter: blur(8px);
      }
    }

    @keyframes viewSlideInRight {
      from {
        opacity: 0;
        transform: translateX(42px) scale(0.996);
        filter: blur(10px);
      }

      to {
        opacity: 1;
        transform: translateX(0) scale(1);
        filter: blur(0);
      }
    }

    @keyframes viewSlideOutRight {
      from {
        opacity: 1;
        transform: translateX(0) scale(1);
        filter: blur(0);
      }

      to {
        opacity: 0.12;
        transform: translateX(34px) scale(0.992);
        filter: blur(8px);
      }
    }

    @keyframes viewSlideInLeft {
      from {
        opacity: 0;
        transform: translateX(-42px) scale(0.996);
        filter: blur(10px);
      }

      to {
        opacity: 1;
        transform: translateX(0) scale(1);
        filter: blur(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .view-shell.forward-out,
      .view-shell.forward-in,
      .view-shell.backward-out,
      .view-shell.backward-in {
        animation: none;
      }

      .edge-switch__button {
        transition: none;
      }
    }

    @media (max-width: 720px) {
      .edge-switch {
        top: auto;
        bottom: 18px;
        width: auto;
        height: auto;
        transform: none;
      }

      .edge-switch--right {
        right: 16px;
      }

      .edge-switch--left {
        left: 16px;
      }

      .edge-switch__button {
        width: 54px;
        height: 54px;
        border-radius: 18px;
        opacity: 1;
        transform: none;
      }

      .edge-switch--right .edge-switch__button,
      .edge-switch--left .edge-switch__button {
        border-radius: 18px;
      }
    }
  `;

  render() {
    return html`
      <crd-navbar></crd-navbar>
      <main>
        <crd-announcements></crd-announcements>
        <section class="view-stage">
          <div class="view-shell ${this.transitionState ?? ''}">
            ${this.renderActiveView()}
          </div>
        </section>
      </main>
      ${this.renderEdgeNavigator()}
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
