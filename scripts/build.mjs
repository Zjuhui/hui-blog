import { spawnSync } from "node:child_process";
const env = { ...process.env };
delete env.BLOG_STUDIO;
const result = spawnSync(
  process.execPath,
  ["node_modules/astro/astro.js", "build"],
  { stdio: "inherit", env },
);
process.exit(result.status ?? 1);
