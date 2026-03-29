# CRD 更新日志语法手册

> 用于编写 `src/logs/YYYY-MM-DD.md`。  
> 这份手册同时约定了 front matter、标准 Markdown 和 CRD 更新日志专属标签的推荐写法。

<crd-log-doc-grid columns="2">
  <crd-log-doc-card tone="primary">
    <crd-log-doc-title>从哪里开始</crd-log-doc-title>
    <crd-log-doc-copy>
      新增一篇日志时，先在 <code>src/logs/</code> 里创建一个按日期命名的文件，再补 front matter 和正文内容。
      页面会自动按日期倒序显示，不需要再手动登记。
    </crd-log-doc-copy>
    <crd-log-doc-code>src/logs/2026-03-18.md</crd-log-doc-code>
  </crd-log-doc-card>

  <crd-log-doc-card tone="neutral">
    <crd-log-doc-title>推荐组织方式</crd-log-doc-title>
    <crd-log-doc-copy>
      一篇正式日志建议分成四层：front matter、顶部概览、重点卡片区、按 Added / Changed / Fixed 拆分的正文章节。
      这样最适合后续维护，也最适合更新历史页面展示。
    </crd-log-doc-copy>
    <crd-log-doc-code>front matter → hero → highlights → sections</crd-log-doc-code>
  </crd-log-doc-card>

  <crd-log-doc-card tone="success">
    <crd-log-doc-title>什么时候用标准 Markdown</crd-log-doc-title>
    <crd-log-doc-copy>
      章节标题、列表、引用、代码块和链接优先使用 Markdown。
      这些基础结构最稳定，也最适合表达“新增、修复、调整、说明”这一类常规更新内容。
    </crd-log-doc-copy>
  </crd-log-doc-card>

  <crd-log-doc-card tone="warning">
    <crd-log-doc-title>什么时候用 CRD 专属标签</crd-log-doc-title>
    <crd-log-doc-copy>
      当你需要更强的视觉表达时，再用 CRD 专属标签处理顶部头图、重点卡片、提醒区块和截图区。
      它们更适合做“更新封面”和“重点信息卡片”，不建议拿来替代整篇正文。
    </crd-log-doc-copy>
  </crd-log-doc-card>
</crd-log-doc-grid>

## 最小可用模板

<crd-log-doc-card span="2" tone="success">
  <crd-log-doc-title>先从这份模板开始</crd-log-doc-title>
  <crd-log-doc-copy>
    如果你只是想快速新增一篇日志，直接复制下面这份模板再修改内容就够了。
    这里已经包含 front matter、头图区、标签区和三个常用章节。
  </crd-log-doc-copy>
  <crd-log-doc-code>
---
title: 这里写更新标题
summary: 这里写一句到两句摘要
status: 已完成
build: 已通过
version: 2026.03.18
---

&lt;crd-log-hero&gt;
  &lt;crd-log-date&gt;2026-03-18&lt;/crd-log-date&gt;
  &lt;crd-log-title&gt;这里写更新标题&lt;/crd-log-title&gt;
  &lt;crd-log-summary&gt;这里写这次更新的简短概览。&lt;/crd-log-summary&gt;
  &lt;crd-log-meta&gt;
    &lt;span&gt;状态：已完成&lt;/span&gt;
    &lt;span&gt;构建：已通过&lt;/span&gt;
    &lt;span&gt;版本：2026.03.18&lt;/span&gt;
  &lt;/crd-log-meta&gt;
&lt;/crd-log-hero&gt;

&lt;crd-log-tags&gt;
  &lt;crd-log-tag tone="added"&gt;Added&lt;/crd-log-tag&gt;
  &lt;crd-log-tag tone="changed"&gt;Changed&lt;/crd-log-tag&gt;
  &lt;crd-log-tag tone="fixed"&gt;Fixed&lt;/crd-log-tag&gt;
&lt;/crd-log-tags&gt;

## Added

- 写新增内容

## Changed

- 写调整内容

## Fixed

- 写修复内容

&lt;crd-log-callout title="补充说明" tone="primary"&gt;
  &lt;p&gt;这里可以写接口说明、迁移说明或特殊注意事项。&lt;/p&gt;
&lt;/crd-log-callout&gt;
  </crd-log-doc-code>
</crd-log-doc-card>

## Front Matter

<crd-log-doc-grid columns="2">
  <crd-log-doc-card tone="primary">
    <crd-log-doc-title>必填字段</crd-log-doc-title>
    <crd-log-doc-copy>
      <code>title</code> 用于左侧日期卡片和当前日志标题，
      <code>summary</code> 用于日期摘要和页面简介，
      <code>status</code>、<code>build</code>、<code>version</code> 用于补充当前版本状态。
    </crd-log-doc-copy>
  </crd-log-doc-card>

  <crd-log-doc-card tone="neutral">
    <crd-log-doc-title>示例</crd-log-doc-title>
    <crd-log-doc-code>
---
title: 公告系统接入与更新历史页搭建
summary: 完成公告 API 接入、主题切换修复、更新历史框架与日志语法手册。
status: 已完成
build: 已通过
version: 2026.03.17
---
    </crd-log-doc-code>
  </crd-log-doc-card>
</crd-log-doc-grid>

## 标准 Markdown 写法

<crd-log-doc-grid columns="2">
  <crd-log-doc-card tone="neutral">
    <crd-log-doc-title>支持的常用语法</crd-log-doc-title>
    <crd-log-doc-code>
# / ## / ### 标题
- 无序列表
1. 有序列表
> 引用块
---
**粗体**
`行内代码`
[链接](https://example.com)
```text
代码块
```
    </crd-log-doc-code>
  </crd-log-doc-card>

  <crd-log-doc-card tone="neutral">
    <crd-log-doc-title>推荐写法示例</crd-log-doc-title>
    <crd-log-doc-code>
## Added

- 新增顶部公告入口
- 新增深色 / 浅色主题切换

## Fixed

- 修复公告按钮点击无响应的问题
- 修复手动主题切换不生效的问题

> 重要说明、迁移提醒或限制说明，优先写成引用块。
    </crd-log-doc-code>
  </crd-log-doc-card>
</crd-log-doc-grid>

## CRD 专属标签

<crd-log-doc-grid columns="2">
  <crd-log-doc-card tone="primary">
    <crd-log-doc-title>&lt;crd-log-hero&gt;</crd-log-doc-title>
    <crd-log-doc-copy>用于放在日志顶部，作为本次更新的头图区。</crd-log-doc-copy>
    <crd-log-doc-code>
&lt;crd-log-hero&gt;
  &lt;crd-log-date&gt;2026-03-18&lt;/crd-log-date&gt;
  &lt;crd-log-title&gt;更新标题&lt;/crd-log-title&gt;
  &lt;crd-log-summary&gt;这里写一句摘要。&lt;/crd-log-summary&gt;
&lt;/crd-log-hero&gt;
    </crd-log-doc-code>
  </crd-log-doc-card>

  <crd-log-doc-card tone="primary">
    <crd-log-doc-title>&lt;crd-log-tags&gt; / &lt;crd-log-tag&gt;</crd-log-doc-title>
    <crd-log-doc-copy>用于显示日志的分类标签，例如 Added、Changed、Fixed。</crd-log-doc-copy>
    <crd-log-doc-code>
&lt;crd-log-tags&gt;
  &lt;crd-log-tag tone="added"&gt;Added&lt;/crd-log-tag&gt;
  &lt;crd-log-tag tone="changed"&gt;Changed&lt;/crd-log-tag&gt;
  &lt;crd-log-tag tone="fixed"&gt;Fixed&lt;/crd-log-tag&gt;
&lt;/crd-log-tags&gt;
    </crd-log-doc-code>
  </crd-log-doc-card>

  <crd-log-doc-card tone="primary">
    <crd-log-doc-title>&lt;crd-log-grid&gt; / &lt;crd-log-card&gt;</crd-log-doc-title>
    <crd-log-doc-copy>用于展示“本次更新重点”卡片，适合放四宫格或二栏重点摘要。</crd-log-doc-copy>
    <crd-log-doc-code>
&lt;crd-log-grid columns="4"&gt;
  &lt;crd-log-card title="公告系统"&gt;支持 API 优先读取与完整公告弹窗。&lt;/crd-log-card&gt;
  &lt;crd-log-card title="主题切换"&gt;支持手动切换并同步到根节点。&lt;/crd-log-card&gt;
&lt;/crd-log-grid&gt;
    </crd-log-doc-code>
  </crd-log-doc-card>

  <crd-log-doc-card tone="primary">
    <crd-log-doc-title>&lt;crd-log-callout&gt;</crd-log-doc-title>
    <crd-log-doc-copy>用于放重要说明、接口顺序、兼容性提醒或迁移提示。</crd-log-doc-copy>
    <crd-log-doc-code>
&lt;crd-log-callout title="公告接口读取顺序" tone="primary"&gt;
  &lt;ol&gt;
    &lt;li&gt;&lt;code&gt;VITE_ANNOUNCEMENTS_API_URL&lt;/code&gt;&lt;/li&gt;
    &lt;li&gt;&lt;code&gt;VITE_ANNOUNCEMENTS_URL&lt;/code&gt;&lt;/li&gt;
    &lt;li&gt;&lt;code&gt;/api/announcements&lt;/code&gt;&lt;/li&gt;
  &lt;/ol&gt;
&lt;/crd-log-callout&gt;
    </crd-log-doc-code>
  </crd-log-doc-card>

  <crd-log-doc-card tone="primary" span="2">
    <crd-log-doc-title>&lt;crd-log-gallery&gt; / &lt;crd-log-shot&gt; / SVG</crd-log-doc-title>
    <crd-log-doc-copy>
      如果项目里已经有正式的品牌资源，优先直接拿真实 SVG 资源做示例展示。像 CRD 现在就是直接复用 <code>/assets/brand/CRD.svg</code>，
      再配合浅色 / 深色两套容器去展示最终效果。
    </crd-log-doc-copy>
    <crd-log-doc-code>
&lt;crd-log-gallery&gt;
  &lt;crd-log-shot caption="浅色主题下的 CRD.svg 品牌展示"&gt;
    &lt;div class="crd-logo-demo crd-logo-demo--light"&gt;
      &lt;div class="crd-logo-demo__surface"&gt;
        &lt;span class="crd-logo-demo__mark" aria-hidden="true"&gt;&lt;/span&gt;
      &lt;/div&gt;
      &lt;div class="crd-logo-demo__meta"&gt;Light Theme · #14709E&lt;/div&gt;
    &lt;/div&gt;
  &lt;/crd-log-shot&gt;

  &lt;crd-log-shot caption="深色主题下的 CRD.svg 品牌展示"&gt;
    &lt;div class="crd-logo-demo crd-logo-demo--dark"&gt;
      &lt;div class="crd-logo-demo__surface"&gt;
        &lt;span class="crd-logo-demo__mark" aria-hidden="true"&gt;&lt;/span&gt;
        &lt;span class="crd-logo-demo__line" aria-hidden="true"&gt;&lt;/span&gt;
      &lt;/div&gt;
      &lt;div class="crd-logo-demo__meta"&gt;Dark Theme · #91CDFF&lt;/div&gt;
    &lt;/div&gt;
  &lt;/crd-log-shot&gt;
&lt;/crd-log-gallery&gt;
    </crd-log-doc-code>
  </crd-log-doc-card>
</crd-log-doc-grid>

<crd-log-callout title="推荐组合方式" tone="primary">
  <p>
    一篇日志优先使用标准 Markdown 组织章节，再用 CRD 专属标签处理“头图区”“重点卡片”“补充提示”和“截图区”。
    这样既方便维护，也能保持页面视觉统一。
  </p>
</crd-log-callout>

## 编写建议

<crd-log-doc-grid columns="2">
  <crd-log-doc-card tone="success">
    <crd-log-doc-title>推荐这样写</crd-log-doc-title>
    <crd-log-doc-copy>
      一篇日期文件只记录一轮发布。摘要尽量控制在一到两句，正文多用“新增 / 修复 / 调整 / 替换”开头，
      让读者能快速扫到重点。
    </crd-log-doc-copy>
  </crd-log-doc-card>

  <crd-log-doc-card tone="warning">
    <crd-log-doc-title>尽量避免</crd-log-doc-title>
    <crd-log-doc-copy>
      不要把整篇日志写成一个超长段落，也不要在自定义标签内部继续嵌套过于复杂的 Markdown 结构。
      这样会让后续维护、排版和渲染都变得不稳定。
    </crd-log-doc-copy>
  </crd-log-doc-card>
</crd-log-doc-grid>
