import type { ReactNode } from "react";

type Props = {
  lang: "zh" | "en";
  onNavigate: (view: string) => void;
  onCreate: () => void;
};

export default function BeginnerGuide({ lang, onNavigate, onCreate }: Props) {
  const w = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const go = (view: string, zh: string, en: string) => (
    <button type="button" className="outlined" onClick={() => onNavigate(view)}>
      {w(zh, en)} <span aria-hidden="true">↗</span>
    </button>
  );
  const step = (
    number: string,
    title: string,
    hint: string,
    content: ReactNode,
    open = false,
  ) => (
    <details className="guide-step" open={open}>
      <summary>
        <span className="guide-step-number" aria-hidden="true">
          {number}
        </span>
        <span className="guide-step-heading">
          <strong>{title}</strong>
          <small>{hint}</small>
        </span>
      </summary>
      <div className="guide-step-body">{content}</div>
    </details>
  );

  return (
    <div className="beginner-guide">
      <header className="guide-hero">
        <p className="eyebrow">
          {w("第一次使用 · 从这里开始", "FIRST TIME HERE · START HERE")}
        </p>
        <h1>
          {w(
            "把第一篇文章，变成你的博客。",
            "Your first article. Your own blog.",
          )}
        </h1>
        <p>
          {w(
            "从起名字、选择样式，到写作和上线。跟着下面的步骤完成一次，以后只需打开工作台继续写。",
            "Name your site, choose a style, write something, and put it online. Follow the steps once; then return to Studio whenever you want to write.",
          )}
        </p>
        <div className="guide-start-actions">
          <button type="button" className="primary" onClick={onCreate}>
            {w("写第一篇文章", "Write your first article")}
          </button>
          {go("settings", "先设置我的博客", "Set up my blog first")}
        </div>
      </header>

      <ol
        className="guide-route"
        aria-label={w("日常写作流程", "Everyday workflow")}
      >
        <li>
          <button type="button" onClick={() => onNavigate("settings")}>
            <span>01</span>
            <strong>{w("设置", "Make it yours")}</strong>
            <small>{w("名字、样式、链接", "Name, style, links")}</small>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onNavigate("library")}>
            <span>02</span>
            <strong>{w("写作与保存", "Write & save")}</strong>
            <small>{w("文章留在本机", "Keep a local draft")}</small>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onNavigate("preview")}>
            <span>03</span>
            <strong>{w("预览", "Preview")}</strong>
            <small>{w("检查桌面与手机", "Check desktop & mobile")}</small>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => onNavigate("publish")}>
            <span>04</span>
            <strong>{w("检查与发布", "Review & publish")}</strong>
            <small>{w("选择这次公开的内容", "Choose what goes online")}</small>
          </button>
        </li>
      </ol>

      <aside className="guide-note">
        <strong>
          {w("保存到本机 ≠ 发布上线", "Saving locally ≠ publishing")}
        </strong>
        <p>
          {w(
            "尝试配色、清空介绍、插入图片都可以先在本机完成。只有在「发布」中检查并确认所选内容，才会更新公开的网站。",
            "Try colors, clear an introduction, or add images on your computer. The public website changes only when you review and publish your selected changes.",
          )}
        </p>
      </aside>

      <div className="guide-steps">
        {step(
          "01",
          w("准备项目并打开工作台", "Get the project and open Studio"),
          w(
            "第一次安装或换电脑时阅读；已经打开了工作台，可以继续下一步。",
            "For first installation or a new computer. Studio is already open? Continue to step 2.",
          ),
          <>
            <p>
              {w(
                "在 Windows 文件夹中找到项目，双击 Open Blog Studio.cmd。首次启动会联网准备项目专用 Node.js 24 和写作工具，请等待浏览器自动打开。以后日常写作无需输入终端命令。",
                "Find the project folder in Windows and double-click Open Blog Studio.cmd. The first launch downloads a project-local Node.js 24 runtime and the writing tools, then opens your browser. Routine writing needs no terminal commands.",
              )}
            </p>
            <p>
              {w(
                "本机地址是 http://127.0.0.1:4321/studio/；它只在这台电脑上运行。GitHub 登录可等到准备发布时再做。",
                "The local address is http://127.0.0.1:4321/studio/. It runs on this computer. You can leave GitHub sign-in until you are ready to publish.",
              )}
            </p>
            <details className="guide-recovery">
              <summary>
                {w(
                  "我的电脑上还没有项目",
                  "I do not have the project on this computer",
                )}
              </summary>
              <ol>
                <li>
                  {w(
                    "先安装 Git for Windows。可以使用 GitHub Desktop 的可视化界面获取项目。",
                    "Install Git for Windows first. You can use GitHub Desktop to get the project through a visual interface.",
                  )}{" "}
                  <a
                    href="https://git-scm.com/downloads/win"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Git for Windows ↗
                  </a>
                </li>
                <li>
                  {w(
                    "在 GitHub Desktop 选择 File → Clone repository → URL，填入下方仓库地址，选择本机文件夹，然后 Clone。",
                    "In GitHub Desktop, choose File → Clone repository → URL, enter the repository below, choose a local folder, and click Clone.",
                  )}{" "}
                  <a
                    href="https://docs.github.com/en/desktop/adding-and-cloning-repositories/cloning-and-forking-repositories-from-github-desktop"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {w("官方图解", "Official illustrated guide")} ↗
                  </a>
                </li>
                <li>
                  <code>https://github.com/Zjuhui/hui-blog.git</code>
                </li>
                <li>
                  {w(
                    "打开克隆后的文件夹，双击 Open Blog Studio.cmd。发布需要完整的 Git 仓库；只下载 ZIP 不够。",
                    "Open the cloned folder and double-click Open Blog Studio.cmd. Publishing needs a full Git checkout; a ZIP download is not enough.",
                  )}
                </li>
              </ol>
            </details>
            <aside className="guide-note">
              <strong>
                {w(
                  "这份项目已连接一个博客",
                  "This project is connected to an existing blog",
                )}
              </strong>
              <p>
                {w(
                  "当前发布目标是 Zjuhui/hui-blog。本文带你从第一篇文章开始使用这份已配置的项目。如果你要为另一个 GitHub 账号创建独立博客，需要先配置自己的仓库、网站地址和部署流程；仅改名称或登录另一个账号不会切换发布目标。",
                  "The configured publishing target is Zjuhui/hui-blog. This guide starts with your first article in this prepared project. A separate blog for another GitHub account needs its own repository, site address, and deployment configuration first. Renaming the site or signing into another account does not change this target.",
                )}
              </p>
            </aside>
          </>,
        )}

        {step(
          "02",
          w("把博客设置成自己的样子", "Make the blog yours"),
          w(
            "改名字和介绍，选择风格，添加需要的入口。",
            "Set the name and introduction, choose a style, and add your links.",
          ),
          <>
            <p>
              {w(
                "打开「网站设置 → 区块与文字」。在「网站标识」里设置浏览器标题和页面上的名字，再去「首页介绍」写一句你是谁、这里会记录什么。文字语言可分别切换中文与 English。",
                "Open Site settings → Sections & text. In Site identity, set the browser title and visible name; in Introduction, say who you are and what you will write about. Edit the Chinese and English text separately.",
              )}
            </p>
            <dl className="guide-facts">
              <div>
                <dt>
                  {w("网站名称（浏览器标题）", "Website name (browser title)")}
                </dt>
                <dd>
                  {w(
                    "显示在博客的浏览器标签中。它与页面上显示的名字是两个设置。",
                    "Appears in the blog’s browser tab. It is separate from the name displayed on the page.",
                  )}
                </dd>
              </div>
              <div>
                <dt>{w("文字标记 / 显示名称", "Text mark / display name")}</dt>
                <dd>
                  {w(
                    "控制页眉中的「珲」或「Hui」等文字。可以修改、留空或关闭对应开关。",
                    "Controls the header text, such as 珲 or Hui. Change it, leave it blank, or turn off its visibility.",
                  )}
                </dd>
              </div>
              <div>
                <dt>
                  {w("工作台名称 Lazy Blog", "The Lazy Blog Studio name")}
                </dt>
                <dd>
                  {w(
                    "这是编辑工具的名称；不会替换你公开博客的名字。",
                    "This names the editing tool. It does not replace your public blog’s name.",
                  )}
                </dd>
              </div>
            </dl>
            <ol>
              <li>
                {w(
                  "在「推荐风格」点选一个起点，再用「颜色与排版」调整背景、字体和宽度。预设保留你的文字。",
                  "Choose a starting point in Style presets, then adjust the background, fonts, and width in Colors & type. Presets keep your text.",
                )}
              </li>
              <li>
                {w(
                  "勾选「点击页面区域进行编辑」，点击右侧预览中的区域即可找到设置。「首页区块」可隐藏或排序整块内容；清空文字只隐藏对应文字。",
                  "Enable click-to-edit and click a region in the preview to find its controls. Home sections lets you hide or reorder whole sections; clearing a text field hides that text.",
                )}
              </li>
              <li>
                {w(
                  "在「导航与分类」添加菜单链接；在「页脚与链接」添加社交链接。填写名称与地址后先点「应用链接」，再点「保存到本机」。每条链接可隐藏、排序、移除或撤销移除。",
                  "Add menu entries in Navigation & categories and social links in Footer & links. Enter a label and address, choose Apply link, then Save locally. Each entry can be hidden, reordered, removed, or restored with Undo removal.",
                )}
              </li>
              <li>
                {w(
                  "改完点击顶部「保存到本机」。右侧设计预览会立即试用正在修改的设置；保存才会保留到项目中。",
                  "Finish with Save locally at the top. The design preview tries your edits immediately; saving keeps them in the project.",
                )}
              </li>
            </ol>
            <p>
              {w(
                "首页、文章、作品、关于等菜单名称可改为你喜欢的文字，但改名不会改变已有网址或文章分类。移除菜单入口也不会删除文章或页面。",
                "You can rename Home, Writing, Works, and About. Labels do not change existing URLs or article categories, and removing a menu entry does not delete a page or article.",
              )}
            </p>
            <div className="guide-actions">
              {go("settings", "打开网站设置", "Open site settings")}
              {go("appearance", "挑选推荐风格", "Choose a style")}
            </div>
          </>,
          true,
        )}

        {step(
          "03",
          w(
            "写第一篇文章并插入图片",
            "Write your first article and add an image",
          ),
          w(
            "从一个标题开始，先写一小段也可以。",
            "Start with a title. A short paragraph is enough.",
          ),
          <>
            <ol>
              <li>
                {w(
                  "在「文章」点击「写一篇新文章」，填入标题、文章网址、分类与正文语言，然后「创建并写作」。",
                  "In Writing, choose Write a new article. Enter the title, article URL, category, and language, then choose Create and write.",
                )}
              </li>
              <li>
                {w(
                  "在编辑器中填写 Summary（摘要）和 Date（日期），然后写正文。选中文字可设置粗体和链接；工具栏还能插入标题、列表、引用与代码块。编辑器菜单是英文，正文可以使用中文、英文或两者混合。",
                  "Fill in Summary and Date, then write the body. Select text to add bold or a link; use the toolbar for headings, lists, quotes, and code blocks. Editor controls are English; your article can be Chinese, English, or both.",
                )}
              </li>
              <li>
                {w(
                  "用正文工具栏的 Image 插入图片，或在 Cover image 中用 Choose file 设置封面。选择电脑里的文件，并填写描述图片内容的替代文字。",
                  "Use Image in the body toolbar to insert a picture, or Choose file under Cover image to set a cover. Choose a file from your computer and add alternative text describing the image.",
                )}
              </li>
              <li>
                {w(
                  "点击编辑器右上方 Save。返回文章库后可再次打开继续写；已发布文章的「编辑文章」会建立本机工作副本。",
                  "Click Save at the top right of the editor. Reopen the draft from Writing to continue. Edit article creates a local working copy of an already published article.",
                )}
              </li>
            </ol>
            <div className="guide-example">
              <strong>
                {w("标题与文章网址有什么区别？", "Title or article URL?")}
              </strong>
              <p>
                {w(
                  "标题可以是「我的第一篇记录」。文章网址可用 my-first-note：只用小写英文字母、数字和短横线，每篇不同。发布后保持文章网址不变，以免别人收藏的链接失效。",
                  "A title can be “My first note”. Its URL slug could be my-first-note: use lowercase letters, numbers, and hyphens, and make it unique. Keep the slug unchanged after publishing so bookmarked links still work.",
                )}
              </p>
              <code>/hui-blog/posts/my-first-note/</code>
            </div>
            <p>
              {w(
                "想显示精选作品？文章选择 Works 分类并勾选 Featured。没有符合条件的内容时，首页作品区会自动隐藏。",
                "To show selected work, choose the Works category and check Featured. The home page hides its works section when there is no matching content.",
              )}
            </p>
            <div className="guide-actions">
              <button type="button" className="primary" onClick={onCreate}>
                {w("写一篇新文章", "Write a new article")}
              </button>
              {go("library", "打开文章库", "Open writing library")}
            </div>
          </>,
        )}

        {step(
          "04",
          w("像读者一样检查预览", "Preview it as a reader"),
          w(
            "文字、图片、链接，再看一遍手机大小。",
            "Check text, images, and links, then try the mobile view.",
          ),
          <>
            <p>
              {w(
                "文章先点 Save，再点「预览已保存的内容」或侧栏「预览」。选择首页或一篇文章，切换「桌面 / 手机」；重新保存文章后点「刷新」。",
                "Save the article first, then choose Preview saved changes or Preview in the sidebar. Select Home or an article and switch between Desktop and Mobile. After saving again, choose Refresh.",
              )}
            </p>
            <ul>
              <li>
                {w(
                  "查看标题是否清楚、图片是否显示、文字是否好读。设计工作区的「适合窗口」会缩小画面；检查真实字号时用「查看实际大小」或「全页预览」。",
                  "Check that headings are clear, pictures load, and text is comfortable to read. Fit to panel scales the design preview down; use View at 100% or Full-page preview to judge the real font size.",
                )}
              </li>
              <li>
                {w(
                  "在设计预览中关闭「点击页面区域进行编辑」，再测试导航与文章链接。中英文切换只改变界面文字，正文保留原样。",
                  "Turn off click-to-edit in the design preview before testing navigation and article links. Switching interface language keeps article bodies as authored.",
                )}
              </li>
              <li>
                {w(
                  "网站设计预览可以显示未保存的设置；侧栏「预览」读取已保存的本机内容。上线前先保存设置，再核对一次。",
                  "The design preview can show unsaved settings. Sidebar Preview uses saved local content. Save settings before your final check.",
                )}
              </li>
            </ul>
            <div className="guide-actions">
              {go("preview", "检查本地预览", "Check local preview")}
            </div>
          </>,
        )}

        {step(
          "05",
          w("第一次发布：连接 GitHub", "First publication: connect GitHub"),
          w(
            "只需完成一次浏览器登录；本机写作不需要登录。",
            "Complete browser sign-in once. Local writing does not require it.",
          ),
          <>
            <ol>
              <li>
                {w(
                  "回到项目文件夹，双击 GitHub Setup.cmd，等待登录窗口显示提示。这个窗口由你操作，不需要自己输入命令。",
                  "Return to the project folder and double-click GitHub Setup.cmd. Wait for the sign-in prompts. Follow the window; you do not need to type a command.",
                )}
              </li>
              <li>
                {w(
                  "如果询问是否用 GitHub 凭据验证 Git（Authenticate Git with your GitHub credentials?），选择 Yes。脚本已指定 GitHub.com、HTTPS 和浏览器登录。",
                  "If asked “Authenticate Git with your GitHub credentials?”, choose Yes. The launcher already selects GitHub.com, HTTPS, and browser sign-in.",
                )}
              </li>
              <li>
                {w(
                  "复制窗口显示的一次性验证码，按 Enter 打开浏览器。登录当前博客的 GitHub 账号 Zjuhui，输入验证码，并确认 GitHub CLI 的授权。",
                  "Copy the one-time code shown in the window and press Enter to open the browser. Sign in as Zjuhui, the account for this blog, enter the code, and authorize GitHub CLI.",
                )}
              </li>
              <li>
                {w(
                  "浏览器没有打开时，可手动打开 github.com/login/device 输入刚才的验证码。不要把验证码发给别人。",
                  "If the browser does not open, visit github.com/login/device and enter that code yourself. Keep the code private.",
                )}{" "}
                <a
                  href="https://github.com/login/device"
                  target="_blank"
                  rel="noreferrer"
                >
                  {w("打开 GitHub 登录页面", "Open GitHub device sign-in")} ↗
                </a>
              </li>
              <li>
                {w(
                  "等待原窗口确认登录成功，再回到「发布」点击「刷新」，看到「GitHub 已连接」后继续。仅在浏览器登录 GitHub，不代表工作台已连接。",
                  "Wait for the original window to confirm sign-in, then return to Publish and choose Refresh. Continue when it says GitHub connected. Signing into the GitHub website alone does not connect Studio.",
                )}
              </li>
            </ol>
            <p>
              {w(
                "如果显示暂时无法连接，先检查网络或代理后刷新；不必因一次连接失败重新登录。",
                "If GitHub cannot be reached, check your network or proxy and refresh; a connection failure alone does not require signing in again.",
              )}{" "}
              <a
                href="https://cli.github.com/manual/gh_auth_login"
                target="_blank"
                rel="noreferrer"
              >
                {w("GitHub 登录说明", "GitHub sign-in documentation")} ↗
              </a>
            </p>
            <div className="guide-actions">
              {go("publish", "检查 GitHub 连接", "Check GitHub connection")}
            </div>
          </>,
        )}

        {step(
          "06",
          w("选择内容，检查，再发布", "Choose changes, review, and publish"),
          w(
            "只发布勾选的文章与设置，其余草稿继续留在本机。",
            "Only selected articles and settings go online. Other drafts stay local.",
          ),
          <>
            <ol>
              <li>
                {w(
                  "确认文章已点 Save、设置已点「保存到本机」，然后打开「发布」。",
                  "Make sure articles are saved with Save and settings with Save locally, then open Publish.",
                )}
              </li>
              <li>
                {w(
                  "勾选这次上线的文章。改了网站名字、风格、介绍或链接时，也要勾选「网站设置」。",
                  "Select the articles to publish. Also select Site settings if you changed the name, style, introduction, or links.",
                )}
              </li>
              <li>
                {w(
                  "点「检查发布内容」，确认清单里只有本次要公开的文章、设置和引用的图片，再点「发布到博客」。检查后又修改了内容，需要重新检查。",
                  "Choose Review changes and check the list of articles, settings, and referenced images. Then choose Publish to blog. If you change content after reviewing, review it again.",
                )}
              </li>
              <li>
                {w(
                  "等待「检查并构建 → 上传中 → 网站部署中 → 发布成功」。上传结束不等于网站已经更新；看到成功后点击「打开线上博客」核对。",
                  "Wait through Checking and building → Uploading → Deploying website → Published successfully. Finishing the upload does not mean the site has updated. Once successful, open the live blog and check it.",
                )}
              </li>
            </ol>
            <p>
              {w(
                "草稿和未选中的图片不会随这次发布上传。这里不读取或修改 Notion，也不会自动同步 Notion 内容。",
                "Unselected drafts and draft-only images are not uploaded with this publication. Studio does not read, modify, or automatically synchronize Notion.",
              )}
            </p>
            <div className="guide-actions">
              {go("publish", "检查这次发布", "Review this publication")}
            </div>
            <details className="guide-recovery">
              <summary>
                {w(
                  "没有发布成功时怎么办？",
                  "What if publishing does not finish?",
                )}
              </summary>
              <dl className="guide-facts">
                <div>
                  <dt>{w("校验 / 构建失败", "Validation or build failed")}</dt>
                  <dd>
                    {w(
                      "按提示修正内容，保存并预览，再检查发布。失败不会删除草稿。",
                      "Fix the reported issue, save and preview, then review again. Failure does not delete drafts.",
                    )}
                  </dd>
                </div>
                <div>
                  <dt>
                    {w(
                      "远程冲突 / 项目未同步",
                      "Remote conflict or project not synchronized",
                    )}
                  </dt>
                  <dd>
                    {w(
                      "先备份 .studio，再请项目维护者同步并核对修改。不要强制覆盖，也不要反复点击发布。",
                      "Back up .studio, then ask the project maintainer to synchronize and reconcile changes. Do not force an overwrite or keep retrying Publish.",
                    )}
                  </dd>
                </div>
                <div>
                  <dt>
                    {w(
                      "部署失败 / 状态暂不可用",
                      "Deployment failed or status unavailable",
                    )}
                  </dt>
                  <dd>
                    {w(
                      "打开对应的 GitHub Actions 查看结果；状态暂不可用时保持工作台打开并刷新，未确认前不要重复发布。",
                      "Open the linked GitHub Actions run to inspect the result. If status is unavailable, keep Studio open and refresh; do not publish again before confirming the outcome.",
                    )}
                  </dd>
                </div>
              </dl>
            </details>
          </>,
        )}

        {step(
          "07",
          w("下次继续写，别忘了备份", "Come back to write, and keep a backup"),
          w(
            "保留尚未发布的文章、图片与网站设置。",
            "Keep unpublished articles, images, and site settings safe.",
          ),
          <>
            <p>
              {w(
                "下次双击 Open Blog Studio.cmd，在文章库找到本地草稿继续写。离开编辑器前先 Save，退出网站设置前先「保存到本机」。",
                "Next time, double-click Open Blog Studio.cmd and reopen your draft from Writing. Use Save before leaving the editor and Save locally before leaving site settings.",
              )}
            </p>
            <p>
              {w(
                "定期把项目里的整个 .studio 文件夹复制到自己的备份盘。它包含草稿、未发布图片、设置和冲突检查信息，不会自动备份到 GitHub。请保留整个文件夹，而不仅仅复制文章。",
                "Regularly copy the entire .studio folder from the project to your backup drive. It contains drafts, unpublished images, settings, and conflict-checking data, and is not automatically backed up to GitHub. Keep the whole folder, not just the article files.",
              )}
            </p>
            <p>
              {w(
                "换电脑时，先克隆项目，再带上自己的 .studio 备份；如果新电脑已有草稿，先分别备份，不要直接覆盖。GitHub 登录在新电脑重新完成。已发布版本可从 Git 历史恢复，请先备份本机草稿再进行恢复。",
                "On another computer, clone the project and bring your .studio backup separately. If that computer already has drafts, back up both copies before combining them. Sign into GitHub again on the new computer. Published versions can be recovered from Git history; back up local drafts before recovery.",
              )}
            </p>
            <details className="guide-recovery">
              <summary>{w("工作台打不开？", "Studio will not open?")}</summary>
              <p>
                {w(
                  "确认首次启动时网络可用，再运行启动文件。仍无法打开时，请保留错误窗口的信息，并查看项目里的 .studio/server-error.log；本机 4321 端口可能已被其他程序使用。不要删除 .studio 来解决启动问题。",
                  "Check the internet connection for first-time setup and run the launcher again. If it still fails, keep the error message and inspect .studio/server-error.log in the project; another app may be using port 4321. Do not delete .studio to troubleshoot startup.",
                )}
              </p>
            </details>
          </>,
        )}
      </div>
    </div>
  );
}
