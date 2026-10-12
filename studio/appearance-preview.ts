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

function connectDesignCanvas() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("studioPreview");
  if (!id) return;

  // Keep the same unsaved snapshot while navigating pages or languages.
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
    "a[href]",
  )) {
    const url = new URL(anchor.href, window.location.href);
    if (
      url.origin !== window.location.origin ||
      !/^\/(?:en\/)?(?:(?:archive|research|life|works|about)\/?|posts\/[a-z0-9-]+\/?)?$/.test(
        url.pathname,
      )
    )
      continue;
    url.searchParams.set("studioPreview", id);
    url.searchParams.set(
      "studioEdit",
      params.get("studioEdit") === "1" ? "1" : "0",
    );
    anchor.href = url.href;
  }
  if (params.get("studioEdit") !== "1" || window.parent === window) return;

  const english = document.documentElement.lang.startsWith("en");
  const style = document.createElement("style");
  style.textContent = `
    [data-studio-section] { cursor: pointer; }
    [data-studio-section]:hover, [data-studio-section]:focus-visible {
      outline: 2px dashed var(--accent); outline-offset: 6px;
    }
  `;
  document.head.append(style);
  for (const section of document.querySelectorAll<HTMLElement>(
    "[data-studio-section]",
  )) {
    section.tabIndex = 0;
    section.title = english ? "Click to edit this section" : "点击编辑这一部分";
  }
  function edit(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;
    const section = target.closest<HTMLElement>("[data-studio-section]");
    if (!section) return false;
    window.parent.postMessage(
      { type: "hui-edit-section", section: section.dataset.studioSection },
      window.location.origin,
    );
    return true;
  }
  document.addEventListener(
    "click",
    (event) => {
      if (edit(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (
      (event.key === "Enter" || event.key === " ") &&
      event.target instanceof HTMLElement &&
      event.target.hasAttribute("data-studio-section") &&
      edit(event.target)
    )
      event.preventDefault();
  });
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", connectDesignCanvas, {
    once: true,
  });
else connectDesignCanvas();
