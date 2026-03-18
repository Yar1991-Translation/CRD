# CRD MD3 TODO

## Audit Result
- `crd-navbar`：主导航已基本对齐 MD3，当前无阻塞问题。
- `crd-hero`：主下载区、Tabs、Segmented Button 已进入 MD3 风格，但代理设置弹窗仍有一部分控件不是完整 MD3 组件。
- `crd-disclaimer`：主结构已统一到 tonal surfaces，当前主要是细节级优化。
- `crd-footer`：已纳入统一的 tonal card 风格。
- `crd-announcements`：仍保留较多自定义玻璃化/装饰性效果，和当前全站 MD3 语言不完全一致。
- `crd-rdd-dialog`：是目前最明显还没完全 MD3 化的界面。

## P0
- [ ] 重做 `src/components/crd-rdd-dialog.ts` 的视觉层级
说明：当前仍有黑底绿字控制台、较小圆角、内联样式和偏工具页的旧视觉，需要改成 MD3 dialog + tonal card + 状态面板。

- [ ] 清理 `src/components/crd-rdd-dialog.ts` 的内联样式
说明：headline 里的红色提示、actions 里的 `flex:1`、进度图标尺寸都应抽回 CSS token，避免和全站主题脱节。

## P1
- [ ] 收敛 `src/components/crd-announcements.ts` 的装饰性效果
说明：现在仍有 blur、较重阴影、旋转/漂浮式入场和硬编码状态色，建议改成更标准的 MD3 tonal surfaces + state layer。

- [ ] 将公告状态色统一到主题 token
说明：`success / warning / danger` 目前仍是手写颜色，应改成可复用的语义 token，避免不同界面颜色语言不一致。

- [ ] 升级 Hero 内的代理设置控件
说明：`src/components/crd-hero.ts` 里的 gh-proxy 选择仍是原生 `select`，后续可替换成更接近 MD3 的菜单/选择器表达。

## P2
- [ ] 统一所有“小字”类目的字重与字族
说明：继续检查 `meta / helper / note / caption` 类文本，保持“正文 MiSans Bold，小字 Google Sans Bold”的规则不被遗漏。

- [ ] 回归检查移动端
说明：重点确认 Hero、公告卡片、免责声明卡片和 RDD Dialog 在窄屏下的圆角、留白和按钮层级是否仍符合 MD3。
## Announcement System Progress
- [x] Refactor `src/components/crd-announcements.ts` to use shared platform cards and tokenized status colors.
- [x] Add a first-phase `/admin` workspace with login, announcement editing, workflow actions, users, and settings.
- [x] Add a JSON-backed announcements service scaffold under `server/announcements-service/`.
- [ ] Deploy `/admin`, `/api/admin/*`, and the upgraded public `/api/announcements` service to `service.forsaken-zh.wiki`.
- [ ] Polish admin localization, mobile layout, and richer platform metadata fetching.
