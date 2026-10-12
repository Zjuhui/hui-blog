import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  appearanceSchema,
  appearanceVariables,
  contrast,
  contrastIssues,
  defaultAppearance,
  presets,
  allPresets,
  technicalPresets,
  appearanceAttributes,
  resolveAppearance,
} from "../src/lib/appearance.mjs";
import {
  init,
  saveSettings,
  library,
  collectSelection,
  editPost,
  siteSchema,
} from "../studio/content.mjs";

const original = await readFile(
  new URL("../src/data/site.json", import.meta.url),
  "utf8",
);
test("legacy settings retain their named accent; presets have readable foregrounds", () => {
  assert.deepEqual(resolveAppearance({ accent: "cinnabar" }), defaultAppearance);
  assert.equal(resolveAppearance({ accent: "sage" }).accent, "#45624e");
  for (const preset of allPresets) {
    const a = appearanceSchema.parse(preset.values);
    assert.deepEqual(contrastIssues(a), [], preset.id);
    const css = appearanceVariables(a);
    assert(contrast(css["--muted"], a.background) >= 4.5, preset.id);
    assert(contrast(a.text, css["--surface"]) >= 4.5, preset.id);
    assert(contrast(a.accent, css["--surface"]) >= 4.5, preset.id);
    assert(contrast(css["--muted"], css["--surface"]) >= 4.5, preset.id);
  }
  assert.equal(
    appearanceVariables(presets.find((p) => p.id === "night").values)[
      "color-scheme"
    ],
    "dark",
  );
});
test("saved styles from before layout presets keep their original structure", () => {
  const { navigation, introduction, showToc, ...oldAppearance } =
    defaultAppearance;
  assert.deepEqual(
    resolveAppearance({ appearance: oldAppearance }),
    defaultAppearance,
  );
  assert.deepEqual(appearanceAttributes(oldAppearance), {
    "data-layout": "list",
    "data-navigation": "top",
    "data-intro": "journal",
    "data-toc": "false",
  });
  const layouts = technicalPresets.map((preset) =>
    appearanceAttributes(preset.values),
  );
  assert.equal(layouts[0]["data-layout"], "index");
  assert.equal(layouts[1]["data-toc"], "true");
  assert.equal(layouts[2]["data-navigation"], "sidebar");
});
test("appearance rejects injected CSS, unknown fonts, unreadable palettes and out-of-range sizes", () => {
  for (const patch of [
    { background: "red;display:none" },
    { accent: "url(https://evil.test)" },
    { headingFont: "arbitrary" },
    { fontSize: 100 },
    { lineHeight: 0 },
    { readingWidth: 99999 },
    { layout: "unknown" },
    { spacing: "negative" },
    { navigation: "floating" },
    { introduction: "unknown" },
    { showToc: "yes" },
    { text: defaultAppearance.background },
    { accent: defaultAppearance.background },
  ])
    assert.throws(() =>
      siteSchema.parse({
        ...JSON.parse(original),
        appearance: { ...defaultAppearance, ...patch },
      }),
    );
});
test("custom appearance saves and reopens locally and publishes only when settings are selected", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "hui-appearance-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await init(root);
  await mkdir(path.join(root, "src/data"), { recursive: true });
  await mkdir(path.join(root, "src/content/posts"), { recursive: true });
  await writeFile(path.join(root, "src/data/site.json"), original);
  const sample = await readFile(
    new URL("../src/content/posts/why-this-blog.mdoc", import.meta.url),
    "utf8",
  );
  await writeFile(path.join(root, "src/content/posts/example.mdoc"), sample);
  const appearance = {
    ...technicalPresets.find((preset) => preset.id === "sidebar-notebook")
      .values,
    bodyFont: "serif",
    fontSize: 20,
    readingWidth: 800,
    lineHeight: 2.15,
  };
  await saveSettings(root, { ...JSON.parse(original), appearance });
  assert.equal(
    await readFile(path.join(root, "src/data/site.json"), "utf8"),
    original,
  );
  const reopened = await library(root);
  assert.deepEqual(reopened.settings.appearance, appearance);
  const selected = await collectSelection(root, { slugs: [], settings: true });
  assert.deepEqual([...selected.files.keys()], ["src/data/site.json"]);
  assert.deepEqual(
    JSON.parse(selected.files.get("src/data/site.json").toString()).appearance,
    appearance,
  );
  await editPost(root, "example");
  const postsOnly = await collectSelection(root, {
    slugs: ["example"],
    settings: false,
  });
  assert(!postsOnly.files.has("src/data/site.json"));
});
