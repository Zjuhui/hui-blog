import { useState } from "react";
import {
  navigationItems,
  navigationItemSchema,
  linkUrlSchema,
} from "../src/lib/site-links.mjs";

const pageNames = {
  zh: {
    home: "首页",
    writing: "文章索引",
    works: "作品",
    about: "关于",
    research: "科研分类",
    life: "生活分类",
  },
  en: {
    home: "Home",
    writing: "Writing index",
    works: "Works",
    about: "About",
    research: "Research category",
    life: "Life category",
  },
};
type Props = {
  kind: "navigation" | "social";
  config: any;
  presentation: any;
  lang: "zh" | "en";
  locale: "zh" | "en";
  onChange: (config: any) => void;
};

export default function LinkControls({
  kind,
  config,
  presentation: p,
  lang,
  locale,
  onChange,
}: Props) {
  const w = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const navigation = kind === "navigation";
  const items: any[] = navigation ? navigationItems(p) : config.socialLinks;
  const [editing, setEditing] = useState<{
    index: number;
    item: any;
    labels: { zh: string; en: string };
  } | null>(null);
  const [removed, setRemoved] = useState<{ item: any; index: number } | null>(
    null,
  );
  const [error, setError] = useState("");
  const limit = navigation ? 12 : 10;
  const update = (next: any[], text = p.text) =>
    onChange(
      navigation
        ? { ...config, presentation: { ...p, navigation: next, text } }
        : { ...config, socialLinks: next },
    );
  const labelOf = (item: any) =>
    navigation
      ? item.kind === "page"
        ? p.text[locale][item.page]
        : item.labels[locale]
      : item.label;
  const destinationOf = (item: any) =>
    navigation && item.kind === "page"
      ? pageNames[lang][item.page as keyof typeof pageNames.zh]
      : item.url;
  function open(index: number) {
    const item =
      index < 0
        ? navigation
          ? {
              id: `link-${crypto.randomUUID()}`,
              kind: "custom",
              labels: { zh: "", en: "" },
              url: "",
              visible: true,
            }
          : { label: "", url: "", visible: true }
        : structuredClone(items[index]);
    const labels =
      navigation && item.kind === "page"
        ? { zh: p.text.zh[item.page], en: p.text.en[item.page] }
        : (item.labels ?? { zh: "", en: "" });
    setEditing({ index, item, labels });
    setError("");
  }
  function move(index: number, delta: number) {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }
  function apply() {
    if (!editing) return;
    let item = editing.item;
    if (navigation) {
      if (item.kind === "custom") item = { ...item, labels: editing.labels };
      const parsed = navigationItemSchema.safeParse(item);
      if (!parsed.success) {
        setError(
          w(
            "请填写有效链接：完整的 https:// 网址、mailto: 邮箱或已有博客页面路径。",
            "Enter a valid https:// URL, mailto: address, or existing blog page path.",
          ),
        );
        return;
      }
      item = parsed.data;
      if (
        item.kind === "page" &&
        items.some(
          (v, i) =>
            i !== editing.index && v.kind === "page" && v.page === item.page,
        )
      ) {
        setError(
          w(
            "该页面已在列表中。可直接开启或编辑原有入口。",
            "This page is already in the list. Enable or edit its existing entry.",
          ),
        );
        return;
      }
    } else {
      const parsed = linkUrlSchema.safeParse(item.url);
      if (!parsed.success) {
        setError(
          w(
            "请填写有效的 https:// 网址、mailto: 邮箱或已有博客页面路径。",
            "Enter a valid https:// URL, mailto: address, or existing blog page path.",
          ),
        );
        return;
      }
      item = { ...item, label: item.label.trim(), url: parsed.data };
    }
    const next = [...items];
    if (editing.index < 0) next.push(item);
    else next[editing.index] = item;
    const text =
      navigation && item.kind === "page"
        ? {
            zh: { ...p.text.zh, [item.page]: editing.labels.zh },
            en: { ...p.text.en, [item.page]: editing.labels.en },
          }
        : p.text;
    update(next, text);
    setEditing(null);
    setError("");
  }
  const busy = !!editing;
  return (
    <div className="link-controls">
      <p className="muted">
        {navigation
          ? w(
              "菜单入口可添加、排序、隐藏或移除。移除入口不会删除页面；已有页面的网址保持不变。",
              "Add, reorder, hide, or remove menu entries. Removing an entry keeps its page and URL intact.",
            )
          : w(
              "这些链接显示在页脚和关于页。支持网站、邮箱和已有博客页面。",
              "These links appear in the footer and About page. Link to websites, email addresses, or existing blog pages.",
            )}
      </p>
      {!items.length && (
        <p className="muted">
          {w("还没有链接。点击下方按钮添加。", "No links yet. Add one below.")}
        </p>
      )}
      <ol className="editable-links">
        {items.map((item, index) => {
          const label = labelOf(item) || w("未命名链接", "Untitled link");
          return (
            <li
              key={item.id ?? index}
              className={item.visible === false ? "link-hidden" : ""}
            >
              <div className="link-row-title">
                <strong>{label}</strong>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={item.visible !== false}
                    disabled={busy}
                    aria-label={`${w("显示", "Show")} ${label}`}
                    onChange={(e) =>
                      update(
                        items.map((v, i) =>
                          i === index ? { ...v, visible: e.target.checked } : v,
                        ),
                      )
                    }
                  />
                  {w("显示", "Show")}
                </label>
              </div>
              <p className="link-destination">{destinationOf(item)}</p>
              <div className="link-actions">
                <button
                  className="outlined"
                  disabled={busy}
                  onClick={() => open(index)}
                  aria-label={`${w("编辑", "Edit")} ${label}`}
                >
                  {w("编辑", "Edit")}
                </button>
                <button
                  className="outlined"
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`${w("上移", "Move up")} ${label}`}
                >
                  ↑
                </button>
                <button
                  className="outlined"
                  disabled={busy || index === items.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`${w("下移", "Move down")} ${label}`}
                >
                  ↓
                </button>
                <button
                  className="outlined"
                  disabled={busy}
                  onClick={() => {
                    setRemoved({ item, index });
                    update(items.filter((_, i) => i !== index));
                  }}
                  aria-label={`${w("移除", "Remove")} ${label}`}
                >
                  {w("移除", "Remove")}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {removed && (
        <div className="link-undo" role="status">
          {w("链接已移除。", "Link removed.")}{" "}
          <button
            disabled={
              busy ||
              items.length >= limit ||
              (navigation &&
                items.some(
                  (v) =>
                    v.id === removed.item.id ||
                    (v.kind === "page" && v.page === removed.item.page),
                ))
            }
            onClick={() => {
              const next = [...items];
              next.splice(
                Math.min(removed.index, next.length),
                0,
                removed.item,
              );
              update(next);
              setRemoved(null);
            }}
          >
            {w("撤销移除", "Undo removal")}
          </button>
        </div>
      )}
      {!editing ? (
        <button
          className="outlined"
          disabled={items.length >= limit}
          onClick={() => open(-1)}
        >
          ＋{" "}
          {navigation
            ? w("添加菜单链接", "Add menu link")
            : w("添加社交链接", "Add social link")}
        </button>
      ) : (
        <div className="link-composer">
          <h3>
            {editing.index < 0
              ? w("添加链接", "Add link")
              : w("编辑链接", "Edit link")}
          </h3>
          <p className="muted">
            {w(
              "填写后点击「应用链接」即可预览；完成后仍需保存到本机。",
              "Choose Apply link to preview it, then save your settings locally.",
            )}
          </p>
          {navigation && (
            <label>
              {w("链接目标", "Link destination")}
              <select
                value={
                  editing.item.kind === "page" ? editing.item.page : "custom"
                }
                onChange={(e) => {
                  const page = e.target.value;
                  setError("");
                  setEditing({
                    ...editing,
                    item:
                      page === "custom"
                        ? {
                            id: editing.item.id,
                            kind: "custom",
                            labels: { zh: "", en: "" },
                            url: "",
                            visible: editing.item.visible,
                          }
                        : {
                            id: editing.item.id,
                            kind: "page",
                            page,
                            visible: editing.item.visible,
                          },
                    labels:
                      page === "custom"
                        ? { zh: "", en: "" }
                        : { zh: p.text.zh[page], en: p.text.en[page] },
                  });
                }}
              >
                <option value="custom">
                  {w("自定义网址 / 邮箱", "Custom URL / email")}
                </option>
                {Object.entries(pageNames[lang]).map(([key, name]) => (
                  <option
                    key={key}
                    value={key}
                    disabled={items.some(
                      (v, i) =>
                        i !== editing.index &&
                        v.kind === "page" &&
                        v.page === key,
                    )}
                  >
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {navigation ? (
            (["zh", "en"] as const).map((l) => (
              <label key={l}>
                {l === "zh"
                  ? w("中文名称", "Chinese label")
                  : w("英文名称", "English label")}
                <input
                  maxLength={120}
                  value={editing.labels[l]}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      labels: { ...editing.labels, [l]: e.target.value },
                    })
                  }
                />
              </label>
            ))
          ) : (
            <label>
              {w("链接名称", "Link label")}
              <input
                maxLength={40}
                value={editing.item.label}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    item: { ...editing.item, label: e.target.value },
                  })
                }
              />
            </label>
          )}
          {(!navigation || editing.item.kind === "custom") && (
            <label>
              {w("链接网址", "Link URL")}
              <input
                placeholder="https://example.com / mailto:hello@example.com"
                value={editing.item.url}
                onChange={(e) => {
                  setEditing({
                    ...editing,
                    item: { ...editing.item, url: e.target.value },
                  });
                  setError("");
                }}
              />
              <small>
                {w(
                  "站内页面示例：/research/ 或 /posts/文章网址/；中英文与部署路径自动适配。",
                  "Internal examples: /research/ or /posts/article-slug/. Language and deployment paths are handled automatically.",
                )}
              </small>
            </label>
          )}
          <p className="muted">
            {navigation
              ? w(
                  "名称留空时，该语言下不显示链接。",
                  "A blank label hides the link in that language.",
                )
              : w(
                  "名称留空时，中英文页面都不显示此链接。",
                  "A blank label hides this link in both languages.",
                )}
          </p>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="link-actions">
            <button className="primary" onClick={apply}>
              {w("应用链接", "Apply link")}
            </button>
            <button
              className="outlined"
              onClick={() => {
                setEditing(null);
                setError("");
              }}
            >
              {w("取消", "Cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
