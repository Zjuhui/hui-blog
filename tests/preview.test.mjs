import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  readdir,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createPreview,
  getPreview,
  previewSettings,
  createPreviewSynchronizer,
} from "../studio/preview-state.mjs";

const published = JSON.parse(
  await readFile(new URL("../src/data/site.json", import.meta.url), "utf8"),
);
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "hui-preview-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, ".studio/posts"), { recursive: true });
  await mkdir(path.join(root, "src/content/posts"), { recursive: true });
  return root;
}
test("unsaved preview snapshots render full settings without touching drafts or publication", async (t) => {
  const root = await fixture(t);
  const saved = structuredClone(published);
  saved.intro.zh.title = "Saved local introduction";
  await writeFile(path.join(root, ".studio/site.json"), JSON.stringify(saved));
  const savedFiles = await readdir(path.join(root, ".studio"));
  const input = structuredClone(saved);
  input.intro.zh.title = "Unsaved canvas introduction";
  input.about.en = "Unsaved About copy";
  const id = createPreview(input);
  input.intro.zh.title = "Later input must not mutate this snapshot";
  const url = new URL(`http://127.0.0.1:4321/?studioPreview=${id}`);
  const preview = await previewSettings(root, url, published);
  assert.equal(preview.intro.zh.title, "Unsaved canvas introduction");
  assert.equal(preview.about.en, "Unsaved About copy");
  preview.about.en = "Caller mutation";
  assert.equal(getPreview(id).about.en, "Unsaved About copy");
  assert.equal(
    (await previewSettings(root, new URL("http://127.0.0.1:4321/"), published))
      .intro.zh.title,
    saved.intro.zh.title,
  );
  assert.equal(
    await readFile(path.join(root, ".studio/site.json"), "utf8"),
    JSON.stringify(saved),
  );
  assert.deepEqual(await readdir(path.join(root, ".studio")), savedFiles);
  assert.throws(() =>
    createPreview({
      ...saved,
      socialLinks: [{ label: "Bad", url: "javascript:alert(1)" }],
    }),
  );
  assert.throws(() => getPreview("missing"), /unavailable/);
});
test("saved preview settings reread current disk contents and surface errors", async (t) => {
  const root = await fixture(t);
  assert.deepEqual(
    await previewSettings(root, undefined, published),
    published,
  );
  const local = structuredClone(published);
  for (const title of ["First saved title", "Next saved title"]) {
    local.intro.zh.title = title;
    await writeFile(
      path.join(root, ".studio/site.json"),
      JSON.stringify(local),
    );
    assert.equal(
      (await previewSettings(root, undefined, published)).intro.zh.title,
      title,
    );
  }
  await writeFile(path.join(root, ".studio/site.json"), "{invalid");
  await assert.rejects(previewSettings(root, undefined, published));
});
test("article previews await saved changes including same-size replacements and new draft routes", async (t) => {
  const root = await fixture(t);
  const publishedFile = path.join(root, "src/content/posts/existing.mdoc");
  const draftFile = path.join(root, ".studio/posts/existing.mdoc");
  await writeFile(publishedFile, "published body");
  let refreshes = 0;
  let rendering;
  const sync = createPreviewSynchronizer(root, async () => {
    refreshes++;
    try {
      rendering = await readFile(draftFile, "utf8");
    } catch {
      rendering = await readFile(publishedFile, "utf8");
    }
  });
  await sync();
  assert.equal(rendering, "published body");
  await writeFile(draftFile, "draft body A");
  await Promise.all([sync(), sync(), sync()]);
  assert.equal(rendering, "draft body A");
  assert.equal(refreshes, 2, "repeated preview requests share a refresh");
  await writeFile(draftFile, "draft body B");
  await sync();
  assert.equal(rendering, "draft body B");
  await writeFile(path.join(root, ".studio/posts/new-note.mdoc"), "new route");
  assert.equal(await sync(), true);
  assert.equal(await sync(), false);
  assert.equal(await readFile(publishedFile, "utf8"), "published body");
  await rm(draftFile);
  await sync();
  assert.equal(rendering, "published body");
});
test("a failed content refresh is retried instead of serving a stale successful snapshot", async (t) => {
  const root = await fixture(t);
  let attempts = 0;
  const sync = createPreviewSynchronizer(root, async () => {
    if (++attempts === 1) throw new Error("Invalid article metadata");
  });
  await assert.rejects(sync(), /Invalid article metadata/);
  assert.equal(await sync(), true);
  assert.equal(await sync(), false);
  assert.equal(attempts, 2);
});
