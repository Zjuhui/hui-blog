import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve("dist");
async function walk(folder) {
  const output = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(file)));
    else output.push(file);
  }
  return output;
}
const files = await walk(root),
  htmlFiles = files.filter((f) => f.endsWith(".html"));
assert(htmlFiles.length >= 12, "Expected both language interfaces.");
for (const file of files) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  assert(
    !/^(studio|keystatic|api|__studio|\.studio)\//.test(relative),
    `Admin file in production: ${relative}`,
  );
  if (!/\.(html|js|json|css)$/.test(file)) continue;
  const source = await readFile(file, "utf8");
  assert(
    !/hui_studio=|__studio\/publish|\.studio\/posts|Local preview · includes|本地预览 · 包含未发布/.test(
      source,
    ),
    `Local-only code leaked into ${relative}`,
  );
  if (!file.endsWith(".html")) continue;
  const english = relative.startsWith("en/");
  assert(
    source.includes(`lang="${english ? "en" : "zh-CN"}"`),
    `Incorrect language in ${relative}`,
  );
  for (const match of source.matchAll(/(?:href|src)="(\/[^"?#]*)/g)) {
    const url = decodeURIComponent(match[1]);
    assert(
      url.startsWith("/hui-blog/"),
      `Base path missing: ${url} in ${relative}`,
    );
    const asset = path.join(root, url.slice("/hui-blog/".length));
    await access(
      url.endsWith("/") ? path.join(asset, "index.html") : asset,
    ).catch(() => {
      throw new Error(`Broken local link: ${url} in ${relative}`);
    });
  }
}
for (const slug of ["why-this-blog", "how-to-make-this-blog"]) {
  const zh = await readFile(
    path.join(root, "posts", slug, "index.html"),
    "utf8",
  );
  const en = await readFile(
    path.join(root, "en/posts", slug, "index.html"),
    "utf8",
  );
  const body = (s) => s.match(/<div class="prose">([\s\S]*?)<\/div>/)?.[1];
  assert(
    body(zh) && body(zh) === body(en),
    `Article wording differs between UI languages: ${slug}`,
  );
  assert(zh.includes(`/hui-blog/en/posts/${slug}/`));
  assert(en.includes(`/hui-blog/posts/${slug}/`));
}
console.log(
  `Verified ${htmlFiles.length} pages: links, assets, language switching, preserved bodies, and no Studio routes.`,
);
