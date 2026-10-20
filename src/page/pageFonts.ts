// The notes' fonts on web pages.
//
// Fonts declared inside a shadow root aren't used by the browser, so they're
// added to the page's document.fonts, under names no site uses. They're
// bundled into the notes UI script and handed over as bytes: nothing is
// fetched (a font url would need the files to be web accessible, which lets
// sites detect the extension) and a site's font-src policy doesn't apply.
import figtree from "../../design-system/fonts/Figtree-Variable.woff2?inline";
import bricolage from "../../design-system/fonts/BricolageGrotesque-Variable.woff2?inline";

export const PAGE_FONT_BODY = "Docamatic Figtree";
export const PAGE_FONT_DISPLAY = "Docamatic Bricolage";

const bytesOf = (dataUrl: string) => {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

let loaded = false;

export const loadPageFonts = () => {
  if (loaded || typeof FontFace === "undefined") return;
  loaded = true;
  const faces = [
    new FontFace(PAGE_FONT_BODY, bytesOf(figtree), { weight: "400 700" }),
    new FontFace(PAGE_FONT_DISPLAY, bytesOf(bricolage), { weight: "400 800" }),
  ];
  for (const face of faces) {
    try {
      document.fonts.add(face);
    } catch {
      // Notes fall back to the system font
    }
  }
};
