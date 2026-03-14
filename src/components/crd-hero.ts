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
import '@material/web/tabs/secondary-tab.js';
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
      padding: clamp(24px, 6vw, 48px) clamp(16px, 4vw, 24px) clamp(32px, 6vw, 48px);
      background-color: var(--md-sys-color-background);
      text-align: center;
      overflow-x: hidden;
    }

    .hero-container {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: clamp(24px, 4vw, 32px);
    }

    .header-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    h1 {
      font-size: clamp(2.8rem, 9vw, 5rem);
      margin: 0;
      line-height: 1.05;
      color: var(--md-sys-color-on-background);
      font-weight: 700;
      letter-spacing: clamp(0.02em, 0.6vw, 0.05em);
    }

    .subtitle {
      font-size: clamp(1rem, 2.4vw, 1.15rem);
      color: var(--md-sys-color-on-surface-variant);
      margin: 0;
      max-width: 640px;
      line-height: 1.65;
    }

    .badges-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
      width: 100%;
    }

    .version-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      max-width: 100%;
      background: color-mix(in srgb, var(--md-sys-color-tertiary-container) 50%, transparent);
      color: var(--md-sys-color-on-tertiary-container);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-tertiary) 30%, transparent);
      border-radius: 12px;
      font-size: 0.85rem;
      font-family: 'Consolas', monospace;
    }

    .version-badge md-icon {
      font-size: 16px;
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
      opacity: 0.7;
      font-size: 0.75rem;
    }

    .download-section {
      position: relative;
      width: 100%;
      background: var(--md-sys-color-surface-container-low);
      border-radius: 24px;
      padding: clamp(18px, 3vw, 24px) clamp(16px, 4vw, 32px) clamp(20px, 4vw, 32px);
      border: 1px solid var(--md-sys-color-outline-variant);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .download-settings-trigger {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 82%, transparent);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
      color: var(--md-sys-color-on-surface-variant);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }

    .download-settings-trigger:hover {
      color: var(--md-sys-color-on-surface);
      background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 94%, transparent);
    }

    .proxy-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 18px;
      border-radius: 18px;
      background: color-mix(in srgb, var(--md-sys-color-secondary-container) 55%, transparent);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-secondary) 28%, transparent);
      text-align: left;
    }

    md-dialog {
      --md-dialog-container-color: var(--md-sys-color-surface-container-high, var(--md-sys-color-surface));
    }

    .proxy-settings-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-top: 8px;
    }

    .proxy-settings-note {
      padding: 12px 14px;
      border-radius: 14px;
      background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 80%, transparent);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, transparent);
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
      font-size: 1rem;
    }

    .proxy-copy span,
    .proxy-status {
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
      font-size: 0.76rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--md-sys-color-on-secondary-container);
      opacity: 0.8;
    }

    .proxy-select {
      appearance: none;
      min-height: 44px;
      padding: 0 42px 0 14px;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--md-sys-color-secondary) 35%, transparent);
      background:
        linear-gradient(45deg, transparent 50%, var(--md-sys-color-on-surface-variant) 50%) calc(100% - 18px) calc(50% - 3px) / 8px 8px no-repeat,
        linear-gradient(135deg, var(--md-sys-color-on-surface-variant) 50%, transparent 50%) calc(100% - 12px) calc(50% - 3px) / 8px 8px no-repeat,
        var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      font: inherit;
      cursor: pointer;
    }

    .proxy-select:focus {
      outline: 2px solid color-mix(in srgb, var(--md-sys-color-primary) 45%, transparent);
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
      width: 100%;
      margin-bottom: 24px;
      --md-primary-tab-container-color: transparent;
      overflow-x: auto;
      scrollbar-width: none;
    }

    md-tabs::-webkit-scrollbar {
      display: none;
    }

    .tab-panel {
      display: none;
      animation: fadeIn 0.3s ease;
    }

    .tab-panel.active {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sub-tab-panel {
      display: none;
      animation: fadeIn 0.3s ease;
      margin-top: 16px;
    }

    .sub-tab-panel.active {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .download-card,
    .mobile-platform-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-radius: 18px;
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant);
      transition: all 0.2s ease;
      text-align: left;
    }

    .download-card:hover,
    .mobile-platform-card:hover {
      background: var(--md-sys-color-surface-container-high);
      border-color: var(--md-sys-color-primary);
    }

    .download-card.main,
    .mobile-platform-card.main {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-primary-container);
    }

    .download-card.main:hover,
    .mobile-platform-card.main:hover {
      background: var(--md-sys-color-primary-container);
      filter: brightness(0.97);
    }

    .download-card md-icon,
    .mobile-platform-icon {
      font-size: 2.5rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-primary);
      flex: none;
    }

    .download-card.main md-icon,
    .mobile-platform-card.main .mobile-platform-icon {
      color: var(--md-sys-color-on-primary-container);
    }

    .custom-icon {
      width: 40px;
      height: 40px;
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
      font-size: 1.1rem;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 4px;
    }

    .download-card.main .info strong,
    .mobile-platform-card.main .mobile-platform-copy strong {
      color: var(--md-sys-color-on-primary-container);
    }

    .info span,
    .mobile-platform-copy span {
      font-size: 0.88rem;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.55;
    }

    .download-card.main .info span,
    .mobile-platform-card.main .mobile-platform-copy span {
      color: var(--md-sys-color-on-primary-container);
      opacity: 0.82;
    }

    .info .support-note,
    .mobile-support-note {
      margin-top: 8px;
      font-size: 0.78rem;
      line-height: 1.5;
      opacity: 0.9;
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
      gap: 8px;
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
      gap: 10px;
      padding-top: 12px;
      border-top: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, transparent);
      width: 100%;
    }

    .secondary-label {
      font-size: 0.76rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.85;
    }

    .download-card.main .secondary-label,
    .mobile-platform-card.main .secondary-label {
      color: var(--md-sys-color-on-primary-container);
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
        border-radius: 22px;
      }

      .download-card {
        flex-direction: column;
        align-items: stretch;
        padding: 18px;
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
        min-width: 170px;
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
        font-size: clamp(2.6rem, 14vw, 3rem);
      }

      .subtitle {
        font-size: 0.98rem;
      }

      .version-badge {
        width: 100%;
        justify-content: center;
        padding: 12px 14px;
        border-radius: 14px;
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
        padding: 16px 14px 18px;
        border-radius: 18px;
      }

      .proxy-toolbar {
        padding: 14px;
        border-radius: 16px;
      }

      .download-settings-trigger {
        top: 10px;
        right: 10px;
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

  private handleWinTabChange(e: Event) {
    const tabs = e.currentTarget as HTMLElement & { activeTabIndex: number };
    this.activeWinTabIndex = tabs.activeTabIndex;
  }

  private openRddDialog(binaryType: string) {
    if (this.rddDialog) {
      this.rddDialog.open(binaryType);
    }
  }

  private renderGhProxySettingsEntry() {
    return html`
      <md-icon-button
        class="download-settings-trigger"
        aria-label="打开下载设置"
        title="下载设置"
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
        <md-outlined-button @click=${() => void this.handleGhProxyDownload(CrdHero.bloxstrapSourceUrl)}>
          Bloxstrap
        </md-outlined-button>
        <md-outlined-button @click=${() => void this.handleGhProxyDownload(CrdHero.fishstrapSourceUrl)}>
          Fishstrap
        </md-outlined-button>
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
        <md-tabs @change=${this.handleTabChange}>
          <md-primary-tab ?active=${this.activeTabIndex === 0}>
            <md-icon slot="icon"><svg viewBox="0 0 448 512" fill="currentColor" width="100%" height="100%"><path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/></svg></md-icon>
            Windows
          </md-primary-tab>
          <md-primary-tab ?active=${this.activeTabIndex === 1}>
            <md-icon slot="icon"><svg viewBox="0 0 384 512" fill="currentColor" width="100%" height="100%"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg></md-icon>
            macOS
          </md-primary-tab>
          <md-primary-tab ?active=${this.activeTabIndex === 2}>
            <md-icon slot="icon">android</md-icon>
            Android
          </md-primary-tab>
        </md-tabs>

        <div class="tab-panel ${this.activeTabIndex === 0 ? 'active' : ''}">
          <md-tabs @change=${this.handleWinTabChange}>
            <md-secondary-tab ?active=${this.activeWinTabIndex === 0}>官方原版</md-secondary-tab>
            <md-secondary-tab ?active=${this.activeWinTabIndex === 1}>第三方启动器</md-secondary-tab>
          </md-tabs>

          <div class="sub-tab-panel ${this.activeWinTabIndex === 0 ? 'active' : ''}">
            <div class="download-card main">
              <md-icon><svg viewBox="0 0 448 512" fill="currentColor" width="100%" height="100%"><path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/></svg></md-icon>
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
            <md-icon><svg viewBox="0 0 384 512" fill="currentColor" width="100%" height="100%"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg></md-icon>
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
              <div class="mobile-platform-icon"><svg viewBox="0 0 448 512" fill="currentColor" width="100%" height="100%"><path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/></svg></div>
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
              <div class="mobile-platform-icon"><svg viewBox="0 0 384 512" fill="currentColor" width="100%" height="100%"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg></div>
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
