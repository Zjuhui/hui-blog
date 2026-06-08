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

