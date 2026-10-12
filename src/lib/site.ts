import { getCollection } from "astro:content";
import { readFile } from "node:fs/promises";
import defaults from "../data/site.json";
export type Locale = "zh" | "en";
export const studioMode = process.env.BLOG_STUDIO === "1";
export const copy = {
  zh: {
    home: "首页",
    writing: "文章",
    works: "作品",
    about: "关于",
    research: "科研",
    life: "生活",
    all: "全部",
    latest: "最近写下的",
    allPosts: "所有文章",
    selected: "一些作品",
    notebook: "文字与记录",
    archiveDesc: "一些想法，一些片刻。按时间留在这里。",
    worksDesc: "从想法到实践，记录做过的东西。",
    aboutTitle: "你好，我是珲。",
    back: "返回文章",
    empty: "这里还没有文章，慢慢来。",
    footer: "先写，再生长。",
    reading: "阅读",
    skip: "跳到正文",
    preview: "本地预览 · 包含未发布内容",
    studio: "返回工作台",
    language: "切换语言",
    note: "文章保留原来的书写语言。",
    count: "篇记录",
  },
  en: {
    home: "Home",
    writing: "Writing",
    works: "Works",
    about: "About",
    research: "Research",
    life: "Life",
    all: "All",
    latest: "Recent writing",
    allPosts: "All writing",
    selected: "Selected work",
    notebook: "Notes & observations",
    archiveDesc: "Some thoughts, some moments. Collected over time.",
    worksDesc: "From an idea to something real. A record of things I make.",
    aboutTitle: "Hello, I'm Hui.",
    back: "Back to writing",
    empty: "Nothing here yet. Give it time.",
    footer: "Write first. Let it grow.",
    reading: "Read",
    skip: "Skip to content",
    preview: "Local preview · includes unpublished changes",
    studio: "Back to Studio",
    language: "Switch language",
    note: "Articles stay in the language they were written in.",
    count: "entries",
  },
};
export function href(path = "", locale: Locale = "zh") {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${locale === "en" ? "en/" : ""}${path.replace(/^\//, "").replace(/\/$/, "")}${path ? "/" : ""}`;
}
export function asset(src: string) {
  return src.startsWith("/hui-blog/")
    ? `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${src.slice(10)}`
    : src;
}
export async function settings() {
  if (studioMode) {
    try {
      return JSON.parse(
        await readFile(".studio/site.json", "utf8"),
      ) as typeof defaults;
    } catch {}
  }
  return defaults;
}
export async function posts() {
  const published = await getCollection("posts");
  const merged = new Map<
    string,
    | (typeof published)[number]
    | Awaited<ReturnType<typeof getCollection<"drafts">>>[number]
  >(published.map((p) => [p.id, p]));
  if (studioMode)
    for (const p of await getCollection("drafts")) merged.set(p.id, p);
  return [...merged.values()].sort(
    (a, b) => +b.data.date - +a.data.date || a.id.localeCompare(b.id),
  );
}
export function dateLabel(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
