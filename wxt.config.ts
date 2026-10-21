import { defineConfig } from "wxt";

// One codebase for Chrome and Firefox (`npm run build` / `npm run build:firefox`).
// WXT writes the manifest from this file plus the entrypoints in
// src/entrypoints/ (popup, side panel, options, background, content script...).
// https://wxt.dev
export default defineConfig({
  srcDir: "src",
  outDir: "dist",
  // Copied into the extension as is (toolbar icons)
  publicDir: "src/public",
  modules: ["@wxt-dev/module-react"],
  // Explicit imports everywhere, so files read the same as plain TypeScript
  imports: false,
  // Firefox has supported Manifest V3 since 109; one manifest shape for both
  manifestVersion: 3,
  manifest: ({ browser, mode }) => {
    const isFirefox = browser === "firefox";
    return {
      name: mode === "development" ? "[DEV] Docamatic - Add Sticky Notes to the Web" : "Docamatic - Add Sticky Notes to the Web",
      description: "Want to add your own sticky notes to any webpage? Docamatic is your solution",
      // offscreen (Chrome only) reads notes saved by the 2019-2022 version;
      // the side panel permission is added by WXT for the sidepanel entrypoint
      // contextMenus: "Add a note here" when right-clicking a page (no install warning)
      permissions: ["storage", "scripting", "unlimitedStorage", "contextMenus", ...(isFirefox ? [] : ["offscreen"])],
      host_permissions: ["<all_urls>"],
      icons: {
        16: "icons/docamatic-icon-16.png",
        48: "icons/docamatic-icon-48.png",
        64: "icons/docamatic-icon-64.png",
        128: "icons/docamatic-icon-128.png",
      },
      action: { default_title: "Docamatic" },
      commands: {
        "create-note": {
          // Not Alt+Shift+N (5.1 before release): Chrome uses it for split
          // view and won't give it to extensions. A suggested key that the
          // browser or another extension already uses is simply left unset,
          // so check new choices with chrome.commands.getAll() after installing.
          suggested_key: { default: "Alt+Shift+D" },
          description: "Add a note to this page",
        },
      },
      ...(isFirefox
        ? {
            browser_specific_settings: {
              // Chosen once and never changed: Firefox ties installs and
              // their storage to this id
              gecko: { id: "docamatic@hibroseph.github.io", strict_min_version: "115.0" },
            },
          }
        : {
            // The offscreen API (importing MV2 notes) needs Chrome 109
            minimum_chrome_version: "109",
          }),
    };
  },
  vite: (env) => ({
    build: {
      // Production maps are written (and uploaded to Sentry by build.sh) but
      // not referenced from the bundles, and not shipped in the zip
      sourcemap: env.mode === "production" ? "hidden" : true,
    },
  }),
});
