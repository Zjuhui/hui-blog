import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  appearanceVariables,
  contrast,
  contrastIssues,
  fonts,
  presets,
  resolveAppearance,
} from "../src/lib/appearance.mjs";

type Appearance = ReturnType<typeof resolveAppearance>;
type Lang = "zh" | "en";
function sampleStyle(values: unknown) {
  const { "color-scheme": colorScheme, ...variables } =
    appearanceVariables(values);
  return { ...variables, colorScheme } as CSSProperties;
}
const words = {
  zh: {
    presets: "从一种喜欢的风格开始",
    custom: "自定义风格",
    current: "当前风格",
    hint: "点击切换配色、字体与列表样式，再按自己的喜好微调。文章内容保持原样。",
    colors: "配色",
    background: "背景",
    text: "正文颜色",
    accent: "强调色",
    typography: "字体与阅读",
    headingFont: "标题字体",
    bodyFont: "正文字体",
    sans: "清晰黑体 · Sans",
    serif: "经典宋体 · Serif",
    literary: "手记楷体 · Literary",
    fontNote:
      "使用电脑上的中文与西文字体，无需下载。实际字形会随读者设备而略有不同。",
    fontSize: "阅读字号",
    lineHeight: "行距",
    readingWidth: "阅读宽度",
    layoutTitle: "文章列表与留白",
    layout: "文章展示",
    list: "简洁列表",
    cards: "独立卡片",
    spacing: "页面留白",
    comfortable: "舒展",
    compact: "紧凑",
    preview: "即时外观预览",
    previewHint: "实际博客模板 · 外观即时变化；文字与图片使用已保存内容。",
    desktop: "桌面",
    mobile: "手机",
    home: "首页",
    article: "文章",
    about: "关于",
    unsaved: "外观尚未保存，也未发布",
    saved: "已保存外观的本地预览",
    reset: "恢复已保存外观",
    undo: "撤销上一次调整",
    selected: "已选择",
    contrast: "颜色对比度",
    contrastError: "下列颜色与背景的对比不足 4.5:1，请调整后保存：",
    contrastOk: "正文与强调色均达到 4.5:1 阅读对比度。",
  },
  en: {
    presets: "Start with a style you like",
    custom: "Custom style",
    current: "Current style",
    hint: "Switch the palette, type, and article list in one click, then make it your own. Article content stays as authored.",
    colors: "Colors",
    background: "Background",
    text: "Text color",
    accent: "Accent color",
    typography: "Type & reading",
    headingFont: "Heading font",
    bodyFont: "Body font",
    sans: "Clear sans-serif",
    serif: "Classic serif",
    literary: "Literary / Kai",
    fontNote:
      "Uses local Chinese and Latin fonts without downloads. Letterforms may vary across readers’ devices.",
    fontSize: "Reading size",
    lineHeight: "Line height",
    readingWidth: "Reading width",
    layoutTitle: "Article list & spacing",
    layout: "Article display",
    list: "Simple list",
    cards: "Individual cards",
    spacing: "Page spacing",
    comfortable: "Comfortable",
    compact: "Compact",
    preview: "Live appearance preview",
    previewHint:
      "Actual blog template · appearance changes instantly; text and images use saved content.",
    desktop: "Desktop",
    mobile: "Mobile",
    home: "Home",
    article: "Article",
    about: "About",
    unsaved: "Appearance is not saved or published",
    saved: "Local preview of saved appearance",
    reset: "Restore saved appearance",
    undo: "Undo last adjustment",
    selected: "Selected",
    contrast: "Color contrast",
    contrastError:
      "These colors need at least 4.5:1 contrast against the background before saving:",
    contrastOk: "Text and accent colors meet 4.5:1 reading contrast.",
  },
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);
  const valid = /^#[0-9a-f]{6}$/i.test(hex);
  return (
    <div className="color-field">
      <label>
        {label}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <input
        aria-label={`${label} HEX`}
        type="text"
        value={hex}
        maxLength={7}
        spellCheck={false}
        aria-invalid={!valid}
        onBlur={() => {
          if (!valid) setHex(value);
        }}
        onChange={(e) => {
          setHex(e.target.value);
          if (/^#[0-9a-f]{6}$/i.test(e.target.value))
            onChange(e.target.value.toLowerCase());
        }}
      />
    </div>
  );
}

export default function AppearancePanel({
  config,
  savedConfig,
  lang,
  posts,
  onChange,
}: {
  config: any;
  savedConfig: any;
  lang: Lang;
  posts: { slug: string; title: string }[];
  onChange: (config: any) => void;
}) {
  const t = words[lang];
  const appearance = resolveAppearance(config);
  const saved = resolveAppearance(savedConfig);
  const signature = JSON.stringify(appearance);
  const changed = signature !== JSON.stringify(saved);
  const current = presets.find((p) => JSON.stringify(p.values) === signature);
  const issues = contrastIssues(appearance) as ("text" | "accent")[];
  const [previous, setPrevious] = useState<Appearance | null>(null);
  const [mobile, setMobile] = useState(false);
  const [page, setPage] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(600);
  const viewport = mobile ? 390 : 1024;
  const scale = Math.min(1, availableWidth / viewport);
  const previewUrl = `/${lang === "en" ? "en/" : ""}${page}`;
  function sendAppearance() {
    frame.current?.contentWindow?.postMessage(
      { type: "hui-appearance-preview", appearance },
      window.location.origin,
    );
  }
  useEffect(sendAppearance, [signature]);
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setAvailableWidth(entries[0].contentRect.width),
    );
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  function update(next: Appearance) {
    setPrevious(appearance);
    onChange({ ...config, appearance: next });
  }
  function field(key: keyof Appearance, value: string | number) {
    update({ ...appearance, [key]: value });
  }
  return (
    <>
      <section className="appearance-presets" aria-labelledby="preset-title">
        <h2 id="preset-title">{t.presets}</h2>
        <p className="muted">{t.hint}</p>
        <div className="preset-grid">
          {presets.map((p) => (
            <button
              key={p.id}
              className="preset-card"
              aria-pressed={current?.id === p.id}
              onClick={() => update({ ...p.values } as Appearance)}
            >
              <div
                className="preset-sample"
                aria-hidden="true"
                style={sampleStyle(p.values)}
              >
                <span className="sample-brand">
                  珲 <i>Hui.</i>
                </span>
                <strong>
                  {lang === "zh"
                    ? "把日子写成故事。"
                    : "Stories, along the way."}
                </strong>
                <span className="sample-line" />
                <span className="sample-line short" />
                <div className={`sample-posts ${p.values.layout}`}>
                  <span />
                  <span />
                </div>
              </div>
              <span className="preset-name">
                {p[lang]}
                <span aria-hidden="true">
                  {current?.id === p.id ? "✓" : "↗"}
                </span>
              </span>
              <span className="preset-description">{p.description[lang]}</span>
            </button>
          ))}
        </div>
        <div className="appearance-status">
          <p>
            {t.current}: <strong>{current?.[lang] ?? t.custom}</strong>
          </p>
          <button
            className="outlined"
            disabled={!previous}
            onClick={() => {
              if (previous) {
                const next = previous;
                setPrevious(appearance);
                onChange({ ...config, appearance: next });
              }
            }}
          >
            {t.undo}
          </button>
          <button
            className="outlined"
            disabled={!changed}
            onClick={() => update(saved)}
          >
            {t.reset}
          </button>
        </div>
      </section>
      <div className="appearance-workspace">
        <div className="appearance-controls">
          <section className="settings-section">
            <h2>{t.colors}</h2>
            {(["background", "text", "accent"] as const).map((key) => (
              <ColorField
                key={key}
                label={t[key]}
                value={appearance[key]}
                onChange={(value) => field(key, value)}
              />
            ))}
            <p
              className={issues.length ? "field-error" : "muted"}
              role="status"
            >
              {issues.length
                ? `${t.contrastError} ${issues.map((key) => `${t[key]} (${contrast(appearance[key], appearance.background).toFixed(2)}:1)`).join(" · ")}`
                : t.contrastOk}
            </p>
          </section>
          <section className="settings-section">
            <h2>{t.typography}</h2>
            {(["headingFont", "bodyFont"] as const).map((key) => (
              <label key={key}>
                {t[key]}
                <select
                  value={appearance[key]}
                  onChange={(e) => field(key, e.target.value)}
                >
                  {(["sans", "serif", "literary"] as const).map((font) => (
                    <option
                      key={font}
                      value={font}
                      style={{ fontFamily: fonts[font] }}
                    >
                      {t[font]}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <p className="muted font-note">{t.fontNote}</p>
            {(
              [
                ["fontSize", 15, 22, 1, "px"],
                ["lineHeight", 1.5, 2.3, 0.05, "×"],
                ["readingWidth", 600, 840, 10, "px"],
              ] as const
            ).map(([key, min, max, step, unit]) => (
              <label className="range-field" key={key}>
                <span>
                  {t[key]}{" "}
                  <output>
                    {appearance[key]}
                    {unit}
                  </output>
                </span>
                <input
                  type="range"
                  aria-label={t[key]}
                  aria-valuetext={`${appearance[key]}${unit}`}
                  min={min}
                  max={max}
                  step={step}
                  value={appearance[key]}
                  onChange={(e) => field(key, Number(e.target.value))}
                />
              </label>
            ))}
          </section>
          <section className="settings-section">
            <h2>{t.layoutTitle}</h2>
            <label>
              {t.layout}
              <select
                value={appearance.layout}
                onChange={(e) => field("layout", e.target.value)}
              >
                <option value="list">{t.list}</option>
                <option value="cards">{t.cards}</option>
              </select>
            </label>
            <label>
              {t.spacing}
              <select
                value={appearance.spacing}
                onChange={(e) => field("spacing", e.target.value)}
              >
                <option value="comfortable">{t.comfortable}</option>
                <option value="compact">{t.compact}</option>
              </select>
            </label>
          </section>
        </div>
        <section className="appearance-preview" aria-label={t.preview}>
          <h2>{t.preview}</h2>
          <p className="muted">{t.previewHint}</p>
          <div className="preview-toolbar">
            <select
              aria-label={t.preview}
              value={page}
              onChange={(e) => setPage(e.target.value)}
            >
              <option value="">{t.home}</option>
              <option value="about/">{t.about}</option>
              {posts.map((p) => (
                <option key={p.slug} value={`posts/${p.slug}/`}>
                  {p.title}
                </option>
              ))}
            </select>
            <div className="segmented">
              <button aria-pressed={!mobile} onClick={() => setMobile(false)}>
                {t.desktop}
              </button>
              <button aria-pressed={mobile} onClick={() => setMobile(true)}>
                {t.mobile}
              </button>
            </div>
          </div>
          <p className="appearance-preview-state" role="status">
            {changed ? t.unsaved : t.saved}
          </p>
          <div
            ref={stage}
            className="appearance-preview-stage"
            style={{ height: 850 * scale }}
          >
            <iframe
              ref={frame}
              title={t.preview}
              src={previewUrl}
              onLoad={sendAppearance}
              style={{
                width: viewport,
                height: 850,
                transform: `translateX(-50%) scale(${scale})`,
              }}
            />
          </div>
        </section>
      </div>
    </>
  );
}
