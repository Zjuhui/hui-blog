# 首页学习笔记

这份笔记解释当前首页的运行逻辑。你可以一边打开代码，一边按顺序阅读。

## 1. Astro 是怎么工作的

当前博客不是传统的单页应用。它的工作方式是：

```text
Astro 源码
  -> npm run build
  -> 生成静态 HTML / CSS
  -> GitHub Pages 托管
  -> 浏览器直接显示
```

也就是说，首页的大部分内容不是访问网页时才动态生成，而是在构建时提前生成好。

这样适合博客，因为文章内容通常是稳定的，不需要每次访问都请求数据库。

## 2. 首页入口：src/pages/index.astro

`src/pages/index.astro` 是首页。

它做的事很少：

```astro
<GlassHeader />
<Hero />
<SectionShowcase />
<WeekOnePosts />
```

这表示首页不是把所有 HTML 都写在一个文件里，而是把页面拆成几个组件。

这样写的好处：

- 首页结构一眼能看懂。
- 某个区域不好看时，只改对应组件。
- 后续加页面时，可以复用导航、布局和卡片。

## 3. 全站骨架：src/layouts/BaseLayout.astro

`BaseLayout` 负责每个页面共同拥有的东西：

- `<!doctype html>`
- `<html lang="zh-CN">`
- `<title>`
- `<meta name="description">`
- 全局 CSS 引入
- favicon

你可以把它理解成网页的外壳。

为什么不把这些写在每个页面里？

因为每个页面都需要这些基础结构。抽成 layout 后，修改一次，全站生效。

## 4. 毛玻璃导航：src/components/GlassHeader.astro

这个组件负责顶部导航。

核心视觉来自这个 class：

```css
.glass {
  background: rgba(255, 255, 255, 0.36);
  backdrop-filter: blur(30px) saturate(180%);
  border-radius: 999px;
}
```

关键点：

- `background` 用半透明白色。
- `backdrop-filter` 让背景被模糊，形成毛玻璃。
- `border-radius: 999px` 让导航变成椭圆胶囊。

这就是 Apple-like 透明材质的基础。

## 5. 首页第一屏：src/components/Hero.astro

`Hero` 是首页最重要的区域。

它包含：

- 博客命题：`Blog: In AI Era, What can I do?`
- 首页宣言：`If You Are Nothing Without AI, Then You Shouldn't Have It!`
- 中文副标题
- 两个按钮
- 一个“珲”的圆形视觉标记

为什么这里不用很多说明文字？

因为首页第一屏要像入口，不像说明书。你的博客不是产品落地页，所以第一屏只需要给出气质和方向。

## 6. 内容分区：src/components/SectionShowcase.astro

这个组件放三个入口：

- Research
- Life
- Works

它们是博客长期更新的三个房间。

为什么要做成组件？

因为以后你可能在其他页面也需要类似的入口，比如首页、归档页、关于页。组件化之后可以复用。

## 7. 第一周文章：src/components/WeekOnePosts.astro

这个组件目前写死两篇文章：

- 为什么要做这个博客
- 如何制作这样的博客

下一阶段可以把它改成自动读取 Markdown。那时逻辑会变成：

```text
src/content/blog/*.md
  -> Astro 读取文章数据
  -> 自动生成文章列表
```

现在先写死，是为了让你先理解页面和组件，不一开始引入太多抽象。

## 8. 全局视觉：src/styles/global.css

这里定义了全站共享的颜色、背景、毛玻璃和圆角。

最重要的是 CSS 变量：

```css
:root {
  --page: #f5f3ee;
  --ink: #111317;
  --muted: #6f737a;
  --accent: #007aff;
  --radius-xl: 38px;
  --radius-pill: 999px;
}
```

想改整体风格，优先改这里。

例如：

- 想更暖：改 `--page`
- 想更冷：改背景渐变
- 想更圆：改 `--radius-xl`
- 想按钮更蓝：改 `--accent`

## 9. 为什么暂时不用复杂前端渲染

这个博客现在不需要 React 状态管理，也不需要数据库。

原因：

- 首页内容固定。
- 文章适合 Markdown。
- GitHub Pages 只能托管静态文件。
- 静态页面加载快，也更稳定。

后续如果你需要评论、搜索、交互动画，再逐步引入 JavaScript 或外部服务。

## 10. 你以后怎么改首页

常见修改位置：

| 想改什么 | 改哪里 |
| --- | --- |
| 首页大标题 | `src/components/Hero.astro` |
| 导航文字 | `src/components/GlassHeader.astro` |
| Research/Life/Works 文案 | `src/components/SectionShowcase.astro` |
| 第一周文章入口 | `src/components/WeekOnePosts.astro` |
| 背景、圆角、毛玻璃 | `src/styles/global.css` |
| 网页 title 和 description | `src/pages/index.astro` |

## 11. 从代码到网页：一次更新到底发生了什么

你每次更新博客，本质上会经过这条链路：

```text
修改源码或文章
  -> 本地预览
  -> 构建静态网页
  -> Git 记录改动
  -> push 到 GitHub
  -> GitHub Pages 展示新版本
```

对应命令是：

```powershell
git pull
npm run dev
npm run build:pages
git status
git add .
git commit -m "Describe what changed"
git push origin main
```

为什么不是直接改 GitHub Pages 上的网页？

因为线上网页只是构建结果，真正应该长期维护的是 `src/`、`docs/`、`public/` 这些源文件。这样以后改版、迁移、回滚都会更稳。

## 12. Git 在这里负责什么

Git 可以理解成你的博客版本记录系统。

它不是用来“发布网页”的工具，而是用来回答这些问题：

- 我这次改了哪些文件？
- 这次改动能不能被命名和保存？
- 如果改坏了，能不能回到之前的版本？
- 我能不能在另一台电脑继续接着写？

常用命令：

| 命令 | 作用 |
| --- | --- |
| `git status` | 查看当前有哪些文件被修改 |
| `git add .` | 把本次要保存的修改放进暂存区 |
| `git commit -m "..."` | 给这次修改拍一个版本快照 |
| `git pull` | 从 GitHub 拉取最新版本 |
| `git push origin main` | 把本地提交上传到 GitHub |

推荐习惯：

- 开始写之前先 `git pull`。
- 每完成一个清晰的小目标就 commit。
- commit message 写“这次做了什么”，不要只写 `update`。

例如：

```powershell
git commit -m "Add homepage learning notes"
git commit -m "Refine glass header spacing"
git commit -m "Draft why-this-blog post"
```

## 13. GitHub 在这里负责什么

GitHub 是远程仓库，也就是博客代码的云端版本。

它在这个项目里做三件事：

1. 保存代码，方便你在不同电脑之间同步。
2. 托管公开仓库，让别人可以阅读代码，但不能随便改你的仓库。
3. 通过 GitHub Pages 把静态网页发布成线上地址。

别人能不能编辑你的博客？

不能直接编辑。公开仓库意味着别人可以看代码、fork 一份、提交 Pull Request，但不能直接 push 到你的 `main` 分支。真正能改线上博客的人，是有仓库写权限的人。

如果你在另一台电脑上更新博客，流程是：

```powershell
git clone https://github.com/Zjuhui/hui-blog.git
cd hui-blog
npm install
git pull
npm run dev
```

改完以后：

```powershell
npm run build:pages
git add .
git commit -m "Update blog content"
git push origin main
```

线上地址是：

```text
https://zjuhui.github.io/hui-blog/
```

如果 `git push origin main` 因为 Windows HTTPS 连接问题失败，可以试：

```powershell
git -c http.version=HTTP/1.1 -c http.sslBackend=schannel push origin main
```

## 14. 为什么要运行 npm run build:pages

Astro 的源码在 `src/` 里，但 GitHub Pages 当前发布的是仓库根目录里的静态文件。

`npm run build:pages` 会做两步：

```text
astro build
  -> 生成 dist/

node scripts/sync-dist.mjs
  -> 把 dist/ 同步到仓库根目录
```

`scripts/sync-dist.mjs` 的作用是先清理旧的生成文件，再复制新的构建结果。

这样做的好处是：你可以继续用 Astro 写组件和页面，同时 GitHub Pages 仍然能直接显示最终 HTML。

后续 v0.2 或 v0.3 可以切换成 GitHub Actions 自动部署。那时你只需要 push 源码，GitHub 会自动 build，不一定还需要把生成后的 HTML 提交到根目录。
