import { z } from "zod";

export const fonts = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif',
  serif: '"Noto Serif SC", "Songti SC", "SimSun", Georgia, serif',
  literary: '"Kaiti SC", "KaiTi", "STKaiti", "Noto Serif SC", Georgia, serif',
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
    headingFont: z.enum(["sans", "serif", "literary"]),
    bodyFont: z.enum(["sans", "serif", "literary"]),
    fontSize: z.number().int().min(15).max(22),
    lineHeight: z.number().min(1.5).max(2.3),
    readingWidth: z.number().int().min(600).max(840),
    layout: z.enum(["list", "cards"]),
    spacing: z.enum(["comfortable", "compact"]),
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
