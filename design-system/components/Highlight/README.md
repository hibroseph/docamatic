# Highlight

A highlighter stroke over text on a web page, with slightly uneven ends like a real marker.

## Use

- Wrap the marked text in `<mark class="dm-hl">`, adding a color modifier (`--pink`, `--blue`, `--green`, `--orange`, `--purple`) to match the highlight's color.
- Add `dm-hl--noted` when a note is attached to the highlight; the wavy underline says "there's more here".
- It keeps the page's own font and size; only the background and text color change, so it works on any site and across line breaks.

## Don't

- Use highlights as decoration in the extension's own UI. They mean "something you marked".
