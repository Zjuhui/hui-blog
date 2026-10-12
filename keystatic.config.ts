import { config, fields, collection } from "@keystatic/core";
export default config({
  storage: { kind: "local" },
  ui: { brand: { name: "Hui · Writing desk" }, navigation: ["posts"] },
  collections: {
    posts: collection({
      label: "Local drafts",
      slugField: "title",
      path: "posts/*",
      format: { contentField: "body" },
      schema: {
        title: fields.slug({
          name: { label: "Title", validation: { isRequired: true } },
          slug: { label: "URL slug — keep this unchanged after publication" },
        }),
        summary: fields.text({ label: "Summary", multiline: true }),
        date: fields.date({ label: "Date", validation: { isRequired: true } }),
        category: fields.select({
          label: "Category",
          options: [
            { label: "Life", value: "life" },
            { label: "Research", value: "research" },
            { label: "Works", value: "works" },
          ],
          defaultValue: "life",
        }),
        language: fields.select({
          label: "Article language",
          options: [
            { label: "中文", value: "zh" },
            { label: "English", value: "en" },
            { label: "中文 + English", value: "zh-en" },
          ],
          defaultValue: "zh",
        }),
        featured: fields.checkbox({ label: "Featured", defaultValue: false }),
        cover: fields.image({
          label: "Cover image",
          directory: "media",
          publicPath: "/hui-blog/media/",
        }),
        coverAlt: fields.text({ label: "Describe the cover image" }),
        body: fields.markdoc({
          label: "Article",
          options: {
            image: { directory: "media", publicPath: "/hui-blog/media/" },
          },
        }),
      },
      previewUrl: "/posts/{slug}/",
    }),
  },
});
