import { z } from "zod";

export const homeSectionIds = ["intro", "recent", "works", "note"];

const textDefaults = {
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
    aboutEyebrow: "关于这个小小的空间",
    worksEyebrow: "把想法做出来",
    margin: "研究 / 生活 / 创作",
    footer: "先写，再生长。",
    back: "返回文章",
    empty: "这里还没有文章，慢慢来。",
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
    aboutEyebrow: "A little about this place",
    worksEyebrow: "FROM IDEAS TO THINGS",
    margin: "RESEARCH / LIFE / MAKING",
    footer: "Write first. Let it grow.",
    back: "Back to writing",
    empty: "Nothing here yet. Give it time.",
    note: "Articles stay in the language they were written in.",
    count: "entries",
  },
};

export const editableTextKeys = Object.keys(textDefaults.zh);
const label = z.string().trim().max(120);
const description = z.string().trim().max(1500);
const textSchema = z
  .object({
    home: label,
    writing: label,
    works: label,
    about: label,
    research: label,
    life: label,
    all: label,
    latest: label,
    allPosts: label,
    selected: label,
    notebook: description,
    archiveDesc: description,
    worksDesc: description,
    aboutTitle: label,
    aboutEyebrow: description,
    worksEyebrow: description,
    margin: description,
    footer: description,
    back: label,
    empty: description,
    note: description,
    count: description,
  })
  .strict();

export const presentationSchema = z
  .object({
    branding: z
      .object({
        mark: z.string().trim().max(8),
        wordmark: z.string().trim().max(80),
        showMark: z.boolean(),
        showWordmark: z.boolean(),
      })
      .strict(),
    text: z.object({ zh: textSchema, en: textSchema }).strict(),
    home: z
      .object({
        sections: z
          .array(
            z
              .object({
                id: z.enum(["intro", "recent", "works", "note"]),
                visible: z.boolean(),
              })
              .strict(),
          )
          .length(4)
          .refine(
            (sections) =>
              new Set(sections.map((section) => section.id)).size ===
              homeSectionIds.length,
            "Include each homepage section exactly once.",
          ),
        recentLimit: z.number().int().min(1).max(20),
        showMargin: z.boolean(),
      })
      .strict(),
    footer: z
      .object({
        showMark: z.boolean(),
        showCopyright: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const defaultPresentation = {
  branding: { mark: "珲", wordmark: "Hui", showMark: true, showWordmark: true },
  text: textDefaults,
  home: {
    sections: homeSectionIds.map((id) => ({ id, visible: true })),
    recentLimit: 6,
    showMargin: true,
  },
  footer: { showMark: true, showCopyright: true },
};

/** Fill defaults while the editor holds incomplete input; validate before saving.
 * @returns {z.infer<typeof presentationSchema>}
 */
export function draftPresentation(config = {}) {
  const saved = config.presentation ?? {};
  return {
    ...defaultPresentation,
    ...saved,
    branding: { ...defaultPresentation.branding, ...saved.branding },
    text: {
      zh: { ...defaultPresentation.text.zh, ...saved.text?.zh },
      en: { ...defaultPresentation.text.en, ...saved.text?.en },
    },
    home: { ...defaultPresentation.home, ...saved.home },
    footer: { ...defaultPresentation.footer, ...saved.footer },
  };
}

/** Older settings gain the current defaults without changing their saved file. */
export function resolvePresentation(config = {}) {
  return presentationSchema.parse(draftPresentation(config));
}

/** Preserve the chosen order; a works section needs actual featured work.
 * @param {z.infer<typeof presentationSchema>} presentation
 * @param {Array<{data: {category: string, featured?: boolean}}>} entries
 */
export function visibleHomeSections(presentation, entries) {
  const hasWorks = entries.some(
    (post) => post.data.category === "works" && post.data.featured,
  );
  return presentation.home.sections.filter(
    (section) => section.visible && (section.id !== "works" || hasWorks),
  );
}
