# 珲 Blog Prototype

这是一个零构建的个人博客雏形。你可以直接打开 `index.html` 预览，也可以把整个目录推到 GitHub 仓库并启用 GitHub Pages。

## 当前定位

- 名字：珲
- 内容：科研、生活、作品集分区记录
- 语言：中英文双语
- 第一周文章：
  - 《为什么要做这个博客》
  - 《如何制作这样的博客》
- 彩蛋：记录每个组件、页面、版本背后的 token 使用量

## v0.1 工作台

- Notion workspace: https://app.notion.com/p/379d48bea36581418150f0752012084b
- Figma file: https://www.figma.com/design/KcZFkNsH1kX69UJdzT9mwz
- Figma clean pass spec: `figma/clean-pass-spec.md`
- Current Figma note: `taste-skill` 已卸载；clean pass 写入暂时受 Figma Starter plan MCP 调用额度限制。

## 推荐工作流

1. 在 `content/` 写 Markdown 草稿。
2. 稳定后同步到 `posts/` 的 HTML 页面。
3. 每次完成页面或组件，在 `logs/token-ledger.md` 记录一次。
4. 设计想法沉淀到 `figma/figma-brief.md`，之后再进 Figma 做视觉系统。
5. 使用 Git 分支推进内容：

```powershell
git checkout -b post/why-this-blog
git add .
git commit -m "Add first blog prototype and drafts"
git checkout main
git merge post/why-this-blog
```

## v0.1 Git Plan

- `main`: 稳定发布分支
- `post/why-this-blog`: 第一篇文章分支
- `post/how-to-make-this-blog`: 第二篇文章分支
- `design/v0.1-clean-pass`: Figma 和视觉系统迭代分支

## GitHub Pages

如果你把这些文件放在仓库根目录：

1. 打开仓库 Settings。
2. 进入 Pages。
3. Source 选择 `Deploy from a branch`。
4. Branch 选择 `main` 和 `/root`。
5. 等待 GitHub 生成站点链接。

如果你后续希望全部用 Markdown 自动生成页面，可以再迁移到 GitHub Pages 内置 Jekyll，或者等内容多了再考虑 Astro。
