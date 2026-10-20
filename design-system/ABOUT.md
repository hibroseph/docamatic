# About this folder

A copy of the Docamatic design system, saved on 2026-10-20 as "Approved direction v1": modern and clean with a playful twist (highlighter palette, sticker-style buttons, sticky notes that lift when picked up, the highlighter swipe as the signature mark).

The live, browsable version (with previews of every component) is the design system artifact:
https://claude.ai/artifact/UoXde7QMRDANokT7fe76Hx

- `README.md`: the brand book (voice, color, type, motion, surfaces).
- `tokens.json`: every color (light "Paper" and dark "Night"), type style, spacing step, radius, shadow and stroke, each with a usage note.
- `components/bundle.css`: the `dm-` CSS classes; `components/<Name>/`: each component's guidelines and preview.
- `fonts/`: Bricolage Grotesque and Figtree (SIL Open Font License), bundled so nothing loads from the internet.

The extension doesn't use these files yet. When the UI redesign starts, `tokens.json` becomes the source for a `tokens.css` and the extension adopts `components/bundle.css`, starting with the side panel. If the design system artifact is changed later, copy the changes back here (or the other way round) so the two don't drift.
