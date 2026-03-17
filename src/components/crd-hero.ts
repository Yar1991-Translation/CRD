import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';

import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/dialog/dialog.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/labs/segmentedbutton/outlined-segmented-button.js';
import '@material/web/labs/segmentedbuttonset/outlined-segmented-button-set.js';
import '@material/web/progress/circular-progress.js';

import type { CrdRddDialog } from './crd-rdd-dialog.js';

type GhProxyOptionId = 'auto' | 'cf' | 'hk' | 'cdn' | 'eo';
type GhProxyManualOptionId = Exclude<GhProxyOptionId, 'auto'>;
type GhProxyOption = {
  id: GhProxyOptionId;
  label: string;
  domain?: string;
  description: string;
};

@customElement('crd-hero')
export class CrdHero extends LitElement {
  private static readonly baseUrl = import.meta.env.BASE_URL;

  private static readonly ghProxyStorageKey = 'crd-gh-proxy-selection';

  private static readonly ghProxyAutoRefreshMs = 10 * 60 * 1000;

  private static readonly ghProxyOptions: GhProxyOption[] = [
    {
      id: 'auto',
      label: '自动选择',
      description: '自动测速并选择当前最快可用节点',
    },
    {
      id: 'cf',
      label: 'Cloudflare',
      domain: 'gh-proxy.org',
      description: '官方 cloudflare 线路',
    },
    {
      id: 'hk',
      label: '香港',
      domain: 'hk.gh-proxy.org',
      description: '官方香港线路',
    },
    {
      id: 'cdn',
      label: 'Fastly',
      domain: 'cdn.gh-proxy.org',
      description: '官方 Fastly 线路',
    },
    {
      id: 'eo',
      label: 'EdgeOne',
      domain: 'edgeone.gh-proxy.org',
      description: '官方 edgeone 线路',
    },
  ];

  private static readonly androidApkSourceUrl =
    'https://github.com/Yar1991-Translation/CRD-APK/releases/latest/download/roblox.apk';

  private static readonly androidZapkSourceUrl =
    'https://github.com/Yar1991-Translation/CRD-APK/releases/latest/download/roblox.zapk';

  private static readonly androidPlayStoreUrl =
    'https://play.google.com/store/apps/details?id=com.roblox.client';

  private static readonly androidRepoUrl =
    'https://github.com/Yar1991-Translation/CRD-APK';

  private static readonly bloxstrapIconUrl =
    `${CrdHero.baseUrl}assets/icons/Bloxstrap.png`;

  private static readonly fishstrapIconUrl =
    `${CrdHero.baseUrl}assets/icons/Fishstrap.png`;

  private static readonly bloxstrapSourceUrl =
    'https://github.com/bloxstraplabs/bloxstrap/releases/download/v2.10.0/Bloxstrap-v2.10.0.exe';

  private static readonly fishstrapSourceUrl =
    'https://github.com/fishstrap/fishstrap/releases/latest/download/Fishstrap.exe';

  @state()
  private activeTabIndex = 0;

  @state()
  private activeWinTabIndex = 0;

  @state()
  private latestVersion = '获取中...';

  @state()
  private lastUpdate = '...';

  @state()
  private ghProxySelection: GhProxyOptionId = 'auto';

  @state()
  private ghProxyStatus = '自动模式会测速选择最优线路';

  @state()
  private ghProxyResolvedId: GhProxyManualOptionId = 'hk';

  @state()
  private ghProxyIsResolving = false;

  @state()
  private showGhProxySettings = false;

  @query('crd-rdd-dialog')
  private rddDialog!: CrdRddDialog;

  private ghProxyResolvePromise: Promise<GhProxyManualOptionId> | null = null;

  private ghProxyLastBenchmarkedAt = 0;

  static styles = css`
    :host {
      display: block;
      padding: clamp(28px, 6vw, 56px) clamp(16px, 4vw, 24px) clamp(40px, 7vw, 56px);
      background-color: var(--md-sys-color-background);
      text-align: center;
      overflow-x: hidden;
    }

    .hero-container {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: clamp(28px, 4vw, 36px);
    }

    .header-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      width: 100%;
    }

    h1 {
      font-family: var(--crd-font-brand);
      font-optical-sizing: auto;
      font-size: clamp(3.1rem, 9vw, 5.4rem);
      margin: 0;
      line-height: 0.95;
      color: var(--md-sys-color-on-background);
      font-weight: 700;
      font-style: normal;
      font-variation-settings: "GRAD" 120;
      letter-spacing: -0.055em;
    }

    .subtitle {
      font-size: clamp(1rem, 2.4vw, 1.18rem);
      color: var(--md-sys-color-on-surface-variant);
      margin: 0;
      max-width: 680px;
      line-height: 1.7;
    }

    .badges-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
      width: 100%;
    }

    .version-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 36px;
      padding: 0 16px;
      max-width: 100%;
      background: color-mix(in srgb, var(--md-sys-color-secondary-container) 92%, transparent);
      color: var(--md-sys-color-on-secondary-container);
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .version-badge md-icon {
      font-size: 18px;
      flex: none;
    }

    .version-copy {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .version-meta {
      font-family: var(--crd-font-small);
      font-weight: 700;
      color: color-mix(in srgb, var(--md-sys-color-on-secondary-container) 72%, transparent);
      font-size: 0.74rem;
    }

    .download-section {
      position: relative;
      width: 100%;
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-high) 72%, transparent),
          var(--md-sys-color-surface-container-low)
        );
      border-radius: 28px;
      padding: clamp(22px, 3.5vw, 30px) clamp(16px, 4vw, 32px) clamp(24px, 4vw, 34px);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 88%, transparent);
      overflow: hidden;
    }

    .download-settings-trigger {
      position: absolute;
      top: 18px;
      right: 18px;
      z-index: 1;
      border-radius: 999px;
      background: transparent;
      border: none;
      color: var(--md-sys-color-on-surface-variant);
      --md-icon-button-state-layer-width: 48px;
      --md-icon-button-state-layer-height: 48px;
      --md-icon-button-state-layer-shape: 999px;
      --md-icon-button-icon-color: var(--md-sys-color-on-surface-variant);
      --md-icon-button-hover-icon-color: var(--md-sys-color-primary);
      --md-icon-button-focus-icon-color: var(--md-sys-color-primary);
      --md-icon-button-pressed-icon-color: var(--md-sys-color-primary);
      --md-icon-button-hover-state-layer-color: var(--md-sys-color-primary);
      --md-icon-button-pressed-state-layer-color: var(--md-sys-color-primary);
      transition:
        color 180ms ease;
    }

    .download-settings-trigger:hover {
      color: var(--md-sys-color-primary);
      background: transparent;
    }

    .download-settings-trigger:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--md-sys-color-primary) 54%, transparent);
      outline-offset: 2px;
    }

    .proxy-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 18px;
      padding: 18px 20px;
      border-radius: 24px;
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-secondary-container) 58%, transparent),
          color-mix(in srgb, var(--md-sys-color-surface-container-high) 92%, transparent)
        );
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 84%, transparent);
      text-align: left;
    }

    md-dialog {
      --md-dialog-container-color: var(--md-sys-color-surface-container-high, var(--md-sys-color-surface));
      --md-dialog-headline-color: var(--md-sys-color-on-surface);
      --md-dialog-supporting-text-color: var(--md-sys-color-on-surface-variant);
    }

    .proxy-settings-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-top: 8px;
    }

    .proxy-settings-note {
      font-family: var(--crd-font-small);
      font-weight: 700;
      padding: 12px 14px;
      border-radius: 18px;
      background: var(--md-sys-color-surface-container-highest);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 78%, transparent);
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.55;
      font-size: 0.86rem;
    }

    .proxy-copy {
      flex: 1 1 280px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }

    .proxy-copy strong {
      color: var(--md-sys-color-on-secondary-container);
      font-size: 1.02rem;
    }

    .proxy-copy span,
    .proxy-status {
      font-family: var(--crd-font-small);
      font-weight: 700;
      color: var(--md-sys-color-on-secondary-container);
      opacity: 0.84;
      line-height: 1.55;
      font-size: 0.88rem;
    }

    .proxy-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: flex-end;
      justify-content: flex-end;
      flex: 0 0 auto;
    }

    .proxy-select-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: min(100%, 290px);
      text-align: left;
    }

    .proxy-select-wrap span {
      font-family: var(--crd-font-small);
      font-weight: 700;
      font-size: 0.76rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--md-sys-color-on-secondary-container);
      opacity: 0.8;
    }

    .proxy-select {
      appearance: none;
      min-height: 48px;
      padding: 0 42px 0 16px;
      border-radius: 16px;
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 84%, transparent);
      background:
        linear-gradient(45deg, transparent 50%, var(--md-sys-color-on-surface-variant) 50%) calc(100% - 18px) calc(50% - 3px) / 8px 8px no-repeat,
        linear-gradient(135deg, var(--md-sys-color-on-surface-variant) 50%, transparent 50%) calc(100% - 12px) calc(50% - 3px) / 8px 8px no-repeat,
        var(--md-sys-color-surface-container-lowest);
      color: var(--md-sys-color-on-surface);
      font: inherit;
      cursor: pointer;
      transition: border-color 180ms ease, background-color 180ms ease;
    }

    .proxy-select:hover {
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 22%, var(--md-sys-color-outline-variant));
      background-color: var(--md-sys-color-surface-container-low);
    }

    .proxy-select:focus {
      outline: 2px solid color-mix(in srgb, var(--md-sys-color-primary) 50%, transparent);
      outline-offset: 2px;
    }

    .proxy-status {
      flex: 1 1 100%;
    }

    .desktop-download-layout {
      display: block;
    }

    .mobile-download-layout {
      display: none;
    }

    .tab-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    md-tabs {
      overflow-x: auto;
      scrollbar-width: none;
    }

    md-tabs::-webkit-scrollbar {
      display: none;
    }

    .platform-tabs {
      width: fit-content;
      max-width: 100%;
      margin: 0 auto 28px;
      padding: 6px 6px 0;
      border-radius: 999px;
      background: var(--md-sys-color-surface-container-high);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 84%, transparent);
      overflow: hidden;
      --md-primary-tab-container-color: transparent;
    }

    .platform-tabs md-primary-tab {
      --md-primary-tab-container-shape: 999px;
      --md-primary-tab-container-height: 52px;
      --md-primary-tab-with-icon-and-label-text-container-height: 60px;
      --md-primary-tab-active-indicator-color: var(--md-sys-color-primary);
      --md-primary-tab-active-indicator-height: 3px;
      --md-primary-tab-active-indicator-shape: 999px;
      --md-primary-tab-label-text-color: var(--md-sys-color-on-surface-variant);
      --md-primary-tab-hover-label-text-color: var(--md-sys-color-on-surface);
      --md-primary-tab-focus-label-text-color: var(--md-sys-color-on-surface);
      --md-primary-tab-pressed-label-text-color: var(--md-sys-color-on-surface);
      --md-primary-tab-active-label-text-color: var(--md-sys-color-primary);
      --md-primary-tab-active-hover-label-text-color: var(--md-sys-color-primary);
      --md-primary-tab-active-focus-label-text-color: var(--md-sys-color-primary);
      --md-primary-tab-icon-color: var(--md-sys-color-on-surface-variant);
      --md-primary-tab-hover-icon-color: var(--md-sys-color-on-surface);
      --md-primary-tab-focus-icon-color: var(--md-sys-color-on-surface);
      --md-primary-tab-active-icon-color: var(--md-sys-color-primary);
      --md-primary-tab-active-hover-icon-color: var(--md-sys-color-primary);
      --md-primary-tab-active-focus-icon-color: var(--md-sys-color-primary);
      --md-primary-tab-hover-state-layer-color: var(--md-sys-color-on-surface);
      --md-primary-tab-pressed-state-layer-color: var(--md-sys-color-primary);
      --md-primary-tab-active-hover-state-layer-color: var(--md-sys-color-primary);
      --md-primary-tab-active-pressed-state-layer-color: var(--md-sys-color-primary);
    }

    .segmented-shell {
      display: flex;
      justify-content: center;
      margin: 0 0 8px;
    }

    .segmented-shell md-outlined-segmented-button-set {
      width: fit-content;
      max-width: 100%;
      margin: 0 auto;
      padding: 3px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 94%, transparent);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline) 52%, transparent);
    }

    .segmented-shell md-outlined-segmented-button {
      --md-outlined-segmented-button-shape: 999px;
      --md-outlined-segmented-button-outline-color: color-mix(
        in srgb,
        var(--md-sys-color-outline-variant) 68%,
        transparent
      );
      --md-outlined-segmented-button-unselected-label-text-color: var(--md-sys-color-on-surface-variant);
      --md-outlined-segmented-button-unselected-hover-label-text-color: var(--md-sys-color-on-surface);
      --md-outlined-segmented-button-unselected-focus-label-text-color: var(--md-sys-color-on-surface);
      --md-outlined-segmented-button-unselected-pressed-label-text-color: var(--md-sys-color-on-surface);
      --md-outlined-segmented-button-unselected-icon-color: var(--md-sys-color-on-surface-variant);
      --md-outlined-segmented-button-unselected-hover-icon-color: var(--md-sys-color-on-surface);
      --md-outlined-segmented-button-selected-container-color: var(--md-sys-color-secondary-container);
      --md-outlined-segmented-button-selected-label-text-color: var(--md-sys-color-on-secondary-container);
      --md-outlined-segmented-button-selected-hover-label-text-color: var(--md-sys-color-on-secondary-container);
      --md-outlined-segmented-button-selected-focus-label-text-color: var(--md-sys-color-on-secondary-container);
      --md-outlined-segmented-button-selected-pressed-label-text-color: var(--md-sys-color-on-secondary-container);
      --md-outlined-segmented-button-selected-icon-color: var(--md-sys-color-on-secondary-container);
      --md-outlined-segmented-button-selected-hover-icon-color: var(--md-sys-color-on-secondary-container);
      --md-outlined-segmented-button-selected-focus-icon-color: var(--md-sys-color-on-secondary-container);
      --md-outlined-segmented-button-selected-pressed-icon-color: var(--md-sys-color-on-secondary-container);
      --md-outlined-segmented-button-unselected-hover-state-layer-color: var(--md-sys-color-on-surface);
      --md-outlined-segmented-button-unselected-pressed-state-layer-color: var(--md-sys-color-on-surface);
      --md-outlined-segmented-button-selected-hover-state-layer-color: var(--md-sys-color-on-secondary-container);
      --md-outlined-segmented-button-selected-pressed-state-layer-color: var(--md-sys-color-on-secondary-container);
    }

    .tab-panel {
      display: none;
      animation: fadeIn 220ms ease;
    }

    .tab-panel.active {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sub-tab-panel {
      display: none;
      animation: fadeIn 220ms ease;
      margin-top: 18px;
    }

    .sub-tab-panel.active {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    md-filled-button,
    md-filled-tonal-button,
    md-outlined-button {
      --md-filled-button-container-height: 42px;
      --md-filled-button-container-shape: 999px;
      --md-filled-button-label-text-size: 0.88rem;
      --md-filled-button-label-text-weight: 600;
      --md-filled-tonal-button-container-height: 42px;
      --md-filled-tonal-button-container-shape: 999px;
      --md-filled-tonal-button-label-text-size: 0.88rem;
      --md-filled-tonal-button-label-text-weight: 600;
      --md-outlined-button-container-height: 42px;
      --md-outlined-button-container-shape: 999px;
      --md-outlined-button-label-text-size: 0.88rem;
      --md-outlined-button-label-text-weight: 600;
    }

    md-filled-tonal-button {
      --md-filled-tonal-button-container-color: var(--md-sys-color-secondary-container);
      --md-filled-tonal-button-label-text-color: var(--md-sys-color-on-secondary-container);
      --md-filled-tonal-button-hover-state-layer-color: var(--md-sys-color-on-secondary-container);
      --md-filled-tonal-button-pressed-state-layer-color: var(--md-sys-color-on-secondary-container);
    }

    md-outlined-button {
      --md-outlined-button-outline-color: color-mix(
        in srgb,
        var(--md-sys-color-outline-variant) 86%,
        transparent
      );
      --md-outlined-button-label-text-color: var(--md-sys-color-on-surface);
      --md-outlined-button-hover-label-text-color: var(--md-sys-color-primary);
      --md-outlined-button-focus-label-text-color: var(--md-sys-color-primary);
      --md-outlined-button-hover-state-layer-color: var(--md-sys-color-primary);
      --md-outlined-button-pressed-state-layer-color: var(--md-sys-color-primary);
    }

    .download-card,
    .mobile-platform-card {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 22px;
      border-radius: 24px;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 88%, transparent);
      transition:
        background-color 180ms ease,
        border-color 180ms ease,
        transform 180ms ease;
      text-align: left;
    }

    .download-card:hover,
    .mobile-platform-card:hover {
      background: var(--md-sys-color-surface-container-high);
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 20%, var(--md-sys-color-outline-variant));
      transform: translateY(-1px);
    }

    .download-card.main,
    .mobile-platform-card.main {
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 24%, var(--md-sys-color-outline-variant));
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 88%, var(--md-sys-color-primary-container)),
          color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 80%, var(--md-sys-color-primary-container))
        );
    }

    .download-card.main:hover,
    .mobile-platform-card.main:hover {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 84%, var(--md-sys-color-primary-container)),
          color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 74%, var(--md-sys-color-primary-container))
        );
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 32%, var(--md-sys-color-outline-variant));
    }

    .download-card md-icon,
    .mobile-platform-icon {
      font-size: 2.5rem;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-primary);
      flex: none;
    }

    .download-card.main md-icon,
    .mobile-platform-card.main .mobile-platform-icon {
      color: var(--md-sys-color-primary);
    }

    .custom-icon {
      width: 42px;
      height: 42px;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      display: inline-block;
      flex: none;
    }

    .info,
    .mobile-platform-copy {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .info strong,
    .mobile-platform-copy strong {
      font-size: 1.08rem;
      line-height: 1.35;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 4px;
    }

    .download-card.main .info strong,
    .mobile-platform-card.main .mobile-platform-copy strong {
      color: var(--md-sys-color-on-surface);
    }

    .info span,
    .mobile-platform-copy span {
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.6;
    }

    .download-card.main .info span,
    .mobile-platform-card.main .mobile-platform-copy span {
      color: var(--md-sys-color-on-surface-variant);
      opacity: 1;
    }

    .info .support-note,
    .mobile-support-note {
      font-family: var(--crd-font-small);
      font-weight: 700;
      margin-top: 8px;
      font-size: 0.8rem;
      line-height: 1.55;
      color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 92%, transparent);
    }

    .info .support-note a,
    .mobile-support-note a {
      color: inherit;
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .card-actions,
    .actions-row,
    .launcher-actions,
    .mobile-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-start;
      flex-shrink: 0;
    }

    .card-actions > *,
    .actions-row > *,
    .launcher-actions > *,
    .mobile-actions > * {
      flex: 0 0 auto;
    }

    .secondary-section,
    .mobile-secondary {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 14px;
      border-top: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 72%, transparent);
      width: 100%;
    }

    .secondary-label {
      font-family: var(--crd-font-small);
      font-weight: 700;
      font-size: 0.76rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.85;
    }

    .download-card.main .secondary-label,
    .mobile-platform-card.main .secondary-label {
      color: var(--md-sys-color-primary);
    }

    .download-card.main md-outlined-button,
    .mobile-platform-card.main md-outlined-button {
      --md-outlined-button-label-text-color: var(--md-sys-color-primary);
      --md-outlined-button-hover-label-text-color: var(--md-sys-color-primary);
      --md-outlined-button-focus-label-text-color: var(--md-sys-color-primary);
      --md-outlined-button-pressed-label-text-color: var(--md-sys-color-primary);
      --md-outlined-button-outline-color: color-mix(
        in srgb,
        var(--md-sys-color-primary) 26%,
        var(--md-sys-color-outline-variant)
      );
      --md-outlined-button-pressed-outline-color: color-mix(
        in srgb,
        var(--md-sys-color-primary) 34%,
        var(--md-sys-color-outline-variant)
      );
      --md-outlined-button-hover-state-layer-color: var(--md-sys-color-primary);
      --md-outlined-button-pressed-state-layer-color: var(--md-sys-color-primary);
    }

    .mobile-platform-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .mobile-platform-card {
      flex-direction: column;
      align-items: stretch;
      padding: 18px;
      gap: 14px;
    }

    .mobile-platform-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .mobile-platform-copy {
      gap: 4px;
    }

    .mobile-platform-copy strong {
      margin: 0;
    }

    .mobile-platform-copy span {
      margin: 0;
    }

    .mobile-support-note {
      margin-top: 0;
    }

    @media (max-width: 1024px) {
      :host {
        text-align: left;
      }

      .hero-container {
        align-items: stretch;
        gap: 24px;
      }

      .header-text {
        align-items: flex-start;
        text-align: left;
      }

      .subtitle {
        max-width: 100%;
      }

      .badges-row {
        justify-content: flex-start;
      }

      .version-copy {
        justify-content: flex-start;
      }

      .download-section {
        border-radius: 26px;
      }

      .download-card {
        flex-direction: column;
        align-items: stretch;
        padding: 20px;
      }

      .download-card md-icon,
      .custom-icon {
        align-self: flex-start;
      }

      .info {
        width: 100%;
      }

      .card-actions,
      .actions-row,
      .launcher-actions {
        width: 100%;
      }

      .card-actions > *,
      .actions-row > *,
      .launcher-actions > * {
        flex: 1 1 calc(50% - 4px);
        min-width: 180px;
      }

      .proxy-controls {
        width: 100%;
        justify-content: stretch;
      }

      .proxy-select-wrap,
      .proxy-controls md-outlined-button {
        flex: 1 1 100%;
      }
    }

    @media (max-width: 480px) {
      :host {
        padding: 24px 14px 32px;
      }

      .hero-container {
        gap: 20px;
      }

      .header-text {
        gap: 10px;
      }

      h1 {
        font-size: clamp(2.75rem, 14vw, 3.2rem);
      }

      .subtitle {
        font-size: 0.98rem;
      }

      .platform-tabs {
        width: 100%;
        margin-bottom: 24px;
        padding-bottom: 0;
      }

      .version-badge {
        width: 100%;
        justify-content: center;
        padding: 10px 14px;
      }

      .version-copy {
        width: 100%;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .version-meta {
        width: 100%;
        text-align: center;
      }

      .download-section {
        padding: 18px 14px 20px;
        border-radius: 24px;
      }

      .proxy-toolbar {
        padding: 14px;
        border-radius: 20px;
      }

      .download-settings-trigger {
        top: 14px;
        right: 14px;
      }

      .desktop-download-layout {
        display: none;
      }

      .mobile-download-layout {
        display: block;
      }

      .mobile-platform-card {
        padding: 16px;
      }

      .mobile-platform-card,
      .download-card {
        border-radius: 22px;
      }

      .mobile-platform-header {
        gap: 12px;
      }

      .mobile-platform-icon {
        width: 36px;
        height: 36px;
        font-size: 2rem;
      }

      .mobile-platform-copy strong {
        font-size: 1.02rem;
      }

      .mobile-platform-copy span,
      .mobile-support-note {
        font-size: 0.82rem;
      }

      .mobile-actions > *,
      .mobile-secondary .launcher-actions > * {
        width: 100%;
        flex: 1 1 100%;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.restoreGhProxySelection();
    this.fetchVersionInfo();
  }

  private restoreGhProxySelection() {
    try {
      const storedSelection = window.localStorage.getItem(CrdHero.ghProxyStorageKey);
      if (CrdHero.isGhProxyOptionId(storedSelection)) {
        this.ghProxySelection = storedSelection;
      }
    } catch (error) {
      console.warn('Failed to restore gh-proxy preference', error);
    }

    void this.syncGhProxySelection();
  }

  private static isGhProxyOptionId(value: string | null): value is GhProxyOptionId {
    return value !== null && CrdHero.ghProxyOptions.some((option) => option.id === value);
  }

  private static getGhProxyOption(optionId: GhProxyOptionId): GhProxyOption {
    return CrdHero.ghProxyOptions.find((option) => option.id === optionId)
      ?? CrdHero.ghProxyOptions[0];
  }

  private async syncGhProxySelection(forceRefresh = false) {
    if (this.ghProxySelection === 'auto') {
      await this.resolveBestGhProxy(forceRefresh);
      return;
    }

    const option = CrdHero.getGhProxyOption(this.ghProxySelection);
    this.ghProxyResolvedId = option.id as GhProxyManualOptionId;
    this.ghProxyStatus = `已手动固定到 ${option.label} (${option.domain})`;
  }

  private async resolveBestGhProxy(forceRefresh = false): Promise<GhProxyManualOptionId> {
    const isCacheFresh = Date.now() - this.ghProxyLastBenchmarkedAt < CrdHero.ghProxyAutoRefreshMs;
    if (!forceRefresh && isCacheFresh && this.ghProxyResolvedId) {
      const cachedOption = CrdHero.getGhProxyOption(this.ghProxyResolvedId);
      this.ghProxyStatus = `自动选择当前使用 ${cachedOption.label} (${cachedOption.domain})`;
      return this.ghProxyResolvedId;
    }

    if (this.ghProxyResolvePromise) {
      return this.ghProxyResolvePromise;
    }

    this.ghProxyIsResolving = true;
    this.ghProxyStatus = '自动测速中，正在选择最优 gh-proxy 线路...';

    this.ghProxyResolvePromise = (async () => {
      const options = CrdHero.ghProxyOptions.filter(
        (option): option is GhProxyOption & { domain: string } => Boolean(option.domain)
      );

      const results = await Promise.all(
        options.map(async (option) => ({
          option,
          latency: await this.measureGhProxyLatency(option.domain),
        }))
      );

      const reachableResults = results
        .filter((result) => Number.isFinite(result.latency))
        .sort((left, right) => left.latency - right.latency);

      const fallbackOption = CrdHero.getGhProxyOption('cf') as GhProxyOption & { domain: string };
      const bestResult = reachableResults[0] ?? { option: fallbackOption, latency: Number.POSITIVE_INFINITY };

      this.ghProxyResolvedId = bestResult.option.id as GhProxyManualOptionId;
      this.ghProxyLastBenchmarkedAt = Date.now();

      if (Number.isFinite(bestResult.latency)) {
        this.ghProxyStatus =
          `自动选择当前使用 ${bestResult.option.label} (${bestResult.option.domain})，约 ${Math.round(bestResult.latency)} ms`;
      } else {
        this.ghProxyStatus =
          `自动测速失败，已回退到 ${bestResult.option.label} (${bestResult.option.domain})`;
      }

      return this.ghProxyResolvedId;
    })()
      .finally(() => {
        this.ghProxyIsResolving = false;
        this.ghProxyResolvePromise = null;
      });

    return this.ghProxyResolvePromise;
  }

  private measureGhProxyLatency(domain: string, timeoutMs = 2500): Promise<number> {
    return new Promise((resolve) => {
      const start = performance.now();
      const image = new Image();

      const finish = (latency: number) => {
        clearTimeout(timeoutId);
        image.onload = null;
        image.onerror = null;
        resolve(latency);
      };

      const timeoutId = window.setTimeout(() => finish(Number.POSITIVE_INFINITY), timeoutMs);

      image.onload = () => finish(performance.now() - start);
      image.onerror = () => finish(Number.POSITIVE_INFINITY);
      image.src = `https://${domain}/favicon.ico?ts=${Date.now()}-${Math.random().toString(36).slice(2)}`;
    });
  }

  private buildGhProxyDownloadUrl(sourceUrl: string, optionId: GhProxyManualOptionId) {
    const option = CrdHero.getGhProxyOption(optionId) as GhProxyOption & { domain: string };
    return `https://${option.domain}/${sourceUrl}`;
  }

  private async handleGhProxyDownload(sourceUrl: string) {
    const pendingWindow = window.open('about:blank', '_blank');
    if (pendingWindow) {
      pendingWindow.opener = null;
    }

    try {
      const optionId = this.ghProxySelection === 'auto'
        ? await this.resolveBestGhProxy()
        : this.ghProxySelection;

      const downloadUrl = this.buildGhProxyDownloadUrl(sourceUrl, optionId);

      if (pendingWindow) {
        pendingWindow.location.replace(downloadUrl);
        return;
      }

      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      pendingWindow?.close();
      console.error('Failed to open gh-proxy download', error);
    }
  }

  private handleGhProxySelectionChange(e: Event) {
    const select = e.currentTarget as HTMLSelectElement;
    if (!CrdHero.isGhProxyOptionId(select.value)) {
      return;
    }

    this.ghProxySelection = select.value;

    try {
      window.localStorage.setItem(CrdHero.ghProxyStorageKey, this.ghProxySelection);
    } catch (error) {
      console.warn('Failed to persist gh-proxy preference', error);
    }

    void this.syncGhProxySelection(this.ghProxySelection === 'auto');
  }

  private getGhProxySelectionLabel() {
    const optionId = this.ghProxySelection === 'auto' ? this.ghProxyResolvedId : this.ghProxySelection;
    return CrdHero.getGhProxyOption(optionId).label;
  }

  private async fetchVersionInfo() {
    try {
      const response = await fetch('https://clientsettings.roproxy.com/v2/client-version/WindowsPlayer/channel/LIVE');
      if (response.ok) {
        const data = await response.json();
        if (data.clientVersionUpload) {
          this.latestVersion = data.clientVersionUpload;
          const now = new Date();
          this.lastUpdate = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        }
      }
    } catch (e) {
      this.latestVersion = '获取失败';
    }
  }

  private async handleOfficialDownload(binaryType: 'WindowsPlayer' | 'MacPlayer') {
    try {
      const response = await fetch(
        `https://clientsettings.roproxy.com/v2/client-version/${binaryType}/channel/LIVE`
      );

      if (!response.ok) {
        throw new Error(`版本获取失败: ${response.status}`);
      }

      const data = await response.json();
      if (!data.clientVersionUpload) {
        throw new Error('未获取到有效版本号');
      }

      const latestUrl = binaryType === 'WindowsPlayer'
        ? `https://setup.rbxcdn.com/${data.clientVersionUpload}-RobloxPlayerInstaller.exe`
        : `https://setup.rbxcdn.com/mac/${data.clientVersionUpload}-RobloxPlayer.zip`;

      window.open(latestUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(`Failed to open latest ${binaryType} download`, error);
    }
  }

  private handleTabChange(e: Event) {
    const tabs = e.currentTarget as HTMLElement & { activeTabIndex: number };
    this.activeTabIndex = tabs.activeTabIndex;
  }

  private handleWinSegmentSelection(e: Event) {
    const event = e as CustomEvent<{ index: number }>;
    this.activeWinTabIndex = event.detail.index;
  }

  private openRddDialog(binaryType: string) {
    if (this.rddDialog) {
      this.rddDialog.open(binaryType);
    }
  }

  private renderWindows11Icon() {
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 128 128"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <path
          fill="var(--md-sys-color-primary)"
          d="M67.328 67.331h60.669V128H67.328zm-67.325 0h60.669V128H.003zM67.328 0h60.669v60.669H67.328zM.003 0h60.669v60.669H.003z"
        ></path>
      </svg>
    `;
  }

  private renderAppleLogoIcon() {
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"
        ></path>
      </svg>
    `;
  }

  private renderGhProxySettingsEntry() {
    return html`
      <md-icon-button
        class="download-settings-trigger"
        aria-label="打开下载设置"
        title="下载设置"
        touch-target="wrapper"
        @click=${() => { this.showGhProxySettings = true; }}
      >
        <md-icon>settings</md-icon>
      </md-icon-button>
    `;
  }

  private renderGhProxyToolbar() {
    return html`
      <section class="proxy-toolbar">
        <div class="proxy-copy">
          <strong>gh-proxy 下载线路</strong>
          <span>
            Android 安装包和第三方启动器支持自动测速，也可以手动固定到你更顺手的节点。
          </span>
        </div>

        <div class="proxy-controls">
          <label class="proxy-select-wrap">
            <span>当前线路</span>
            <select
              class="proxy-select"
              .value=${this.ghProxySelection}
              @change=${(e: Event) => this.handleGhProxySelectionChange(e)}
            >
              ${CrdHero.ghProxyOptions.map((option) => html`
                <option value=${option.id}>
                  ${option.domain
                    ? `${option.label} (${option.domain})`
                    : option.label}
                </option>
              `)}
            </select>
          </label>

          <md-outlined-button
            ?disabled=${this.ghProxySelection !== 'auto' || this.ghProxyIsResolving}
            @click=${() => void this.syncGhProxySelection(true)}
          >
            ${this.ghProxyIsResolving ? '测速中...' : '重新测速'}
          </md-outlined-button>
        </div>

        <div class="proxy-status">
          当前生效：${this.getGhProxySelectionLabel()}。${this.ghProxyStatus}
        </div>
      </section>
    `;
  }

  private renderGhProxySettingsDialog() {
    return html`
      <md-dialog
        ?open=${this.showGhProxySettings}
        @close=${() => { this.showGhProxySettings = false; }}
      >
        <div slot="headline">下载设置</div>
        <div slot="content" class="proxy-settings-dialog-content">
          <div class="proxy-settings-note">
            设置会立即保存。Android 安装包和第三方启动器会使用这里选择的 gh-proxy 下载路线。
          </div>
          ${this.renderGhProxyToolbar()}
        </div>
        <div slot="actions">
          <md-text-button @click=${() => { this.showGhProxySettings = false; }}>
            关闭
          </md-text-button>
        </div>
      </md-dialog>
    `;
  }

  private renderLauncherActions(className = 'launcher-actions') {
    return html`
      <div class=${className}>
        <md-filled-tonal-button @click=${() => void this.handleGhProxyDownload(CrdHero.bloxstrapSourceUrl)}>
          Bloxstrap
        </md-filled-tonal-button>
        <md-filled-tonal-button @click=${() => void this.handleGhProxyDownload(CrdHero.fishstrapSourceUrl)}>
          Fishstrap
        </md-filled-tonal-button>
      </div>
    `;
  }

  private renderAndroidActions(className = 'actions-row') {
    return html`
      <div class=${className}>
        <md-filled-button @click=${() => void this.handleGhProxyDownload(CrdHero.androidZapkSourceUrl)}>
          推荐下载 .zapk
        </md-filled-button>
        <md-filled-tonal-button @click=${() => void this.handleGhProxyDownload(CrdHero.androidApkSourceUrl)}>
          备用下载 .apk
        </md-filled-tonal-button>
        <md-outlined-button
          href=${CrdHero.androidPlayStoreUrl}
          target="_blank"
        >
          Google Play
        </md-outlined-button>
      </div>
    `;
  }

  private renderDesktopDownloadLayout() {
    return html`
      <div class="desktop-download-layout">
        <md-tabs class="platform-tabs" @change=${this.handleTabChange}>
          <md-primary-tab ?active=${this.activeTabIndex === 0}>
            <md-icon slot="icon">${this.renderWindows11Icon()}</md-icon>
            Windows
          </md-primary-tab>
          <md-primary-tab ?active=${this.activeTabIndex === 1}>
            <md-icon slot="icon">${this.renderAppleLogoIcon()}</md-icon>
            macOS
          </md-primary-tab>
          <md-primary-tab ?active=${this.activeTabIndex === 2}>
            <md-icon slot="icon">android</md-icon>
            Android
          </md-primary-tab>
        </md-tabs>

        <div class="tab-panel ${this.activeTabIndex === 0 ? 'active' : ''}">
          <div class="segmented-shell">
            <md-outlined-segmented-button-set @segmented-button-set-selection=${this.handleWinSegmentSelection}>
              <md-outlined-segmented-button
                .label=${'官方原版'}
                ?selected=${this.activeWinTabIndex === 0}
              >
              </md-outlined-segmented-button>
              <md-outlined-segmented-button
                .label=${'第三方启动器'}
                ?selected=${this.activeWinTabIndex === 1}
              >
              </md-outlined-segmented-button>
            </md-outlined-segmented-button-set>
          </div>

          <div class="sub-tab-panel ${this.activeWinTabIndex === 0 ? 'active' : ''}">
            <div class="download-card main">
              <md-icon>${this.renderWindows11Icon()}</md-icon>
              <div class="info">
                <strong>Windows 官方原版</strong>
                <span>适合绝大多数 PC 用户，稳定可靠，点击时会实时获取最新官方安装包。</span>
              </div>
              <div class="card-actions">
                <md-filled-button @click=${() => this.handleOfficialDownload('WindowsPlayer')}>
                  安装包下载
                </md-filled-button>
                <md-outlined-button @click=${() => this.openRddDialog('WindowsPlayer')}>
                  免安装本体 (RDD)
                </md-outlined-button>
              </div>
            </div>
          </div>

          <div class="sub-tab-panel ${this.activeWinTabIndex === 1 ? 'active' : ''}">
            <div class="download-card">
              <div
                class="custom-icon"
                style=${`background-image: url('${CrdHero.bloxstrapIconUrl}')`}
              ></div>
              <div class="info">
                <strong>Bloxstrap</strong>
                <span>Roblox 的第三方开源启动器，附带了许多额外的功能。</span>
              </div>
              <div class="card-actions">
                <md-filled-tonal-button @click=${() => void this.handleGhProxyDownload(CrdHero.bloxstrapSourceUrl)}>
                  下载
                </md-filled-tonal-button>
              </div>
            </div>

            <div class="download-card">
              <div
                class="custom-icon"
                style=${`background-image: url('${CrdHero.fishstrapIconUrl}')`}
              ></div>
              <div class="info">
                <strong>Fishstrap</strong>
                <span>基于 Bloxstrap 的增强分支，提供多开、消息日志与跳过更新等功能。</span>
              </div>
              <div class="card-actions">
                <md-filled-tonal-button @click=${() => void this.handleGhProxyDownload(CrdHero.fishstrapSourceUrl)}>
                  下载
                </md-filled-tonal-button>
              </div>
            </div>
          </div>
        </div>

        <div class="tab-panel ${this.activeTabIndex === 1 ? 'active' : ''}">
          <div class="download-card main">
            <md-icon>${this.renderAppleLogoIcon()}</md-icon>
            <div class="info">
              <strong>macOS 官方版</strong>
              <span>支持 Intel 与 Apple Silicon (M1/M2/M3) 原生运行，下载时会实时获取最新官方包。</span>
            </div>
            <div class="card-actions">
              <md-filled-button @click=${() => this.handleOfficialDownload('MacPlayer')}>
                安装包下载
              </md-filled-button>
              <md-outlined-button @click=${() => this.openRddDialog('MacPlayer')}>
                免安装本体 (RDD)
              </md-outlined-button>
            </div>
          </div>
        </div>

        <div class="tab-panel ${this.activeTabIndex === 2 ? 'active' : ''}">
          <div class="download-card main">
            <md-icon>android</md-icon>
            <div class="info">
              <strong>Android 安装包下载</strong>
              <span>ZAPK 为推荐下载方式，APK 作为兼容备用，同时支持跳转 Google Play 商店。</span>
              <div class="support-note">
                安装包由
                <a href=${CrdHero.androidRepoUrl} target="_blank">
                  CRD-APK 仓库
                </a>
                提供，感谢维护与发布。
              </div>
            </div>
            ${this.renderAndroidActions()}
          </div>
        </div>
      </div>
    `;
  }

  private renderMobileDownloadLayout() {
    return html`
      <div class="mobile-download-layout">
        <div class="mobile-platform-list">
          <section class="mobile-platform-card main">
            <div class="mobile-platform-header">
              <div class="mobile-platform-icon">${this.renderWindows11Icon()}</div>
              <div class="mobile-platform-copy">
                <strong>Windows 官方原版</strong>
                <span>优先提供官方安装包下载，同时保留 RDD 免安装本体作为快速方案。</span>
              </div>
            </div>
            <div class="mobile-actions">
              <md-filled-button @click=${() => this.handleOfficialDownload('WindowsPlayer')}>
                官方安装包下载
              </md-filled-button>
              <md-outlined-button @click=${() => this.openRddDialog('WindowsPlayer')}>
                免安装本体 (RDD)
              </md-outlined-button>
            </div>
            <div class="mobile-secondary">
              <div class="secondary-label">第三方启动器</div>
              ${this.renderLauncherActions()}
            </div>
          </section>

          <section class="mobile-platform-card">
            <div class="mobile-platform-header">
              <div class="mobile-platform-icon">${this.renderAppleLogoIcon()}</div>
              <div class="mobile-platform-copy">
                <strong>macOS 官方版</strong>
                <span>适配 Intel 与 Apple Silicon 设备，点击时会实时获取当前官方最新包。</span>
              </div>
            </div>
            <div class="mobile-actions">
              <md-filled-button @click=${() => this.handleOfficialDownload('MacPlayer')}>
                官方安装包下载
              </md-filled-button>
              <md-outlined-button @click=${() => this.openRddDialog('MacPlayer')}>
                免安装本体 (RDD)
              </md-outlined-button>
            </div>
          </section>

          <section class="mobile-platform-card main">
            <div class="mobile-platform-header">
              <md-icon class="mobile-platform-icon">android</md-icon>
              <div class="mobile-platform-copy">
                <strong>Android 安装包</strong>
                <span>推荐优先使用 ZAPK，APK 可作为兼容备用，Google Play 入口也保留。</span>
              </div>
            </div>
            ${this.renderAndroidActions('mobile-actions')}
            <div class="mobile-support-note">
              安装包由
              <a href=${CrdHero.androidRepoUrl} target="_blank">
                CRD-APK 仓库
              </a>
              提供，感谢维护与发布。
            </div>
          </section>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="hero-container">
        <div class="header-text">
          <h1>CRD.</h1>
          <p class="subtitle">专为中国大陆地区提供的 Roblox 客户端安装分流服务。高速、稳定、安全纯净。</p>

          <div class="badges-row">
            <div class="version-badge" title="最新 Windows 官方版本 Hash">
              <md-icon>update</md-icon>
              <div class="version-copy">
                <span>最新版: ${this.latestVersion}</span>
                <span class="version-meta">更新于 ${this.lastUpdate}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="download-section">
          ${this.renderGhProxySettingsEntry()}
          ${this.renderDesktopDownloadLayout()}
          ${this.renderMobileDownloadLayout()}
        </div>
      </div>

      ${this.renderGhProxySettingsDialog()}
      <crd-rdd-dialog></crd-rdd-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crd-hero': CrdHero;
  }
}
