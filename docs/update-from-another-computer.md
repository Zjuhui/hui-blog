# 换电脑继续写作

1. 在旧电脑关闭编辑器，保存文章。复制整个 `.studio` 文件夹到自己的备份盘。它不在 GitHub 上，包括未发布文章、图片及用于冲突检测的 `bases.json`。
2. 在新电脑安装 Git，克隆 `https://github.com/Zjuhui/hui-blog.git`。不要只下载 ZIP：发布需要 Git 仓库和 origin 远程地址。
3. 将备份的 `.studio` 放在新仓库根目录。如果新电脑已经有草稿，先分别备份；不要直接覆盖同名文件。
4. 双击 `Open Blog Studio.cmd`。首次启动自动准备项目专用 Node.js 24 和依赖。
5. 双击 `GitHub Setup.cmd`，登录 Zjuhui。不要复制旧电脑的 GitHub 凭据或 `.tools`。
6. 在工作台重新打开文章、预览并检查，再选择发布。

多台电脑不要同时发布同一篇文章。换电脑前先确保代码已从 main 同步；Studio 检测到远程版本变化时会停止。保留本地副本，在同步项目后比较内容并重新建立编辑副本，不要使用强制推送或直接覆盖远程文章。

日常流程与截图见 [Studio 使用指南](studio-guide.md)。Notion 不参与同步。
