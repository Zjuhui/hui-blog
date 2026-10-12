import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  copyFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  init,
  createPost,
  editPost,
  collectSelection,
  validSlug,
  within,
  saveSettings,
  postSchema,
  library,
} from "../studio/content.mjs";
import { authorized } from "../studio/integration.mjs";
const sample = await readFile(
  new URL("../src/content/posts/why-this-blog.mdoc", import.meta.url),
  "utf8",
);
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "hui-content-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await init(root);
  await mkdir(path.join(root, "src/content/posts"), { recursive: true });
  await mkdir(path.join(root, "src/data"), { recursive: true });
  await writeFile(path.join(root, "src/content/posts/existing.mdoc"), sample);
  await copyFile(
    new URL("../src/data/site.json", import.meta.url),
    path.join(root, "src/data/site.json"),
  );
  return root;
}
test("slugs and paths cannot escape the content directory", () => {
  for (const slug of ["../secret", "A Title", "a/b", "x\\y", "-a", "a--b"])
    assert.throws(() => validSlug(slug));
  assert.equal(validSlug("a-quiet-day"), "a-quiet-day");
  assert.throws(() => within("C:/blog", "../secret"));
  assert.throws(() => within("/blog", "a\\b"));
});
test("opening and saving a working copy leaves published content unchanged", async (t) => {
  const root = await fixture(t);
  await editPost(root, "existing");
  await writeFile(
    path.join(root, ".studio/posts/existing.mdoc"),
    sample + "\nA local revision.\n",
  );
  assert.equal(
    await readFile(path.join(root, "src/content/posts/existing.mdoc"), "utf8"),
    sample,
  );
  const list = await library(root);
  assert.equal(list.posts[0].changed, true);
});
test("duplicate URLs and empty articles are rejected", async (t) => {
  const root = await fixture(t);
  await assert.rejects(
    createPost(root, { slug: "existing", title: "Another" }),
    /already exists/,
  );
  await createPost(root, { slug: "new-note", title: "New note" });
  await assert.rejects(
    collectSelection(root, { slugs: ["new-note"] }),
    /write some article/,
  );
  assert.throws(() =>
    postSchema.parse({
      title: "",
      date: "bad",
      category: "unknown",
      language: "zh",
    }),
  );
});
test("publication selects only chosen posts and their referenced images", async (t) => {
  const root = await fixture(t);
  await editPost(root, "existing");
  await writeFile(
    path.join(root, ".studio/posts/existing.mdoc"),
    sample + "\n![A photo](/hui-blog/media/selected.png)\n",
  );
  await writeFile(path.join(root, ".studio/media/selected.png"), "image");
  await writeFile(
    path.join(root, ".studio/media/private.png"),
    "private image",
  );
  await createPost(root, { slug: "private-note", title: "Private" });
  const selection = await collectSelection(root, { slugs: ["existing"] });
  assert.deepEqual(
    [...selection.files.keys()],
    ["src/content/posts/existing.mdoc", "public/media/selected.png"],
  );
  await assert.rejects(
    collectSelection(root, { slugs: ["existing", "existing"] }),
    /Duplicate/,
  );
});
test("settings remain local and reject unsafe links", async (t) => {
  const root = await fixture(t);
  const original = await readFile(
    path.join(root, "src/data/site.json"),
    "utf8",
  );
  const config = JSON.parse(original);
  config.accent = "sage";
  await saveSettings(root, config);
  assert.equal(
    await readFile(path.join(root, "src/data/site.json"), "utf8"),
    original,
  );
  assert.equal((await library(root)).settingsChanged, true);
  config.socialLinks = [{ label: "Bad", url: "javascript:alert(1)" }];
  await assert.rejects(saveSettings(root, config));
});
test("session, loopback host and origin are required for protected endpoints", () => {
  const token = "a".repeat(64);
  const req = {
    headers: {
      host: "127.0.0.1:4321",
      origin: "http://127.0.0.1:4321",
      cookie: `hui_studio=${token}`,
    },
  };
  assert.equal(authorized(req, token), true);
  for (const headers of [
    { ...req.headers, origin: "https://evil.example" },
    { ...req.headers, host: "evil.example:4321" },
    { ...req.headers, cookie: "" },
    { ...req.headers, "sec-fetch-site": "cross-site" },
  ])
    assert.equal(authorized({ headers }, token), false);
});
