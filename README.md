# CRD

CRD (`China Roblox Download`) 是一个面向中国大陆用户的 Roblox 客户端下载分流站点前端。

项目基于 `Lit + TypeScript + Vite` 构建，提供：

- Windows / macOS 官方客户端下载入口
- Android 安装包下载入口
- 第三方启动器下载入口
- `gh-proxy` 下载线路自动测速与手动切换
- RDD 免安装包生成对话框
- 动态主题色与免责声明弹窗

仓库地址：

- [https://github.com/Yar1991-Translation/CRD](https://github.com/Yar1991-Translation/CRD)

## 开发

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

本地预览生产构建：

```bash
npm run preview
```

## 项目结构

```text
src/
  crd-app.ts                 应用入口
  components/
    crd-navbar.ts            顶部导航
    crd-hero.ts              下载区主界面与下载逻辑
    crd-rdd-dialog.ts        RDD 免安装包对话框
    crd-disclaimer.ts        免责声明弹窗
    crd-footer.ts            页脚
  utils/
    rdd-core.ts              RDD 相关核心逻辑
  theme-utils.ts             动态配色
```

## 说明

- `gh-proxy` 线路选择目前用于 Android 安装包和第三方启动器下载。
- 官方客户端版本信息通过 `roproxy` 接口获取，再拼接 Roblox 官方安装地址。
- 构建产物默认输出到 `dist/`。

## License

项目许可证见 [LICENSE](./LICENSE)。
