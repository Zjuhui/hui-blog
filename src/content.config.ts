import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
const schema = z.object({
  title: z.string().min(1),
  summary: z.string().default(""),
  date: z.coerce.date(),
  category: z.enum(["research", "life", "works"]),
  language: z.enum(["zh", "en", "zh-en"]),
  featured: z.boolean().default(false),
  cover: z.string().nullish(),
  coverAlt: z.string().default(""),
});
export const collections = {
  posts: defineCollection({
    loader: glob({ pattern: "*.mdoc", base: "./src/content/posts" }),
    schema,
  }),
  drafts: defineCollection({
    loader: glob({
      pattern: "*.mdoc",
      base:
        process.env.BLOG_STUDIO === "1"
          ? "./.studio/posts"
          : "./src/content/empty",
    }),
    schema,
  }),
};
