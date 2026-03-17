# CRD 更新日志

## 2026-3-17
<section class="changelog-feed">

<article class="changelog-entry">
  <header class="changelog-entry__hero">
    <p class="changelog-entry__date">2026-03-17</p>
    <h2 class="changelog-entry__title">MD3 视觉重构、公告系统上线与主题切换完善</h2>
    <p class="changelog-entry__summary">
      这一轮更新把 CRD 从一个结构清晰的静态下载页，进一步打磨成更完整的下载站：
      下载设置独立化、公告系统支持 API、全站视觉收束到更原生的 MD3 风格，
      同时补齐了主题切换、字体体系和平台图标。
    </p>
    <div class="changelog-entry__meta">
      <span>状态：已完成</span>
      <span>构建：通过</span>
      <span>类型：功能 + 视觉 + 修复</span>
    </div>
  </header>

  <section class="changelog-highlights">
    <div class="changelog-highlight">
      <strong>公告系统</strong>
      <p>支持 API 优先读取、顶部公告按钮和完整公告弹窗。</p>
    </div>
    <div class="changelog-highlight">
      <strong>下载设置</strong>
      <p>gh-proxy 路线从主下载流程中拆出，改为独立设置入口。</p>
    </div>
    <div class="changelog-highlight">
      <strong>主题切换</strong>
      <p>深色 / 浅色模式支持手动切换，不再依赖浏览器当前主题。</p>
    </div>
    <div class="changelog-highlight">
      <strong>字体与品牌</strong>
      <p>正文改为 MiSans Bold，品牌字样与小字信息使用 Google Sans Bold。</p>
    </div>
  </section>

### Added

<ul class="changelog-list changelog-list--added">
  <li>新增 gh-proxy 多线路下载能力，支持自动选择最优路线或手动固定节点。</li>
  <li>新增独立的下载设置弹窗，并在下载区右上角加入小型设置按钮。</li>
  <li>新增公告系统接口接入能力，支持从服务器 API 读取公告内容。</li>
  <li>新增顶部公告按钮，用户可以主动打开公告弹窗。</li>
  <li>新增深色 / 浅色模式切换按钮，并支持记住用户选择。</li>
  <li>新增项目说明文档 <code>README.md</code>。</li>
  <li>新增 MD3 视觉审计待办文档 <code>TODO.md</code>。</li>
</ul>

### Changed

<ul class="changelog-list changelog-list--changed">
  <li>下载区结构重新整理，下载设置从主流程中解耦，视觉上更干净。</li>
  <li>“获取源码”相关按钮已全部替换为真实仓库地址 <a href="https://github.com/Yar1991-Translation/CRD">Yar1991-Translation/CRD</a>。</li>
  <li>首页 Hero、平台切换、分段按钮、下载卡片和操作按钮统一向 MD3 语言收束。</li>
  <li>RDD 弹窗重做为更一致的 MD3 风格对话框。</li>
  <li>公告提示从普通信息块改成更像站点通知的卡片式提示。</li>
  <li>导航栏、免责声明、公告、页脚的色层、圆角和状态反馈统一到同一套视觉系统。</li>
  <li>正文默认字体改为 <strong>MiSans Bold</strong>，小字号信息改为 <strong>Google Sans Bold</strong>。</li>
  <li><code>CRD.</code> 品牌字样统一改用 <strong>Google Sans Bold</strong>。</li>
</ul>

### Fixed

<ul class="changelog-list changelog-list--fixed">
  <li>修复深色 / 浅色模式按钮点击后不完全生效的问题，主题现在直接作用于根节点。</li>
  <li>修复公告按钮在“加载中 / 无数据 / 接口异常”场景下看起来无反应的问题。</li>
  <li>修复下载设置入口过于显眼的问题，将其收敛为右上角小图标按钮。</li>
  <li>修复公告弹窗在部分状态下不渲染的问题，补齐加载态、空状态和错误态。</li>
</ul>

### Design

<ul class="changelog-list changelog-list--design">
  <li>暗色主题层级从“纯灰 + 阴影”转向更接近 MD3 的 tonal surfaces 表达。</li>
  <li>顶部 Primary Tabs 指示条改为贴底、加厚、圆角化的 MD3 风格。</li>
  <li>Windows 子分类切换改为真正的 Segmented Button 样式并居中显示。</li>
  <li>主下载卡片背景收敛为更柔和的容器色，突出主操作按钮而不是背景块。</li>
  <li>所有可点击图标按钮补齐 state layer 与更合理的触控热区。</li>
  <li>公告卡片动画多次收敛后，保留更自然、更克制的入场方式。</li>
</ul>

### Branding

<ul class="changelog-list changelog-list--branding">
  <li>Windows 图标替换为新的 SVG 版本，并改成 CRD 主题蓝色。</li>
  <li>macOS 的 Apple Logo 替换为新的 SVG 版本，并继续通过 <code>currentColor</code> 跟随选中态。</li>
  <li>全站品牌字样、按钮权重和排版节奏进一步统一。</li>
</ul>

### Docs

<ul class="changelog-list changelog-list--docs">
  <li>补充项目说明文档，方便后续部署、开发和接口接入。</li>
  <li>整理了一份适用于站点更新页的更新日志文案结构。</li>
</ul>

<section class="changelog-callout">
  <h3>公告接口读取顺序</h3>
  <ol>
    <li><code>VITE_ANNOUNCEMENTS_API_URL</code></li>
    <li><code>VITE_ANNOUNCEMENTS_URL</code></li>
    <li><code>/api/announcements</code></li>
  </ol>
  <p>
    这意味着后续只要服务器提供标准 JSON 公告接口，前端就可以直接切换到动态公告源。
  </p>
</section>

<section class="changelog-gallery">
  <h3>建议配图</h3>
  <p>后续做更新日志页面时，可以在这里插入本次更新相关截图：</p>
  <ul class="changelog-list">
    <li>首页 Hero 下载区的 MD3 重构效果</li>
    <li>公告卡片与公告弹窗</li>
    <li>深色 / 浅色模式切换前后对比</li>
    <li>新的 Windows / Apple 平台图标</li>
  </ul>
  <!-- 示例：
  <img src="/assets/changelog/2026-03-17-hero.png" alt="CRD 首页 Hero 更新效果" />
  -->
</section>

<details class="changelog-details">
  <summary>展开查看本次更新完整清单</summary>
  <ul class="changelog-list">
    <li>新增 gh-proxy 多线路下载与独立设置界面</li>
    <li>设置入口改为右上角小图标按钮</li>
    <li>替换获取源码相关 GitHub 占位链接为真实仓库</li>
    <li>补充项目 README</li>
    <li>上线公告系统并支持 API 读取</li>
    <li>新增顶部公告按钮</li>
    <li>公告卡片与公告弹窗重做</li>
    <li>修复公告按钮点击无响应问题</li>
    <li>新增深色 / 浅色模式切换按钮</li>
    <li>修复手动主题切换异常</li>
    <li>全站推进 MD3 风格统一</li>
    <li>接入 MiSans Bold</li>
    <li>接入 Google Sans Bold</li>
    <li>CRD 品牌字样改用 Google Sans Bold</li>
    <li>RDD 弹窗风格重做</li>
    <li>Windows 图标换新并切换为 CRD 主蓝色</li>
    <li>Apple Logo 更新为新 SVG 版本</li>
  </ul>
</details>

</article>

</section>

---

## 维护建议

- 后续建议每次更新都按“日期 / 标题 / 摘要 / Added / Changed / Fixed / Design”这套结构追加。
- 如果未来要做真正的更新日志页面，可以把每个 `<article class="changelog-entry">` 当成一个独立条目渲染。
- 如果后续接入截图，只需要在对应条目里的 `changelog-gallery` 区块补上图片即可。

**备注：本文件适合直接作为网站更新日志页面的 Markdown 数据源。**
