import { cp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const generatedPaths = [
  "_astro",
  "archive",
  "life",
  "posts",
  "research",
  "works",
  "favicon.svg",
  "index.html",
];

for (const path of generatedPaths) {
  if (existsSync(path)) {
    await rm(path, { recursive: true, force: true });
  }
}

await cp("dist", ".", { recursive: true });

console.log("Synced Astro dist/ output to the repository root for GitHub Pages.");

