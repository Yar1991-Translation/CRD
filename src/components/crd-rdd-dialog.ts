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
      width: 100%;
      max-width: 500px;
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 8px;
    }

    .info-box {
      padding: 12px 16px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--md-sys-color-secondary-container) 40%, transparent);
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.875rem;
      line-height: 1.5;
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
    
    .info-box a {
      color: var(--md-sys-color-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .info-box a:hover {
      text-decoration: underline;
    }

    .console-output {
      height: 200px;
      background: #1e1e1e;
      color: #00ff00;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.8rem;
      padding: 12px;
      border-radius: 8px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      margin-top: 8px;
      border: 1px solid var(--md-sys-color-outline-variant);
    }
    
    .console-output .error {
      color: #ff5555;
    }
    
    .console-output .info {
      color: #88ccff;
    }

    .field-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    md-outlined-text-field {
      width: 100%;
    }
    
    .progress-row {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--md-sys-color-primary);
      font-weight: 500;
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

  private async fetchLatestVersion(binaryType: string) {
    this.isFetchingVersion = true;
    this.log(`[*] 正在自动获取最新版本信息...`);
    try {
      // 使用 roproxy 的反向代理来绕过原版 CORS 限制
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
        throw new Error("API 返回的数据格式异常");
      }
    } catch (e: any) {
      this.log(`[!] 自动获取失败，请手动填写 Version Hash。(${e.message})`);
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

  private log(msg: string) {
    let className = "";
    if (msg.includes("[!]")) className = "error";
    else if (msg.includes("[*]")) className = "info";

    const formattedMsg = className ? `<span class="${className}">${msg}</span>` : msg;
    
    this.logs = [...this.logs, formattedMsg];
    
    // Auto scroll to bottom
    setTimeout(() => {
      if (this.consoleOutput) {
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
      }
    }, 50);
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.versionHash = input.value.trim();
  }

  private async startDownload() {
    if (!this.versionHash) {
      this.log("[!] 请先输入 Version Hash。");
      return;
    }

    this.isRunning = true;
    this.logs = [];
    this.log(`[*] 开始初始化下载任务: ${this.binaryType}`);
    
    this.rddCore = new RDDCore((msg) => this.log(msg));
    
    try {
      await this.rddCore.run(this.binaryType, this.versionHash, 'LIVE');
      if (!this.logs[this.logs.length - 1].includes("done!")) {
         this.log("[*] 任务结束或被取消。");
      }
    } catch (e: any) {
      this.log(`[!] 运行时发生错误: ${e.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  render() {
    const clientsettingsUrl = `https://clientsettings.roblox.com/v2/client-version/${this.binaryType}/channel/LIVE`;

    return html`
      <md-dialog ?open=${this.isOpen} @close=${() => { this.isOpen = false; }}>
        <div slot="headline">
          下载免安装本体 (${this.binaryType})
          <div style="font-size: 0.8rem; color: var(--md-sys-color-error); margin-top: 4px;">[直链提取，无加速下载可能较慢]</div>
        </div>
        <div slot="content" class="dialog-content">
          
          <div class="info-box">
            <md-icon>info</md-icon>
            <div>
              已尝试为您自动获取最新的 <b>Version Hash</b>。<br>
              <span style="color: var(--md-sys-color-error); font-weight: 500;">注意：此模式为直连官方服务器提取文件，国内网络无加速可能会下载很慢。</span><br>
              若自动获取失败，请在新标签页打开 <a href="${clientsettingsUrl}" target="_blank">此 API 链接</a>，复制类似 <code>version-xxxxxxxxxxxxxxxx</code> 的字符串并填入下方。
            </div>
          </div>

          <div class="field-row">
            <md-outlined-text-field
              label="Version Hash (例如 version-123456...)"
              .value=${this.versionHash}
              @input=${this.handleInput}
              ?disabled=${this.isRunning || this.isFetchingVersion}
            ></md-outlined-text-field>
          </div>

          ${this.isRunning || this.logs.length > 0 ? html`
            <div class="console-output" .innerHTML=${this.logs.join('<br>')}></div>
          ` : ''}

        </div>
        <div slot="actions">
          ${this.isRunning ? html`
             <div class="progress-row">
               <md-circular-progress indeterminate style="--md-circular-progress-size: 24px;"></md-circular-progress>
               正在处理中...
             </div>
             <div style="flex:1"></div>
             <md-text-button @click=${this.close}>取消任务</md-text-button>
          ` : html`
             <md-text-button @click=${this.close}>关闭</md-text-button>
             <md-filled-button @click=${this.startDownload} ?disabled=${!this.versionHash}>开始抓取并打包</md-filled-button>
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