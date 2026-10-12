import { useEffect, useRef, useState } from "react";
import "./studio.css";
import AppearancePanel from "./AppearancePanel";
import { contrastIssues, resolveAppearance } from "../src/lib/appearance.mjs";

type Lang = "zh" | "en";
const words = {
  zh: {
    desk: "写作工作台",
    subtitle: "让记录慢慢生长。",
    library: "文章",
    settings: "网站设置",
    preview: "预览",
    publish: "发布",
    guide: "使用指南",
    local: "仅在本机运行",
    new: "写一篇新文章",
    edit: "继续写作",
    editPublished: "编辑文章",
    empty: "还没有文章。从一个小小的想法开始。",
    draft: "本地草稿",
    revision: "有未发布修改",
    live: "已发布",
    save: "保存到本机",
    saved: "已保存到本机，尚未发布。",
    back: "返回文章",
    savedPreview: "预览已保存的内容",
    editorNote: "请先在编辑器中点击 Save，再预览。",
    newTitle: "从一个标题开始",
    title: "文章标题",
    slug: "文章网址",
    slugHelp:
      "使用英文小写、数字与短横线。例如 a-quiet-afternoon，发布后保持不变。",
    category: "分类",
    language: "正文语言",
    create: "创建并写作",
    cancel: "取消",
    life: "生活",
    research: "科研",
    works: "作品",
    desktop: "桌面",
    mobile: "手机",
    refresh: "刷新",
    open: "在新标签页打开",
    home: "首页",
    localPreview: "本地预览 · 已保存的草稿与设置",
    intro: "首页介绍",
    eyebrow: "上方小标题",
    heading: "首页标题",
    body: "介绍文字",
    about: "关于我",
    appearance: "外观",
    accent: "强调色",
    cinnabar: "朱砂",
    sage: "青苔",
    ink: "墨蓝",
    quote: "最初的宣言",
    showQuote: "在关于页显示宣言",
    links: "社交链接",
    addLink: "添加链接",
    remove: "移除",
    linkLabel: "名称",
    linkUrl: "网址",
    pending: "选择这次要发布的修改",
    pendingHint: "只有选中的文章、网站设置以及它们用到的图片会上传。",
    noChanges: "没有待发布的修改。去写点什么吧。",
    review: "检查发布内容",
    reviewTitle: "本次发布",
    files: "包含的文件",
    publishNow: "发布到博客",
    publication: "发布状态",
    idle: "尚未开始",
    building: "检查并构建",
    uploading: "上传中",
    deploying: "网站部署中",
    successful: "发布成功",
    failed: "发布未完成",
    "status-unavailable": "暂时无法确认部署状态",
    checkActions: "查看 GitHub Actions",
    visit: "打开线上博客",
    authNeeded: "发布前需要连接 GitHub",
    authUnavailable: "暂时无法连接 GitHub",
    authRetry: "请检查网络或代理后点击刷新，无需因为连接失败重新登录。",
    authHint: "双击项目里的 GitHub Setup.cmd，完成一次登录，然后点击刷新。",
    authOk: "GitHub 已连接",
    saveFirst: "离开前请先保存网站设置。",
    error: "未能完成操作",
    close: "关闭",
    guideTitle: "从想法到文章",
    steps: [
      "打开 Open Blog Studio.cmd，工作台会在浏览器里启动。",
      "在文章页点击「写一篇新文章」，填入标题与网址。用编辑器工具栏排版、插入图片，然后点击 Save。",
      "点击「预览已保存的内容」。可切换手机与桌面，也可预览首页。",
      "前往「发布」，选择文章和设置，检查文件清单，再点击「发布到博客」。看到「发布成功」后，才表示网站已更新。",
    ],
    backup: "备份与恢复",
    backupText:
      "草稿和未发布图片保存在 .studio 文件夹，只在这台电脑上。定期复制整个 .studio 到自己的备份盘；换电脑时也带上它。已发布文章保存在 Git 历史里。发布失败不会删除草稿。",
    recovery:
      "如果提示远程内容有冲突，请保留草稿并先同步项目。不要强制覆盖。上传成功但部署失败时，可在 GitHub Actions 中重新运行失败的任务。",
    englishEditor: "写作编辑器的内置菜单使用英文；正文可以自由使用中文或英文。",
    saveMeaning: "保存 ≠ 发布",
    saveMeaningText:
      "保存只更新本机的工作副本。预览也只在本机。只有发布按钮才会上传所选内容。",
  },
  en: {
    desk: "Writing desk",
    subtitle: "A little space to let things grow.",
    library: "Writing",
    settings: "Site settings",
    preview: "Preview",
    publish: "Publish",
    guide: "Guide",
    local: "Running on your computer",
    new: "Write a new article",
    edit: "Continue writing",
    editPublished: "Edit article",
    empty: "No articles yet. Start with a small idea.",
    draft: "Local draft",
    revision: "Unpublished changes",
    live: "Published",
    save: "Save locally",
    saved: "Saved on this computer. Not published yet.",
    back: "Back to writing",
    savedPreview: "Preview saved changes",
    editorNote: "Click Save in the editor before previewing.",
    newTitle: "Start with a title",
    title: "Article title",
    slug: "Article URL",
    slugHelp:
      "Lowercase letters, numbers, and hyphens. For example: a-quiet-afternoon. Keep it unchanged after publication.",
    category: "Category",
    language: "Article language",
    create: "Create and write",
    cancel: "Cancel",
    life: "Life",
    research: "Research",
    works: "Works",
    desktop: "Desktop",
    mobile: "Mobile",
    refresh: "Refresh",
    open: "Open in a new tab",
    home: "Home",
    localPreview: "Local preview · saved drafts and settings",
    intro: "Home introduction",
    eyebrow: "Small heading",
    heading: "Home title",
    body: "Introduction",
    about: "About me",
    appearance: "Appearance",
    accent: "Accent color",
    cinnabar: "Cinnabar",
    sage: "Sage",
    ink: "Ink blue",
    quote: "The original manifesto",
    showQuote: "Show the quote on the About page",
    links: "Social links",
    addLink: "Add link",
    remove: "Remove",
    linkLabel: "Label",
    linkUrl: "URL",
    pending: "Choose what to publish",
    pendingHint:
      "Only selected articles, site settings, and their referenced images will be uploaded.",
    noChanges: "Nothing waiting to be published. Time to write something.",
    review: "Review changes",
    reviewTitle: "This publication",
    files: "Included files",
    publishNow: "Publish to blog",
    publication: "Publication status",
    idle: "Not started",
    building: "Checking and building",
    uploading: "Uploading",
    deploying: "Deploying website",
    successful: "Published successfully",
    failed: "Publication incomplete",
    "status-unavailable": "Deployment status unavailable",
    checkActions: "View GitHub Actions",
    visit: "Open live blog",
    authNeeded: "Connect GitHub before publishing",
    authUnavailable: "GitHub is temporarily unreachable",
    authRetry:
      "Check your network or proxy, then refresh. A connection failure does not require signing in again.",
    authHint:
      "Open GitHub Setup.cmd in the project, sign in once, then refresh.",
    authOk: "GitHub connected",
    saveFirst: "Save your site settings before leaving.",
    error: "Could not complete the action",
    close: "Close",
    guideTitle: "From an idea to an article",
    steps: [
      "Open Open Blog Studio.cmd. Your writing desk opens in the browser.",
      "Choose “Write a new article” and enter its title and URL. Use the editor toolbar to format text and add images, then click Save.",
      "Choose “Preview saved changes.” Switch between mobile and desktop, or preview your homepage.",
      "Go to Publish, select articles and settings, review the file list, then publish. “Published successfully” means the deployment has finished.",
    ],
    backup: "Backup and recovery",
    backupText:
      "Drafts and unpublished images live in .studio on this computer. Regularly copy that whole folder to your own backup drive; bring it with you when switching computers. Published articles are kept in Git history. Failed publication never deletes drafts.",
    recovery:
      "If remote content conflicts, keep your draft and synchronize the project before reconciling it. Never force overwrite. If upload succeeds but deployment fails, rerun the failed workflow in GitHub Actions.",
    englishEditor:
      "The writing editor uses English menus. Article text can be in any language.",
    saveMeaning: "Saving is separate from publishing",
    saveMeaningText:
      "Save updates your local working copy. Preview stays local too. Only the publishing button uploads your selected content.",
  },
};
async function api(action: string, body?: unknown) {
  const response = await fetch(`/__studio/${action}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
function useSession(
  key: string,
  fallback: string,
): [string, (value: string) => void] {
  const [value, update] = useState(
    () => sessionStorage.getItem(key) ?? fallback,
  );
  return [
    value,
    (next: string) => {
      sessionStorage.setItem(key, next);
      update(next);
    },
  ];
}

export default function Studio() {
  const [lang, setLang] = useState<Lang>("zh");
  const t = words[lang];
  const [view, setView] = useSession("hui-view", "library");
  const [data, setData] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useSession("hui-editor", "");
  const [previewPath, setPreviewPath] = useSession("hui-preview", "/");
  const [frameKey, setFrameKey] = useState(0);
  const [mobile, setMobile] = useState(false);
  const modalRef = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectSettings, setSelectSettings] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [dirty, setDirty] = useState(
    !!sessionStorage.getItem("hui-unsaved-settings"),
  );
  async function refresh(first = false) {
    const next = await api("state");
    setData(next);
    if (first)
      setConfig(
        JSON.parse(sessionStorage.getItem("hui-unsaved-settings") || "null") ??
          next.settings,
      );
    return next;
  }
  async function act(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function navigate(next: string) {
    if (dirty && !["settings", "appearance"].includes(next)) {
      setError(t.saveFirst);
      return;
    }
    setView(next);
    setNotice("");
    setReview(null);
    void act(async () => {
      await refresh();
    });
  }
  useEffect(() => {
    setLang(localStorage.getItem("hui-studio-language") === "en" ? "en" : "zh");
    void act(async () => {
      await refresh(true);
    });
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    localStorage.setItem("hui-studio-language", lang);
  }, [lang]);
  useEffect(() => {
    const phase = data?.publication?.phase;
    if (
      !["building", "uploading", "deploying", "status-unavailable"].includes(
        phase,
      )
    )
      return;
    const timer = setInterval(() => {
      refresh().catch((e) => setError(e.message));
    }, 12000);
    return () => clearInterval(timer);
  }, [data?.publication?.phase]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  useEffect(() => {
    if (!creating) return;
    const previous = document.activeElement as HTMLElement;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCreating(false);
        return;
      }
      if (event.key !== "Tab") return;
      const fields = modalRef.current?.querySelectorAll<HTMLElement>(
        "input,select,button:not(:disabled)",
      );
      if (!fields?.length) return;
      const first = fields[0],
        last = fields[fields.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [creating]);
  const pending = data?.posts.filter((p: any) => p.changed) ?? [];
  const active = [
    "building",
    "uploading",
    "deploying",
    "status-unavailable",
  ].includes(data?.publication?.phase);
  const selection = { slugs: selected, settings: selectSettings };
  function changeConfig(next: any) {
    sessionStorage.setItem("hui-unsaved-settings", JSON.stringify(next));
    setConfig(next);
    setDirty(true);
    setNotice("");
  }
  function localized(
    section: string,
    locale: Lang,
    key: string,
    value: string,
  ) {
    changeConfig({
      ...config,
      [section]: {
        ...config[section],
        [locale]: { ...config[section][locale], [key]: value },
      },
    });
  }
  async function edit(slug: string, published: boolean) {
    sessionStorage.setItem("hui-editor", slug);
    sessionStorage.setItem("hui-view", "editor");
    if (published) await api("edit", { slug });
    setEditing(slug);
    setView("editor");
    await refresh();
  }
  function showPreview(route: string) {
    setPreviewPath(route);
    setFrameKey((k) => k + 1);
    setView("preview");
  }
  return (
    <div className="studio-app">
      <aside className="studio-sidebar">
        <a className="studio-brand" href="/studio/">
          <span className="studio-seal">珲</span>
          <span>
            Hui<span className="studio-brand-sub">BLOG STUDIO</span>
          </span>
        </a>
        <p className="sidebar-caption">{t.desk}</p>
        <nav aria-label={t.desk}>
          {(
            [
              "library",
              "appearance",
              "settings",
              "preview",
              "publish",
              "guide",
            ] as const
          ).map((key, i) => (
            <button
              key={key}
              onClick={() => navigate(key)}
              aria-current={view === key ? "page" : undefined}
            >
              <span aria-hidden="true">
                {["▤", "◐", "◈", "◫", "↗", "?"][i]}
              </span>
              {t[key]}
              {key === "publish" && pending.length > 0 && (
                <small>{pending.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="local-dot"></span>
          {t.local}
          <button
            className="lang-button"
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
          >
            {lang === "zh" ? "English ↗" : "中文 ↗"}
          </button>
        </div>
      </aside>
      <main
        className={`studio-main ${["editor", "preview", "appearance"].includes(view) ? "wide" : ""}`}
      >
        <header className="studio-topbar">
          <span>{t.subtitle}</span>
          <a
            href="https://zjuhui.github.io/hui-blog/"
            target="_blank"
            rel="noreferrer"
          >
            {t.visit} ↗
          </a>
        </header>
        {error && (
          <div className="studio-alert" role="alert">
            <div>
              <strong>{t.error}</strong>
              <p>{error}</p>
            </div>
            <button aria-label={t.close} onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}
        {notice && (
          <div className="studio-notice" role="status">
            {notice === "saved" ? t.saved : notice}
          </div>
        )}
        {!data ? (
          <p className="loading">{error ? "" : "…"}</p>
        ) : (
          <>
            {view === "library" && (
              <>
                <div className="studio-heading">
                  <div>
                    <p className="overline">
                      {lang === "zh" ? "我的笔记本" : "YOUR NOTEBOOK"}
                    </p>
                    <h1>
                      {t.library}
                      <small>{data.posts.length}</small>
                    </h1>
                  </div>
                  <button className="primary" onClick={() => setCreating(true)}>
                    ＋ {t.new}
                  </button>
                </div>
                <div className="library-list">
                  {data.posts.map((p: any) => (
                    <article key={p.slug} className="library-entry">
                      <div>
                        <div className="entry-meta">
                          <span>{t[p.category as "life"]}</span>
                          <span
                            className={`badge ${p.changed ? "pending" : ""}`}
                          >
                            {p.changed
                              ? p.published
                                ? t.revision
                                : t.draft
                              : t.live}
                          </span>
                        </div>
                        <h2>{p.title}</h2>
                        <p>{p.slug}</p>
                        {p.error && <p className="field-error">{p.error}</p>}
                      </div>
                      <div className="entry-actions">
                        <button
                          onClick={() => showPreview(`/posts/${p.slug}/`)}
                        >
                          {t.preview} ↗
                        </button>
                        <button
                          className="outlined"
                          disabled={busy}
                          onClick={() => act(() => edit(p.slug, p.published))}
                        >
                          {p.draft ? t.edit : t.editPublished}
                        </button>
                      </div>
                    </article>
                  ))}
                  {!data.posts.length && <p className="empty">{t.empty}</p>}
                </div>
                <div className="studio-footnote">
                  <span>✳</span>
                  <p>{t.saveMeaningText}</p>
                </div>
              </>
            )}
            {view === "editor" && (
              <>
                <div className="editor-toolbar">
                  <button onClick={() => navigate("library")}>
                    ← {t.back}
                  </button>
                  <span>{t.editorNote}</span>
                  <button
                    className="primary"
                    onClick={() => showPreview(`/posts/${editing}/`)}
                  >
                    {t.savedPreview} ↗
                  </button>
                </div>
                <iframe
                  className="editor-frame"
                  title="Visual article editor"
                  src={`/keystatic/collection/posts/item/${editing}`}
                />
              </>
            )}
            {view === "preview" && (
              <>
                <div className="studio-heading">
                  <div>
                    <p className="overline">
                      {lang === "zh" ? "发布之前" : "BEFORE YOU PUBLISH"}
                    </p>
                    <h1>{t.preview}</h1>
                  </div>
                </div>
                <div className="preview-toolbar">
                  <select
                    aria-label={t.preview}
                    value={previewPath}
                    onChange={(e) => {
                      setPreviewPath(e.target.value);
                      setFrameKey((k) => k + 1);
                    }}
                  >
                    <option value="/">{t.home}</option>
                    <option value="/en/">Home · English</option>
                    {data.posts.map((p: any) => (
                      <option key={p.slug} value={`/posts/${p.slug}/`}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <div className="segmented">
                    <button
                      aria-pressed={!mobile}
                      onClick={() => setMobile(false)}
                    >
                      {t.desktop}
                    </button>
                    <button
                      aria-pressed={mobile}
                      onClick={() => setMobile(true)}
                    >
                      {t.mobile}
                    </button>
                  </div>
                  <button onClick={() => setFrameKey((k) => k + 1)}>
                    {t.refresh} ↻
                  </button>
                  <a href={previewPath} target="_blank" rel="noreferrer">
                    {t.open} ↗
                  </a>
                </div>
                <p className="preview-caption">{t.localPreview}</p>
                <div className={`preview-stage ${mobile ? "phone" : ""}`}>
                  <iframe
                    key={frameKey}
                    title={t.localPreview}
                    src={previewPath}
                  />
                </div>
              </>
            )}
            {["settings", "appearance"].includes(view) && config && (
              <>
                <div className="studio-heading settings-heading">
                  <div>
                    <p className="overline">
                      {lang === "zh" ? "自己的小空间" : "MAKE IT YOURS"}
                    </p>
                    <h1>{view === "appearance" ? t.appearance : t.settings}</h1>
                  </div>
                  <button
                    disabled={
                      busy ||
                      !dirty ||
                      contrastIssues(resolveAppearance(config)).length > 0
                    }
                    className="primary"
                    onClick={() =>
                      act(async () => {
                        await api("settings", config);
                        sessionStorage.removeItem("hui-unsaved-settings");
                        setDirty(false);
                        setNotice("saved");
                        await refresh();
                      })
                    }
                  >
                    {t.save}
                  </button>
                </div>
                {view === "appearance" ? (
                  <AppearancePanel
                    config={config}
                    savedConfig={data.settings}
                    lang={lang}
                    posts={data.posts}
                    onChange={changeConfig}
                  />
                ) : (
                  <>
                    <div className="appearance-settings-link">
                      <span>
                        {lang === "zh"
                          ? "风格、背景和字体在「外观」中调整。"
                          : "Choose a style, background, and fonts in Appearance."}
                      </span>
                      <button
                        className="outlined"
                        onClick={() => navigate("appearance")}
                      >
                        {t.appearance} ↗
                      </button>
                    </div>
                    <section className="settings-section">
                      <h2>{t.intro}</h2>
                      <div className="language-columns">
                        {(["zh", "en"] as const).map((locale) => (
                          <div key={locale}>
                            <h3>{locale === "zh" ? "中文" : "English"}</h3>
                            {(["eyebrow", "title", "body"] as const).map(
                              (key) => (
                                <label key={key}>
                                  {key === "title"
                                    ? t.heading
                                    : key === "body"
                                      ? t.body
                                      : t.eyebrow}
                                  <textarea
                                    rows={key === "body" ? 4 : 2}
                                    value={config.intro[locale][key]}
                                    onChange={(e) =>
                                      localized(
                                        "intro",
                                        locale,
                                        key,
                                        e.target.value,
                                      )
                                    }
                                  />
                                </label>
                              ),
                            )}
                            <label>
                              {t.about}
                              <textarea
                                rows={7}
                                value={config.about[locale]}
                                onChange={(e) =>
                                  changeConfig({
                                    ...config,
                                    about: {
                                      ...config.about,
                                      [locale]: e.target.value,
                                    },
                                  })
                                }
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="settings-section">
                      <h2>{t.quote}</h2>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={config.showQuote}
                          onChange={(e) =>
                            changeConfig({
                              ...config,
                              showQuote: e.target.checked,
                            })
                          }
                        />
                        {t.showQuote}
                      </label>
                      <label>
                        {t.quote}
                        <textarea
                          rows={2}
                          value={config.quote}
                          onChange={(e) =>
                            changeConfig({ ...config, quote: e.target.value })
                          }
                        />
                      </label>
                    </section>
                    <section className="settings-section">
                      <h2>{t.links}</h2>
                      {config.socialLinks.map((link: any, i: number) => (
                        <div className="social-row" key={i}>
                          <label>
                            {t.linkLabel}
                            <input
                              value={link.label}
                              onChange={(e) =>
                                changeConfig({
                                  ...config,
                                  socialLinks: config.socialLinks.map(
                                    (v: any, n: number) =>
                                      n === i
                                        ? { ...v, label: e.target.value }
                                        : v,
                                  ),
                                })
                              }
                            />
                          </label>
                          <label>
                            {t.linkUrl}
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) =>
                                changeConfig({
                                  ...config,
                                  socialLinks: config.socialLinks.map(
                                    (v: any, n: number) =>
                                      n === i
                                        ? { ...v, url: e.target.value }
                                        : v,
                                  ),
                                })
                              }
                            />
                          </label>
                          <button
                            onClick={() =>
                              changeConfig({
                                ...config,
                                socialLinks: config.socialLinks.filter(
                                  (_: any, n: number) => n !== i,
                                ),
                              })
                            }
                          >
                            {t.remove}
                          </button>
                        </div>
                      ))}
                      <button
                        className="outlined"
                        onClick={() =>
                          changeConfig({
                            ...config,
                            socialLinks: [
                              ...config.socialLinks,
                              { label: "", url: "" },
                            ],
                          })
                        }
                      >
                        ＋ {t.addLink}
                      </button>
                    </section>
                  </>
                )}
              </>
            )}
            {view === "publish" && (
              <>
                <div className="studio-heading">
                  <div>
                    <p className="overline">
                      {lang === "zh" ? "写好就出发" : "READY WHEN YOU ARE"}
                    </p>
                    <h1>{t.publish}</h1>
                  </div>
                  <button
                    className="outlined"
                    disabled={busy}
                    onClick={() =>
                      act(async () => {
                        await refresh();
                      })
                    }
                  >
                    {t.refresh} ↻
                  </button>
                </div>
                <div className={`auth-card ${data.auth.ok ? "connected" : ""}`}>
                  <strong>
                    {data.auth.ok
                      ? "✓ " + t.authOk
                      : data.auth.unavailable
                        ? t.authUnavailable
                        : t.authNeeded}
                  </strong>
                  {!data.auth.ok && (
                    <p>{data.auth.unavailable ? t.authRetry : t.authHint}</p>
                  )}
                </div>
                <section className="publish-card">
                  <h2>{t.pending}</h2>
                  <p className="muted">{t.pendingHint}</p>
                  {pending.map((p: any) => (
                    <label className="publish-choice" key={p.slug}>
                      <input
                        type="checkbox"
                        disabled={busy || active}
                        checked={selected.includes(p.slug)}
                        onChange={(e) => {
                          setReview(null);
                          setSelected(
                            e.target.checked
                              ? [...selected, p.slug]
                              : selected.filter((s) => s !== p.slug),
                          );
                        }}
                      />
                      <span>
                        <strong>{p.title}</strong>
                        <small>{p.slug}</small>
                      </span>
                    </label>
                  ))}
                  {data.settingsChanged && (
                    <label className="publish-choice">
                      <input
                        type="checkbox"
                        disabled={busy || active}
                        checked={selectSettings}
                        onChange={(e) => {
                          setSelectSettings(e.target.checked);
                          setReview(null);
                        }}
                      />
                      <strong>{t.settings}</strong>
                    </label>
                  )}
                  {!pending.length && !data.settingsChanged && (
                    <p>{t.noChanges}</p>
                  )}
                  <button
                    className="outlined"
                    disabled={
                      busy || active || (!selected.length && !selectSettings)
                    }
                    onClick={() =>
                      act(async () => setReview(await api("review", selection)))
                    }
                  >
                    {t.review} →
                  </button>
                </section>
                {review && (
                  <section className="publish-card review-card">
                    <h2>{t.reviewTitle}</h2>
                    <p className="muted">{t.files}</p>
                    <ul>
                      {review.files.map((file: string) => (
                        <li key={file}>
                          <code>{file}</code>
                        </li>
                      ))}
                    </ul>
                    <button
                      className="primary"
                      disabled={busy || active || !data.auth.ok}
                      onClick={() =>
                        act(async () => {
                          await api("publish", {
                            selection: review.selection,
                            fingerprint: review.fingerprint,
                          });
                          setReview(null);
                          setSelected([]);
                          setSelectSettings(false);
                          await refresh();
                        })
                      }
                    >
                      {t.publishNow} ↗
                    </button>
                  </section>
                )}
                <section
                  className={`publication-state ${data.publication.phase}`}
                  aria-live="polite"
                >
                  <p className="overline">{t.publication}</p>
                  <h2>
                    {t[data.publication.phase as "idle"] ??
                      data.publication.phase}
                  </h2>
                  <p>
                    {lang === "zh"
                      ? ((
                          {
                            building: "正在检查并构建本次选择的修改。",
                            uploading: "正在上传审核过的内容。",
                            deploying:
                              "已上传，正在等待 GitHub Pages 完成部署。",
                            successful: "本次修改已成功上线。",
                            "status-unavailable":
                              "已上传，但暂时无法确认部署结果。请稍后刷新或查看 GitHub Actions。",
                          } as Record<string, string>
                        )[data.publication.phase] ?? data.publication.message)
                      : data.publication.message}
                  </p>
                  {data.publication.sha && (
                    <code>{data.publication.sha.slice(0, 12)}</code>
                  )}
                  {data.publication.runUrl && (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={data.publication.runUrl}
                    >
                      {t.checkActions} ↗
                    </a>
                  )}
                  {data.publication.phase === "successful" && (
                    <a
                      href="https://zjuhui.github.io/hui-blog/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t.visit} ↗
                    </a>
                  )}
                </section>
              </>
            )}
            {view === "guide" && (
              <>
                <div className="studio-heading">
                  <div>
                    <p className="overline">
                      {lang === "zh" ? "一份简明指南" : "A SMALL FIELD GUIDE"}
                    </p>
                    <h1>{t.guideTitle}</h1>
                  </div>
                </div>
                <ol className="guide-steps">
                  {t.steps.map((step, i) => (
                    <li key={step}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
                <section className="guide-note">
                  <h2>{t.saveMeaning}</h2>
                  <p>{t.saveMeaningText}</p>
                  <p>{t.englishEditor}</p>
                </section>
                <section className="guide-note">
                  <h2>{t.backup}</h2>
                  <p>{t.backupText}</p>
                  <p>{t.recovery}</p>
                </section>
              </>
            )}
          </>
        )}
      </main>
      {creating && (
        <div className="modal-backdrop">
          <section
            ref={modalRef}
            className="studio-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-title"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                void act(async () => {
                  sessionStorage.setItem("hui-view", "editor");
                  sessionStorage.setItem(
                    "hui-editor",
                    String(form.get("slug")),
                  );
                  let result;
                  try {
                    result = await api("create", Object.fromEntries(form));
                  } catch (e) {
                    sessionStorage.setItem("hui-view", "library");
                    throw e;
                  }
                  setCreating(false);
                  await edit(result.slug, false);
                });
              }}
            >
              <p className="overline">
                {lang === "zh" ? "新的一页" : "A NEW PAGE"}
              </p>
              <h2 id="new-title">{t.newTitle}</h2>
              <label>
                {t.title}
                <input name="title" required autoFocus maxLength={200} />
              </label>
              <label>
                {t.slug}
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength={100}
                  placeholder="a-quiet-afternoon"
                />
                <small>{t.slugHelp}</small>
              </label>
              <div className="form-pair">
                <label>
                  {t.category}
                  <select name="category">
                    <option value="life">{t.life}</option>
                    <option value="research">{t.research}</option>
                    <option value="works">{t.works}</option>
                  </select>
                </label>
                <label>
                  {t.language}
                  <select name="language">
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                    <option value="zh-en">中文 + English</option>
                  </select>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setCreating(false)}>
                  {t.cancel}
                </button>
                <button className="primary" disabled={busy}>
                  {t.create} →
                </button>
              </div>
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
