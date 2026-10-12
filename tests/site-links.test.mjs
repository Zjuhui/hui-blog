import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  defaultNavigation,
  navigationItems,
  navigationLinks,
  navigationSchema,
  linkUrlSchema,
  resolveLinkHref,
  socialLinks,
} from "../src/lib/site-links.mjs";
import { resolvePresentation } from "../src/lib/site-customization.mjs";
import {
  siteSchema,
  init,
  saveSettings,
  library,
  collectSelection,
} from "../studio/content.mjs";
import { createPreview, getPreview } from "../studio/preview-state.mjs";

const original = await readFile(
  new URL("../src/data/site.json", import.meta.url),
  "utf8",
);
const custom = (overrides = {}) => ({
  id: "contact",
  kind: "custom",
  labels: { zh: "联系我", en: "Contact" },
  url: "mailto:hello@example.com",
  visible: true,
  ...overrides,
});

test("legacy links retain their order and labels without making old settings dirty", () => {
  const legacy = JSON.parse(original);
  delete legacy.presentation;
  legacy.socialLinks = [{ label: "GitHub", url: "https://github.com/Zjuhui" }];
  assert.deepEqual(siteSchema.parse(legacy).socialLinks, legacy.socialLinks);
  assert(!Object.hasOwn(siteSchema.parse(legacy), "presentation"));
  const presentation = resolvePresentation(legacy);
  assert.deepEqual(navigationItems(presentation), defaultNavigation);
  assert.deepEqual(
    navigationLinks(presentation).map(({ label, href }) => ({ label, href })),
    [
      { label: "首页", href: "/hui-blog/" },
      { label: "文章", href: "/hui-blog/archive/" },
      { label: "作品", href: "/hui-blog/works/" },
      { label: "关于", href: "/hui-blog/about/" },
    ],
  );
  assert.equal(socialLinks(legacy)[0].href, legacy.socialLinks[0].url);
});

test("navigation supports reordering, hiding, removing and localized custom links", () => {
  const presentation = resolvePresentation({});
  presentation.text.en.writing = "Research notes";
  presentation.navigation = [
    custom(),
    { id: "research", kind: "page", page: "research", visible: true },
    { id: "writing", kind: "page", page: "writing", visible: true },
    { id: "hidden", kind: "page", page: "about", visible: false },
    custom({
      id: "zh-only",
      labels: { zh: "归档", en: " " },
      url: "/archive/",
    }),
  ];
  assert.deepEqual(
    navigationLinks(presentation, "en", "/").map(({ id, label, href }) => ({
      id,
      label,
      href,
    })),
    [
      { id: "contact", label: "Contact", href: "mailto:hello@example.com" },
      { id: "research", label: "Research", href: "/en/research/" },
      { id: "writing", label: "Research notes", href: "/en/archive/" },
    ],
  );
  assert.equal(
    navigationLinks(presentation, "zh").at(-1).href,
    "/hui-blog/archive/",
  );
  const editable = navigationItems(presentation);
  editable[0].labels.en = "A different name";
  assert.equal(presentation.navigation[0].labels.en, "Contact");
  presentation.navigation = [];
  assert.deepEqual(navigationLinks(presentation), []);
  assert.deepEqual(
    resolvePresentation({ presentation: { navigation: [] } }).navigation,
    [],
  );
});

test("internal links use the same language and base rules in Studio and production", () => {
  for (const input of [
    "/about",
    "/about/",
    "/hui-blog/about/",
    "/en/about/",
    "/hui-blog/en/about/",
  ]) {
    assert.equal(
      resolveLinkHref(input, "zh", "/hui-blog/"),
      "/hui-blog/about/",
    );
    assert.equal(
      resolveLinkHref(input, "en", "/hui-blog/"),
      "/hui-blog/en/about/",
    );
    assert.equal(resolveLinkHref(input, "zh", "/"), "/about/");
    assert.equal(resolveLinkHref(input, "en", "/"), "/en/about/");
  }
  for (const input of [
    "/",
    "/hui-blog",
    "/hui-blog/",
    "/en/",
    "/hui-blog/en/",
  ]) {
    assert.equal(resolveLinkHref(input, "zh"), "/hui-blog/");
    assert.equal(resolveLinkHref(input, "en", "/"), "/en/");
  }
  assert.equal(
    resolveLinkHref(
      "/hui-blog/en/posts/why-this-blog/?from=nav#details",
      "en",
      "/",
    ),
    "/en/posts/why-this-blog/?from=nav#details",
  );
  assert.equal(
    resolveLinkHref("https://example.com/en/?ref=blog#top", "zh", "/"),
    "https://example.com/en/?ref=blog#top",
  );
  assert.equal(
    resolveLinkHref(" mailto:hello@example.com?subject=Hello%20there "),
    "mailto:hello@example.com?subject=Hello%20there",
  );
});

test("link validation rejects unsafe destinations, unknown routes and ambiguous navigation", () => {
  for (const url of [
    "",
    " ",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "//evil.example",
    "/\\evil.example",
    "https://exa\nmple.com",
    "ftp://example.com",
    "https://",
    "mailto:",
    "mailto:missing-address",
    "/studio/",
    "/__studio/publish",
    "/unknown/",
    "/about/../studio",
    "/%2e%2e/studio",
    "/hui-blog//about/",
    "/posts/Bad-Slug/",
  ])
    assert.equal(linkUrlSchema.safeParse(url).success, false, url);
  for (const url of [
    "http://example.com",
    "https://example.com/path",
    "mailto:hello@example.com",
    "/",
    "/life/",
    "/posts/a-note/",
  ]) {
    assert.equal(linkUrlSchema.safeParse(url).success, true, url);
  }
  assert.equal(navigationSchema.safeParse([custom(), custom()]).success, false);
  assert.equal(
    navigationSchema.safeParse([
      { id: "one", kind: "page", page: "home", visible: true },
      { id: "two", kind: "page", page: "home", visible: false },
    ]).success,
    false,
  );
  assert.equal(
    navigationSchema.safeParse([custom({ id: "Not stable" })]).success,
    false,
  );
  assert.equal(
    navigationSchema.safeParse(
      Array.from({ length: 13 }, (_, n) => custom({ id: `link-${n}` })),
    ).success,
    false,
  );
});

test("social links can be hidden, removed and linked internally without empty anchors", () => {
  const config = {
    socialLinks: [
      { label: "Mail", url: "mailto:hello@example.com" },
      { label: "About", url: "/hui-blog/about/", visible: true },
      { label: "Hidden", url: "https://example.com", visible: false },
      { label: " \n", url: "https://example.com/empty" },
    ],
  };
  assert.deepEqual(
    socialLinks(config, "en", "/").map(({ label, href }) => ({ label, href })),
    [
      { label: "Mail", href: "mailto:hello@example.com" },
      { label: "About", href: "/en/about/" },
    ],
  );
  assert.deepEqual(socialLinks({ socialLinks: [] }), []);
});

test("link edits preview, reopen and publish only with selected settings", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "hui-links-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await init(root);
  await mkdir(path.join(root, "src/data"), { recursive: true });
  await mkdir(path.join(root, "src/content/posts"), { recursive: true });
  await writeFile(path.join(root, "src/data/site.json"), original);
  const config = JSON.parse(original);
  config.presentation = resolvePresentation({});
  config.presentation.navigation = [custom({ url: "/research/" })];
  config.socialLinks = [
    { label: "Email", url: "mailto:hello@example.com", visible: false },
  ];
  const expected = siteSchema.parse(config);
  assert.deepEqual(getPreview(createPreview(config)), expected);
  await saveSettings(root, config);
  assert.deepEqual((await library(root)).settings, expected);
  await assert.rejects(
    collectSelection(root, { slugs: [], settings: false }),
    /Select at least one change/,
  );
  const snapshot = await collectSelection(root, { slugs: [], settings: true });
  assert.deepEqual([...snapshot.files.keys()], ["src/data/site.json"]);
  assert.deepEqual(
    JSON.parse(snapshot.files.get("src/data/site.json").toString()),
    expected,
  );
  assert.equal(
    await readFile(path.join(root, "src/data/site.json"), "utf8"),
    original,
  );
});
