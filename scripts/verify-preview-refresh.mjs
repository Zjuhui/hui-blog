// Manual regression check: open Blog Studio, then run this with the project Node.js.
// Creates and removes one uniquely named test draft; never changes existing drafts.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const origin = "http://127.0.0.1:4321";
const root = fileURLToPath(new URL("../", import.meta.url));
const slug = `preview-refresh-${randomBytes(12).toString("hex")}`;
const file = path.join(root, ".studio", "posts", `${slug}.mdoc`);
let owned = false;

const bootstrap = await fetch(`${origin}/studio/`, {
  signal: AbortSignal.timeout(30000),
});
assert.equal(bootstrap.status, 200, "Open Blog Studio before running this check.");
const cookie = bootstrap.headers.getSetCookie()
  .find((value) => value.startsWith("hui_studio="))?.split(";")[0];
assert(cookie, "The server must run in explicit Studio mode.");
await bootstrap.arrayBuffer();

async function page(prefix = "") {
  const response = await fetch(`${origin}/${prefix}posts/${slug}/`, {
    headers: { Cookie: cookie },
    signal: AbortSignal.timeout(30000),
  });
  return {
    status: response.status,
    html: await response.text(),
    cache: response.headers.get("cache-control"),
  };
}

function article(word, day) {
  return `---
title: Preview refresh ${word}
summary: Summary ${word}.
date: 2026-07-${day}
category: life
language: en
featured: false
---

Refresh body ${word}.
`;
}

function verify(result, word, day) {
  assert.equal(result.status, 200, `The ${word} version should render immediately. ${result.status === 200 ? "" : result.html.slice(0, 2000)}`);
  assert.match(result.cache ?? "", /no-store/, "Local preview must not be cached.");
  assert.match(result.html, new RegExp(`<h1[^>]*>Preview refresh ${word}</h1>`), "Title is current.");
  assert(result.html.includes(`content="Summary ${word}."`), "Summary metadata is current.");
  assert(result.html.includes(`datetime="2026-07-${day}T00:00:00.000Z"`), "Article date is current.");
  assert(result.html.includes(`<p>Refresh body ${word}.</p>`), "Rendered Markdoc body is current.");
}

try {
  assert.equal((await page()).status, 404, "The unique test route must not exist yet.");
  const first = article("Alpha", "01");
  const second = article("Bravo", "02");
  assert.equal(Buffer.byteLength(first), Buffer.byteLength(second), "The replacement must have the same byte length.");
  await writeFile(file, first, { flag: "wx" });
  owned = true;
  verify(await page(), "Alpha", "01");

  // No sleep or retry: this exercises the interval before Astro's normal
  // filesystem watcher and debounced content store necessarily finish.
  await writeFile(file, second);
  const updated = await page();
  verify(updated, "Bravo", "02");
  assert(!updated.html.includes("Preview refresh Alpha"), "Old metadata must not remain in the page.");
  assert(!updated.html.includes("Refresh body Alpha."), "Old article wording must not remain in the page.");
  verify(await page("en/"), "Bravo", "02");
} finally {
  if (owned) {
    // Exact path created by this invocation only; never recurse into drafts.
    await unlink(file);
    assert.equal((await page()).status, 404, "Removing the test draft must remove its route immediately.");
  }
}
console.log("Verified immediate draft creation, same-size body/metadata replacement, both languages, and cleanup through the live Astro preview.");
