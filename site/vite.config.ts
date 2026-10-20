import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The website (hibroseph.github.io/docamatic): plain HTML pages, with the
// extension's real note components for the demo. `npm run site` to work on
// it, `npm run site:build` to build it into dist/site.
const root = resolve(import.meta.dirname);

export default defineConfig({
  root,
  // Relative links, so it works under /docamatic/ on GitHub Pages
  base: "./",
  plugins: [react()],
  build: {
    outDir: resolve(root, "../dist/site"),
    emptyOutDir: true,
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
