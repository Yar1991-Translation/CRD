import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { RDDCore } from '../utils/rdd-core.js';

import '@material/web/dialog/dialog.js';
import '@material/web/button/text-button.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/icon/icon.js';
import '@material/web/progress/circular-progress.js';

@customElement('crd-rdd-dialog')
export class CrdRddDialog extends LitElement {
  @state()
  private isOpen = false;

  @state()
  private binaryType = 'WindowsPlayer';

  @state()
  private versionHash = '';

  @state()
  private isRunning = false;

  @state()
  private logs: string[] = [];

  @state()
  private isFetchingVersion = false;

  private rddCore: RDDCore | null = null;

  @query('.console-output')
  private consoleOutput!: HTMLDivElement;

  static styles = css`
    :host {
      display: block;
    }

    md-dialog {
      --md-dialog-container-color: var(--md-sys-color-surface-container-high, var(--md-sys-color-surface));
      --md-dialog-headline-color: var(--md-sys-color-on-surface);
      --md-dialog-supporting-text-color: var(--md-sys-color-on-surface-variant);
      width: min(680px, 94vw);
      max-width: 94vw;
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 8px;
    }

    .dialog-hero {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 18px 20px;
      border-radius: 24px;
      background:
        radial-gradient(circle at top right, color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent), transparent 42%),
        var(--md-sys-color-surface-container-high);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
    }

    .dialog-hero md-icon {
      flex: none;
      margin-top: 2px;
      font-size: 26px;
      color: var(--md-sys-color-primary);
    }

    .hero-copy {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    .hero-title {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .hero-title strong {
      color: var(--md-sys-color-on-surface);
      font-size: 1rem;
    }

    .hero-flag {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 12px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--md-sys-color-error-container) 72%, transparent);
      color: var(--md-sys-color-on-error-container);
      font-family: var(--crd-font-small);
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .hero-copy span {
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.6;
      font-size: 0.9rem;
    }

    .input-card,
    .console-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 18px;
      border-radius: 20px;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 76%, transparent);
    }

    .section-title {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .section-title strong {
      color: var(--md-sys-color-on-surface);
      font-size: 0.96rem;
    }

    .section-title span {
      color: var(--md-sys-color-on-surface-variant);
      font-family: var(--crd-font-small);
      font-size: 0.78rem;
      font-weight: 700;
      line-height: 1.55;
    }

    .info-box {
      padding: 14px 16px;
      border-radius: 18px;
      background: color-mix(in srgb, var(--md-sys-color-secondary-container) 48%, transparent);
      color: var(--md-sys-color-on-secondary-container);
      font-size: 0.88rem;
      line-height: 1.6;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .info-box md-icon {
      color: var(--md-sys-color-secondary);
      font-size: 20px;
      flex: none;
      margin-top: 2px;
    }

    .info-copy {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    .info-note {
      color: var(--md-sys-color-error);
      font-family: var(--crd-font-small);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .info-box a {
      color: var(--md-sys-color-primary);
      text-decoration: none;
      font-weight: 700;
    }

    .info-box a:hover {
      text-decoration: underline;
    }

    code {
      font-family: "Cascadia Code", "Consolas", monospace;
      font-size: 0.82rem;
      padding: 1px 6px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 86%, transparent);
      color: var(--md-sys-color-on-surface);
    }

    .field-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    md-outlined-text-field {
      width: 100%;
      --md-outlined-text-field-container-shape: 18px;
    }

    .console-output {
      max-height: 240px;
      min-height: 180px;
      overflow-y: auto;
      padding: 14px;
      border-radius: 18px;
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--md-sys-color-surface-container-highest) 84%, transparent),
          var(--md-sys-color-surface-container-high)
        );
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 72%, transparent);
      white-space: pre-wrap;
      word-break: break-word;
      font-family: "Cascadia Code", "Consolas", monospace;
      font-size: 0.82rem;
      line-height: 1.6;
      color: var(--md-sys-color-on-surface);
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--md-sys-color-on-surface) 24%, transparent) transparent;
    }

    .log-line {
      display: block;
      color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 90%, transparent);
    }

    .log-line + .log-line {
      margin-top: 4px;
    }

    .log-line.info {
      color: var(--md-sys-color-primary);
    }

    .log-line.error {
      color: var(--md-sys-color-error);
    }

    .log-line.success {
      color: #177245;
    }

    .action-status {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--md-sys-color-primary);
      font-family: var(--crd-font-small);
      font-size: 0.84rem;
      font-weight: 700;
    }

    md-circular-progress {
      --md-circular-progress-size: 22px;
    }

    .actions-spacer {
      flex: 1;
    }

    @media (max-width: 640px) {
      .dialog-hero,
      .input-card,
      .console-card {
        padding: 14px 16px;
      }

      .dialog-hero {
        border-radius: 22px;
      }

      .console-output {
        min-height: 160px;
      }
    }
  `;

  public async open(binaryType: string = 'WindowsPlayer') {
    this.binaryType = binaryType;
    this.isOpen = true;
    this.isRunning = false;
    this.logs = [];
    this.versionHash = '';

    await this.fetchLatestVersion(binaryType);
  }

  protected updated(changedProperties: Map<PropertyKey, unknown>) {
    if (changedProperties.has('logs') && this.consoleOutput) {
      this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    }
  }

  private async fetchLatestVersion(binaryType: string) {
    this.isFetchingVersion = true;
    this.log('[*] 正在自动获取最新版本信息...');

    try {
      const proxyUrl = `https://clientsettings.roproxy.com/v2/client-version/${binaryType}/channel/LIVE`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`无法获取版本信息: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.clientVersionUpload) {
        this.versionHash = data.clientVersionUpload;
        this.log(`[+] 成功获取最新版本: ${this.versionHash}`);
      } else {
        throw new Error('API 返回的数据格式异常');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`[!] 自动获取失败，请手动填写 Version Hash。(${message})`);
    } finally {
      this.isFetchingVersion = false;
    }
  }

  private close() {
    if (this.isRunning && this.rddCore) {
      this.rddCore.cancel();
    }

    this.isOpen = false;
  }

  private log(message: string) {
    this.logs = [...this.logs, message];
  }

  private getLogTone(message: string) {
    if (message.includes('[!]')) {
      return 'error';
    }

    if (message.includes('[+]') || message.toLowerCase().includes('done!')) {
      return 'success';
    }

    if (message.includes('[*]')) {
      return 'info';
    }

    return '';
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.versionHash = input.value.trim();
  }

  private async startDownload() {
    if (!this.versionHash) {
      this.log('[!] 请先输入 Version Hash。');
      return;
    }

    this.isRunning = true;
    this.logs = [];
    this.log(`[*] 开始初始化下载任务: ${this.binaryType}`);

    this.rddCore = new RDDCore((message) => this.log(message));

    try {
      await this.rddCore.run(this.binaryType, this.versionHash, 'LIVE');
      if (!this.logs[this.logs.length - 1]?.toLowerCase().includes('done!')) {
        this.log('[*] 任务结束或被取消。');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`[!] 运行时发生错误: ${message}`);
    } finally {
      this.isRunning = false;
    }
  }

  render() {
    const clientsettingsUrl = `https://clientsettings.roblox.com/v2/client-version/${this.binaryType}/channel/LIVE`;

    return html`
      <md-dialog ?open=${this.isOpen} @close=${() => { this.isOpen = false; }}>
        <div slot="headline">下载免安装本体 (${this.binaryType})</div>

        <div slot="content" class="dialog-content">
          <section class="dialog-hero">
            <md-icon>inventory_2</md-icon>
            <div class="hero-copy">
              <div class="hero-title">
                <strong>RDD 直连提取</strong>
                <span class="hero-flag">无加速下载可能较慢</span>
              </div>
              <span>
                这个模式会直接连接 Roblox 相关服务拉取文件，并打包为免安装本体，适合需要手动部署或保留原始文件的场景。
              </span>
            </div>
          </section>

          <section class="input-card">
            <div class="section-title">
              <strong>Version Hash</strong>
              <span>我们会先尝试自动获取；如果失败，你也可以手动粘贴。</span>
            </div>

            <div class="info-box">
              <md-icon>info</md-icon>
              <div class="info-copy">
                <div>自动获取失败时，可以打开 <a href=${clientsettingsUrl} target="_blank" rel="noopener noreferrer">ClientSettings API</a>，复制类似 <code>version-xxxxxxxxxxxxxxxx</code> 的值填入下方。</div>
                <div class="info-note">注意：此模式为直连官方服务提取文件，国内网络无加速时下载可能较慢。</div>
              </div>
            </div>

            <div class="field-row">
              <md-outlined-text-field
                label="Version Hash（例如 version-123456...）"
                .value=${this.versionHash}
                @input=${this.handleInput}
                ?disabled=${this.isRunning || this.isFetchingVersion}
              >
              </md-outlined-text-field>
            </div>
          </section>

          ${(this.isRunning || this.logs.length > 0) ? html`
            <section class="console-card">
              <div class="section-title">
                <strong>任务输出</strong>
                <span>这里会显示自动获取、抓取、打包和错误信息。</span>
              </div>

              <div class="console-output">
                ${this.logs.map((message) => html`
                  <span class="log-line ${this.getLogTone(message)}">${message}</span>
                `)}
              </div>
            </section>
          ` : ''}
        </div>

        <div slot="actions">
          ${this.isRunning ? html`
            <div class="action-status">
              <md-circular-progress indeterminate></md-circular-progress>
              <span>正在处理任务…</span>
            </div>
            <span class="actions-spacer"></span>
            <md-text-button @click=${this.close}>取消任务</md-text-button>
          ` : html`
            <md-text-button @click=${this.close}>关闭</md-text-button>
            <md-filled-button @click=${this.startDownload} ?disabled=${!this.versionHash || this.isFetchingVersion}>
              开始抓取并打包
            </md-filled-button>
          `}
        </div>
      </md-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crd-rdd-dialog': CrdRddDialog;
  }
}
