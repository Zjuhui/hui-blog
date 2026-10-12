import {
  readFile,
  writeFile,
  readdir,
  mkdir,
  copyFile,
  lstat,
  realpath,
  rename,
} from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import matter from "gray-matter";
import { z } from "zod";
import { appearanceSchema, contrastIssues } from "../src/lib/appearance.mjs";
import { presentationSchema } from "../src/lib/site-customization.mjs";

export const postSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().max(1000).default(""),
  date: z.coerce.date(),
  category: z.enum(["research", "life", "works"]),
  language: z.enum(["zh", "en", "zh-en"]),
  featured: z.boolean().default(false),
  cover: z
    .string()
    .nullish()
    .transform((s) => s ?? ""),
  coverAlt: z.string().default(""),
});
const intro = z.object({
  eyebrow: z.string().trim().max(150),
  title: z.string().trim().max(200),
  body: z.string().trim().max(1500),
});
export const siteSchema = z.object({
  name: z.string().trim().max(40),
  accent: z.enum(["cinnabar", "sage", "ink"]),
  presentation: presentationSchema.optional(),
  appearance: appearanceSchema
    .superRefine((value, ctx) => {
      for (const key of contrastIssues(value))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message:
            "Choose colors with at least 4.5:1 contrast against the background.",
        });
    })
    .optional(),
  intro: z.object({ zh: intro, en: intro }),
  about: z.object({
    zh: z.string().trim().max(10000),
    en: z.string().trim().max(10000),
  }),
  quote: z.string().trim().max(500),
  showQuote: z.boolean(),
  socialLinks: z
    .array(
      z.object({
        label: z.string().trim().max(40),
        url: z
          .string()
          .url()
          .refine((s) => /^https?:\/\//.test(s), "Use an http or https URL"),
      }),
    )
    .max(10),
});
export const hash = (value) =>
  createHash("sha256")
    .update(typeof value === "string" ? value.replace(/\r\n/g, "\n") : value)
    .digest("hex");
export function validSlug(slug) {
  if (
    typeof slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    slug.length > 100
  )
    throw new Error(
      "Use a URL slug with lowercase English letters, numbers, and hyphens.",
    );
  return slug;
}
export function within(root, relative) {
  if (
    typeof relative !== "string" ||
    relative.includes("\\") ||
    relative.includes("\0") ||
    path.isAbsolute(relative)
  )
    throw new Error("Invalid path.");
  const resolved = path.resolve(root, relative);
  if (
    resolved === path.resolve(root) ||
    !resolved.startsWith(path.resolve(root) + path.sep)
  )
    throw new Error("Path escapes its directory.");
  return resolved;
}
export async function readOptional(file) {
  try {
    return await readFile(file, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}
export async function atomicWrite(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, value);
  await rename(temp, file);
}
export async function init(root) {
  for (const dir of ["posts", "media", "releases", "backups"])
    await mkdir(path.join(root, ".studio", dir), { recursive: true });
  const file = path.join(root, ".studio/.gitignore");
  if ((await readOptional(file)) === null)
    await writeFile(file, "*\n!posts/\n!posts/**\n!media/\n!media/**\n");
}
export async function bases(root) {
  return JSON.parse(
    (await readOptional(path.join(root, ".studio/bases.json"))) || "{}",
  );
}
export async function rememberBase(root, key, value) {
  const map = await bases(root);
  if (!(key in map)) {
    map[key] = value;
    await atomicWrite(
      path.join(root, ".studio/bases.json"),
      JSON.stringify(map, null, 2),
    );
  }
}
export async function editPost(root, slug) {
  validSlug(slug);
  await init(root);
  const file = path.join(root, `src/content/posts/${slug}.mdoc`);
  const raw = await readFile(file, "utf8");
  await rememberBase(root, slug, hash(raw));
  const draft = path.join(root, `.studio/posts/${slug}.mdoc`);
  if ((await readOptional(draft)) === null) await copyFile(file, draft);
  // Keystatic reads images from its local workspace, including on a new computer.
  for (const relative of mediaReferences(raw)) {
    const source = await safeMedia(path.join(root, "public/media"), relative);
    const target = within(path.join(root, ".studio/media"), relative);
    try {
      await lstat(target);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);
    }
  }
}
export async function createPost(root, input) {
  const slug = validSlug(input.slug);
  await init(root);
  for (const dir of ["src/content/posts", ".studio/posts"])
    if ((await readOptional(path.join(root, dir, `${slug}.mdoc`))) !== null)
      throw new Error("This URL slug already exists. Choose another.");
  const data = postSchema.parse({
    title: input.title,
    summary: "",
    date: new Date().toISOString().slice(0, 10),
    category: input.category || "life",
    language: input.language || "zh",
    featured: false,
  });
  await rememberBase(root, slug, null);
  await atomicWrite(
    path.join(root, `.studio/posts/${slug}.mdoc`),
    matter.stringify("\n", {
      ...data,
      date: data.date.toISOString().slice(0, 10),
    }),
  );
  return slug;
}
export async function saveSettings(root, input) {
  const value = siteSchema.parse(input);
  await rememberBase(
    root,
    "@settings",
    hash(await readFile(path.join(root, "src/data/site.json"), "utf8")),
  );
  await atomicWrite(
    path.join(root, ".studio/site.json"),
    JSON.stringify(value, null, 2) + "\n",
  );
}
export async function library(root) {
  await init(root);
  const result = new Map();
  for (const [dir, isDraft] of [
    ["src/content/posts", false],
    [".studio/posts", true],
  ]) {
    for (const file of await readdir(path.join(root, dir))) {
      if (!file.endsWith(".mdoc")) continue;
      const slug = file.slice(0, -5);
      const raw = await readFile(path.join(root, dir, file), "utf8");
      let data, error;
      try {
        data = postSchema.parse(matter(raw).data);
        validSlug(slug);
      } catch (e) {
        data = { title: slug, category: "life", date: new Date(0) };
        error = e.message;
      }
      const existing = result.get(slug);
      result.set(slug, {
        slug,
        ...data,
        error,
        published: !!existing || !isDraft,
        draft: isDraft,
        changed:
          isDraft &&
          raw !==
            (await readOptional(path.join(root, `src/content/posts/${file}`))),
      });
    }
  }
  const siteRaw = await readFile(path.join(root, "src/data/site.json"), "utf8");
  const working = await readOptional(path.join(root, ".studio/site.json"));
  return {
    posts: [...result.values()].sort(
      (a, b) => +new Date(b.date) - +new Date(a.date),
    ),
    settings: JSON.parse(working ?? siteRaw),
    settingsChanged: working !== null && working !== siteRaw,
  };
}
export function mediaReferences(raw) {
  return [
    ...new Set(
      [...raw.matchAll(/\/hui-blog\/media\/([^\s)"'<>]+)/g)].map((m) =>
        decodeURIComponent(m[1]),
      ),
    ),
  ];
}
export function snapshotFingerprint(snapshot) {
  return hash(
    JSON.stringify({
      files: [...snapshot.files]
        .map(([file, bytes]) => [file, hash(bytes)])
        .sort(([a], [b]) => a.localeCompare(b)),
      expected: snapshot.expected,
      selection: snapshot.selection,
    }),
  );
}
export async function safeMedia(root, relative) {
  const file = within(root, relative);
  const stat = await lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink())
    throw new Error("Media must be a regular file.");
  if (!(await realpath(file)).startsWith((await realpath(root)) + path.sep))
    throw new Error("Media escapes its directory.");
  if (!/\.(png|jpe?g|gif|webp|avif)$/i.test(relative))
    throw new Error("Use PNG, JPG, GIF, WebP or AVIF images.");
  return file;
}
export async function collectSelection(root, selection) {
  if (!Array.isArray(selection.slugs) || selection.slugs.length > 500)
    throw new Error("Invalid selection.");
  if (new Set(selection.slugs).size !== selection.slugs.length)
    throw new Error("Duplicate slug in publication.");
  const files = new Map();
  const expected = {};
  const base = await bases(root);
  for (const slug of selection.slugs) {
    validSlug(slug);
    const raw = await readFile(
      path.join(root, `.studio/posts/${slug}.mdoc`),
      "utf8",
    );
    const parsed = matter(raw);
    const data = postSchema.parse(parsed.data);
    if (!parsed.content.trim())
      throw new Error(`${slug}: write some article content before publishing.`);
    if (data.cover && !data.coverAlt.trim())
      throw new Error(`${slug}: add cover image alternative text.`);
    if (
      data.cover &&
      !data.cover.startsWith("/hui-blog/media/") &&
      !/^https:\/\//.test(data.cover)
    )
      throw new Error("Invalid cover URL.");
    const target = `src/content/posts/${slug}.mdoc`;
    files.set(target, Buffer.from(raw));
    if (
      !(slug in base) &&
      (await readOptional(path.join(root, target))) !== null
    )
      throw new Error(
        "Missing draft baseline. Reopen this article from Studio.",
      );
    expected[target] = base[slug] ?? null;
    for (const relative of mediaReferences(raw)) {
      let local;
      try {
        local = await safeMedia(path.join(root, ".studio/media"), relative);
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
        local = await safeMedia(path.join(root, "public/media"), relative);
      }
      files.set(`public/media/${relative}`, await readFile(local));
    }
  }
  if (selection.settings) {
    const raw = await readFile(path.join(root, ".studio/site.json"), "utf8");
    siteSchema.parse(JSON.parse(raw));
    files.set("src/data/site.json", Buffer.from(raw));
    expected["src/data/site.json"] = base["@settings"];
  }
  if (!files.size) throw new Error("Select at least one change.");
  return {
    files,
    expected,
    selection: { slugs: [...selection.slugs], settings: !!selection.settings },
  };
}
