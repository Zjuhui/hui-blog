import { z } from "zod";

export const fonts = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif',
  serif: '"Noto Serif SC", "Songti SC", "SimSun", Georgia, serif',
  literary: '"Kaiti SC", "KaiTi", "STKaiti", "Noto Serif SC", Georgia, serif',
  mono: '"Cascadia Code", "SFMono-Regular", Consolas, "Microsoft YaHei", monospace',
};
export const accents = { cinnabar: "#9e4337", sage: "#45624e", ink: "#426078" };
const hex = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, "Use a six-digit hex color.")
  .transform((value) => value.toLowerCase());
export const appearanceSchema = z
  .object({
    background: hex,
    text: hex,
    accent: hex,
    headingFont: z.enum(["sans", "serif", "literary", "mono"]),
    bodyFont: z.enum(["sans", "serif", "literary", "mono"]),
    fontSize: z.number().int().min(15).max(22),
    lineHeight: z.number().min(1.5).max(2.3),
    readingWidth: z.number().int().min(600).max(840),
    layout: z.enum(["list", "cards", "index"]),
    spacing: z.enum(["comfortable", "compact"]),
    navigation: z.enum(["top", "sidebar"]).default("top"),
    introduction: z.enum(["journal", "compact"]).default("journal"),
    showToc: z.boolean().default(false),
  })
  .strict();

export const defaultAppearance = {
  background: "#f8f6f1",
  text: "#302e2a",
  accent: accents.cinnabar,
  headingFont: "serif",
  bodyFont: "sans",
  fontSize: 17,
  lineHeight: 2,
  readingWidth: 720,
  layout: "list",
  spacing: "comfortable",
  navigation: "top",
  introduction: "journal",
  showToc: false,
};
export const presets = [
  {
    id: "journal",
    zh: "温暖手记",
    en: "Warm Journal",
    description: {
      zh: "米白纸色、宋体标题，适合生活与长文。",
      en: "Warm paper and serif headings for personal stories.",
    },
    values: { ...defaultAppearance },
  },
  {
    id: "minimal",
    zh: "简洁留白",
    en: "Clean Minimal",
    description: {
      zh: "纯白底色、清晰黑体，让文字站在前面。",
      en: "White space and clear sans-serif type for focused notes.",
    },
    values: {
      ...defaultAppearance,
      background: "#ffffff",
      text: "#25282c",
      accent: "#345781",
      headingFont: "sans",
      fontSize: 18,
      lineHeight: 1.8,
      readingWidth: 760,
      spacing: "compact",
    },
  },
  {
    id: "forest",
    zh: "林间笔记",
    en: "Forest Notes",
    description: {
      zh: "浅绿底色、楷体标题，卡片收纳日常。",
      en: "Soft green, literary headings, and a card-based index.",
    },
    values: {
      ...defaultAppearance,
      background: "#f1f4ed",
      text: "#29382c",
      accent: "#3e6147",
      headingFont: "literary",
      layout: "cards",
      lineHeight: 1.9,
    },
  },
  {
    id: "night",
    zh: "夜读时分",
    en: "Night Reading",
    description: {
      zh: "深墨底色、暖色文字，安静的阅读空间。",
      en: "Deep charcoal and warm text for a quiet reading space.",
    },
    values: {
      ...defaultAppearance,
      background: "#242725",
      text: "#e9e5db",
      accent: "#dcb18b",
      bodyFont: "serif",
      fontSize: 18,
      lineHeight: 1.9,
      readingWidth: 680,
    },
  },
];

// Original compositions informed by the linked sites' reading and navigation patterns.
export const technicalPresets = [
  {
    id: "developer-index",
    zh: "开发者索引",
    en: "Developer Index",
    description: {
      zh: "简短介绍、日期对齐的文章目录，快速找到记录。",
      en: "A short introduction and date-aligned index for quick scanning.",
    },
    references: [
      { name: "Lee Robinson", url: "https://leerob.com/" },
      { name: "Tania Rascia", url: "https://www.taniarascia.com/" },
    ],
    values: {
      ...defaultAppearance,
      background: "#ffffff",
      text: "#292d33",
      accent: "#315a8b",
      headingFont: "sans",
      fontSize: 17,
      lineHeight: 1.85,
      readingWidth: 720,
      layout: "index",
      spacing: "compact",
      introduction: "compact",
    },
  },
  {
    id: "technical-notes",
    zh: "技术札记",
    en: "Technical Notes",
    description: {
      zh: "等宽标题、单栏摘要与文章目录，适合教程和技术长文。",
      en: "Monospace headings, a single-column feed, and an article contents list.",
    },
    references: [{ name: "AstroPaper", url: "https://astro-paper.pages.dev/" }],
    values: {
      ...defaultAppearance,
      background: "#f7f8fa",
      text: "#273340",
      accent: "#075c85",
      headingFont: "mono",
      fontSize: 17,
      lineHeight: 1.85,
      readingWidth: 700,
      spacing: "compact",
      introduction: "compact",
      showToc: true,
    },
  },
  {
    id: "sidebar-notebook",
    zh: "侧栏笔记本",
    en: "Sidebar Notebook",
    description: {
      zh: "桌面侧栏导航、清晰的文章目录，适合长期整理知识。",
      en: "Desktop sidebar navigation and article contents for a growing notebook.",
    },
    references: [{ name: "NexT", url: "https://theme-next.js.org/" }],
    values: {
      ...defaultAppearance,
      background: "#fafafa",
      text: "#30343a",
      accent: "#465ba2",
      headingFont: "sans",
      fontSize: 17,
      lineHeight: 1.9,
      readingWidth: 720,
      navigation: "sidebar",
      introduction: "compact",
      showToc: true,
    },
  },
];
export const allPresets = [...technicalPresets, ...presets];

export function appearanceAttributes(input) {
  const a = appearanceSchema.parse(input);
  return {
    "data-layout": a.layout,
    "data-navigation": a.navigation,
    "data-intro": a.introduction,
    "data-toc": String(a.showToc),
  };
}

// Old settings contain only a named accent. Reading them must not change the site.
export function resolveAppearance(config) {
  return appearanceSchema.parse(
    config.appearance ?? {
      ...defaultAppearance,
      accent: accents[config.accent] ?? accents.cinnabar,
    },
  );
}
function channels(color) {
  return [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16));
}
function luminance(color) {
  const [r, g, b] = channels(color).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function contrastIssues(value) {
  return ["text", "accent"].filter(
    (key) => contrast(value[key], value.background) < 4.5,
  );
}
export function mix(a, b, weight) {
  const other = channels(b);
  return (
    "#" +
    channels(a)
      .map((c, i) =>
        Math.round(c * weight + other[i] * (1 - weight))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function appearanceVariables(input) {
  const a = appearanceSchema.parse(input);
  let surface = mix(a.text, a.background, 0.045);
  if ([a.text, a.accent].some((color) => contrast(color, surface) < 4.5))
    surface = a.background;
  let muted = mix(a.text, a.background, 0.7);
  if ([a.background, surface].some((color) => contrast(muted, color) < 4.5))
    muted = a.text;
  return {
    "--paper": a.background,
    "--ink": a.text,
    "--accent": a.accent,
    "--muted": muted,
    "--line": mix(a.text, a.background, 0.16),
    "--surface": surface,
    "--selection": mix(a.accent, a.background, 0.22),
    "--serif": fonts[a.headingFont],
    "--body-font": fonts[a.bodyFont],
    "--reading-size": `${a.fontSize}px`,
    "--reading-line-height": String(a.lineHeight),
    "--reading-width": `${a.readingWidth}px`,
    "--row-space": a.spacing === "compact" ? "18px" : "28px",
    "--intro-space": a.spacing === "compact" ? "52px" : "86px",
    "color-scheme": luminance(a.background) < 0.15 ? "dark" : "light",
  };
}
