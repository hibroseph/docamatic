# Note

A sticky note on a web page: a soft pastel card that lifts and tilts slightly when you pick it up.

## Use

- One of six note colors: `dm-note` (yellow, the default), `--pink`, `--blue`, `--green`, `--orange`, `--purple`. Notes stay bright with `note-ink` text in **both** themes.
- The title (`dm-note__title`, Bricolage Grotesque) is optional; a note can be just its body. The body is plain Figtree, so notes read cleanly.
- `dm-note__grip` is the drag handle; it appears on hover and keyboard focus. Add `is-dragging` while the note is being moved: it lifts a little further and tilts.
- Keep the two most-used actions visible in `dm-note__actions` (favorite, more); everything else goes in the More menu.
- New notes go in the page **margin** (next to the text, not on top of it). Use the side panel when there's no room.
- The lift and tilt are the note's only motion, and they turn off for people who prefer reduced motion.

## The consumer provides

The title, body, tags and the actions' handlers, plus the `is-dragging` class while dragging. Notes on web pages render inside the extension's shadow root, with `tokens.css` and this stylesheet loaded there.

## Don't

- Add outlines, tape or rotation at rest. A note sits straight until it's picked up.
