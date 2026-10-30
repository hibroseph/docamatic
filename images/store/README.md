# Chrome Web Store images

| File | Store slot | Size |
|---|---|---|
| `small-promo-tile-440x280.jpg` | Small promo tile | 440×280 |
| `marquee-promo-tile-1400x560.jpg` | Marquee promo tile | 1400×560 |
| `screenshot-1-notes-1280x800.jpg` | Screenshot 1: notes on a page | 1280×800 |
| `screenshot-2-search-1280x800.jpg` | Screenshot 2: fuzzy search | 1280×800 |
| `screenshot-3-tags-1280x800.jpg` | Screenshot 3: tags | 1280×800 |
| `screenshot-4-right-click-1280x800.jpg` | Screenshot 4: right-click to add | 1280×800 |
| `screenshot-5-private-1280x800.jpg` | Screenshot 5: private, light and dark | 1280×800 |

All are JPEG (no alpha channel), at the exact sizes the store asks for.
The pictures of the extension are real captures of the built extension, not
mock-ups (except the browser frame and the right-click menu, which is the
browser's own and can't be captured). "Slow Bread" and `slowbread.blog` are
made up for the pictures.

## Making them again (after UI changes)

`src/` has everything:

1. `npm run build` (the captures use `dist/chrome-mv3`).
2. Serve the repo on port 8790 (`python -m http.server 8790` in the repo root).
3. `node images/store/src/capture.mjs`: loads the extension in Chrome for
   Testing with sample notes and saves captures to `src/raw/`. Needs
   `puppeteer-core` (not a project dependency) and Chrome for Testing; the
   paths at the top of the script are for the machine they were made on.
4. `python images/store/src/build_pages.py`: writes one HTML page per image,
   built from the design system (`src/store.css`).
5. `node images/store/src/render.mjs`: renders each page at its size into
   this folder.
