// Manual regression check against an already running Blog Studio.
// Only temporary, in-memory preview snapshots are created; local drafts stay untouched.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolvePresentation } from "../src/lib/site-customization.mjs";

const origin = "http://127.0.0.1:4321";
const published = JSON.parse(
  await readFile(new URL("../src/data/site.json", import.meta.url), "utf8"),
);
const bootstrap = await fetch(`${origin}/studio/`, {
  signal: AbortSignal.timeout(30000),
});
assert.equal(
  bootstrap.status,
  200,
  "Open Blog Studio before running this check.",
);
const cookie = bootstrap.headers
  .getSetCookie()
  .find((value) => value.startsWith("hui_studio="))
  ?.split(";")[0];
assert(cookie, "The server must run in explicit Studio mode.");
await bootstrap.arrayBuffer();

async function preview(config) {
  const response = await fetch(`${origin}/__studio/preview`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
    signal: AbortSignal.timeout(30000),
  });
  const result = await response.json();
  assert.equal(
    response.status,
    200,
    `Preview validation failed: ${JSON.stringify(result)}`,
  );
  assert.match(
    result.id,
    /^[a-f0-9]{48}$/,
    "Preview should be held in memory.",
  );
  return result.id;
}

async function page(route, id) {
  const response = await fetch(`${origin}/${route}?studioPreview=${id}`, {
    headers: { Cookie: cookie },
    signal: AbortSignal.timeout(30000),
  });
  const html = await response.text();
  assert.equal(
    response.status,
    200,
    `Astro must render ${route || "/"}: ${html.slice(0, 500)}`,
  );
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  assert(
    html.includes('class="preview-banner"'),
    "Use the actual Studio Astro template.",
  );
  return html;
}

const decode = (value) =>
  value
    .replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi, (_, hex, decimal) =>
      String.fromCodePoint(parseInt(hex ?? decimal, hex ? 16 : 10)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
const text = (html) =>
  decode(html.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*↗$/, "");
function links(html = "") {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((match) => ({
    label: text(match[2]),
    href: decode(match[1].match(/\bhref="([^"]*)"/)?.[1] ?? ""),
    current: match[1].includes('aria-current="page"'),
  }));
}
function mainNav(html, locale) {
  return html.match(
    new RegExp(
      `<nav\\b[^>]*aria-label="${locale === "zh" ? "主导航" : "Main navigation"}"[^>]*>([\\s\\S]*?)<\\/nav>`,
    ),
  )?.[1];
}
const footer = (html) =>
  html.match(
    /<footer\b[^>]*class="site-footer"[^>]*>([\s\S]*?)<\/footer>/,
  )?.[1];
const aboutLinks = (html) =>
  html.match(/<div\b[^>]*class="about-links"[^>]*>([\s\S]*?)<\/div>/)?.[1];
const plainLinks = (html) =>
  links(html).map(({ label, href }) => ({ label, href }));

const config = structuredClone(published);
config.presentation = resolvePresentation({});
config.presentation.navigation = [
  {
    id: "docs",
    kind: "custom",
    labels: { zh: "文档与笔记", en: "Docs & notes" },
    url: "https://example.com/docs?from=menu&view=all#start",
    visible: true,
  },
  { id: "research", kind: "page", page: "research", visible: true },
  { id: "writing", kind: "page", page: "writing", visible: false },
  {
    id: "about-link",
    kind: "custom",
    labels: { zh: "关于链接", en: "About link" },
    url: "/hui-blog/en/about/?from=menu&view=all#details",
    visible: true,
  },
  { id: "home", kind: "page", page: "home", visible: true },
  {
    id: "zh-only",
    kind: "custom",
    labels: { zh: "中文专用", en: " \t" },
    url: "/life/",
    visible: true,
  },
];
config.socialLinks = [
  { label: "Email", url: "mailto:hello@example.com?subject=Hello%20there" },
  { label: "Hidden social", url: "https://example.com/hidden", visible: false },
  {
    label: "About",
    url: "/hui-blog/en/about/?from=social&view=all#details",
    visible: true,
  },
  { label: " \n", url: "https://example.com/blank" },
  { label: "Resources", url: "https://example.com/resources" },
];
const id = await preview(config);
for (const locale of ["zh", "en"]) {
  const prefix = locale === "en" ? "en/" : "";
  const expectedNav = [
    {
      label: locale === "zh" ? "文档与笔记" : "Docs & notes",
      href: "https://example.com/docs?from=menu&view=all#start",
    },
    {
      label: config.presentation.text[locale].research,
      href: `/${prefix}research/`,
    },
    {
      label: locale === "zh" ? "关于链接" : "About link",
      href: `/${prefix}about/?from=menu&view=all#details`,
    },
    { label: config.presentation.text[locale].home, href: `/${prefix}` },
    ...(locale === "zh" ? [{ label: "中文专用", href: "/life/" }] : []),
  ];
  const expectedSocial = [
    { label: "Email", href: "mailto:hello@example.com?subject=Hello%20there" },
    { label: "About", href: `/${prefix}about/?from=social&view=all#details` },
    { label: "Resources", href: "https://example.com/resources" },
  ];
  for (const route of ["", "about/", "research/"]) {
    const html = await page(`${prefix}${route}`, id);
    assert.deepEqual(
      plainLinks(mainNav(html, locale)),
      expectedNav,
      `${locale} ${route}: menu order, labels, hidden entries and destinations`,
    );
    assert.deepEqual(
      plainLinks(footer(html)),
      expectedSocial,
      `${locale} ${route}: footer links`,
    );
    if (route === "about/")
      assert.deepEqual(
        plainLinks(aboutLinks(html)),
        expectedSocial,
        `${locale}: About links match the footer`,
      );
    if (route === "research/")
      assert.equal(
        links(mainNav(html, locale))
          .filter((link) => link.current)
          .map((link) => link.href)
          .join(),
        `/${prefix}research/`,
        "The category entry is active when present.",
      );
    assert(!html.includes("https://example.com/hidden"));
    assert(!html.includes("https://example.com/blank"));
  }
}

const removed = structuredClone(config);
removed.presentation.navigation = removed.presentation.navigation.filter(
  (item) => item.id !== "about-link",
);
removed.socialLinks = removed.socialLinks.filter(
  (item) => item.label !== "Resources",
);
const removedId = await preview(removed);
for (const locale of ["zh", "en"]) {
  const prefix = locale === "en" ? "en/" : "";
  const html = await page(`${prefix}about/`, removedId);
  assert(
    !links(mainNav(html, locale)).some(
      (link) => link.href.includes("from=menu") && link.href.startsWith("/"),
    ),
    "Removing a menu entry removes only its anchor.",
  );
  assert(
    !html.includes("https://example.com/resources"),
    "Removed social links disappear from the footer and About page.",
  );
  assert(
    html.includes('class="about-page"'),
    "Removing a link must not remove its page.",
  );
}

const empty = structuredClone(config);
empty.presentation.navigation = [];
empty.socialLinks = [];
empty.presentation.footer = { showMark: false, showCopyright: false };
for (const locale of ["zh", "en"]) empty.presentation.text[locale].footer = "";
const emptyId = await preview(empty);
for (const locale of ["zh", "en"]) {
  const prefix = locale === "en" ? "en/" : "";
  const html = await page(`${prefix}about/`, emptyId);
  assert.equal(
    mainNav(html, locale),
    undefined,
    "An explicitly empty menu must not restore legacy links.",
  );
  assert.equal(
    aboutLinks(html),
    undefined,
    "Empty social lists leave no About links shell.",
  );
  assert.equal(
    footer(html),
    undefined,
    "An entirely disabled footer leaves no separator shell.",
  );
  assert(
    html.includes('class="locale-switch"'),
    "Language switching stays available.",
  );
}

console.log(
  "Verified configurable navigation and social links in both languages through live Astro previews: ordering, visibility, removal, empty lists, internal paths and email/external URLs. No local draft files were changed.",
);
