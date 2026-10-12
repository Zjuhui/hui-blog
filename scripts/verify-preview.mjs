// Run with Studio open, after a production build and with the original posts unchanged.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import {
  resolveAppearance,
  appearanceVariables,
} from "../src/lib/appearance.mjs";
const publishedSettings = JSON.parse(
  await readFile("src/data/site.json", "utf8"),
);
let localSettings = publishedSettings;
try {
  localSettings = JSON.parse(await readFile(".studio/site.json", "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
function verifyAppearance(html, config) {
  const appearance = resolveAppearance(config);
  assert(html.includes(`data-layout="${appearance.layout}"`));
  for (const key of [
    "--paper",
    "--ink",
    "--accent",
    "--reading-size",
    "--reading-line-height",
    "--reading-width",
  ]) {
    assert(
      html.includes(`${key}:${appearanceVariables(appearance)[key]}`),
      `Missing appearance value: ${key}`,
    );
  }
}
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
    verifyAppearance(preview, localSettings);
    verifyAppearance(production, publishedSettings);
  }
}
console.log(
  "Verified article wording and the expected local/published appearance in both languages.",
);
