// Manual regression check against an already running Blog Studio.
// All configurations live only in the server's temporary preview memory.
// This script never reads or writes the user's local settings or draft files.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { defaultPresentation } from "../src/lib/site-customization.mjs";

const origin = "http://127.0.0.1:4321";
const published = JSON.parse(
  await readFile(new URL("../src/data/site.json", import.meta.url), "utf8"),
);
const bootstrap = await fetch(`${origin}/studio/`, {
  signal: AbortSignal.timeout(30000),
});
assert.equal(bootstrap.status, 200, "Open Blog Studio before running this check.");
const cookie = bootstrap.headers.getSetCookie()
  .find((value) => value.startsWith("hui_studio="))?.split(";")[0];
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
  assert.equal(response.status, 200, `Preview validation failed: ${JSON.stringify(result)}`);
  assert.match(result.id, /^[a-f0-9]{48}$/, "Preview should be held in memory.");
  return result.id;
}

async function page(route, id) {
  const response = await fetch(`${origin}/${route}?studioPreview=${id}`, {
    headers: { Cookie: cookie },
    signal: AbortSignal.timeout(30000),
  });
  const html = await response.text();
  assert.equal(response.status, 200, `Astro must render ${route || "/"}: ${html.slice(0, 500)}`);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  assert(html.includes('class="preview-banner"'), "The result must be the actual Studio page template.");
  return html;
}

function hasClass(html, name) {
  return [...html.matchAll(/class="([^"]*)"/g)].some((match) =>
    match[1].split(/\s+/).includes(name),
  );
}

function withoutClasses(html, names) {
  for (const name of names)
    assert(!hasClass(html, name), `Empty ${name} should not leave a visible shell.`);
}

function title(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/)?.[1].trim();
}

function prose(html) {
  return html.match(/<div class="prose">([\s\S]*?)<\/div>/)?.[1]
    .replace(/\s+/g, " ").trim();
}

function common(html, locale) {
  withoutClasses(html, ["brand", "site-footer"]);
  assert(!html.includes(`aria-label="${locale === "zh" ? "主导航" : "Main navigation"}"`));
  assert(title(html), "The document keeps a useful fallback browser title.");
  assert(!/^\s*·|·\s*$/.test(title(html)), "A blank name must not leave a dangling title separator.");
  assert(!/<h[1-6]\b[^>]*>\s*<\/h[1-6]>/.test(html), "No empty heading should remain.");
  assert(!/<a\b[^>]*>\s*<\/a>/.test(html), "No empty link should remain.");
}

function blankConfiguration(value) {
  const config = structuredClone(published);
  config.name = value;
  config.presentation = structuredClone(defaultPresentation);
  config.presentation.branding.mark = value;
  config.presentation.branding.wordmark = value;
  for (const locale of ["zh", "en"]) {
    for (const key of Object.keys(config.intro[locale]))
      config.intro[locale][key] = value;
    config.about[locale] = value;
    for (const key of Object.keys(config.presentation.text[locale]))
      config.presentation.text[locale][key] = value;
  }
  config.quote = value;
  config.showQuote = true;
  config.socialLinks = [{ label: value, url: "https://github.com/Zjuhui" }];
  return config;
}

const normal = structuredClone(published);
normal.name = "Blank text check";
normal.intro.zh.title = "保留这个标题";
normal.intro.en.title = "Keep this heading";
normal.presentation = structuredClone(defaultPresentation);
const normalId = await preview(normal);
const originals = new Map();
for (const locale of ["zh", "en"]) {
  const prefix = locale === "en" ? "en/" : "";
  const home = await page(prefix, normalId);
  assert.equal(title(home), `${normal.intro[locale].title} · ${normal.name}`);
  assert(home.includes(`<h1>${normal.intro[locale].title}</h1>`));
  assert(hasClass(home, "intro"), "Nonempty text must continue rendering.");
  for (const slug of ["why-this-blog", "how-to-make-this-blog"]) {
    const article = await page(`${prefix}posts/${slug}/`, normalId);
    assert(prose(article), "Authored article content must be nonempty.");
    originals.set(`${prefix}${slug}`, { prose: prose(article), title: article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] });
  }
}

for (const value of ["", " \t\n　 "]) {
  const id = await preview(blankConfiguration(value));
  for (const locale of ["zh", "en"]) {
    const prefix = locale === "en" ? "en/" : "";
    const home = await page(prefix, id);
    common(home, locale);
    withoutClasses(home, ["intro", "endnote", "section-heading", "eyebrow"]);
    assert(home.includes(`href="/${prefix}posts/why-this-blog/"`), "Blank labels must not remove article routes.");

    const archive = await page(`${prefix}archive/`, id);
    common(archive, locale);
    withoutClasses(archive, ["eyebrow", "page-description", "filters", "language-note"]);
    assert(!/<section class="archive-page"[^>]*>\s*<header/.test(archive), "Empty archive header must be omitted.");
    for (const route of ["research/", "life/", "works/"])
      common(await page(`${prefix}${route}`, id), locale);

    const about = await page(`${prefix}about/`, id);
    common(about, locale);
    withoutClasses(about, ["prose", "about-links", "eyebrow"]);
    assert(!/<blockquote\b/.test(about), "Enabled but empty quote should be hidden.");

    for (const slug of ["why-this-blog", "how-to-make-this-blog"]) {
      const article = await page(`${prefix}posts/${slug}/`, id);
      common(article, locale);
      withoutClasses(article, ["back-link", "article-end"]);
      const original = originals.get(`${prefix}${slug}`);
      assert.equal(prose(article), original.prose, "Blank site text must not change authored article wording.");
      assert.equal(article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1], original.title);
      const metadata = article.match(/<div class="meta">([\s\S]*?)<\/div>/)?.[1];
      assert.equal(metadata?.match(/·/g)?.length, 1, "Date and language keep exactly one separator after hiding category.");
      assert(article.includes(`href="/${locale === "zh" ? "en/" : ""}posts/${slug}/"`), "Language switch keeps the article URL.");
    }
  }
}

console.log("Verified empty and whitespace-only text through the live Astro preview: hidden empty areas, valid headings and links, intact routes and article bodies, and preserved nonempty content. No local draft files were changed.");
