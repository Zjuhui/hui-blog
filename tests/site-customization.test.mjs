import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  defaultPresentation,
  editableTextKeys,
  presentationSchema,
  draftPresentation,
  resolvePresentation,
  visibleHomeSections,
} from "../src/lib/site-customization.mjs";
import {
  init,
  saveSettings,
  library,
  collectSelection,
  siteSchema,
} from "../studio/content.mjs";

const original = await readFile(
  new URL("../src/data/site.json", import.meta.url),
  "utf8",
);

test("existing site settings preserve their branding, labels and homepage order", () => {
  const legacy = JSON.parse(original);
  delete legacy.presentation;
  assert.deepEqual(resolvePresentation(legacy), defaultPresentation);
  assert(!Object.hasOwn(siteSchema.parse(legacy), "presentation"));
  const updated = resolvePresentation({
    presentation: {
      branding: { showMark: false },
      text: { en: { writing: "Research" } },
    },
  });
  assert.equal(updated.branding.showMark, false);
  assert.equal(updated.branding.wordmark, "Hui");
  assert.equal(updated.text.en.writing, "Research");
  assert.equal(updated.text.zh.writing, "文章");
  assert.deepEqual(Object.keys(updated.text.zh), editableTextKeys);
});

test("homepage order and visibility are independent, and empty works stay omitted", () => {
  const presentation = resolvePresentation({});
  presentation.home.sections = [
    { id: "works", visible: true },
    { id: "recent", visible: true },
    { id: "intro", visible: false },
    { id: "note", visible: true },
  ];
  const article = { data: { category: "research", featured: true } };
  const work = { data: { category: "works", featured: true } };
  assert.deepEqual(
    visibleHomeSections(presentation, [article]).map((s) => s.id),
    ["recent", "note"],
  );
  assert.deepEqual(
    visibleHomeSections(presentation, [article, work]).map((s) => s.id),
    ["works", "recent", "note"],
  );
  assert.deepEqual(
    visibleHomeSections(presentation, [
      { data: { ...work.data, featured: false } },
    ]).map((s) => s.id),
    ["recent", "note"],
  );
});

test("customization validates section uniqueness, sizes and navigation labels", () => {
  const incomplete = draftPresentation({
    presentation: { text: { zh: { home: "" } } },
  });
  assert.equal(incomplete.text.zh.home, "");
  assert.equal(incomplete.text.en.home, "Home");
  assert.throws(() => presentationSchema.parse(incomplete));
  for (const change of [
    (p) => {
      p.home.sections[0].id = "recent";
    },
    (p) => {
      p.home.sections.pop();
    },
    (p) => {
      p.home.sections[0].id = "unknown";
    },
    (p) => {
      p.home.recentLimit = 0;
    },
    (p) => {
      p.home.recentLimit = 21;
    },
    (p) => {
      p.text.en.home = " ";
    },
    (p) => {
      p.branding.wordmark = "x".repeat(81);
    },
    (p) => {
      p.footer.showCopyright = "false";
    },
  ]) {
    const presentation = resolvePresentation({});
    change(presentation);
    assert.throws(() => presentationSchema.parse(presentation));
  }
  const hidden = resolvePresentation({
    presentation: {
      branding: {
        showMark: false,
        showWordmark: false,
        mark: "",
        wordmark: "",
      },
      home: {
        sections: defaultPresentation.home.sections.map((section) => ({
          ...section,
          visible: false,
        })),
      },
    },
  });
  assert.deepEqual(visibleHomeSections(hidden, []), []);
});

test("branding, bilingual text and homepage choices save locally and survive a selected publication", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "hui-presentation-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await init(root);
  await mkdir(path.join(root, "src/data"), { recursive: true });
  await mkdir(path.join(root, "src/content/posts"), { recursive: true });
  await writeFile(path.join(root, "src/data/site.json"), original);
  const presentation = resolvePresentation({});
  presentation.branding = {
    mark: "",
    wordmark: "Field notes",
    showMark: false,
    showWordmark: true,
  };
  presentation.text.en.writing = "Research";
  presentation.text.zh.works = "经历";
  presentation.home.sections.reverse();
  presentation.home.recentLimit = 3;
  await saveSettings(root, {
    ...JSON.parse(original),
    name: "Field notes",
    presentation,
  });
  assert.equal(
    await readFile(path.join(root, "src/data/site.json"), "utf8"),
    original,
  );
  assert.deepEqual((await library(root)).settings.presentation, presentation);
  const selection = await collectSelection(root, { slugs: [], settings: true });
  assert.deepEqual([...selection.files.keys()], ["src/data/site.json"]);
  const serialized = JSON.parse(
    selection.files.get("src/data/site.json").toString(),
  );
  assert.deepEqual(resolvePresentation(serialized), presentation);
});
