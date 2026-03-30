import { LitElement, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import type {
  AdminAnnouncementRecord,
  AdminRole,
  AdminSession,
  AdminSettings,
  AdminUserSummary,
  PlatformCard,
  SupportedPlatform,
} from '../utils/announcement-types.js';
import { platformDisplayNames } from '../utils/announcement-platforms.js';

type AdminSection = 'draft' | 'in_review' | 'published' | 'archived' | 'users' | 'settings';
type NoticeTone = 'neutral' | 'success' | 'danger';

type EditorState = {
  id: string;
  title: string;
  content: string;
  level: 'info' | 'success' | 'warning' | 'danger';
  pinned: boolean;
  link: string;
  linkText: string;
  linksText: string;
  publishedAt: string;
  scheduledAt: string;
  expiresAt: string;
  internalNotes: string;
  status: 'draft' | 'in_review' | 'published' | 'archived';
};

const apiBase = import.meta.env.VITE_ANNOUNCEMENTS_ADMIN_API_URL || '/api/admin';
const allPlatforms: SupportedPlatform[] = [
  'github',
  'bilibili',
  'youtube',
  'qq-channel',
  'roblox-game',
  'roblox-group',
  'roblox-profile',
  'roblox-devforum',
];

const defaultSettings: AdminSettings = {
  siteTitle: 'Announcement Center',
  subtitle: 'Operations notices, maintenance windows, and release reminders live here.',
  platformSupport: allPlatforms,
};

function emptyEditor(): EditorState {
  return {
    id: '',
    title: '',
    content: '',
    level: 'info',
    pinned: false,
    link: '',
    linkText: 'View Details',
    linksText: '',
    publishedAt: '',
    scheduledAt: '',
    expiresAt: '',
    internalNotes: '',
    status: 'draft',
  };
}

function sectionLabel(section: AdminSection) {
  return {
    draft: 'Drafts',
    in_review: 'In Review',
    published: 'Published',
    archived: 'Archived',
    users: 'Users',
    settings: 'Settings',
  }[section];
}

function toDatetimeLocal(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

@customElement('crd-admin-app')
export class CrdAdminApp extends LitElement {
  @state() private loading = true;
  @state() private session: AdminSession = { authenticated: false };
  @state() private announcements: AdminAnnouncementRecord[] = [];
  @state() private activeSection: AdminSection = 'draft';
  @state() private selectedId = '';
  @state() private editor = emptyEditor();
  @state() private previewCards: PlatformCard[] = [];
  @state() private previewPlatforms: SupportedPlatform[] = [];
  @state() private settingsData: AdminSettings = defaultSettings;
  @state() private users: AdminUserSummary[] = [];
  @state() private notice = '';
  @state() private noticeTone: NoticeTone = 'neutral';
  @state() private busyAction = '';
  @state() private loginUsername = 'owner';
  @state() private loginPassword = '';
  @state() private loginError = '';
  @state() private userEditor = {
    id: '',
    username: '',
    displayName: '',
    role: 'editor' as AdminRole,
    password: '',
  };

  static styles = css`
    :host { display: block; min-height: 100vh; background: var(--md-sys-color-background); color: var(--md-sys-color-on-background); }
    .shell { max-width: 1440px; margin: 0 auto; padding: 24px; display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 20px; }
    .card { border-radius: 28px; background: linear-gradient(180deg, var(--md-sys-color-surface-container-high), var(--md-sys-color-surface-container)); border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 82%, transparent); box-shadow: 0 14px 30px rgba(0,0,0,0.06); }
    .sidebar, .main, .stack, .section-list, .list { display: flex; flex-direction: column; gap: 16px; }
    .sidebar { position: sticky; top: 24px; align-self: start; }
    .panel { padding: 18px; }
    .hero { padding: 22px; }
    h1, h2, h3, p { margin: 0; }
    h1, h2, h3 { color: var(--md-sys-color-on-surface); }
    p, .meta, .helper { color: var(--md-sys-color-on-surface-variant); line-height: 1.6; }
    .eyebrow, .chip, .notice { font-family: var(--crd-font-small); font-weight: 700; }
    .eyebrow { color: var(--md-sys-color-primary); font-size: 0.74rem; letter-spacing: 0.05em; text-transform: uppercase; }
    .inline, .badge-row, .platform-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .section-btn, .list-item { width: 100%; border: 1px solid transparent; border-radius: 18px; padding: 14px; background: transparent; color: inherit; text-align: left; cursor: pointer; transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease; }
    .section-btn:hover, .section-btn:focus-visible, .list-item:hover, .list-item:focus-visible { background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent); border-color: color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent); transform: translateY(-1px); }
    .section-btn.active, .list-item.active { background: color-mix(in srgb, var(--md-sys-color-primary-container) 82%, transparent); border-color: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent); }
    .section-btn strong, .list-item strong { display: block; margin-bottom: 4px; }
    .stats, .layout, .preview-grid, .user-grid { display: grid; gap: 12px; }
    .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .layout { grid-template-columns: 340px minmax(0, 1fr); gap: 18px; }
    .preview-grid, .user-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .list-card, .editor-card, .preview-card, .user-card { padding: 18px; border-radius: 22px; background: var(--md-sys-color-surface-container-low); border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 82%, transparent); }
    .editor-grid { display: flex; flex-wrap: wrap; gap: 14px; }
    .field { display: flex; flex-direction: column; gap: 8px; min-width: 0; flex: 1 1 220px; }
    .field.full { flex-basis: 100%; }
    .field label { color: var(--md-sys-color-on-surface); font-family: var(--crd-font-small); font-size: 0.8rem; }
    .field input, .field textarea, .field select { width: 100%; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 88%, transparent); border-radius: 18px; background: var(--md-sys-color-surface-container); color: var(--md-sys-color-on-surface); padding: 14px 16px; font: inherit; }
    .field textarea { min-height: 128px; resize: vertical; line-height: 1.6; }
    .toggle { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 18px; border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 82%, transparent); background: var(--md-sys-color-surface-container); }
    .chip { display: inline-flex; align-items: center; min-height: 24px; padding: 0 10px; border-radius: 999px; font-size: 0.72rem; }
    .chip.status { background: color-mix(in srgb, var(--md-sys-color-primary-container) 84%, transparent); color: var(--md-sys-color-on-primary-container); }
    .chip.info { background: color-mix(in srgb, var(--md-sys-color-secondary-container) 88%, transparent); color: var(--md-sys-color-on-secondary-container); }
    .chip.success { background: var(--crd-status-success-container); color: var(--crd-status-on-success-container); }
    .chip.warning { background: var(--crd-status-warning-container); color: var(--crd-status-on-warning-container); }
    .chip.danger { background: var(--crd-status-danger-container); color: var(--crd-status-on-danger-container); }
    .chip.platform { background: color-mix(in srgb, var(--md-sys-color-secondary-container) 76%, transparent); color: var(--md-sys-color-on-secondary-container); }
    .notice { padding: 14px 16px; border-radius: 18px; border: 1px solid transparent; }
    .notice.neutral { background: color-mix(in srgb, var(--md-sys-color-secondary-container) 72%, transparent); color: var(--md-sys-color-on-secondary-container); }
    .notice.success { background: var(--crd-status-success-container); color: var(--crd-status-on-success-container); }
    .notice.danger { background: var(--crd-status-danger-container); color: var(--crd-status-on-danger-container); }
    .notice-bar { position: sticky; top: 16px; z-index: 2; }
    .section-count { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; min-height: 28px; padding: 0 10px; border-radius: 999px; background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 90%, transparent); color: var(--md-sys-color-on-surface-variant); font-family: var(--crd-font-small); font-size: 0.76rem; font-weight: 700; }
    .section-btn.active .section-count { background: color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent); color: var(--md-sys-color-primary); }
    .preview-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .preview-actions a, .links a { color: var(--md-sys-color-primary); text-decoration: none; font-weight: 700; }
    .editor-status { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .login { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .login-card { width: min(520px, 100%); padding: 28px; }
    .login-card h1 { font-family: var(--crd-font-brand); font-size: clamp(2rem, 4vw, 3rem); line-height: 1.02; }
    @media (max-width: 1180px) { .shell, .layout { grid-template-columns: 1fr; } .sidebar { position: static; } .stats, .preview-grid, .user-grid { grid-template-columns: 1fr; } }
    @media (max-width: 720px) { .shell { padding: 16px 14px 28px; } .card, .list-card, .editor-card, .preview-card, .user-card { border-radius: 22px; } }
  `;

  connectedCallback() {
    super.connectedCallback();
    void this.bootstrap();
  }

  private async bootstrap() {
    try {
      await this.loadSession();
      if (this.session.authenticated) {
        await this.loadWorkspace();
      }
    } finally {
      this.loading = false;
    }
  }

  private async api(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (this.session.csrfToken && init.method && init.method !== 'GET') {
      headers.set('X-CSRF-Token', this.session.csrfToken);
    }
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${apiBase}${path}`, {
      credentials: 'include',
      ...init,
      headers,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload;
  }

  private async loadSession() {
    this.session = await this.api('/session');
  }

  private async loadWorkspace() {
    await Promise.all([
      this.loadAnnouncements(),
      this.loadSettings(),
      this.session.user?.role === 'owner' ? this.loadUsers() : Promise.resolve(),
    ]);
  }

  private async loadAnnouncements() {
    const payload = await this.api('/announcements');
    this.announcements = payload.items || [];
    this.syncActiveSection();
    const selected = this.announcements.find((entry) => entry.id === this.selectedId) || this.filteredAnnouncements[0] || this.announcements[0];
    if (selected) {
      this.selectAnnouncement(selected);
    } else {
      this.createDraft(false);
    }
  }

  private async loadSettings() {
    this.settingsData = await this.api('/settings');
  }

  private async loadUsers() {
    const payload = await this.api('/users');
    this.users = payload.items || [];
  }

  private setNotice(message: string, tone: NoticeTone = 'neutral') {
    this.notice = message;
    this.noticeTone = tone;
  }

  private setBusy(action = '') {
    this.busyAction = action;
  }

  private syncActiveSection() {
    if (this.activeSection === 'users' || this.activeSection === 'settings') {
      return;
    }

    const orderedSections: AdminSection[] = ['draft', 'in_review', 'published', 'archived'];
    const currentHasItems = this.announcements.some((entry) => entry.status === this.activeSection);
    if (currentHasItems) {
      return;
    }

    const fallback = orderedSections.find((section) => this.announcements.some((entry) => entry.status === section));
    this.activeSection = fallback || 'draft';
  }

  private selectAnnouncement(record: AdminAnnouncementRecord) {
    this.selectedId = record.id;
    this.editor = {
      id: record.id,
      title: record.title,
      content: record.content,
      level: record.level || 'info',
      pinned: Boolean(record.pinned),
      link: record.link || '',
      linkText: record.linkText || 'View Details',
      linksText: (record.links || []).join('\n'),
      publishedAt: toDatetimeLocal(record.publishedAt),
      scheduledAt: toDatetimeLocal(record.scheduledAt),
      expiresAt: toDatetimeLocal(record.expiresAt),
      internalNotes: record.internalNotes || '',
      status: record.status,
    };
    this.previewCards = record.platformCards || [];
    this.previewPlatforms = record.supportPlatforms || [];
  }

  private get filteredAnnouncements() {
    if (this.activeSection === 'users' || this.activeSection === 'settings') {
      return this.announcements;
    }
    return this.announcements.filter((entry) => entry.status === this.activeSection);
  }

  private get counts() {
    return {
      draft: this.announcements.filter((entry) => entry.status === 'draft').length,
      in_review: this.announcements.filter((entry) => entry.status === 'in_review').length,
      published: this.announcements.filter((entry) => entry.status === 'published').length,
      archived: this.announcements.filter((entry) => entry.status === 'archived').length,
    };
  }

  private updateEditor<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    this.editor = { ...this.editor, [key]: value };
  }

  private async handleLogin(event: Event) {
    event.preventDefault();
    this.loginError = '';
    try {
      this.session = await this.api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: this.loginUsername,
          password: this.loginPassword,
        }),
      });
      this.loginPassword = '';
      await this.loadWorkspace();
      this.setNotice('Signed in to the admin workspace.', 'success');
    } catch (error) {
      this.loginError = error instanceof Error ? error.message : 'Sign in failed.';
    }
  }

  private async handleLogout() {
    await this.api('/auth/logout', { method: 'POST' });
    this.session = { authenticated: false };
    this.announcements = [];
    this.users = [];
    this.editor = emptyEditor();
    this.previewCards = [];
    this.previewPlatforms = [];
    this.selectedId = '';
  }

  private createDraft(showNotice = true) {
    this.activeSection = 'draft';
    this.selectedId = '';
    this.editor = emptyEditor();
    this.previewCards = [];
    this.previewPlatforms = [];
    if (showNotice) {
      this.setNotice('Switched to a new draft.', 'neutral');
    }
  }

  private async resolvePreview() {
    this.setBusy('resolve');
    this.setNotice('Resolving platform links...', 'neutral');
    try {
      const payload = await this.api('/platform-resolve', {
        method: 'POST',
        body: JSON.stringify({
          link: this.editor.link,
          links: this.editor.linksText,
          content: this.editor.content,
        }),
      });
      this.previewCards = payload.cards || [];
      this.previewPlatforms = payload.supportPlatforms || [];
      this.setNotice(`Platform links resolved. Generated ${this.previewCards.length} card(s).`, 'success');
    } catch (error) {
      this.setNotice(error instanceof Error ? error.message : 'Resolving links failed.', 'danger');
    } finally {
      this.setBusy();
    }
  }

  private editorPayload() {
    return {
      id: this.editor.id || undefined,
      title: this.editor.title,
      content: this.editor.content,
      level: this.editor.level,
      pinned: this.editor.pinned,
      link: this.editor.link,
      linkText: this.editor.linkText,
      links: this.editor.linksText,
      publishedAt: fromDatetimeLocal(this.editor.publishedAt),
      scheduledAt: fromDatetimeLocal(this.editor.scheduledAt),
      expiresAt: fromDatetimeLocal(this.editor.expiresAt),
      internalNotes: this.editor.internalNotes,
      status: this.editor.status,
    };
  }

  private async saveAnnouncement() {
    this.setBusy('save');
    this.setNotice('Saving announcement...', 'neutral');
    try {
      const payload = this.editorPayload();
      const result = this.editor.id
        ? await this.api('/announcements', { method: 'PATCH', body: JSON.stringify(payload) })
        : await this.api('/announcements', { method: 'POST', body: JSON.stringify(payload) });
      await this.loadAnnouncements();
      const record = this.announcements.find((entry) => entry.id === result.id);
      if (record) {
        this.selectAnnouncement(record);
      }
      this.setNotice('Announcement saved.', 'success');
    } catch (error) {
      this.setNotice(error instanceof Error ? error.message : 'Save failed.', 'danger');
    } finally {
      this.setBusy();
    }
  }

  private async runWorkflow(action: 'submit-review' | 'publish' | 'archive' | 'restore') {
    if (!this.editor.id) {
      return;
    }
    this.setBusy(action);
    this.setNotice({
      'submit-review': 'Sending announcement to review...',
      publish: 'Publishing announcement...',
      archive: 'Archiving announcement...',
      restore: 'Restoring announcement...',
    }[action], 'neutral');
    try {
      const result = await this.api(`/announcements/${this.editor.id}/${action}`, { method: 'POST' });
      await this.loadAnnouncements();
      const record = this.announcements.find((entry) => entry.id === result.id);
      if (record) {
        this.selectAnnouncement(record);
      }
      this.setNotice({
        'submit-review': 'Announcement sent to review.',
        publish: 'Announcement published.',
        archive: 'Announcement archived.',
        restore: 'Announcement restored to draft.',
      }[action], 'success');
    } catch (error) {
      this.setNotice(error instanceof Error ? error.message : 'Workflow action failed.', 'danger');
    } finally {
      this.setBusy();
    }
  }

  private async saveSettings() {
    this.setBusy('settings');
    this.setNotice('Saving settings...', 'neutral');
    try {
      this.settingsData = await this.api('/settings', { method: 'PATCH', body: JSON.stringify(this.settingsData) });
      this.setNotice('Settings saved.', 'success');
    } catch (error) {
      this.setNotice(error instanceof Error ? error.message : 'Saving settings failed.', 'danger');
    } finally {
      this.setBusy();
    }
  }

  private async saveUser() {
    this.setBusy('user');
    this.setNotice('Saving user...', 'neutral');
    try {
      const payload = await this.api('/users', { method: 'PATCH', body: JSON.stringify({ user: this.userEditor }) });
      this.users = payload.items || [];
      this.userEditor = { id: '', username: '', displayName: '', role: 'editor', password: '' };
      this.setNotice('User saved.', 'success');
    } catch (error) {
      this.setNotice(error instanceof Error ? error.message : 'Saving user failed.', 'danger');
    } finally {
      this.setBusy();
    }
  }

  private renderLogin() {
    return html`
      <div class="login">
        <section class="card login-card stack">
          <span class="eyebrow">Announcement Backend</span>
          <h1>CRD Admin</h1>
          <p>Create drafts, submit reviews, publish announcements, and manage roles plus platform support.</p>

          <form class="stack" @submit=${this.handleLogin}>
            <div class="field">
              <label>Username</label>
              <input .value=${this.loginUsername} @input=${(event: Event) => { this.loginUsername = (event.currentTarget as HTMLInputElement).value; }} />
            </div>
            <div class="field">
              <label>Password</label>
              <input type="password" .value=${this.loginPassword} @input=${(event: Event) => { this.loginPassword = (event.currentTarget as HTMLInputElement).value; }} />
            </div>
            <div class="inline">
              <md-filled-button type="submit">Sign In</md-filled-button>
              <a href="https://service.forsaken-zh.wiki/api/announcements" target="_blank" rel="noopener noreferrer">Public API</a>
            </div>
          </form>

          ${this.loginError ? html`<div class="notice danger">${this.loginError}</div>` : html``}
          <p class="helper">Change the bootstrap passwords after first deployment and manage editor / reviewer accounts with the owner role.</p>
        </section>
      </div>
    `;
  }

  private renderSidebar() {
    const sections: AdminSection[] = ['draft', 'in_review', 'published', 'archived', 'users', 'settings'];
    const sectionCounts: Record<Exclude<AdminSection, 'users' | 'settings'>, number> = {
      draft: this.counts.draft,
      in_review: this.counts.in_review,
      published: this.counts.published,
      archived: this.counts.archived,
    };
    return html`
      <aside class="sidebar">
        <section class="card panel">
          <h2>Views</h2>
          <p>Drafts are for editing, in review is for release flow, and published or archived handles live state management.</p>
          <div class="section-list">
            ${sections.map((section) => html`
              <button class="section-btn ${this.activeSection === section ? 'active' : ''}" type="button" @click=${() => {
                this.activeSection = section;
                if (section !== 'users' && section !== 'settings') {
                  const next = this.announcements.find((entry) => entry.status === section);
                  if (next) {
                    this.selectAnnouncement(next);
                    this.setNotice(`Opened ${sectionLabel(section)} section.`, 'neutral');
                  } else {
                    this.selectedId = '';
                    this.editor = emptyEditor();
                    this.previewCards = [];
                    this.previewPlatforms = [];
                    this.setNotice(`${sectionLabel(section)} is currently empty.`, 'neutral');
                  }
                }
              }}>
                <div class="editor-status">
                  <strong>${sectionLabel(section)}</strong>
                  ${section === 'users' || section === 'settings'
                    ? nothing
                    : html`<span class="section-count">${sectionCounts[section]}</span>`}
                </div>
                <span class="meta">${section === 'users' ? 'Manage accounts and roles.' : section === 'settings' ? 'Update public title and platform scope.' : `Browse ${sectionLabel(section)} announcements.`}</span>
              </button>
            `)}
          </div>
        </section>

        <section class="card panel">
          <h3>Current Session</h3>
          <p>${this.session.user?.displayName || 'Not Signed In'} / ${this.session.user?.role || '-'}</p>
          <div class="inline">
            <md-outlined-button @click=${() => this.createDraft()}>New Draft</md-outlined-button>
            <md-text-button @click=${() => this.handleLogout()}>Sign Out</md-text-button>
          </div>
        </section>
      </aside>
    `;
  }

  private renderBadges(record: AdminAnnouncementRecord) {
    return html`
      <div class="badge-row">
        <span class="chip status">${record.status}</span>
        <span class="chip ${record.level || 'info'}">${record.level || 'info'}</span>
        ${record.pinned ? html`<span class="chip status">Pinned</span>` : html``}
      </div>
    `;
  }

  private renderList() {
    return html`
      <section class="list-card stack">
        <div class="inline" style="justify-content: space-between;">
          <div>
            <h3>${sectionLabel(this.activeSection)}</h3>
            <p class="meta">Select a record to open it in the editor.</p>
          </div>
          <md-outlined-button @click=${() => this.createDraft()}>New</md-outlined-button>
        </div>
        <div class="list">
          ${this.filteredAnnouncements.length === 0 ? html`<div class="helper">No announcement records match this section yet.</div>` : this.filteredAnnouncements.map((record) => html`
            <button class="list-item ${this.selectedId === record.id ? 'active' : ''}" type="button" @click=${() => this.selectAnnouncement(record)}>
              <strong>${record.title}</strong>
              ${this.renderBadges(record)}
              ${(record.supportPlatforms || []).length > 0 ? html`<div class="platform-row">${(record.supportPlatforms || []).map((platform) => html`<span class="chip platform">${platformDisplayNames[platform]}</span>`)}</div>` : html``}
            </button>
          `)}
        </div>
      </section>
    `;
  }

  private renderPreview() {
    if (this.previewCards.length === 0) {
      return html`<div class="helper">No platform cards yet. Resolve links or save the announcement to generate them.</div>`;
    }
    return html`
      <div class="preview-grid">
        ${this.previewCards.map((card) => html`
          <article class="preview-card stack">
            <strong>${card.title}</strong>
            <span class="meta">${platformDisplayNames[card.platform]} / ${card.entityType}</span>
            <span class="meta">${card.subtitle}</span>
            <div class="preview-actions">
              ${card.actions.map((action) => html`<a href=${action.url} target="_blank" rel="noopener noreferrer">${action.label}</a>`)}
            </div>
          </article>
        `)}
      </div>
    `;
  }

  private renderEditor() {
    const selected = this.announcements.find((entry) => entry.id === this.selectedId);
    const canEdit = this.session.user?.role === 'owner' || (this.session.user?.role === 'editor' && (!selected || selected.authorId === this.session.user?.id));
    const canReview = this.session.user?.role === 'owner' || this.session.user?.role === 'reviewer';
    return html`
      <section class="editor-card stack">
        <div class="inline" style="justify-content: space-between;">
          <div class="stack">
            <span class="eyebrow">Editor</span>
            <h2>${this.editor.id ? this.editor.title || this.editor.id : 'Create New Draft'}</h2>
            <p>The public frontend reads <code>platformCards[]</code> and <code>supportPlatforms[]</code> first, while older announcements still fall back to plain <code>links</code>.</p>
          </div>
          <div class="inline">
            <md-outlined-button ?disabled=${this.busyAction !== ''} @click=${() => this.resolvePreview()}>
              ${this.busyAction === 'resolve' ? 'Resolving...' : 'Resolve Links'}
            </md-outlined-button>
            <md-filled-button ?disabled=${!canEdit || this.busyAction !== ''} @click=${() => this.saveAnnouncement()}>
              ${this.busyAction === 'save' ? 'Saving...' : 'Save'}
            </md-filled-button>
          </div>
        </div>

        <div class="editor-grid">
          <div class="field full"><label>Title</label><input .value=${this.editor.title} @input=${(event: Event) => this.updateEditor('title', (event.currentTarget as HTMLInputElement).value)} /></div>
          <div class="field"><label>Level</label><select .value=${this.editor.level} @change=${(event: Event) => this.updateEditor('level', (event.currentTarget as HTMLSelectElement).value as EditorState['level'])}><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="danger">Danger</option></select></div>
          <div class="field"><label>Primary CTA Label</label><input .value=${this.editor.linkText} @input=${(event: Event) => this.updateEditor('linkText', (event.currentTarget as HTMLInputElement).value)} /></div>
          <div class="field full"><label>Primary Link</label><input .value=${this.editor.link} @input=${(event: Event) => this.updateEditor('link', (event.currentTarget as HTMLInputElement).value)} /></div>
          <div class="field full"><label>Body</label><textarea .value=${this.editor.content} @input=${(event: Event) => this.updateEditor('content', (event.currentTarget as HTMLTextAreaElement).value)}></textarea></div>
          <div class="field full"><label>Platform Links</label><textarea .value=${this.editor.linksText} @input=${(event: Event) => this.updateEditor('linksText', (event.currentTarget as HTMLTextAreaElement).value)}></textarea></div>
          <div class="field"><label>Published At</label><input type="datetime-local" .value=${this.editor.publishedAt} @input=${(event: Event) => this.updateEditor('publishedAt', (event.currentTarget as HTMLInputElement).value)} /></div>
          <div class="field"><label>Scheduled At</label><input type="datetime-local" .value=${this.editor.scheduledAt} @input=${(event: Event) => this.updateEditor('scheduledAt', (event.currentTarget as HTMLInputElement).value)} /></div>
          <div class="field"><label>Expires At</label><input type="datetime-local" .value=${this.editor.expiresAt} @input=${(event: Event) => this.updateEditor('expiresAt', (event.currentTarget as HTMLInputElement).value)} /></div>
          <div class="field"><label>Status</label><input .value=${this.editor.status} disabled /></div>
          <div class="field full"><label class="toggle"><input type="checkbox" .checked=${this.editor.pinned} @change=${(event: Event) => this.updateEditor('pinned', (event.currentTarget as HTMLInputElement).checked)} /><span>Pinned announcement</span></label></div>
          <div class="field full"><label>Internal Notes</label><textarea .value=${this.editor.internalNotes} @input=${(event: Event) => this.updateEditor('internalNotes', (event.currentTarget as HTMLTextAreaElement).value)}></textarea></div>
        </div>

        <div class="inline">
          <md-outlined-button ?disabled=${!this.editor.id || !canEdit || this.busyAction !== ''} @click=${() => this.runWorkflow('submit-review')}>
            ${this.busyAction === 'submit-review' ? 'Submitting...' : 'Submit Review'}
          </md-outlined-button>
          <md-outlined-button ?disabled=${!this.editor.id || !canReview || this.busyAction !== ''} @click=${() => this.runWorkflow('publish')}>
            ${this.busyAction === 'publish' ? 'Publishing...' : 'Publish'}
          </md-outlined-button>
          <md-outlined-button ?disabled=${!this.editor.id || !canReview || this.busyAction !== ''} @click=${() => this.runWorkflow('archive')}>
            ${this.busyAction === 'archive' ? 'Archiving...' : 'Archive'}
          </md-outlined-button>
          <md-text-button ?disabled=${!this.editor.id || !canReview || this.busyAction !== ''} @click=${() => this.runWorkflow('restore')}>
            ${this.busyAction === 'restore' ? 'Restoring...' : 'Restore'}
          </md-text-button>
        </div>

        ${this.previewPlatforms.length > 0 ? html`<div class="platform-row">${this.previewPlatforms.map((platform) => html`<span class="chip platform">${platformDisplayNames[platform]}</span>`)}</div>` : html``}
        ${this.renderPreview()}
      </section>
    `;
  }

  private renderUsers() {
    if (this.session.user?.role !== 'owner') {
      return html`<div class="editor-card"><p class="helper">Only the owner role can manage users.</p></div>`;
    }
    return html`
      <section class="editor-card stack">
        <div class="inline" style="justify-content: space-between;">
          <div><span class="eyebrow">Users</span><h2>Users And Roles</h2></div>
          <md-filled-button ?disabled=${this.busyAction !== ''} @click=${() => this.saveUser()}>
            ${this.busyAction === 'user' ? 'Saving User...' : 'Save User'}
          </md-filled-button>
        </div>
        <div class="user-grid">
          ${this.users.map((user) => html`
            <article class="user-card stack">
              <strong>${user.displayName}</strong>
              <span class="meta">${user.username} / ${user.role}</span>
              <md-outlined-button @click=${() => { this.userEditor = { id: user.id, username: user.username, displayName: user.displayName, role: user.role, password: '' }; }}>Edit</md-outlined-button>
            </article>
          `)}
        </div>
        <div class="editor-grid">
          <div class="field"><label>ID</label><input .value=${this.userEditor.id} @input=${(event: Event) => { this.userEditor = { ...this.userEditor, id: (event.currentTarget as HTMLInputElement).value }; }} /></div>
          <div class="field"><label>Username</label><input .value=${this.userEditor.username} @input=${(event: Event) => { this.userEditor = { ...this.userEditor, username: (event.currentTarget as HTMLInputElement).value }; }} /></div>
          <div class="field"><label>Display Name</label><input .value=${this.userEditor.displayName} @input=${(event: Event) => { this.userEditor = { ...this.userEditor, displayName: (event.currentTarget as HTMLInputElement).value }; }} /></div>
          <div class="field"><label>Role</label><select .value=${this.userEditor.role} @change=${(event: Event) => { this.userEditor = { ...this.userEditor, role: (event.currentTarget as HTMLSelectElement).value as AdminRole }; }}><option value="owner">owner</option><option value="editor">editor</option><option value="reviewer">reviewer</option></select></div>
          <div class="field full"><label>Password</label><input type="password" .value=${this.userEditor.password} @input=${(event: Event) => { this.userEditor = { ...this.userEditor, password: (event.currentTarget as HTMLInputElement).value }; }} /></div>
        </div>
      </section>
    `;
  }

  private renderSettings() {
    return html`
      <section class="editor-card stack">
        <div class="inline" style="justify-content: space-between;">
          <div><span class="eyebrow">Settings</span><h2>System Settings</h2></div>
          <md-filled-button ?disabled=${this.session.user?.role !== 'owner' || this.busyAction !== ''} @click=${() => this.saveSettings()}>
            ${this.busyAction === 'settings' ? 'Saving Settings...' : 'Save Settings'}
          </md-filled-button>
        </div>
        <div class="editor-grid">
          <div class="field"><label>Public Title</label><input .value=${this.settingsData.siteTitle} @input=${(event: Event) => { this.settingsData = { ...this.settingsData, siteTitle: (event.currentTarget as HTMLInputElement).value }; }} /></div>
          <div class="field"><label>Public Subtitle</label><input .value=${this.settingsData.subtitle} @input=${(event: Event) => { this.settingsData = { ...this.settingsData, subtitle: (event.currentTarget as HTMLInputElement).value }; }} /></div>
        </div>
        <div class="platform-row">
          ${allPlatforms.map((platform) => html`
            <label class="toggle">
              <input type="checkbox" .checked=${this.settingsData.platformSupport.includes(platform)} @change=${(event: Event) => {
                const checked = (event.currentTarget as HTMLInputElement).checked;
                const next = new Set(this.settingsData.platformSupport);
                if (checked) next.add(platform); else next.delete(platform);
                this.settingsData = { ...this.settingsData, platformSupport: [...next] as SupportedPlatform[] };
              }} />
              <span>${platformDisplayNames[platform]}</span>
            </label>
          `)}
        </div>
      </section>
    `;
  }

  private renderDashboard() {
    return html`
      <div class="shell">
        ${this.renderSidebar()}
        <main class="main">
          <section class="card hero stack">
            <span class="eyebrow">CRD Announcement System</span>
            <h2>Platform-Aware Announcement Workspace</h2>
            <p>This admin covers public aggregation, role-based login, draft editing, workflow transitions, platform-card caching, and user or settings management.</p>
            ${this.notice ? html`<div class="notice-bar"><div class="notice ${this.noticeTone}">${this.notice}</div></div>` : html``}
            <div class="stats">
              <article class="card panel"><strong>Drafts</strong><div class="helper">${this.counts.draft}</div></article>
              <article class="card panel"><strong>In Review</strong><div class="helper">${this.counts.in_review}</div></article>
              <article class="card panel"><strong>Published</strong><div class="helper">${this.counts.published}</div></article>
              <article class="card panel"><strong>Archived</strong><div class="helper">${this.counts.archived}</div></article>
            </div>
            <div class="inline links">
              <a href="https://service.forsaken-zh.wiki/api/announcements" target="_blank" rel="noopener noreferrer">Public API</a>
              <a href="/" target="_blank" rel="noopener noreferrer">Back To Site</a>
            </div>
          </section>

          ${this.activeSection === 'users'
            ? this.renderUsers()
            : this.activeSection === 'settings'
              ? this.renderSettings()
              : html`<section class="layout">${this.renderList()}${this.renderEditor()}</section>`}
        </main>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="login"><section class="card login-card"><h1>CRD Admin</h1><p>Loading admin workspace...</p></section></div>`;
    }
    if (!this.session.authenticated) {
      return this.renderLogin();
    }
    return this.renderDashboard();
  }
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_ANNOUNCEMENTS_ADMIN_API_URL?: string;
  }

  interface HTMLElementTagNameMap {
    'crd-admin-app': CrdAdminApp;
  }
}
