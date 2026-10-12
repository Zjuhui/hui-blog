// Run against an existing Studio server. Preview snapshots stay in memory;
// this check never changes local drafts, settings, or published content.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { defaultPresentation } from "../src/lib/site-customization.mjs";
import { resolveAppearance } from "../src/lib/appearance.mjs";

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
  "Start Blog Studio before running this check.",
);
const cookie = bootstrap.headers
  .getSetCookie()
  .find((value) => value.startsWith("hui_studio="))
  ?.split(";")[0];
assert(cookie, "Preview checks require explicit Studio mode.");
await bootstrap.arrayBuffer();

async function preview(order, visible, options = {}) {
  const config = structuredClone(published);
  config.presentation = structuredClone(defaultPresentation);
  config.appearance = {
    ...resolveAppearance(config),
    layout: options.layout ?? "index",
  };
  config.presentation.home.sections = order.map((id) => ({
    id,
    visible: visible.includes(id),
  }));
  config.presentation.branding.showMark = false;
  config.presentation.branding.showWordmark = false;
  if (options.marginOnly) {
    for (const locale of ["zh", "en"]) {
      config.intro[locale] = { eyebrow: "", title: "", body: "" };
      config.presentation.text[locale].about = "";
    }
    config.appearance.introduction = "journal";
  }
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
  assert.equal(response.status, 200, JSON.stringify(result));
  return result.id;
}

async function home(id, locale) {
  const response = await fetch(
    `${origin}/${locale === "en" ? "en/" : ""}?studioPreview=${id}`,
    {
      headers: { Cookie: cookie },
      signal: AbortSignal.timeout(30000),
    },
  );
  const html = await response.text();
  assert.equal(response.status, 200, html.slice(0, 500));
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert(main, "Render the actual Astro page, not an error document.");
  return { html, main };
}

const order = ["intro", "recent", "works", "note"];
const cases = [
  {
    name: "note hidden",
    id: await preview(order, ["intro", "recent"]),
    expected: ["intro", "recent"],
    firstWriting: false,
  },
  {
    name: "writing first",
    id: await preview(
      ["recent", "intro", "works", "note"],
      ["intro", "recent"],
    ),
    expected: ["recent", "intro"],
    firstWriting: true,
  },
  {
    name: "note before writing",
    id: await preview(["note", "recent", "intro", "works"], ["note", "recent"]),
    expected: ["note", "recent"],
    firstWriting: false,
  },
  {
    name: "all sections hidden",
    id: await preview(order, []),
    expected: [],
    firstWriting: false,
  },
  {
    name: "decorative-only intro",
    id: await preview(order, ["intro", "recent"], { marginOnly: true }),
    expected: ["recent"],
    firstWriting: true,
  },
  {
    name: "cards last",
    id: await preview(order, ["recent"], { layout: "cards" }),
    expected: ["recent"],
    firstWriting: true,
  },
];

for (const check of cases) {
  for (const locale of ["zh", "en"]) {
    const { html, main } = await home(check.id, locale);
    const sections = [
      ...main.matchAll(
        /<(?:section|aside)\b[^>]*data-studio-section="([^"]+)"/g,
      ),
    ].map((match) => match[1]);
    assert.deepEqual(
      sections,
      check.expected,
      `${check.name}: the rendered order follows only visible content.`,
    );
    assert.equal(
      /class="writing-section first-home-section"/.test(main),
      check.firstWriting,
      `${check.name}: only a genuinely first writing section receives top padding.`,
    );
    assert.equal(
      /class="home-content home-content-empty"/.test(main),
      check.expected.length === 0,
      `${check.name}: the hidden H1 must not defeat the empty-page state.`,
    );
    assert(
      !/<a\b[^>]*class="brand"/.test(html),
      "Disabled branding leaves no empty wrapper.",
    );
  }
}

console.log(
  "Verified bilingual section hiding/reordering, the empty homepage, decorative-only intro omission, and hidden branding through real Astro previews.",
);
console.log(
  "For browser border checks (list/index must have no final row bottom border; cards retain their outline):",
);
for (const check of cases)
  console.log(`${check.name}: ${origin}/?studioPreview=${check.id}`);
