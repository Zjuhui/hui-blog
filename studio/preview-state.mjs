import { randomBytes, createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { siteSchema } from "./content.mjs";

// Vite's SSR module graph and the integration run in separate module instances.
// Share only ephemeral previews through the process, never through the draft folder.
const stateKey = Symbol.for("hui.studio.preview-state");
const state = (globalThis[stateKey] ??= new Map());
const lifetime = 2 * 60 * 60 * 1000;
const maximum = 200;

export function createPreview(input) {
  const config = siteSchema.parse(input);
  const now = Date.now();
  for (const [id, value] of state)
    if (now - value.updated > lifetime) state.delete(id);
  while (state.size >= maximum) state.delete(state.keys().next().value);
  const id = randomBytes(24).toString("hex");
  state.set(id, { config, updated: now });
  return id;
}

export function getPreview(id) {
  if (typeof id !== "string" || !/^[a-f0-9]{48}$/.test(id))
    throw new Error(
      "This preview is unavailable. Refresh it from Blog Studio.",
    );
  const item = state.get(id);
  if (!item || Date.now() - item.updated > lifetime) {
    state.delete(id);
    throw new Error("This preview has expired. Refresh it from Blog Studio.");
  }
  item.updated = Date.now();
  return structuredClone(item.config);
}

export async function previewSettings(root, url, published) {
  const id = url?.searchParams.get("studioPreview");
  if (id) return getPreview(id);
  try {
    return siteSchema.parse(
      JSON.parse(await readFile(path.join(root, ".studio/site.json"), "utf8")),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return published;
  }
}

// A content hash catches same-size edits and coarse filesystem timestamps.
// It also detects files saved before a filesystem watcher has fired.
export async function postFingerprint(root) {
  const hash = createHash("sha256");
  for (const directory of ["src/content/posts", ".studio/posts"]) {
    let files;
    try {
      files = await readdir(path.join(root, directory));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      files = [];
    }
    for (const name of files.filter((file) => file.endsWith(".mdoc")).sort()) {
      hash.update(`${directory}/${name}\0`);
      hash.update(await readFile(path.join(root, directory, name)));
    }
  }
  return hash.digest("hex");
}

export function createPreviewSynchronizer(root, refresh) {
  let fingerprint;
  let pending;
  return async () => {
    // Each caller checks again after the previous refresh, so a save occurring
    // while another request renders cannot be lost.
    if (pending) await pending;
    const current = await postFingerprint(root);
    if (current === fingerprint) return false;
    if (pending) {
      await pending;
      if (current === fingerprint) return false;
    }
    pending = (async () => {
      await refresh();
      fingerprint = current;
    })();
    try {
      await pending;
      return true;
    } finally {
      pending = undefined;
    }
  };
}
