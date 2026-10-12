import {
  appearanceSchema,
  appearanceVariables,
  appearanceAttributes,
} from "../src/lib/appearance.mjs";

// Registered by the local Studio integration; absent from production builds.
window.addEventListener("message", (event) => {
  if (
    window.parent === window ||
    event.source !== window.parent ||
    event.origin !== window.location.origin ||
    event.data?.type !== "hui-appearance-preview"
  )
    return;
  const result = appearanceSchema.safeParse(event.data.appearance);
  if (!result.success) return;
  for (const [name, value] of Object.entries(
    appearanceVariables(result.data),
  )) {
    document.documentElement.style.setProperty(name, value);
  }
  for (const [name, value] of Object.entries(
    appearanceAttributes(result.data),
  )) {
    document.documentElement.setAttribute(name, value);
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", result.data.background);
});
