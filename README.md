# 珲 Blog

Blog: In AI Era, What can I do?

这是一个用 Astro 搭建的个人博客。第一阶段目标很简单：用 Markdown 和组件化页面把博客系统跑起来，再逐步加入个性化、作品集、文章分类和 token ledger。

## 当前版本

- 名字：珲
- 主题：科研、生活、作品集
- 语言：中文和英文双语
- 部署：GitHub Pages
- 线上地址：https://zjuhui.github.io/hui-blog/
- Notion 工作台：https://app.notion.com/p/379d48bea36581418150f0752012084b

## 怎么运行

第一次下载项目后：

```powershell
npm install
```

本地预览：

```powershell
npm run dev
```

构建静态网站：

```powershell
npm run build
```

构建后，Astro 会把网站生成到 `dist/`。

## 代码结构

```text
src/layouts/BaseLayout.astro
  全站 HTML 骨架，负责 title、description、全局 CSS。

src/components/GlassHeader.astro
  顶部毛玻璃导航。

src/components/Hero.astro
  首页第一屏，包含博客宣言、按钮和“珲”视觉标记。

src/components/SectionShowcase.astro
  Research / Life / Works 三个内容入口。

src/components/WeekOnePosts.astro
  第一周两篇文章入口。

src/pages/index.astro
  首页，把上面的组件组合起来。

src/pages/posts/*.astro
  文章详情页。
```

## 学习路线

1. 先看 `src/pages/index.astro`，理解页面是怎么组合组件的。
2. 再看 `src/components/Hero.astro`，理解首页视觉是怎么写出来的。
3. 再看 `src/styles/global.css`，理解全局颜色、毛玻璃、圆角和背景。
4. 想改文字，先改 `src/pages/index.astro` 或对应组件里的文本。
5. 想改视觉，优先改 `src/styles/global.css` 里的 CSS 变量。

详细解释在：

```text
docs/homepage-learning.md
```

## GitHub Pages

当前仓库保留了根目录静态输出，方便 GitHub Pages 直接从 `main / root` 发布。

后续更推荐切换到 GitHub Actions 自动部署，相关配置在：

```text
.github/workflows/deploy.yml
```
