# Tag

A small highlighter-colored pill that labels notes; each tag keeps one color everywhere it appears.

## Use

- One of six highlighter colors: `dm-tag` (yellow), `--pink`, `--blue`, `--green`, `--orange`, `--purple`. Text is always `on-primary`, in both themes.
- Give a tag its color when it's created, and never change it per note, so people learn to recognize their tags by color.
- `dm-tag__remove` (an `×` button with an `aria-label`) only where the tag can be removed.
- `dm-tag--add` (dashed) is the one way to start a new tag.

## The consumer provides

The tag text: lowercase, one or two words.
