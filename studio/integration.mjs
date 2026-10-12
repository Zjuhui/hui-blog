import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  init,
  library,
  createPost,
  editPost,
  saveSettings,
  collectSelection,
  safeMedia,
  snapshotFingerprint,
} from "./content.mjs";
import { Publisher, authStatus } from "./publish.mjs";

export function authorized(req, token) {
  const host = req.headers.host;
  if (!/^127\.0\.0\.1:\d+$/.test(host ?? "")) return false;
  const origin = req.headers.origin;
  if (origin && origin !== `http://${host}`) return false;
  if (req.headers["sec-fetch-site"] === "cross-site") return false;
  const cookie = req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("hui_studio="))
    ?.slice(11);
  return (
    !!cookie &&
    cookie.length === token.length &&
    timingSafeEqual(Buffer.from(cookie), Buffer.from(token))
  );
}
async function jsonBody(req) {
  let chunks = [],
    size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error("Request is too large.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString() || "{}");
}
export default function studio() {
  return {
    name: "hui-studio",
    hooks: {
      "astro:config:setup": async ({
        injectRoute,
        injectScript,
        updateConfig,
        config,
      }) => {
        const root = fileURLToPath(config.root);
        await init(root);
        injectScript("page", 'import "/studio/appearance-preview.ts";');
        injectRoute({
          pattern: "/studio",
          entrypoint: fileURLToPath(
            new URL("./StudioPage.astro", import.meta.url),
          ),
          prerender: false,
        });
        injectRoute({
          pattern: "/keystatic/[...params]",
          entrypoint: fileURLToPath(
            new URL("./EditorPage.astro", import.meta.url),
          ),
          prerender: false,
        });
        injectRoute({
          pattern: "/api/keystatic/[...params]",
          entrypoint: fileURLToPath(
            new URL("./editor-api.ts", import.meta.url),
          ),
          prerender: false,
        });
        const token = randomBytes(32).toString("hex");
        const publisher = new Publisher(root);
        try {
          publisher.state = JSON.parse(
            await readFile(
              path.join(root, ".studio/last-publication.json"),
              "utf8",
            ),
          );
        } catch {}
        let lastPoll = 0,
          mutation = false;
        updateConfig({
          vite: {
            plugins: [
              {
                name: "hui-studio-server",
                configureServer(server) {
                  server.middlewares.use(async (req, res, next) => {
                    const url = new URL(req.url ?? "/", "http://127.0.0.1");
                    const pathname = url.pathname;
                    if (!/^127\.0\.0\.1:\d+$/.test(req.headers.host ?? "")) {
                      res.statusCode = 403;
                      res.end("Loopback only.");
                      return;
                    }
                    // Bootstrap the session only on a direct document navigation, never an API request.
                    if (
                      (pathname === "/studio/" || pathname === "/studio") &&
                      req.method === "GET"
                    ) {
                      if (req.headers["sec-fetch-site"] === "cross-site") {
                        res.statusCode = 403;
                        res.end("Open Studio using the launcher.");
                        return;
                      }
                      res.setHeader(
                        "Set-Cookie",
                        `hui_studio=${token}; HttpOnly; SameSite=Strict; Path=/`,
                      );
                      res.setHeader("Cache-Control", "no-store");
                    }
                    const controlled =
                      pathname.startsWith("/__studio/") ||
                      pathname.startsWith("/api/keystatic/") ||
                      pathname.startsWith("/keystatic");
                    if (controlled && !authorized(req, token)) {
                      res.statusCode = 403;
                      res.end("Open /studio/ first.");
                      return;
                    }
                    if (
                      pathname.startsWith("/hui-blog/media/") ||
                      pathname.startsWith("/media/")
                    ) {
                      try {
                        const relative = decodeURIComponent(
                          pathname.replace(/^\/(?:hui-blog\/)?media\//, ""),
                        );
                        let file;
                        try {
                          file = await safeMedia(
                            path.join(root, ".studio/media"),
                            relative,
                          );
                        } catch (e) {
                          if (e.code !== "ENOENT") throw e;
                          file = await safeMedia(
                            path.join(root, "public/media"),
                            relative,
                          );
                        }
                        const ext = path.extname(file).slice(1).toLowerCase();
                        res.setHeader(
                          "Content-Type",
                          `image/${ext === "jpg" ? "jpeg" : ext}`,
                        );
                        res.setHeader("X-Content-Type-Options", "nosniff");
                        res.end(await readFile(file));
                      } catch {
                        res.statusCode = 404;
                        res.end("Image not found.");
                      }
                      return;
                    }
                    if (!pathname.startsWith("/__studio/")) return next();
                    res.setHeader("Content-Type", "application/json");
                    res.setHeader("Cache-Control", "no-store");
                    const send = (value) => res.end(JSON.stringify(value));
                    try {
                      if (
                        req.method === "GET" &&
                        pathname === "/__studio/state"
                      ) {
                        if (
                          Date.now() - lastPoll > 10000 &&
                          !publisher.active
                        ) {
                          lastPoll = Date.now();
                          await publisher.pollDeployment();
                        }
                        return send({
                          ...(await library(root)),
                          publication: publisher.state,
                          auth: await authStatus(root),
                        });
                      }
                      if (req.method !== "POST") {
                        res.statusCode = 405;
                        return send({ error: "Method not allowed." });
                      }
                      if (req.headers.origin !== `http://${req.headers.host}`)
                        throw new Error("Origin required.");
                      if (mutation)
                        throw new Error(
                          "Another change is being saved. Try again.",
                        );
                      mutation = true;
                      try {
                        const body = await jsonBody(req);
                        if (pathname === "/__studio/create")
                          return send({ slug: await createPost(root, body) });
                        if (pathname === "/__studio/edit") {
                          await editPost(root, body.slug);
                          return send({ ok: true });
                        }
                        if (pathname === "/__studio/settings") {
                          await saveSettings(root, body);
                          return send({ ok: true });
                        }
                        if (pathname === "/__studio/review") {
                          const selection = await collectSelection(root, body);
                          return send({
                            files: [...selection.files.keys()],
                            selection: selection.selection,
                            fingerprint: snapshotFingerprint(selection),
                          });
                        }
                        if (pathname === "/__studio/publish") {
                          if (typeof body.fingerprint !== "string")
                            throw new Error(
                              "Review the changes before publishing.",
                            );
                          return send(
                            await publisher.start(
                              body.selection,
                              body.fingerprint,
                            ),
                          );
                        }
                        res.statusCode = 404;
                        return send({ error: "Unknown action." });
                      } finally {
                        mutation = false;
                      }
                    } catch (error) {
                      res.statusCode = 400;
                      send({ error: error.message });
                    }
                  });
                },
              },
            ],
          },
        });
      },
    },
  };
}
