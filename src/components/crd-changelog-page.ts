import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import '@material/web/dialog/dialog.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';

import { changelogEntries, changelogSyntaxGuide } from '../logs/index.js';
import { renderChangelogMarkdown } from '../utils/changelog-render.js';

@customElement('crd-changelog-page')
export class CrdChangelogPage extends LitElement {
  private static readonly syntaxGuideStorageKey = 'crd:syntax-guide-access';

  private static readonly syntaxGuideTag = '1145141919810';

  @state()
  private selectedLogId = changelogEntries[0]?.id ?? '';

  @state()
  private showSyntaxGuide = false;

  @state()
  private syntaxGuideUnlocked = false;

  private readonly syntaxGuideHtml = renderChangelogMarkdown(changelogSyntaxGuide);

  connectedCallback() {
    super.connectedCallback();
    this.syncSelectedLogFromHash();
    this.syncSyntaxGuideAccess();
    this.registerSyntaxGuideConsoleAccess();
    window.addEventListener('hashchange', this.handleHashChange);
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.handleHashChange);
    if (window.crdSyntaxGuideAccess === this.handleSyntaxGuideConsoleAccess) {
      delete window.crdSyntaxGuideAccess;
    }
    if (window.crdSyntaxGuideReset === this.handleSyntaxGuideConsoleReset) {
      delete window.crdSyntaxGuideReset;
    }
    super.disconnectedCallback();
  }

  private readonly handleHashChange = () => {
    this.syncSelectedLogFromHash();
  };

  private syncSelectedLogFromHash() {
    const match = window.location.hash.match(/^#updates\/(\d{4}-\d{2}-\d{2})$/);
    const logId = match?.[1];

    if (logId && changelogEntries.some((entry) => entry.id === logId)) {
      this.selectedLogId = logId;
      return;
    }

    if (!this.selectedLogId && changelogEntries[0]) {
      this.selectedLogId = changelogEntries[0].id;
    }
  }

  private syncSyntaxGuideAccess() {
    const storedTag = window.localStorage.getItem(CrdChangelogPage.syntaxGuideStorageKey);
    this.syntaxGuideUnlocked = storedTag === CrdChangelogPage.syntaxGuideTag;

    if (!this.syntaxGuideUnlocked) {
      this.showSyntaxGuide = false;
    }
  }

  private registerSyntaxGuideConsoleAccess() {
    window.crdSyntaxGuideAccess = this.handleSyntaxGuideConsoleAccess;
    window.crdSyntaxGuideReset = this.handleSyntaxGuideConsoleReset;
  }

  private selectLog(logId: string) {
    if (logId === this.selectedLogId) {
      return;
    }

    this.selectedLogId = logId;
    window.location.hash = `#updates/${logId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private readonly openSyntaxGuide = () => {
    this.showSyntaxGuide = true;
  };

  private readonly closeSyntaxGuide = () => {
    this.showSyntaxGuide = false;
  };

  private readonly handleSyntaxGuideConsoleAccess = (tag?: string) => {
    const normalizedTag = String(tag ?? '').trim();
    if (normalizedTag !== CrdChangelogPage.syntaxGuideTag) {
      console.warn('Invalid CRD syntax tag.');
      return false;
    }

    window.localStorage.setItem(CrdChangelogPage.syntaxGuideStorageKey, normalizedTag);
    this.syntaxGuideUnlocked = true;
    console.info('CRD syntax guide unlocked.');
    return true;
  };

  private readonly handleSyntaxGuideConsoleReset = () => {
    window.localStorage.removeItem(CrdChangelogPage.syntaxGuideStorageKey);
    this.syntaxGuideUnlocked = false;
    this.showSyntaxGuide = false;
    console.info('CRD syntax guide hidden.');
    return true;
  };

  private get selectedLog() {
    return changelogEntries.find((entry) => entry.id === this.selectedLogId) ?? changelogEntries[0] ?? null;
  }

  static styles = css`
    :host {
      display: block;
      padding: clamp(28px, 6vw, 56px) clamp(16px, 4vw, 24px) clamp(48px, 7vw, 72px);
      background: transparent;
    }

    .page-shell {
      max-width: 1180px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .intro-card,
    .dates-panel,
    .log-panel {
      border-radius: 28px;
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 84%, transparent);
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-high) 76%, transparent),
          var(--md-sys-color-surface-container-low)
        );
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
    }

    .intro-card {
      padding: clamp(24px, 4vw, 34px);
      display: flex;
      flex-direction: column;
      gap: 14px;
      background:
        radial-gradient(
          circle at top right,
          color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent),
          transparent 34%
        ),
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-highest) 92%, transparent),
          var(--md-sys-color-surface-container-high)
        );
    }

    .intro-kicker {
      margin: 0;
      font-family: var(--crd-font-small);
      font-size: 0.82rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--md-sys-color-primary);
    }

    .intro-title {
      margin: 0;
      font-size: clamp(2rem, 5.8vw, 3.8rem);
      line-height: 0.98;
      letter-spacing: -0.05em;
      color: var(--md-sys-color-on-surface);
    }

    .intro-summary {
      margin: 0;
      max-width: 780px;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.75;
      font-size: 1rem;
    }

    .content-layout {
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      gap: 20px;
      align-items: start;
    }

    .content-main {
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 0;
    }

    .dates-panel {
      padding: 16px;
      position: sticky;
      top: 98px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .dates-panel h2 {
      margin: 4px 6px 0;
      font-size: 1rem;
      color: var(--md-sys-color-on-surface);
    }

    .dates-panel p {
      margin: 0 6px 4px;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.65;
      font-size: 0.92rem;
    }

    .dates-panel code,
    .syntax-dialog-lead code,
    .syntax-entry__summary code {
      font-family: var(--crd-font-small);
      font-size: 0.84em;
      padding: 0.15em 0.42em;
      border-radius: 8px;
      background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 92%, transparent);
      color: var(--md-sys-color-on-surface);
    }

    .dates-panel__syntax-entry {
      width: 100%;
      padding: 18px;
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 72%, transparent);
      border-radius: 24px;
      background:
        radial-gradient(
          circle at top right,
          color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent),
          transparent 42%
        ),
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-secondary-container) 46%, transparent),
          var(--md-sys-color-surface-container-low)
        );
      display: flex;
      flex-direction: column;
      gap: 14px;
      color: inherit;
      text-align: left;
      cursor: pointer;
      transition:
        transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
        border-color 180ms ease,
        background-color 180ms ease,
        box-shadow 180ms ease;
    }

    .dates-panel__syntax-entry:hover,
    .dates-panel__syntax-entry:focus-visible {
      transform: translateY(-1px);
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 32%, var(--md-sys-color-outline-variant));
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
      outline: none;
    }

    .syntax-entry__header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      min-width: 0;
    }

    .syntax-entry__icon {
      width: 48px;
      height: 48px;
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 88%, transparent);
      color: var(--md-sys-color-on-primary-container);
    }

    .syntax-entry__icon md-icon {
      font-size: 24px;
    }

    .syntax-entry__copy {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .syntax-entry__eyebrow {
      font-family: var(--crd-font-small);
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--md-sys-color-primary);
    }

    .syntax-entry__title {
      color: var(--md-sys-color-on-surface);
      font-size: 1rem;
      line-height: 1.4;
      font-weight: 700;
    }

    .syntax-entry__summary {
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.9rem;
      line-height: 1.65;
    }

    .syntax-entry__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .syntax-entry__chips span {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 0 12px;
      border-radius: 999px;
      font-family: var(--crd-font-small);
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 88%, transparent);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 62%, transparent);
      color: var(--md-sys-color-on-surface);
    }

    .syntax-entry__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: var(--md-sys-color-on-surface);
      font-size: 0.9rem;
    }

    .syntax-entry__footer md-icon {
      color: var(--md-sys-color-primary);
      font-size: 20px;
    }

    .date-button {
      width: 100%;
      padding: 16px;
      border-radius: 22px;
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
      background: var(--md-sys-color-surface-container-low);
      color: inherit;
      text-align: left;
      cursor: pointer;
      transition:
        transform 180ms ease,
        border-color 180ms ease,
        background-color 180ms ease;
    }

    .date-button:hover,
    .date-button:focus-visible {
      transform: translateY(-1px);
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 24%, var(--md-sys-color-outline-variant));
      background: var(--md-sys-color-surface-container);
      outline: none;
    }

    .date-button.active {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-primary-container) 72%, transparent),
          color-mix(in srgb, var(--md-sys-color-surface-container-low) 94%, transparent)
        );
      border-color: color-mix(in srgb, var(--md-sys-color-primary) 34%, var(--md-sys-color-outline-variant));
    }

    .date-label {
      display: block;
      margin-bottom: 8px;
      font-family: var(--crd-font-small);
      font-size: 0.78rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--md-sys-color-primary);
    }

    .date-title {
      display: block;
      color: var(--md-sys-color-on-surface);
      font-size: 0.98rem;
      line-height: 1.45;
      margin-bottom: 8px;
    }

    .date-summary {
      display: block;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.86rem;
      line-height: 1.6;
    }

    .log-panel {
      padding: clamp(20px, 3vw, 28px);
      overflow: hidden;
    }

    .log-renderer {
      display: flex;
      flex-direction: column;
      gap: 18px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .log-renderer :where(h1, h2, h3) {
      margin: 0;
      color: var(--md-sys-color-on-surface);
    }

    .log-renderer h1 {
      font-size: clamp(2rem, 5vw, 3.2rem);
      line-height: 1.02;
      letter-spacing: -0.04em;
    }

    .log-renderer h2 {
      font-size: 1.28rem;
      padding-top: 10px;
      border-top: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 64%, transparent);
    }

    .log-renderer h3 {
      font-size: 1.06rem;
    }

    .log-renderer p,
    .log-renderer li,
    .log-renderer ol,
    .log-renderer ul,
    .log-renderer blockquote {
      font-size: 0.98rem;
      line-height: 1.8;
    }

    .log-renderer p,
    .log-renderer ul,
    .log-renderer ol,
    .log-renderer blockquote,
    .log-renderer pre,
    .log-renderer hr {
      margin: 0;
    }

    .log-renderer ul,
    .log-renderer ol {
      padding-left: 1.3rem;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .log-renderer li::marker {
      color: var(--md-sys-color-primary);
    }

    .log-renderer a {
      color: var(--md-sys-color-primary);
      text-decoration: none;
    }

    .log-renderer a:hover {
      text-decoration: underline;
    }

    .log-renderer blockquote {
      padding: 16px 18px;
      border-radius: 18px;
      border-left: 4px solid color-mix(in srgb, var(--md-sys-color-primary) 62%, transparent);
      background: var(--md-sys-color-surface-container-low);
      color: var(--md-sys-color-on-surface);
    }

    .log-renderer hr {
      border: none;
      height: 1px;
      background: color-mix(in srgb, var(--md-sys-color-outline-variant) 76%, transparent);
    }

    .log-renderer .log-code {
      padding: 16px 18px;
      border-radius: 20px;
      overflow-x: auto;
      background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 96%, transparent);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 68%, transparent);
    }

    .log-renderer code {
      font-family: var(--crd-font-small);
      font-size: 0.84em;
      padding: 0.15em 0.4em;
      border-radius: 8px;
      background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 92%, transparent);
      color: var(--md-sys-color-on-surface);
    }

    .log-renderer pre code {
      padding: 0;
      background: transparent;
      color: inherit;
    }

    .log-renderer crd-log-hero,
    .log-renderer crd-log-grid,
    .log-renderer crd-log-tags,
    .log-renderer crd-log-callout,
    .log-renderer crd-log-gallery {
      display: block;
    }

    .log-renderer crd-log-hero {
      padding: clamp(22px, 3vw, 32px);
      border-radius: 28px;
      background:
        radial-gradient(
          circle at top right,
          color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent),
          transparent 34%
        ),
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-highest) 92%, transparent),
          var(--md-sys-color-surface-container-high)
        );
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    }

    .log-renderer crd-log-date,
    .log-renderer crd-log-title,
    .log-renderer crd-log-summary,
    .log-renderer crd-log-meta {
      display: block;
    }

    .log-renderer crd-log-date {
      margin-bottom: 10px;
      font-family: var(--crd-font-small);
      font-size: 0.8rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--md-sys-color-primary);
    }

    .log-renderer crd-log-title {
      margin-bottom: 12px;
      font-size: clamp(1.9rem, 4.6vw, 3.1rem);
      line-height: 1;
      letter-spacing: -0.05em;
      color: var(--md-sys-color-on-surface);
      font-weight: 700;
    }

    .log-renderer crd-log-summary {
      margin-bottom: 14px;
      max-width: 760px;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.75;
    }

    .log-renderer crd-log-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .log-renderer crd-log-meta span {
      display: inline-flex;
      align-items: center;
      min-height: 34px;
      padding: 0 14px;
      border-radius: 999px;
      font-family: var(--crd-font-small);
      font-size: 0.76rem;
      color: var(--md-sys-color-on-secondary-container);
      background: color-mix(in srgb, var(--md-sys-color-secondary-container) 92%, transparent);
    }

    .log-renderer crd-log-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .log-renderer crd-log-tag {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      font-family: var(--crd-font-small);
      font-size: 0.74rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
      color: var(--md-sys-color-on-surface);
    }

    .log-renderer crd-log-tag[tone="added"] {
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 88%, transparent);
      color: var(--md-sys-color-on-primary-container);
    }

    .log-renderer crd-log-tag[tone="changed"] {
      background: color-mix(in srgb, var(--md-sys-color-secondary-container) 88%, transparent);
      color: var(--md-sys-color-on-secondary-container);
    }

    .log-renderer crd-log-tag[tone="fixed"] {
      background: color-mix(in srgb, var(--md-sys-color-tertiary-container, var(--md-sys-color-secondary-container)) 88%, transparent);
      color: var(--md-sys-color-on-tertiary-container, var(--md-sys-color-on-secondary-container));
    }

    .log-renderer crd-log-tag[tone="design"],
    .log-renderer crd-log-tag[tone="branding"],
    .log-renderer crd-log-tag[tone="docs"] {
      color: var(--md-sys-color-on-surface-variant);
    }

    .log-renderer crd-log-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }

    .log-renderer crd-log-grid[columns="2"] {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .log-renderer crd-log-grid[columns="3"] {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .log-renderer crd-log-card {
      display: block;
      min-height: 128px;
      padding: 18px;
      border-radius: 22px;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 62%, transparent);
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.7;
    }

    .log-renderer crd-log-card::before {
      content: attr(title);
      display: block;
      margin-bottom: 8px;
      color: var(--md-sys-color-on-surface);
      font-size: 1rem;
      font-weight: 700;
    }

    .log-renderer crd-log-callout {
      padding: 20px;
      border-radius: 24px;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 62%, transparent);
    }

    .log-renderer crd-log-callout::before {
      content: attr(title);
      display: block;
      margin-bottom: 12px;
      color: var(--md-sys-color-on-surface);
      font-size: 1rem;
      font-weight: 700;
    }

    .log-renderer crd-log-callout[tone="primary"] {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-primary-container) 40%, transparent),
          var(--md-sys-color-surface-container-low)
        );
    }

    .log-renderer crd-log-callout[tone="warning"] {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, #fff0c2 64%, transparent),
          var(--md-sys-color-surface-container-low)
        );
    }

    .log-renderer crd-log-callout[tone="danger"] {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, #ffd9d7 64%, transparent),
          var(--md-sys-color-surface-container-low)
        );
    }

    .log-renderer crd-log-callout > :last-child {
      margin-bottom: 0;
    }

    .log-renderer crd-log-gallery {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .log-renderer crd-log-shot {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 180px;
      padding: 18px;
      border-radius: 22px;
      background:
        linear-gradient(
          135deg,
          color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent),
          color-mix(in srgb, var(--md-sys-color-surface-container-highest) 92%, transparent)
        );
      border: 1px dashed color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
      overflow: hidden;
      position: relative;
    }

    .log-renderer crd-log-shot:empty::before {
      content: 'Screenshot Pending';
      position: absolute;
      top: 18px;
      left: 18px;
      font-family: var(--crd-font-small);
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--md-sys-color-primary);
    }

    .log-renderer crd-log-shot::after {
      content: attr(caption);
      display: block;
      margin-top: auto;
      color: var(--md-sys-color-on-surface);
      font-size: 0.92rem;
      line-height: 1.65;
    }

    .log-renderer crd-log-shot img {
      width: 100%;
      height: auto;
      border-radius: 16px;
      margin-bottom: 14px;
      object-fit: cover;
    }

    .log-renderer .crd-logo-demo {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16px;
      min-height: 180px;
      margin-bottom: 14px;
      padding: 18px;
      border-radius: 24px;
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 54%, transparent);
    }

    .log-renderer .crd-logo-demo--light {
      color: #14709e;
      background:
        radial-gradient(circle at top left, rgba(20, 112, 158, 0.1), transparent 58%),
        linear-gradient(180deg, rgba(20, 112, 158, 0.08), rgba(20, 112, 158, 0.04));
    }

    .log-renderer .crd-logo-demo--dark {
      color: #91cdff;
      background:
        radial-gradient(circle at top left, rgba(145, 205, 255, 0.16), transparent 58%),
        linear-gradient(180deg, rgba(10, 18, 28, 0.92), rgba(20, 33, 48, 0.86));
      border-color: color-mix(in srgb, #91cdff 26%, rgba(255, 255, 255, 0.1));
    }

    .log-renderer .crd-logo-demo__surface {
      display: flex;
      align-items: center;
      gap: clamp(16px, 2.6vw, 28px);
      min-height: 98px;
      padding: clamp(16px, 2.8vw, 24px);
      border-radius: 26px;
      background: color-mix(in srgb, currentColor 12%, rgba(255, 255, 255, 0.48));
    }

    .log-renderer .crd-logo-demo--dark .crd-logo-demo__surface {
      background: color-mix(in srgb, currentColor 12%, rgba(255, 255, 255, 0.04));
    }

    .log-renderer .crd-logo-demo__mark {
      flex: 0 0 auto;
      width: clamp(84px, 12vw, 112px);
      height: clamp(40px, 5vw, 54px);
      background-color: currentColor;
      -webkit-mask: url('/assets/brand/CRD.svg') center / contain no-repeat;
      mask: url('/assets/brand/CRD.svg') center / contain no-repeat;
    }

    .log-renderer .crd-logo-demo__line {
      width: min(180px, 42%);
      height: 14px;
      border-radius: 999px;
      background: color-mix(in srgb, currentColor 18%, transparent);
    }

    .log-renderer .crd-logo-demo__meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--crd-font-small);
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.88;
    }

    .log-renderer .crd-logo-demo__meta::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: currentColor;
    }

    .log-renderer .crd-logo-demo__details {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      color: color-mix(in srgb, currentColor 74%, var(--md-sys-color-on-surface));
      font-size: 0.94rem;
      line-height: 1.6;
    }

    .log-renderer .crd-logo-demo code {
      padding: 0.18em 0.5em;
      border-radius: 10px;
      background: color-mix(in srgb, currentColor 16%, rgba(255, 255, 255, 0.68));
      border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
      color: currentColor;
    }

    .log-renderer .crd-logo-demo--dark .crd-logo-demo__details {
      color: color-mix(in srgb, currentColor 76%, white);
    }

    .log-renderer .crd-logo-demo--dark code {
      background: color-mix(in srgb, currentColor 18%, rgba(255, 255, 255, 0.06));
      border-color: color-mix(in srgb, currentColor 28%, rgba(255, 255, 255, 0.12));
      color: currentColor;
    }

    md-dialog.syntax-dialog {
      --md-dialog-container-color: var(--md-sys-color-surface-container-high, var(--md-sys-color-surface));
      --md-dialog-headline-color: var(--md-sys-color-on-surface);
      --md-dialog-supporting-text-color: var(--md-sys-color-on-surface-variant);
      --md-dialog-container-shape: 32px;
      width: min(1220px, 96vw);
      max-width: 96vw;
    }

    .syntax-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding-top: 6px;
    }

    .syntax-dialog-lead {
      padding: 20px 22px;
      border-radius: 24px;
      background:
        radial-gradient(
          circle at top right,
          color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent),
          transparent 40%
        ),
        var(--md-sys-color-surface-container-low);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 58%, transparent);
    }

    .syntax-dialog-lead strong {
      display: block;
      margin-bottom: 8px;
      color: var(--md-sys-color-on-surface);
      font-size: 1rem;
    }

    .syntax-dialog-lead p {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.72;
    }

    .syntax-dialog-renderer {
      max-height: min(76vh, 920px);
      overflow: auto;
      padding-right: 6px;
    }

    .syntax-dialog-renderer .log-renderer {
      gap: 22px;
    }

    .syntax-dialog-renderer .log-renderer h1,
    .syntax-dialog-renderer .log-renderer h2 {
      border-top: none;
      padding-top: 0;
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-grid,
    .syntax-dialog-renderer .log-renderer crd-log-doc-card,
    .syntax-dialog-renderer .log-renderer crd-log-doc-title,
    .syntax-dialog-renderer .log-renderer crd-log-doc-copy,
    .syntax-dialog-renderer .log-renderer crd-log-doc-code {
      display: block;
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-grid[columns="1"] {
      grid-template-columns: 1fr;
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-card {
      padding: 24px 24px 22px;
      border-radius: 28px;
      min-height: 240px;
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-highest) 92%, transparent),
          var(--md-sys-color-surface-container-low)
        );
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 62%, transparent);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.04);
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-card[span="2"] {
      grid-column: span 2;
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-card[tone="primary"] {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-primary-container) 42%, transparent),
          var(--md-sys-color-surface-container-low)
        );
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-card[tone="success"] {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, #d6f5de 56%, transparent),
          var(--md-sys-color-surface-container-low)
        );
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-card[tone="warning"] {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, #fff0c2 58%, transparent),
          var(--md-sys-color-surface-container-low)
        );
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-card[tone="neutral"] {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-secondary-container) 38%, transparent),
          var(--md-sys-color-surface-container-low)
        );
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-title {
      margin-bottom: 10px;
      color: var(--md-sys-color-on-surface);
      font-size: 1.14rem;
      font-weight: 700;
      line-height: 1.45;
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-copy {
      margin-bottom: 14px;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.78;
      font-size: 0.96rem;
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-copy code {
      font-family: var(--crd-font-small);
      font-size: 0.84em;
      padding: 0.15em 0.42em;
      border-radius: 8px;
      background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 92%, transparent);
      color: var(--md-sys-color-on-surface);
    }

    .syntax-dialog-renderer .log-renderer crd-log-doc-code {
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: anywhere;
      padding: 18px;
      border-radius: 20px;
      background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 96%, transparent);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
      color: var(--md-sys-color-on-surface);
      font-family: var(--crd-font-small);
      font-size: 0.88rem;
      line-height: 1.72;
    }

    .empty-state {
      padding: 26px;
      border-radius: 24px;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 62%, transparent);
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.7;
    }

    @media (max-width: 980px) {
      .content-layout {
        grid-template-columns: 1fr;
      }

      .dates-panel {
        position: static;
      }
    }

    @media (max-width: 760px) {
      .syntax-dialog-renderer .log-renderer crd-log-doc-grid,
      .log-renderer crd-log-grid,
      .log-renderer crd-log-gallery {
        grid-template-columns: 1fr;
      }

      .syntax-dialog-renderer .log-renderer crd-log-doc-card[span="2"] {
        grid-column: span 1;
      }
    }

    @media (max-width: 640px) {
      :host {
        padding-bottom: 88px;
      }

      .intro-card,
      .dates-panel,
      .log-panel {
        border-radius: 24px;
      }

      .intro-card,
      .log-panel {
        padding: 18px;
      }

      .dates-panel {
        padding: 14px;
      }

      .dates-panel__syntax-entry {
        padding: 16px;
        border-radius: 22px;
      }

      .syntax-entry__header {
        gap: 12px;
      }

      .syntax-entry__icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
      }

      .log-renderer crd-log-hero,
      .log-renderer crd-log-callout,
      .log-renderer crd-log-card,
      .log-renderer crd-log-shot {
        padding: 16px;
        border-radius: 20px;
      }
    }
  `;

  render() {
    const selectedLog = this.selectedLog;

    return html`
      <div class="page-shell">
        <section class="intro-card">
          <p class="intro-kicker">Update History</p>
          <h1 class="intro-title">更新历史</h1>
          <p class="intro-summary">
            这里集中记录 CRD 的阶段性迭代、界面更新和功能修复。后续每一次发布都会按日期写入日志，
            你可以在左侧切换不同日期查看不同阶段的更新内容。
          </p>
        </section>

        <div class="content-layout">
          <aside class="dates-panel">
            <h2>按日期查看</h2>
            <p>
              日志会按日期倒序显示。新增一个 <code>YYYY-MM-DD.md</code> 文件后，
              这里会自动出现新的切换项。
            </p>

            ${this.syntaxGuideUnlocked ? html`
              <button
                class="dates-panel__syntax-entry"
                type="button"
                aria-haspopup="dialog"
                @click=${this.openSyntaxGuide}
              >
                <div class="syntax-entry__header">
                  <span class="syntax-entry__icon">
                    <md-icon>menu_book</md-icon>
                  </span>
                  <div class="syntax-entry__copy">
                    <span class="syntax-entry__eyebrow">写日志时可参考</span>
                    <span class="syntax-entry__title">打开语法手册</span>
                    <span class="syntax-entry__summary">
                      查看 front matter、Markdown 和 CRD 专属标签的大卡片示例，更适合直接照着写。
                    </span>
                  </div>
                </div>

                <div class="syntax-entry__chips">
                  <span>Front Matter</span>
                  <span>Markdown</span>
                  <span>CRD Tags</span>
                </div>

                <div class="syntax-entry__footer">
                  <span>查看完整语法说明</span>
                  <md-icon>arrow_forward</md-icon>
                </div>
              </button>
            ` : nothing}

            ${changelogEntries.map((entry) => html`
              <button
                class="date-button ${entry.id === selectedLog?.id ? 'active' : ''}"
                type="button"
                @click=${() => this.selectLog(entry.id)}
              >
                <span class="date-label">${entry.date}</span>
                <span class="date-title">${entry.title}</span>
                <span class="date-summary">${entry.summary}</span>
              </button>
            `)}
          </aside>

          <div class="content-main">
            <section class="log-panel">
              ${selectedLog
                ? html`
                    <div class="log-renderer">
                      ${unsafeHTML(renderChangelogMarkdown(selectedLog.body))}
                    </div>
                  `
                : html`
                    <div class="empty-state">
                      当前还没有可用的更新日志。你后续只要在 <code>src/logs/</code> 里新增日期文件，
                      更新历史页就会自动读取并展示。
                    </div>
                  `}
            </section>
          </div>
        </div>
      </div>

      ${this.syntaxGuideUnlocked ? html`
        <md-dialog
          class="syntax-dialog"
          ?open=${this.showSyntaxGuide}
          @close=${this.closeSyntaxGuide}
        >
          <div slot="headline">更新日志语法手册</div>
          <div slot="content" class="syntax-dialog-content">
            <div class="syntax-dialog-lead">
              <strong>这份手册现在更像一个真正的文档面板。</strong>
              <p>
                你可以在这里直接查看 front matter、标准 Markdown 和 CRD 专属标签的完整示例。
                我把它改成了更大的卡片式结构，方便在写日志时快速对照和复制。
              </p>
            </div>

            <div class="syntax-dialog-renderer">
              <div class="log-renderer">
                ${this.syntaxGuideHtml ? unsafeHTML(this.syntaxGuideHtml) : nothing}
              </div>
            </div>
          </div>

          <div slot="actions">
            <md-text-button @click=${this.closeSyntaxGuide}>
              关闭
            </md-text-button>
          </div>
        </md-dialog>
      ` : nothing}
    `;
  }
}

declare global {
  interface Window {
    crdSyntaxGuideAccess?: (tag?: string) => boolean;
    crdSyntaxGuideReset?: () => boolean;
  }

  interface HTMLElementTagNameMap {
    'crd-changelog-page': CrdChangelogPage;
  }
}
