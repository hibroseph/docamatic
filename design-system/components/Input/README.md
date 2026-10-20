# Input

Text fields with an ink outline; the search variant has a magnifier and a recessed resting fill.

## Use

- Wrap a labelled input in `dm-field`, with `dm-field__label` above and optional `dm-field__help` below.
- Use `dm-search` (an inline SVG icon plus the input) for searching notes. Its fill is `paper-2` at rest and turns `paper` on focus.
- Errors go in `dm-field__help dm-field__help--error`, which says what went wrong and how to fix it. Also set `aria-invalid="true"` on the input.

## The consumer provides

The `<input>` with an `id`, a visible label (or an `aria-label` for search), and placeholder text that's an example or an action ("Search your notes"), never the label itself.
