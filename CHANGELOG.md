# Changelog

All notable changes to Docamatic, for developers. Add every change under
**Unreleased** as it's made. When releasing:

1. Rename **Unreleased** to the new version and date, and start a new empty
   **Unreleased** section above it.
2. Copy the user-facing changes, reworded for users, into the website's change
   log (`src/apps/homepage/changelog.html`).
3. If the saved data format changed, check that a migration and a fixture of
   the previous release's data were added (see `src/redux/migrations.js`).

The format follows [Keep a Changelog](https://keepachangelog.com/).

## Unreleased

### Fixed
- Edge's "Blocked" (it won't let extensions script a tab, seen reconnecting a
  YouTube tab after the 5.0.3 update) is an expected scripting error, so it
  isn't reported to Sentry. Only that exact message.

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
