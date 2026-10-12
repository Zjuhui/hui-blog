// Run with Studio open, after a production build and with the original posts unchanged.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const prose = (html) =>
  html
    .match(/<div class="prose">([\s\S]*?)<\/div>/)?.[1]
    .replace(/\s+/g, " ")
    .trim();
for (const slug of ["why-this-blog", "how-to-make-this-blog"]) {
  for (const prefix of ["", "en/"]) {
    const response = await fetch(
      `http://127.0.0.1:4321/${prefix}posts/${slug}/`,
    );
    assert.equal(response.status, 200);
    const preview = await response.text();
    const production = await readFile(
      `dist/${prefix}posts/${slug}/index.html`,
      "utf8",
    );
    assert(prose(preview));
    assert.equal(
      prose(preview),
      prose(production),
      `${prefix}${slug}: preview and public article differ`,
    );
    assert(preview.includes("preview-banner"));
    assert(!production.includes('class="preview-banner"'));
  }
}
console.log(
  "Verified all original article bodies match between Studio preview and production.",
);
