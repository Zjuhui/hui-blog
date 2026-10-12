# 珲 · Hui Blog

温暖、简单的个人日志。Astro 静态博客，加上只在本机运行的 Blog Studio。

**开始写作：双击 `Open Blog Studio.cmd`。** 首次发布前双击 `GitHub Setup.cmd`，在浏览器里登录 Zjuhui。首次准备需要联网；项目会在 `.tools/` 安装 Node.js 24 和 GitHub CLI，不替换系统 Node.js。

**更换风格：侧栏「外观」**。一键选择温暖手记、简洁留白、林间笔记或夜读时分，再自定义背景、文字与强调色、标题与正文字体、阅读字号、行距、宽度、列表 / 卡片与留白。实际模板即时预览；保存只在本机生效，发布时勾选「网站设置」才会上线。

[图解使用指南](docs/studio-guide.md) · [换电脑与备份](docs/update-from-another-computer.md) · [线上博客](https://zjuhui.github.io/hui-blog/)

## 日常使用

1. 在「文章」里创建或打开文章，用可视化编辑器写作、插图，点击 **Save**。
2. 在「预览」里检查已保存内容，切换桌面或手机宽度。
3. 在「发布」里勾选这次要上线的文章和设置，**检查发布内容 → 发布到博客**。
4. 等待「发布成功」。上传成功与部署成功分开显示。

保存只更新本机草稿。未选草稿与图片不会发布。Notion 保持原样，没有自动同步。编辑器自带菜单为英文，工作台和公开网站可以切换中英文；语言切换不翻译文章正文。

## 文件与实现

| 路径 | 用途 |
| --- | --- |
| `src/content/posts/*.mdoc` | 已发布 Markdoc 文章，文件名就是稳定网址 |
| `src/data/site.json` | 已发布的介绍、关于、配色与链接 |
| `public/media/` | 已发布图片 |
| `.studio/` | 本机草稿、图片、编辑基线和发布状态；不进 Git |
| `.tools/` | 项目专用运行时；不进 Git |
| `src/pages/[...path].astro` | 中文 / 英文共用页面与文章模板 |
| `studio/` | 本机工作台、会话验证、选择性发布服务 |
| `content/*.md` | 保留的历史 Markdown 草稿，与线上原文不同 |

原有 `/hui-blog/posts/why-this-blog/` 与 `/hui-blog/posts/how-to-make-this-blog/` 保持不变。英文界面位于 `/hui-blog/en/`。本机 Studio 位于 `http://127.0.0.1:4321/studio/`；本机预览使用根路径，生产构建使用 `/hui-blog/`。

## 开发与验证

使用 Node.js 24：

```sh
npm ci
npm run check
npm test
npm run build
npm run test:build
npm run studio
```

Studio 开启后，可运行 `node scripts/verify-preview.mjs` 比较原始文章的预览与生产正文。比较前先构建生产版，且不要修改这两篇文章的本机副本。不要在同一目录同时运行构建和 Studio；它们共用 Astro 内容缓存。正常发布使用隔离目录构建。

工作台仅在显式 `BLOG_STUDIO=1` 时注册。生产构建脚本会清除此变量。写入端点受回环地址、Origin 与 HttpOnly 会话令牌保护。发布从 `origin/main` 建立隔离快照，只提交已审核文件，拒绝远程冲突和并发操作；不使用 force push。部署状态按提交 SHA 查询。

## 部署与恢复

`.github/workflows/deploy.yml` 在推送 `main` 后检查、构建并部署 GitHub Pages。Pages 的 Build and deployment / Source 应选择 **GitHub Actions**。2026-10-12 已验证 Actions 部署成功，旧根目录静态输出与同步脚本已移除。迁移前版本 `b99faad` 可从 Git 历史恢复。

本机草稿需要单独备份 `.studio/`。源码不同步、有冲突、构建失败或登录失效时，Studio 会停止并保留草稿。修复后重新审核发布；上传后部署失败可在 Actions 重试对应任务。

`docs/homepage-learning.md`、`docs/v0.2-plan.md` 等是旧版本学习笔记，保留作历史参考。当前使用方式以本 README 和 Studio 指南为准。
