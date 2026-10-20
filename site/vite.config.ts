import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// The website (hibroseph.github.io/docamatic): plain HTML pages, with the
// extension's real note components for the demo. `npm run site` to work on
// it, `npm run site:build` to build it into dist/site.
const root = resolve(import.meta.dirname);

/**
 * The built pages also work when opened straight from disk (file://), not
 * only from a server. Browsers block module scripts and `crossorigin`
 * stylesheets on file:// pages, so the pages load the bundle as an ordinary
 * deferred script (wrapped in a function, so nothing leaks into the page's
 * globals), and the stylesheet as a plain link.
 */
const worksFromDisk = (): Plugin => ({
  name: "docamatic-works-from-disk",
  apply: "build",
  generateBundle: {
    // After Vite has dropped the empty per-page chunks, leaving the one script
    order: "post",
    handler(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== "chunk") continue;
        // Only a script that stands alone can run as a classic script
        if (file.imports.length > 0 || file.exports.length > 0 || file.dynamicImports.length > 0) {
          this.error(`${file.fileName} isn't self-contained, so it can't load from file:// pages`);
        }
        file.code = `(function () {\n${file.code}\n})();\n`;
      }
    },
  },
  transformIndexHtml: {
    order: "post",
    handler: (html) =>
      html
        .replace(/<script type="module" crossorigin src=/g, "<script defer src=")
        .replace(/<script type="module" src=/g, "<script defer src=")
        .replace(/ crossorigin(?=[ >])/g, ""),
  },
});

export default defineConfig({
  root,
  // Relative links, so it works under /docamatic/ on GitHub Pages
  base: "./",
  plugins: [react(), worksFromDisk()],
  build: {
    outDir: resolve(root, "../dist/site"),
    emptyOutDir: true,
    // Every page uses the same one script, so there's nothing to preload
    modulePreload: false,
    rollupOptions: {
      input: {
        index: resolve(root, "index.html"),
        changelog: resolve(root, "changelog.html"),
        contactus: resolve(root, "contactus.html"),
        privacy: resolve(root, "privacy.html"),
      },
    },
  },
});
