# Changelog

All notable changes to Docamatic, for developers. Add every change under
**Unreleased** as it's made. When releasing:

1. Rename **Unreleased** to the new version and date, and start a new empty
   **Unreleased** section above it.
2. Copy the user-facing changes, reworded for users, into the website's change
   log (`site/changelog.html`).
3. If the saved data format changed, check that a migration and a fixture of
   the previous release's data were added (see `src/redux/migrations.js`).

The format follows [Keep a Changelog](https://keepachangelog.com/).

## Unreleased

### Fixed
- Edge's "Blocked" (it won't let extensions script a tab, seen reconnecting a
  YouTube tab after the 5.0.3 update) is an expected scripting error, so it
  isn't reported to Sentry. Only that exact message. (Also on master, for
  the next 5.0.x.)

## 5.1.0 (not released yet; set the date when it's published)

The redesign: the design system in `design-system/` is now used everywhere,
and the extension is built with WXT so it can ship to Firefox too.

### Added
- Board: open a note in full, with the Open button on each card or by
  double-clicking it. Read only while "Edit notes" is off; with it on, the
  popup's full card (title, text, tags, color). Closes with Escape, Close,
  or a click beside it; "Find on page" from there too. Analytics:
  `board_note_opened` (`editing`). Test ids `board-note-open`,
  `board-note-dialog`.
- When a new note can't go on the page, the popup and side panel say so and
  offer what can still work: **Reload the page and try again** (reloads the
  tab, waits for it, and adds the note; not offered where it can't help:
  browser pages, extension stores, file access off, safe mode) and **Keep a
  note here instead** (a note kept in Docamatic, saved with the page, opened
  in the list with the cursor in it; for any page whose address is known,
  including extension stores). "This page" lists notes kept for a store
  page, and their menu has no "Show on page". Analytics:
  `note_create_recovery` (`action`: reload, keep_in_docamatic; `reason`;
  `ok`). Test ids `popup-create-failure`, `popup-retry-after-reload`,
  `popup-keep-note-instead`.
- Board (preview): `board.html`, opened from a new button in the popup's top
  bar (test id `popup-open-board`). "Board" shows every note on a canvas,
  grouped by its set of tags; groups of notes with several tags sit right
  after their main tag's group, untagged notes last (`model/board.ts`,
  unit tested). Notes can be dragged anywhere and the background dragged to
  pan; positions are kept in storage.local under `board` (not part of the
  notes' state or backups), and "Arrange by tag" clears them. "By tag" shows
  a section per tag. Analytics: `board_opened`, `board_view_changed`.
- Board: search (top bar, "/" to focus, Escape clears; the popup's fuzzy
  search). On the canvas notes that don't match fade and the first match is
  scrolled into view; in By tag only matches are shown. An "Edit notes"
  switch (remembered, off at first): off, cards are read only so arranging
  can't change a note; on, the canvas cards' title and text are editable
  (cards still drag by their edges) and By tag uses the popup's full cards.
  Test ids `board-search`, `board-edit-switch`. Analytics, counts and on/off
  only (never the search text): `board_searched` (result and word counts,
  once typing stops), `board_edit_mode_changed`, `board_note_edited` (first
  edit per visit), `board_note_moved`, `board_arranged`,
  `board_find_on_page`; every board event carries the current `view`.
- New look for notes on pages, the popup, Backup & restore, the welcome
  page and the website, from the design system (tokens, `dm-` components,
  Bricolage Grotesque and Figtree bundled; nothing loads from the internet).
- Popup: one "New note on this page" button (closes the popup so you can
  type straight away), fuzzy search across every note (titles, text, tags,
  page titles; Fuse.js) with tag filters, and tabs for This page, All notes
  (sort: newest, oldest, recently edited, by website), Favorites and Tags.
  `/` focuses search.
- Tags tab: every tag with its note count; open a tag to see its notes;
  rename (renaming to an existing tag merges them), recolor or delete a tag
  everywhere. New tags get the highlighter color fewest tags use.
- Side panel (preview; Chrome 116+, Firefox sidebar): notes for the page
  you're on, following tab switches. Notes added there stay in the panel
  (saved with `visible: false`) until put on the page from their menu.
- Keyboard shortcut for a new note: Alt+Shift+D (changeable in the browser).
  Not Alt+Shift+N, the first choice: Chrome now uses it for split view and
  leaves it unassigned for extensions. When no shortcut is set, Settings and
  the welcome page link to the browser's shortcuts page.
- Infinite scroll and notes out of reach: the popup and side panel ask the
  open page where each of its notes is (`page/noteRegistry.ts`,
  `note_places` message) and show "Further down the page", "Higher up the
  page", "Off to the side" or "Scrolled out of view" on its card, with
  "Bring here" (also in the note's menu, for notes on the open page), which
  moves the note to the top right of what's on screen. New test ids
  `note-bring-here`, `note-place`.
- "Add a note here" in the right-click menu (`contextMenus` permission, no
  install warning): the note goes where the page was right-clicked, and
  starts with the selected text, if any (escaped, line breaks kept).
- Note layout (`layoutNote` action, `LAYOUT_NOTE`): "Keep on screen" (the
  long-unused `stickify` flag; position is then on screen), "Collapse" to the
  top bar (`note.collapsed`; also the ^ button in the top bar, shown on
  hover and always on collapsed notes, test id `note-collapse`; and two quick
  clicks on the grip), and a height
  set by dragging the bottom right corner (`size.height`; the text scrolls
  inside; double-click the corner to fit the text again).
- Settings: text size of notes on pages (`preferences.note_text_size`).
- The popup and side panel always show something: "Opening your notes…",
  then "Try again" and "Restart Docamatic" if the background doesn't answer
  within 4 seconds, and a message instead of a blank page if rendering
  fails (16 uninstall reasons were a white popup).
- Files on the computer: when "Allow access to file URLs" is off, adding a
  note says how to turn it on instead of failing.
- "Find on page" in a note's menu in the popup and side panel
  (`background/findNote.js`, `page/reveal.ts`): switches to a tab with the
  note's page (or opens it), scrolls to the note, brings it to the front and
  outlines it for a moment. A note in a panel that's no longer on the page
  is moved back onto the page; a side-panel-only note is put on the page.
  New test id `note-find`; analytics event `note_found_on_page`.
- Undo after deleting a note, on pages and in lists; undo after hiding one
  from a page.
- New notes are placed near the top right of what's on screen (beside the
  text) and get the cursor.
- Settings: default color for new notes, theme (System, Light, Dark).
- Page titles are saved with notes (when a note is added, and when a page
  with notes is visited), so lists show titles instead of urls.
- Setting "Move notes with scrolling panels" (Preview, off by default;
  `metadata.preferences.follow_panels`). With it on, notes move with what
  they're on (`page/anchor.ts`). A note dropped (or added) over a scrolling
  panel, like a web app's message list, scrolls with that panel, and is
  hidden whole once its corner scrolls out of the panel; over a fixed part
  of the page (header, sidebar) it stays put on screen, and on a sticky part
  (a sidebar that sticks while the page scrolls, like Facebook
  Marketplace's) it moves with that part. A note only anchors to a panel it
  fits across, so one dropped half over a panel stays fully visible. Panels
  are found again by a stable attribute where there is one (`aria-label`,
  `role`, `data-testid`, `data-pagelet`); ids that look generated per load
  (digits, colons, like Facebook's `mount_0_0_CN`) aren't used. One that's a
  very different width from when the note was dropped isn't trusted
  (`anchor.w`). When the saved path doesn't work any more (Facebook builds
  its markup fresh on every load), the panel is found by position: the
  scrolling or sticky element of the same width at a point saved in the
  anchor (`anchor.hint`). Notes in a panel are drawn the way the panel moves (fixed if the
  panel is inside something fixed, on the page otherwise), so page scrolling
  needs no correction, and they're redrawn from the panel's own scroll
  events in the same frame. With the setting off, saved anchors are kept
  but ignored, and moving a note clears its anchor. Saved as an optional
  `note.anchor` (`element`: a CSS path to the panel plus the offset in its
  content; `viewport`: screen position); `position` keeps the page
  coordinates as a fallback and for older versions. Notes are only anchored
  when moved or added, so existing notes render exactly as before. The
  website demos it in an example inbox.
- Firefox build (`npm run build:firefox`, `dist/app-firefox.zip`), untested.
- Typecheck (`npm run typecheck`) in CI.
- New Chrome Web Store images (`images/store/`): small and marquee promo
  tiles and five screenshots, from real captures of the extension, with the
  scripts to make them again.
- `docs/feedback-review.md`: every theme from 877 uninstall survey
  responses, and where it stands.
- Tests for the model (colors, search, sorting, placement, dates), the new
  reducer cases, and that a pre-5.1 note renders at its saved position and
  width in its own color.

### Changed
- Build: webpack, Babel and Jest replaced by WXT (Vite) and Vitest. Output is
  `dist/chrome-mv3/`; pages are `popup.html` (was `index.html`),
  `options.html`, `onboarding.html`, `sidepanel.html`; the content script is
  `content-scripts/content.js`. `build.sh` produces the same artifacts as
  before. React 17 -> 18; styled-components and Font Awesome removed (plain
  CSS from the design system, inline SVG icons). Store-only images moved
  from `icons/` to `store-assets/` so they're no longer shipped.
- Code layout: `src/model/` (typed note model, selectors, search, colors,
  placement), `src/page/` (notes on pages), `src/app/` (popup and side panel,
  one app), `src/ui/` (note parts shared by both: a note on a page and a note
  in a list behave the same, but are laid out for where they are). Creating
  a note moved to the background (`background/createNote.js`), shared by the
  popup, side panel and shortcut.
- Saved data (still schema version 1, readable by 5.0.0): new notes save a
  palette color name (`color.name`) alongside its hex values; notes from
  before keep their colors and render with that color as a band across the
  top. Changing an old note's color remembers it as `color.original`, offered
  in the color menu. Also optional: `page.title`, `note.updated_at`,
  `metadata.preferences`. Positions and sizes of existing notes are untouched
  and render at the same place.
- Notes stay on top of site elements added later with the same top z-index
  (Facebook's chat windows and popups): the notes' layer is kept the last
  element in `<body>`. It waits while a note is being typed in or dragged,
  and backs off from scripts that fight for the same spot.
- Notes are moved and resized by Docamatic's own code
  (`page/useDragResize.ts`) instead of react-rnd (removed). react-draggable
  kept the note's position in React state; under React 18 that state lags
  behind fast pointer moves, so a quick flick (or a busy page like Facebook)
  left the note behind the pointer. Now the position goes straight onto the
  element on every move and is saved on release, with the pointer captured
  for the whole drag (iframes and sites that swallow events can't interrupt
  it). Same positioning as before (`translate(x, y)` from the layer's top
  left), so existing notes land exactly where they were.
- A note can be moved from the keyboard: focus its grip, then use the arrow
  keys (Shift for bigger steps).
- Notes fixed on screen (on a fixed sidebar, or anchored to the screen) can
  be dragged anywhere after the page has scrolled; react-rnd's window limits
  assumed they scrolled with the page and pushed them off by the scroll
  amount. All notes are kept on screen when dropped instead of during the
  drag (react-rnd also shifted the next drag by however far one overshot an
  edge).
- Amazon product pages: notes are saved under the product id (`/dp/ASIN`),
  so one product is one page however it's reached (with the product name in
  the address, tracking, `/gp/product/`). Notes saved by 5.0.0 under the full
  address are still found (`noteUrlsFor` includes the 5.0.0 rule).
- Spell check in notes only while typing in them.
- Fuzzy search with several words: each word is matched on its own (typos
  allowed) and a note matches when every word is found somewhere in it or
  its page ("sourdugh starter" found nothing before).
- A note whose text has one line break showed the "Write something…"
  placeholder over its text and lost the line break (the CSS emptiness check
  couldn't see text); emptiness now comes from the text itself.
- Note cards in "All notes" were widened past the popup by long page titles
  (the ⋯ button was cut off); long text is now cut off with an ellipsis.
- Tags are matched ignoring case and surrounding spaces. A note shows no tag
  field until it has tags: "Add tag" in its menu opens one
  (`note-add-tag` is now that menu item).
- Renaming, recoloring and deleting tags and changing preferences are
  privileged actions (extension pages only); restoring a deleted note and
  saving a page title are allowed for content scripts on their own site.
- Test ids: every shipped id still exists. Note actions (color, show/hide,
  delete) are in the note's More menu, which stays in the DOM when closed;
  `popup-nav-sort` is the All notes tab, `popup-nav-search` the search field;
  new `popup-nav-tags`. Color choices' `data-color` values are the new
  palette (plus the note's original color).
- Analytics: `popup_page_viewed` includes `surface`; new events
  `sidepanel_opened`, `note_restored`, `tag_edited`, `tag_deleted`;
  `note_create_*` events include `source` (popup, sidepanel, shortcut) and
  `placement`. Privacy policy mentions the side panel.
- Website: same pages and content (demo, change log, privacy, contact),
  redesigned; links to the Chrome Web Store listing. The home page also
  shows notes in a scrolling panel (live), a picture of the new popup, and
  the smaller features (undo, shortcut, themes, colors).
  The built pages load their stylesheet and script as plain tags, so they
  also work opened from disk (`file://`), not only from a server.
- Welcome page rewritten with a practice note instead of GIFs of the old UI.
  It shows both ways to add a note: an arrow up into a bracket over the
  right end of the toolbar ("Docamatic is up in your toolbar", with a drawn
  toolbar; it brackets the area rather than one spot because the buttons'
  order differs between browsers and setups), and a practice area
  where right-clicking opens a look-alike browser menu whose "Add a note
  here" puts a practice note where you clicked (`page/practiceMenu.ts`,
  `styles/practice-menu.css`; the real menu can't act on extension pages).
  The website's demo area takes a right-click the same way.
  `startDemo().addNote` takes optional page coordinates. Wherever the steps
  say to click Docamatic, the puzzle piece or the pin, a small picture of
  that button is shown inline.

- Website: visits are counted with PostHog instead of Google Analytics
  (`site/analytics.ts`, posthog-js 1.435.5 pinned, slim "no-external"
  build, same project as the extension, events marked `surface: website`).
  Nothing stored on the device (memory persistence, no cookies), no
  autocapture or session recording; besides page views and page leaves,
  only `website_add_to_chrome_clicked` (`placement`) and
  `website_demo_note_added` (`method`: button, right_click). Off on
  localhost and when opened from disk. Privacy policy updated.
- Where installs come from: `extension_installed` now has
  `came_from_website` (a tab with the website is open when it's installed)
  and, when the Chrome Web Store listing tab is open, `store_tab_open` and
  its `store_utm_source` / `store_utm_medium` / `store_utm_campaign`
  (label-like values only; never tab addresses). `background/installSource.js`,
  unit tested. The website's "Add to Chrome" links carry
  `utm_source=docamatic_website&utm_medium=header|hero` (also shown per
  source on the store dashboard's Impressions tab) and open the store in a
  new tab, so the site stays open. Privacy policy updated.

### Fixed
- A note's menu opens where it fits: upward when there's no room below
  (the last notes in the popup's list), scrolled into view if it fits
  neither way. Pressing a scrollbar no longer closes the menu (it did, so the
  rest of a menu that ran past the popup couldn't be reached by its
  scrollbar).
- A note just added from the side panel (or kept in Docamatic) always gets
  the cursor: the card focuses its title when it becomes the new note, not
  only if it wasn't on screen yet.
- The toolbar icon was still the 2020 logo (a darker blue D on a tan
  square), unlike the current logo on the website and in
  `images/docamatic-logo.png` (a yellow sticky note with a bright blue D).
  `src/public/icons/` are now made from the current logo; the store images
  were rendered again with it.
- Typing fast in a new, empty note: the first character could end up after
  the rest ("elloH"). Showing the placeholder changed the text field's class,
  and react-contenteditable rewrites the field (moving the cursor) when its
  props change; the placeholder class is now on a wrapper, and spell check is
  switched on the element directly.
- Typing in a note no longer sets off the site's keyboard shortcuts (PostHog's
  "e", YouTube's space bar, GitHub's letters), even on sites that listen
  before anything else: the loader now runs at `document_start` and registers
  the page's first window listener for keys; keys headed into a note stop
  there and a copy is delivered inside the note's shadow root
  (`page/keyGuard.ts`). Keys typed anywhere else go to the site as before,
  and so do keys for other `<docamatic-notes>` elements (the website's demo).
- Changing a note's width (right edge) no longer drops the height set with
  its corner: `RESIZE_NOTE` keeps the rest of `size`.
- A note dragged and dropped back where it was no longer stays stuck at its
  dropped spot (not following its panel, ignoring moves from other tabs)
  until the page reloads.
- "Add a note here" on a right-click inside a frame (an embedded video,
  comments) puts the note where new notes go, instead of at an older
  right-click on the page.

## 5.0.3 (2026-10-22)

### Changed
- New welcome page (`src/apps/tabpage`), in the design system's look (tokens,
  fonts and `dm-` components, as 5.1's; `src/styles/tokens.css` and
  `fonts.css` copied from the redesign). Many installs never open the
  popup, so its main action is **Open a page with my first note**: it opens
  Wikipedia's Post-it note article and puts a first note on it that says how
  to add more (the popup's own flow: `GET_PAGE_INFORMATION`, then `addNote`).
  Also a toolbar tip pointing up at the extension buttons (with the puzzle
  piece and pin), a practice area where notes can be tried without being
  saved, and three steps with pictures of the buttons to click. Analytics:
  `onboarding_first_note_clicked`, `onboarding_first_note_added`,
  `onboarding_first_note_failed` (`stage`), `onboarding_practice_note_added`.
  The old animated GIFs are no longer used.
- Website redesigned the same way (layout from 5.1's `site/`, with only what
  5.0 does): hero with a live demo note, how it works, finding notes again,
  and the plain pages (change log from 5.1's site, without 5.1). Google
  Analytics replaced by PostHog, set up as on 5.1's site (memory persistence,
  no autocapture, `website_add_to_chrome_clicked`, `website_demo_note_added`;
  posthog-js 1.435.5 pinned). "Add to Chrome" links carry UTM labels.
  `refresh-paths.js` copies the site's CSS and fonts and points the plain
  pages at the hashed bundle; `build.sh` now ships `*.css` and `css/` too.
- Privacy policy: the website section describes PostHog; lists the welcome
  page's events.

### Fixed
- Spell check underlines notes only while typing in them, not all over notes
  that are just being read.
- Keys typed in a note no longer reach the page as `keypress` either (only
  `keydown`/`keyup` were stopped), so sites' shortcuts on that event don't
  go off while typing.
- Tabs open during an update kept the previous version's notes, which can't
  save any more: typing in them was silently lost until the page was
  reloaded (Chrome updates extensions on its own, so this hit every open
  tab). On update the background now injects the new loader into open web
  tabs (not ones Chrome has unloaded), which brings in the new notes UI
  where there are notes; the new UI hides every older notes layer
  (`docamatic-notes` with a `_DOCAMATIC_NOTES_MOUNT_POINT:` id, renamed
  `...stale`) instead of removing it by its own version's id, since the
  orphaned copy puts a removed layer back.
- Notes saved left of or above the page (a window narrower than the note,
  or dragged above the top) are drawn at the edge instead of where they
  can't be scrolled to. Display only; the saved position is unchanged.
- A page's notes show whether its address ends in a slash or not
  (`/blog/post` and `/blog/post/`): `noteUrlsFor` also returns each key's
  trailing-slash twin (not for the site root). New notes are still saved
  under the address as it is.

## 5.0.2 (2026-10-22)

### Fixed
- Installs that had `pages: []` saved (an empty array instead of the
  url-keyed object, from builds older than this repository, with metadata
  `{ docamatic_version, migrated_data_to_storage_local }`) went into safe mode
  on 5.0.1 ("pages is not an object (found array)"). An empty array holds no
  notes, so it's now read as `{}` and saved in the right shape. A `pages`
  array with anything in it is still refused, so nothing can be thrown away.
- Safe mode only when there's something to protect: saved data that can't be
  used but has nothing in it that could be a note (nothing with an `id`,
  `body` or `text` under `pages` or the old notes keys, JSON strings
  included) is backed up ("Before an update" on Backup & restore) and
  replaced with a clean start, keeping usable tags (emptied) and settings.
  Reported to Sentry as a warning (tag `safe_mode_avoided`, with the stored
  data's shape) and to analytics as `started_fresh`, so the format can be
  handled properly later. Data from a newer version, or that may hold a
  note, still goes to safe mode untouched (`mayHoldNotes`, unit tested).
- Publish workflow: a rejected Web Store upload (e.g. `ITEM_NOT_UPDATABLE`
  while a review is pending) now fails the workflow with the Web Store's
  error. The API answers HTTP 200 either way, so it passed before.

## 5.0.1 (2026-10-20)

### Added
- Analytics events have an `internal` property, `true` for the developer's own
  installs, so they can be left out of PostHog numbers (PostHog: "Filter out
  internal and test users": `internal` is not `true`). Unpacked installs are
  always internal; any other install can be marked by running
  `docamaticMarkInternal()` in the service worker's DevTools console
  (`docamaticMarkInternal(false)` undoes it).
- README section on renewing the Chrome Web Store credentials used by the
  publish workflow.
- `design-system/`: the new design system ("Approved direction v1"): brand
  book, tokens for light and dark themes, `dm-` CSS components, and the
  Bricolage Grotesque and Figtree fonts. Not used by the extension yet; it's
  the basis for the UI redesign. The browsable version is the design system
  artifact linked in `design-system/ABOUT.md`.
- Error reports for problems that make Docamatic unusable carry everything
  needed to fix them, sent the moment they happen:
  - Safe mode: a description of the stored data (types, sizes and counts of
    `pages`, `tags`, `metadata` and the legacy keys, schema version, storage
    key names, how many notes exist anywhere; never urls or note text, see
    `src/redux/storageShape.js`), storage size, which loading step failed,
    and the install's update history. Level `fatal`.
  - Failed saves and failed imports of the MV2 notes get the same kind of
    description, and the import reports which stage failed.
  - Every report is tagged `impact` (`unusable`, `notes_not_saved`,
    `old_notes_missing`) so these can be found and alerted on in Sentry.
- Every Sentry report, from any part of the extension, is tagged with
  `previous_version`, `install_reason`, `internal` and `install_type`, and
  linked to the PostHog install id (unless usage statistics are off).
- Updates and installs are remembered in storage (`lifecycle`, last 5), since
  Chrome only reports the previous version once.
- `safe_mode_entered` events include the load step, the type of `pages` and
  the schema version.
- Breadcrumbs for each startup step when loading notes.
- Privacy policy: says what the new error report details are.

### Changed
- Invalid saved data errors say what was found (e.g. "pages is not an object
  (found string)") and no longer include page urls in the message, which
  went to Sentry and the Backup & restore page.
- A failed save while importing the MV2 notes is reported as part of the
  import (it was reported as "startup backups").
- Website change log: added the history of versions before 5.0.0 (2019–2020
  updates, and the 2020 version's known issues, labeled as such).

### Fixed
- Website change log: removed a stray `</script>` tag from the page's head.
- Publish workflow: an expired or revoked Chrome Web Store refresh token now
  fails at the token step with Google's error, instead of passing an access
  token of `null` on and failing at the upload. Uses Google's current token
  endpoint (`oauth2.googleapis.com/token`).

## 5.0.0 (2026-10-19)

Rebuilt for Manifest V3 after the Manifest V2 version (3.1.3) was removed from
the Chrome Web Store.

### Added
- Manifest V3 service worker background, with notes stored in
  `chrome.storage.local`.
- Automatic import of notes from the Manifest V2 version's localStorage
  (through an offscreen document), and conversion of the 2022 storage formats.
- Versioned storage migrations (`metadata.schema_version`, now 1) with
  fixture tests for every historical data format.
- Fail-closed loading: data is backed up before any conversion, writes are
  verified, and anything unexpected puts the extension in a read-only safe mode
  instead of risking notes.
- Backup & restore page (the extension's options page): download, import,
  and automatic backups (daily, before updates, restores, imports and
  delete-all).
- Notes UI loads only on pages that have notes (a small loader runs
  everywhere else), in every open tab of a page when it gets its first note,
  and follows single page app navigation (including sites like GitHub that
  replace the whole page body).
- Notes are saved under a url that keeps identifying parts (YouTube `?v=`,
  `?id=`, `#/routes`, ...); older notes are still found under the old rule.
  New notes record the full url they were created on, with credentials removed.
- PostHog usage analytics (with an opt-out in Settings) and a
  note-creation funnel (`note_create_started` -> `note_created` ->
  `note_shown`, plus `note_create_failed`).
- Sentry error reporting with debug-ID source maps, an isolated client in
  content scripts, and `docamaticSentryTest()` for checking it.
- Privacy policy page on the website; stable `data-testid` test hooks.

### Changed
- Security: content scripts can only change notes on their own site;
  delete-all, import and settings only from extension pages. Notes render in a
  closed shadow root; note HTML is sanitized with DOMPurify.
- Page and note styles are isolated from websites (Font Awesome CSS inside the
  shadow root, a custom root element).
- Dependencies upgraded (no known vulnerabilities in shipped code); Node 22.

### Fixed
- Notes not appearing for users of older storage formats.
- Jumpy dragging, and the caret jumping to the start while typing after the
  service worker restarted.
- The "sort by date" view, and many smaller bugs.
