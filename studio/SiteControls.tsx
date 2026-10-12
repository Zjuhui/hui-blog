import { useState } from "react";
import { draftPresentation } from "../src/lib/site-customization.mjs";

type Lang = "zh" | "en";
export const sectionNames = {
  zh: {
    branding: "网站标识",
    navigation: "导航与分类",
    structure: "首页区块",
    intro: "首页介绍",
    recent: "文章区块",
    works: "作品区块",
    note: "页尾短句",
    about: "关于页面",
    footer: "页脚与链接",
    labels: "其他页面文字",
  },
  en: {
    branding: "Site identity",
    navigation: "Navigation & categories",
    structure: "Home sections",
    intro: "Introduction",
    recent: "Writing section",
    works: "Works section",
    note: "Closing note",
    about: "About page",
    footer: "Footer & links",
    labels: "Other page text",
  },
};
const labels: Record<string, [string, string]> = {
  home: ["首页导航", "Home label"],
  writing: ["文章导航", "Writing label"],
  works: ["作品导航", "Works label"],
  about: ["关于导航", "About label"],
  research: ["科研分类", "Research category"],
  life: ["生活分类", "Life category"],
  latest: ["最近文章标题", "Recent articles heading"],
  allPosts: ["所有文章链接", "All articles link"],
  selected: ["首页作品标题", "Featured works heading"],
  notebook: ["文章页小标题", "Writing page eyebrow"],
  archiveDesc: ["文章页说明", "Writing page description"],
  worksDesc: ["作品页说明", "Works page description"],
  worksEyebrow: ["作品页小标题", "Works page eyebrow"],
  aboutTitle: ["关于页标题", "About page title"],
  aboutEyebrow: ["关于页小标题", "About page eyebrow"],
  margin: ["介绍旁的小字", "Introduction side note"],
  footer: ["页尾短句", "Closing sentence"],
  back: ["返回文章链接", "Back to writing link"],
  all: ["全部分类标签", "All categories label"],
  empty: ["没有文章时的提示", "Empty list message"],
  note: ["正文语言说明", "Article language note"],
  count: ["文章数量单位", "Article count suffix"],
};

export default function SiteControls({
  config,
  lang,
  section,
  onSection,
  onChange,
}: {
  config: any;
  lang: Lang;
  section: string;
  onSection: (section: string) => void;
  onChange: (value: any) => void;
}) {
  const [locale, setLocale] = useState<Lang>(lang);
  const p = draftPresentation(config);
  const names = sectionNames[lang];
  const words = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const update = (next: typeof p) =>
    onChange({ ...config, presentation: next });
  const text = (key: string) => (
    <label key={key}>
      {labels[key]?.[lang === "zh" ? 0 : 1] ?? key}
      <textarea
        rows={key.endsWith("Desc") ? 3 : 2}
        value={(p.text[locale] as any)[key]}
        onChange={(e) =>
          update({
            ...p,
            text: {
              ...p.text,
              [locale]: { ...p.text[locale], [key]: e.target.value },
            },
          })
        }
      />
    </label>
  );
  const check = (
    label: string,
    checked: boolean,
    change: (next: boolean) => void,
  ) => (
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => change(e.target.checked)}
      />
      {label}
    </label>
  );
  function move(index: number, next: number) {
    if (
      index < 0 ||
      next < 0 ||
      next >= p.home.sections.length ||
      next === index
    )
      return;
    const sections = [...p.home.sections];
    const [item] = sections.splice(index, 1);
    sections.splice(next, 0, item);
    update({ ...p, home: { ...p.home, sections } });
  }
  return (
    <div className="site-controls">
      <label>
        {words("选择要编辑的区域", "Choose an area to edit")}
        <select value={section} onChange={(e) => onSection(e.target.value)}>
          {Object.entries(names).map(([key, value]) => (
            <option value={key} key={key}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <p className="muted">
        {words(
          "页面文字可以留空，清空后对应文字和装饰会隐藏。要隐藏整块区域，请选择「首页区块」。也可点击右侧预览进行编辑。",
          "Leave page text blank to hide it and its decoration. To hide an entire section, choose Home sections. You can also click the preview to edit.",
        )}
      </p>
      {!["branding", "structure"].includes(section) && (
        <div className="content-locale">
          <span>{words("正在编辑的文字语言", "Text language")}</span>
          <div className="segmented">
            {(["zh", "en"] as const).map((l) => (
              <button
                key={l}
                aria-pressed={locale === l}
                onClick={() => setLocale(l)}
              >
                {l === "zh" ? "中文" : "English"}
              </button>
            ))}
          </div>
        </div>
      )}
      <section className="settings-section">
        <h2>{(names as any)[section]}</h2>
        {section === "branding" && (
          <>
            <label>
              {words("网站名称（浏览器标题）", "Site name (browser title)")}
              <input
                maxLength={40}
                value={config.name}
                onChange={(e) => onChange({ ...config, name: e.target.value })}
              />
              <small>
                {words(
                  "可以留空；浏览器标签页将使用页面标题。页眉中的文字标记和名称在下方单独设置。",
                  "Optional; the browser tab will use the page title. Set the visible header mark and wordmark below.",
                )}
              </small>
            </label>
            {check(
              words("显示文字标记", "Show symbol / mark"),
              p.branding.showMark,
              (value) =>
                update({ ...p, branding: { ...p.branding, showMark: value } }),
            )}
            <label>
              {words("文字标记，例如 珲", "Symbol, for example 珲")}
              <input
                maxLength={8}
                value={p.branding.mark}
                onChange={(e) =>
                  update({
                    ...p,
                    branding: { ...p.branding, mark: e.target.value },
                  })
                }
              />
            </label>
            {check(
              words("显示名称", "Show wordmark"),
              p.branding.showWordmark,
              (value) =>
                update({
                  ...p,
                  branding: { ...p.branding, showWordmark: value },
                }),
            )}
            <label>
              {words("显示名称，例如 Hui", "Wordmark, for example Hui")}
              <input
                maxLength={60}
                value={p.branding.wordmark}
                onChange={(e) =>
                  update({
                    ...p,
                    branding: { ...p.branding, wordmark: e.target.value },
                  })
                }
              />
            </label>
            <p className="muted">
              {words(
                "两个开关都关闭时，页眉只显示导航。",
                "Turn both off for a header with navigation only.",
              )}
            </p>
          </>
        )}
        {section === "navigation" && (
          <>
            {["home", "writing", "works", "about", "research", "life"].map(
              text,
            )}
            <p className="muted">
              {words(
                "名称可自由修改，已有网址保持不变。",
                "Labels are yours to change. Existing URLs stay stable.",
              )}
            </p>
          </>
        )}
        {section === "structure" && (
          <>
            <p className="muted">
              {words(
                "拖动排序，或使用上下按钮。取消勾选即可隐藏区块。",
                "Drag to reorder, or use the arrow buttons. Uncheck a section to hide it.",
              )}
            </p>
            <ol className="section-order">
              {p.home.sections.map((item, i) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", item.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    move(
                      p.home.sections.findIndex(
                        (v) => v.id === e.dataTransfer.getData("text/plain"),
                      ),
                      i,
                    );
                  }}
                >
                  <span className="drag-grip" aria-hidden="true">
                    ⠿
                  </span>
                  {check((names as any)[item.id], item.visible, (visible) =>
                    update({
                      ...p,
                      home: {
                        ...p.home,
                        sections: p.home.sections.map((v, j) =>
                          j === i ? { ...v, visible } : v,
                        ),
                      },
                    }),
                  )}
                  <button
                    className="order-arrow"
                    aria-label={`${words("上移", "Move up")} ${(names as any)[item.id]}`}
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                  >
                    ↑
                  </button>
                  <button
                    className="order-arrow"
                    aria-label={`${words("下移", "Move down")} ${(names as any)[item.id]}`}
                    disabled={i === p.home.sections.length - 1}
                    onClick={() => move(i, i + 1)}
                  >
                    ↓
                  </button>
                </li>
              ))}
            </ol>
            <label>
              {words("首页文章数量", "Articles on the homepage")}
              <input
                type="number"
                min={1}
                max={20}
                value={p.home.recentLimit}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n >= 1 && n <= 20)
                    update({ ...p, home: { ...p.home, recentLimit: n } });
                }}
              />
            </label>
            {check(
              words("显示介绍旁的小字", "Show the introduction side note"),
              p.home.showMargin,
              (showMargin) => update({ ...p, home: { ...p.home, showMargin } }),
            )}
            <p className="muted">
              {words(
                "作品区块仅在有精选作品时出现。",
                "The works section appears when featured works exist.",
              )}
            </p>
          </>
        )}
        {section === "intro" && (
          <>
            {(["eyebrow", "title", "body"] as const).map((key) => (
              <label key={key}>
                {
                  {
                    eyebrow: words("上方小标题", "Small heading"),
                    title: words("首页标题", "Home title"),
                    body: words("介绍文字", "Introduction text"),
                  }[key]
                }
                <textarea
                  rows={key === "body" ? 5 : 2}
                  value={config.intro[locale][key]}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      intro: {
                        ...config.intro,
                        [locale]: {
                          ...config.intro[locale],
                          [key]: e.target.value,
                        },
                      },
                    })
                  }
                />
              </label>
            ))}
            {text("margin")}
          </>
        )}
        {section === "recent" && ["latest", "allPosts"].map(text)}
        {section === "works" &&
          ["selected", "worksEyebrow", "worksDesc"].map(text)}
        {section === "note" && text("footer")}
        {section === "about" && (
          <>
            {["aboutEyebrow", "aboutTitle"].map(text)}
            <label>
              {words("关于正文", "About text")}
              <textarea
                rows={8}
                value={config.about[locale]}
                onChange={(e) =>
                  onChange({
                    ...config,
                    about: { ...config.about, [locale]: e.target.value },
                  })
                }
              />
            </label>
            {check(
              words("显示宣言", "Show the quote"),
              config.showQuote,
              (showQuote) => onChange({ ...config, showQuote }),
            )}
            <label>
              {words("宣言文字", "Quote")}
              <textarea
                rows={3}
                value={config.quote}
                onChange={(e) => onChange({ ...config, quote: e.target.value })}
              />
            </label>
          </>
        )}
        {section === "labels" &&
          [
            "notebook",
            "archiveDesc",
            "back",
            "all",
            "empty",
            "note",
            "count",
          ].map(text)}
        {section === "footer" && (
          <>
            {text("footer")}
            {check(
              words("页脚显示标记", "Show footer mark"),
              p.footer.showMark,
              (showMark) => update({ ...p, footer: { ...p.footer, showMark } }),
            )}
            {check(
              words("显示版权行", "Show copyright line"),
              p.footer.showCopyright,
              (showCopyright) =>
                update({ ...p, footer: { ...p.footer, showCopyright } }),
            )}
            <h3>{words("社交链接", "Social links")}</h3>
            {config.socialLinks.map((link: any, i: number) => (
              <div className="design-social" key={i}>
                {(["label", "url"] as const).map((key) => (
                  <label key={key}>
                    {key === "label"
                      ? words("名称", "Label")
                      : words("网址", "URL")}
                    <input
                      value={link[key]}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          socialLinks: config.socialLinks.map(
                            (v: any, j: number) =>
                              i === j ? { ...v, [key]: e.target.value } : v,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                <button
                  className="outlined"
                  onClick={() =>
                    onChange({
                      ...config,
                      socialLinks: config.socialLinks.filter(
                        (_: unknown, j: number) => i !== j,
                      ),
                    })
                  }
                >
                  {words("移除链接", "Remove link")}
                </button>
              </div>
            ))}
            <button
              className="outlined"
              disabled={config.socialLinks.length >= 10}
              onClick={() =>
                onChange({
                  ...config,
                  socialLinks: [...config.socialLinks, { label: "", url: "" }],
                })
              }
            >
              ＋ {words("添加链接", "Add link")}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
