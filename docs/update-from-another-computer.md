# 如何在另一台电脑更新博客

这份文档记录从一台新电脑继续维护 `珲 Blog` 的完整流程。

## 1. 需要先安装什么

新电脑需要：

- Git
- Node.js，推荐 20.19 或更高版本
- VS Code 或你喜欢的编辑器
- 一个能访问 GitHub 的终端

## 2. 把仓库下载到新电脑

```powershell
git clone https://github.com/Zjuhui/hui-blog.git
cd hui-blog
```

这一步会把 GitHub 上的博客代码下载到本地。

## 3. 安装项目依赖

```powershell
npm install
```

`package.json` 里写了项目需要 Astro。`npm install` 会按照 `package-lock.json` 下载对应依赖。

## 4. 本地预览博客

```powershell
npm run dev
```

Astro 会启动一个本地开发服务器。终端里会显示一个本地地址，通常类似：

```text
http://localhost:4321/hui-blog/
```

如果打开根路径看不到内容，就试试带 `/hui-blog/` 的路径，因为这个站点部署在 GitHub Pages 的项目子路径下。

## 5. 修改内容

常见修改位置：

| 想改什么 | 文件 |
| --- | --- |
| 首页组合结构 | `src/pages/index.astro` |
| 首页大标题和按钮 | `src/components/Hero.astro` |
| 顶部导航 | `src/components/GlassHeader.astro` |
| Research/Life/Works 文案 | `src/components/SectionShowcase.astro` |
| 第一周文章入口 | `src/components/WeekOnePosts.astro` |
| 颜色、圆角、毛玻璃 | `src/styles/global.css` |
| 学习笔记 | `docs/homepage-learning.md` |

## 6. 发布前构建

```powershell
npm run build:pages
```

这个命令做两件事：

1. `astro build`：把 `src/` 里的 Astro 源码生成静态网页到 `dist/`。
2. `node scripts/sync-dist.mjs`：把 `dist/` 复制到仓库根目录，让 GitHub Pages 可以直接发布。

为什么需要第二步？

因为当前 GitHub Pages 是从 `main / root` 发布。它看的不是 `src/`，而是仓库根目录里的静态 HTML。

## 7. 提交并上传

```powershell
git status
git add .
git commit -m "Update blog content"
git push origin main
```

推送后，GitHub Pages 会自动更新。通常几十秒到几分钟后，线上地址会生效：

```text
https://zjuhui.github.io/hui-blog/
```

## 8. 每次开始前先同步

如果你在多台电脑上维护博客，每次开始写之前先运行：

```powershell
git pull
```

这会把 GitHub 上最新版本拉到当前电脑，避免两台电脑改出冲突。

## 9. 推荐工作流

简单版：

```powershell
git pull
npm install
npm run dev
```

改完后：

```powershell
npm run build:pages
git add .
git commit -m "Describe what changed"
git push origin main
```

## 10. 如果 push 失败

如果出现 GitHub 连接超时，可以重试：

```powershell
git push origin main
```

如果你的电脑上 Git for Windows 的 HTTPS 连接有问题，可以试：

```powershell
git -c http.version=HTTP/1.1 -c http.sslBackend=schannel push origin main
```

这次 v0.2 首页迁移时，就是用这个方式成功推送的。

