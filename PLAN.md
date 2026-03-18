# CRD 公告系统扩展计划

## 摘要
- 目标是把现有“静态读取 + 前端轻预览”的公告模块，升级成“平台感知的公告内容系统 + 多角色后台 + 可持续扩展的平台适配层”。
- 主站继续保持静态站；后台管理与公告 API 统一部署在 `service.forsaken-zh.wiki`，分别使用 `/admin` 和 `/api/admin/*`，公开读接口继续使用 `/api/announcements`。
- 第一阶段平台范围固定为：`GitHub / Bilibili / YouTube / Roblox Game / Roblox Group / Roblox Profile / Roblox DevForum`。
- 后台流程采用多角色协作审核，固定角色为 `owner / editor / reviewer`，主流程为 `draft -> in_review -> published -> archived`。

## 接口与数据
- 公开公告结构保持兼容：现有 `id/title/content/publishedAt/link/linkText/links/pinned/level` 不删除，新增 `expiresAt`、`supportPlatforms[]`、`platformCards[]`。
- `platformCards[]` 固定包含 `id/url/platform/entityType/title/subtitle/thumbnail/badge/actions[]`；前台优先显示它，缺失时再回退到现有 `links` 本地解析。
- 后台公告记录额外保存 `status/authorId/reviewerId/publishedBy/scheduledAt/expiresAt/version/internalNotes/auditTrail`。
- 鉴权固定为 `users.json` 中的多账号 + 角色配置，登录后发放 `HTTP-only + SameSite=Strict` 会话 Cookie；所有后台写接口要求携带 CSRF token。
- JSON 存储拆为 `announcements/*.json`、`published.json`、`users.json`、`audit-log.ndjson`、`platform-cache.json`；发布和下线时生成公开只读聚合文件。
- 后台 API 固定为：
  - `POST /api/admin/auth/login`、`POST /api/admin/auth/logout`、`GET /api/admin/session`
  - `GET/POST/PATCH /api/admin/announcements`、`GET /api/admin/announcements/:id`
  - `POST /api/admin/announcements/:id/submit-review`、`/publish`、`/archive`、`/restore`
  - `POST /api/admin/platform-resolve`
  - `GET/PATCH /api/admin/users` 仅 `owner` 可用

## 关键实现
- 建立平台注册表，每个平台实现 `match(url) / parse(url) / resolveMeta() / buildCard()` 四段逻辑；后续新增平台只接注册表，不改公告主流程。
- GitHub 支持 `repo / issue / pull / release / user`，小功能为 avatar、类型徽标、快捷动作（仓库 / Issues / Releases）。
- Bilibili 支持 `video / space / article`，小功能为 BV/UID 标签、封面或头像、快捷打开对应页面。
- YouTube 支持 `video / channel / playlist`，小功能为缩略图、频道标识、快捷打开视频或频道。
- Roblox Game 支持 `place / universe`，小功能为 experience id 提取、游戏图标、快速打开游戏页。
- Roblox Group 支持群组链接，小功能为 group id、群组图标、快速打开群组页。
- Roblox Profile 支持用户资料链接，小功能为 user id、头像、快速打开个人页。
- Roblox DevForum 支持 topic/category 链接，小功能为 topic id、作者/分类摘要、快速打开讨论页。
- 平台元数据统一由后台抓取并写入 `platform-cache.json`；抓取失败时仍生成最小卡片，不阻塞发布。
- 后台管理系统固定包含：登录页、公告列表、公告编辑器、审核队列、已发布/归档页、用户与角色页、系统设置页。
- 编辑器字段固定为：`标题、正文、级别、置顶、主按钮、平台链接列表、发布时间、过期时间、内部备注`；正文继续用纯文本 + 换行，不引入富文本编辑器。
- `owner` 管理用户、系统设置和所有公告；`editor` 负责草稿与提交审核；`reviewer` 负责审核、发布、归档、驳回。
- 前台公告组件改为优先消费后台产出的 `platformCards[]`，并展示 `supportPlatforms[]` 标签；旧公告仍可只靠 `links` 工作。

## 测试与验收
- 链接解析测试覆盖 GitHub、Bilibili、YouTube、Roblox Game、Group、Profile、DevForum 的合法 URL、非法 URL、短链接和缺失 ID 场景。
- 权限测试覆盖 `owner/editor/reviewer` 的允许与禁止操作，尤其是用户管理、发布、归档、恢复。
- 工作流测试覆盖 `draft -> in_review -> published -> archived -> restore`，以及定时发布、过期下线。
- 公开接口测试验证只返回 `published` 且未过期的公告，并正确输出 `platformCards[]`。
- 前台渲染测试验证：有 `platformCards[]` 时直接展示；没有时回退 `links`；平台解析失败时显示最小卡片而不是空白。
- 部署验收标准为：`service.forsaken-zh.wiki/admin` 可登录，`/api/admin/*` 受鉴权保护，`/api/announcements` 对现有前台保持兼容。

## 假设与默认
- 主站继续保持纯静态，不把后台并入主站构建。
- 后台与 API 统一挂在现有服务域名，不新增后台子域名。
- 第一阶段坚持 JSON 文件存储，不引入 SQLite 或独立数据库；如果公告量和协作量继续上升，再单独做迁移计划。
- 第一阶段不做评论流、复杂审批链、附件上传或可视化富文本，平台卡片与协作发布是核心范围。
- 第一阶段平台支持范围固定为 `GitHub / Bilibili / YouTube / Roblox Game / Roblox Group / Roblox Profile / Roblox DevForum`，其余平台通过注册表继续扩展。
