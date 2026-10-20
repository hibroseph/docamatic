Docamatic is for marking up the web: notes and highlights on the pages you read, kept so you remember them. The look is modern and calm, with a few playful moments: highlighter colors, controls that press like stickers, notes that lift when you pick them up, and a highlighter swipe as the signature mark. The page someone is reading always comes first.

## Voice

- Talk like a friendly study partner: plain, warm, short. Sentence case everywhere ("New note", "Backup & restore").
- Say what happens and what to do: "Your notes stay on this computer." "This file isn't a Docamatic backup. Choose the .json file you downloaded."
- Name things by what people see: notes, highlights, pages, tags. Never "items", "entries" or "store".
- Destructive actions say exactly what they do: "Delete all notes", not "Nuke".
- No exclamation marks, no emoji, no "Oops". The playfulness lives in the visuals and motion, not the words.

## Color

- Every surface the extension owns is `paper`; recessed areas (hovered rows, the resting search field) are `paper-2`; pressed or selected neutral areas are `paper-3`. Dividers are `hairline`.
- Text is `ink`; secondary text (domains, dates, counts, help) is `ink-muted`. Both are readable on all three papers in both themes.
- The **one** primary action in a view is `primary` (highlighter yellow) with `on-primary` text. Everything else is paper with an ink outline.
- Highlighter colors (`hl-yellow`, `hl-pink`, `hl-blue`, `hl-green`, `hl-orange`, `hl-purple`) are for things the user marks (highlights, tags) and for the signature swipe. They're the same in both themes, always with `on-primary` text.
- Sticky notes use the six `note-*` colors with `note-ink` text and a `note-edge` hairline, bright in both themes.
- Errors use `danger` text; destructive buttons use `danger-fill` with `on-primary` text. Links in running text are `link`.

## Type

- **Bricolage Grotesque** (`display` family) is for titles only: `display`, `title`, `note-title`. Set it tight (the styles carry negative letter-spacing) and never below 15px.
- **Figtree** (`body` family) is everything else, including the text people write in notes: `heading`, `body`, `body-strong` (button labels, list titles), `small` (metadata), `label` (tags).
- Both fonts ship with the extension (`fonts/`); nothing loads from the internet.
- Highlights on web pages keep the page's own font; only notes and the extension's own UI use ours.

## The signature: the highlighter swipe

- `dm-swipe` puts a highlighter stroke behind one to three words of a **title**: "Mark up `the web`.", "No notes on this page `yet`".
- At most once per view. It's the accent that makes a screen recognizably Docamatic; used everywhere, it stops meaning anything.
- Swipes use the `swipe-*` colors, not the highlighters directly: they match the highlighters on light paper and deepen on dark paper so the title stays readable.

## Spacing and shape

- A 4px grid: `space-1` (4) to `space-8` (32). Views are padded `space-4`; sections are `space-6` apart.
- Corners: `radius-sm` for small icon buttons and favicon tiles, `radius-md` for buttons, inputs, menus and sticky notes, `radius-lg` for panels on full pages, `radius-pill` for tags and tabs.
- The popup is 380px wide; the side panel is fluid from 320px up. Lists fill the width; nothing is centered in empty space.

## Outlines, shadows and motion

- Controls you press (buttons, inputs, tabs, tags) have a `stroke-bold` `ink` outline, rest on `sticker-sm` (a hard 2px offset shadow), lift to `sticker` on hover, and press flat when clicked.
- Sticky notes have no outline: a `note-edge` hairline and the soft `note-lift` shadow. When hovered or dragged they rise to `note-lift-hover` and tilt very slightly, as if picked up. At rest they sit perfectly straight.
- Those two (the sticker press and the note pick-up) are the only motion. Don't add more.
- Keyboard focus is always visible: `focus-ring` (a paper gap, then a solid `focus` ring). Never remove it.
- Respect reduced motion: no lift, tilt or press when the user asks for less motion.

## Iconography

- Simple line icons at 16px, 1.8–2px strokes with round caps, drawn with `currentColor` so they take the text color.
- Every icon-only button has an `aria-label`. Navigation always has text labels; icons alone are never navigation.
- No illustrations of people or scenes. Color, type and the swipe carry the personality.

## Surfaces

- **Popup:** quick actions and a short list: New note, open the side panel, recent pages.
- **Side panel:** the main surface. Notes for the current page, beside the text you're reading, with tabs for This page, All, Timeline and Favorites.
- **On web pages:** sticky notes and highlights only. They render in a closed shadow root with `tokens.css` and `components/bundle.css` loaded inside it, so the site's styles never leak in.
- **Full pages** (onboarding, Backup & restore): `paper` background, content up to 720px wide, the `display` style for the page title.

## Using it in code

Load `tokens.css`, then `components/bundle.css`, and use the `dm-` classes from each component's guidelines. Read colors, spacing and type through the CSS variables (`var(--paper)`, `var(--space-4)`, `var(--font-display)`); never paste raw values.
