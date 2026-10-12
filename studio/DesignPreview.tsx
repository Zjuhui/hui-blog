import { useEffect, useRef, useState } from "react";

export default function DesignPreview({
  config,
  savedConfig,
  lang,
  posts,
  onSection,
}: {
  config: any;
  savedConfig: any;
  lang: "zh" | "en";
  posts: { slug: string; title: string }[];
  onSection: (section: string) => void;
}) {
  const w = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scroll = useRef(0);
  const [width, setWidth] = useState(600);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [mobile, setMobile] = useState(false);
  const [actualSize, setActualSize] = useState(false);
  const [page, setPage] = useState("");
  const [locale, setLocale] = useState(lang);
  const [editable, setEditable] = useState(true);
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState("");
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const signature = JSON.stringify(config);
  const viewport = mobile ? 390 : 1024;
  const scale = actualSize ? 1 : Math.min(1, width / viewport);
  const canvasHeight = Math.max(
    280,
    Math.min(actualSize ? 600 : 850 * scale, windowHeight - 410),
  );
  const previewUrl = `/${locale === "en" ? "en/" : ""}${page}?studioPreview=${snapshot}&studioEdit=${editable ? 1 : 0}`;
  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setState("loading");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/__studio/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: signature,
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Preview failed");
        if (!current) return;
        try {
          scroll.current = frame.current?.contentWindow?.scrollY ?? 0;
        } catch {
          scroll.current = 0;
        }
        setError("");
        setSnapshot(result.id);
      } catch (e) {
        if (!current || controller.signal.aborted) return;
        setError((e as Error).message);
        setState("error");
      }
    }, 350);
    return () => {
      current = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [signature, revision]);
  useEffect(() => {
    const resize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", resize);
    const observer = new ResizeObserver((entries) =>
      setWidth(entries[0].contentRect.width),
    );
    if (stage.current) observer.observe(stage.current);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      if (
        event.data?.type === "hui-edit-section" &&
        typeof event.data.section === "string"
      )
        onSection(event.data.section);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSection]);
  function loaded() {
    const document = frame.current?.contentDocument;
    const location = frame.current?.contentWindow?.location;
    if (!document || !location) return;
    if (!document.querySelector(".site-shell")) {
      setError(
        document.body?.innerText.slice(0, 600) ||
          w(
            "预览暂时无法加载，请刷新。",
            "Preview could not load. Please refresh.",
          ),
      );
      setState("error");
      return;
    }
    if (location.search.includes(`studioPreview=${snapshot}`)) {
      const path = location.pathname;
      const nextLocale = path.startsWith("/en/") ? "en" : "zh";
      setLocale(nextLocale);
      setPage(path.replace(/^\/(?:en\/)?/, ""));
    }
    setState("ready");
    frame.current?.contentWindow?.scrollTo(0, scroll.current);
  }
  return (
    <section
      className="appearance-preview"
      aria-label={w("可视化预览", "Visual preview")}
    >
      <div className="design-preview-heading">
        <h2>{w("你的博客", "Your blog")}</h2>
        <span className="local-preview-pill">{w("仅本机", "LOCAL ONLY")}</span>
      </div>
      <p className="muted">
        {w(
          "网站文字、布局与外观一起预览。文章展示编辑器中已保存的内容。",
          "Site text, layout, and appearance preview together. Articles use the content saved in the editor.",
        )}
      </p>
      <div className="preview-toolbar">
        <select
          aria-label={w("预览页面", "Preview page")}
          value={page}
          onChange={(e) => {
            scroll.current = 0;
            setPage(e.target.value);
          }}
        >
          <option value="">{w("首页", "Home")}</option>
          <option value="archive/">{w("文章索引", "Writing index")}</option>
          <option value="works/">{w("作品", "Works")}</option>
          <option value="about/">{w("关于", "About")}</option>
          {posts.map((post) => (
            <option key={post.slug} value={`posts/${post.slug}/`}>
              {post.title}
            </option>
          ))}
        </select>
        <select
          aria-label={w("预览语言", "Preview language")}
          className="preview-language"
          value={locale}
          onChange={(e) => setLocale(e.target.value as "zh" | "en")}
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
        <div className="segmented">
          <button aria-pressed={!mobile} onClick={() => setMobile(false)}>
            {w("桌面", "Desktop")}
          </button>
          <button aria-pressed={mobile} onClick={() => setMobile(true)}>
            {w("手机", "Mobile")}
          </button>
        </div>
      </div>
      <div className="canvas-mode">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={editable}
            onChange={(e) => setEditable(e.target.checked)}
          />
          {w("点击页面区域进行编辑", "Click a page area to edit")}
        </label>
        <button className="outlined" onClick={() => setRevision((v) => v + 1)}>
          {w("刷新文章", "Refresh articles")} ↻
        </button>
      </div>
      <div className="canvas-zoom">
        <span>
          {viewport}px · {Math.round(scale * 100)}%
        </span>
        <button
          aria-pressed={actualSize}
          onClick={() => setActualSize((v) => !v)}
        >
          {actualSize
            ? w("适合窗口", "Fit to panel")
            : w("查看实际大小", "View at 100%")}
        </button>
        {snapshot && (
          <a
            href={previewUrl.replace(/studioEdit=1$/, "studioEdit=0")}
            target="_blank"
            rel="noreferrer"
          >
            {w("全页预览", "Full-page preview")} ↗
          </a>
        )}
      </div>
      <p className="appearance-preview-state" role="status">
        {state === "loading"
          ? w("正在渲染当前修改…", "Rendering your changes…")
          : error
            ? w(
                "请完成或修正输入；下方保留上一次有效预览。",
                "Complete or correct the fields; the last valid preview remains below.",
              )
            : signature !== JSON.stringify(savedConfig)
              ? w(
                  "正在预览未保存修改 · 尚未发布",
                  "Previewing unsaved changes · not published",
                )
              : w(
                  "已保存的本地内容 · 尚未发布的修改也会显示",
                  "Saved local content · includes unpublished changes",
                )}
      </p>
      {error && (
        <details className="field-error">
          <summary>{w("查看需要修正的字段", "Show fields to correct")}</summary>
          <pre>{error}</pre>
        </details>
      )}
      <div
        ref={stage}
        className={`appearance-preview-stage ${actualSize ? "actual-size" : ""}`}
        aria-busy={state === "loading"}
        style={{ height: canvasHeight }}
      >
        {snapshot && (
          <iframe
            ref={frame}
            title={w("博客设计预览", "Blog design preview")}
            src={previewUrl}
            onLoad={loaded}
            style={{
              width: viewport,
              height: actualSize ? canvasHeight - 18 : canvasHeight / scale,
              left: actualSize ? 0 : "50%",
              transform: actualSize
                ? "none"
                : `translateX(-50%) scale(${scale})`,
            }}
          />
        )}
      </div>
      <p className="muted canvas-help">
        {editable
          ? w(
              "点击有虚线边框的区域，左侧会打开对应设置。关闭勾选即可浏览链接。",
              "Click an outlined area to open its controls. Turn off click-to-edit to follow links.",
            )
          : w(
              "浏览模式：可点击链接检查各页面。",
              "Browse mode: follow links to check each page.",
            )}
      </p>
    </section>
  );
}
