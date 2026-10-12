import { z } from "zod";

/** @type {["home", "writing", "works", "about", "research", "life"]} */
export const navigationPages = [
  "home",
  "writing",
  "works",
  "about",
  "research",
  "life",
];
const pagePaths = {
  home: "",
  writing: "archive",
  works: "works",
  about: "about",
  research: "research",
  life: "life",
};
/** @type {Array<z.infer<typeof navigationItemSchema>>} */
export const defaultNavigation = ["home", "writing", "works", "about"].map(
  (page) => ({
    id: page,
    kind: "page",
    page,
    visible: true,
  }),
);

/** Custom internal links point to existing route types, never to Studio APIs. */
function internalTarget(value) {
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  const match = value.match(/^([^?#]*)([?#].*)?$/);
  if (!match) return null;
  let route = match[1]
    .replace(/^\/hui-blog(?=\/|$)/, "")
    .replace(/^\/en(?=\/|$)/, "");
  route = route.replace(/^\//, "").replace(/\/$/, "");
  if (
    !/^(?:|archive|works|about|research|life|posts\/[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(
      route,
    )
  )
    return null;
  return { route, suffix: match[2] || "" };
}

export function isSafeLinkUrl(value) {
  if (typeof value !== "string") return false;
  const url = value.trim();
  if (!url || /[\s\\\u0000-\u001f\u007f]/.test(url)) return false;
  if (url.startsWith("/")) return internalTarget(url) !== null;
  if (!/^(?:https?:\/\/|mailto:)/i.test(url)) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:")
      return !!parsed.hostname;
    return (
      parsed.protocol === "mailto:" &&
      /^[^?@]+@[^?@]+(?:\?.*)?$/.test(parsed.pathname + parsed.search)
    );
  } catch {
    return false;
  }
}

export const linkUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine(
    isSafeLinkUrl,
    "Use an http://, https:// or mailto: link, or an existing blog path such as /about/ or /posts/my-note/.",
  );
const idSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{0,63}$/,
    "Use a stable link ID with lowercase letters, numbers and hyphens.",
  );
export const navigationItemSchema = z.discriminatedUnion("kind", [
  z
    .object({
      id: idSchema,
      kind: z.literal("page"),
      page: z.enum(navigationPages),
      visible: z.boolean(),
    })
    .strict(),
  z
    .object({
      id: idSchema,
      kind: z.literal("custom"),
      labels: z
        .object({
          zh: z.string().trim().max(120),
          en: z.string().trim().max(120),
        })
        .strict(),
      url: linkUrlSchema,
      visible: z.boolean(),
    })
    .strict(),
]);
export const navigationSchema = z
  .array(navigationItemSchema)
  .max(12)
  .superRefine((items, ctx) => {
    const ids = new Set();
    const pages = new Set();
    items.forEach((item, index) => {
      if (ids.has(item.id))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "id"],
          message: "Each link needs a unique ID.",
        });
      ids.add(item.id);
      if (item.kind === "page") {
        if (pages.has(item.page))
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, "page"],
            message: "This page is already in the navigation.",
          });
        pages.add(item.page);
      }
    });
  });

/** Missing navigation means the old four links; an explicit empty list stays empty.
 * @param {{navigation?: Array<z.infer<typeof navigationItemSchema>>}} presentation
 * @returns {Array<z.infer<typeof navigationItemSchema>>}
 */
export function navigationItems(presentation = {}) {
  return (presentation.navigation ?? defaultNavigation).map((item) => ({
    ...item,
    ...(item.kind === "custom" ? { labels: { ...item.labels } } : {}),
  }));
}

/** Internal paths follow the current UI language and the deployment base. */
export function resolveLinkHref(value, locale = "zh", base = "/hui-blog/") {
  const url = linkUrlSchema.parse(value);
  const internal = internalTarget(url);
  if (!internal) return url;
  const prefix = base.replace(/\/$/, "");
  return `${prefix}/${locale === "en" ? "en/" : ""}${internal.route}${internal.route ? "/" : ""}${internal.suffix}`;
}

export function navigationLinks(
  presentation,
  locale = "zh",
  base = "/hui-blog/",
) {
  return navigationItems(presentation).flatMap((item) => {
    const label = (
      item.kind === "page"
        ? presentation.text?.[locale]?.[item.page]
        : item.labels[locale]
    )?.trim();
    if (!item.visible || !label) return [];
    return [
      {
        id: item.id,
        label,
        href: resolveLinkHref(
          item.kind === "page" ? `/${pagePaths[item.page]}` : item.url,
          locale,
          base,
        ),
        ...(item.kind === "page" ? { page: item.page } : {}),
      },
    ];
  });
}

/** Keep old saved rows unchanged while treating an absent visibility flag as visible.
 * @param {{socialLinks?: Array<{label: string, url: string, visible?: boolean}>}} config
 * @returns {Array<{label: string, url: string, visible?: boolean, href: string}>}
 */
export function socialLinks(config, locale = "zh", base = "/hui-blog/") {
  return (config.socialLinks ?? []).flatMap((item) => {
    const label = item.label.trim();
    return item.visible !== false && label
      ? [{ ...item, label, href: resolveLinkHref(item.url, locale, base) }]
      : [];
  });
}
