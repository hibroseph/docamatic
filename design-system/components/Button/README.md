# Button

A chunky, sticker-like button: ink outline, hard offset shadow, and a little press when clicked.

## Use

- `dm-btn dm-btn--primary` for the **one** main action in a view: New note, Download backup. Highlighter yellow with `on-primary` text.
- `dm-btn` (paper) for secondary actions next to it.
- `dm-btn--ghost` for low-emphasis actions such as Cancel, and for toolbars where several buttons sit together.
- `dm-btn--danger` only for destructive actions, and only behind a confirmation. Label it with what happens: "Delete all notes", never "Nuke".
- `dm-btn--icon` for icon-only buttons; always give it an `aria-label`.
- `dm-btn--sm` in dense places such as list rows.

## The consumer provides

A `<button type="button">` with a short verb label (sentence case, no exclamation mark), optionally a 16px inline SVG icon before the label.

## Don't

- Put two primary buttons in one view.
- Remove the outline or shadow to "make it quieter"; use `dm-btn--ghost` instead.
