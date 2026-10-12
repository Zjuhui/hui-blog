import { spawn } from "node:child_process";
import { init } from "../studio/content.mjs";
if (Number(process.versions.node.split(".")[0]) < 24)
  throw new Error(
    "Use Open Blog Studio.cmd to install the project-local Node.js runtime.",
  );
await init(process.cwd());
const child = spawn(
  process.execPath,
  [
    "node_modules/astro/astro.js",
    "dev",
    "--host",
    "127.0.0.1",
    "--port",
    "4321",
  ],
  {
    env: { ...process.env, BLOG_STUDIO: "1" },
    stdio: "inherit",
    windowsHide: true,
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
