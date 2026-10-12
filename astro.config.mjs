import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import markdoc from "@astrojs/markdoc";
import studio from "./studio/integration.mjs";
const isStudio = process.env.BLOG_STUDIO === "1";

export default defineConfig({
  site: "https://zjuhui.github.io",
  base: isStudio ? "/" : "/hui-blog",
  output: "static",
  outDir: "./dist",
  integrations: [markdoc(), ...(isStudio ? [react(), studio()] : [])],
  devToolbar: { enabled: false },
  server: { host: "127.0.0.1", port: 4321 },
  vite: {
    server: { strictPort: true },
    optimizeDeps: {
      exclude: ["@keystatic/astro/api"],
      esbuildOptions: { external: ["astro:env/server"] },
    },
  },
});
