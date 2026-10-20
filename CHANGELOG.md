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

### Added
- Analytics events have an `internal` property, `true` for the developer's own
  installs, so they can be left out of PostHog numbers (PostHog: "Filter out
  internal and test users": `internal` is not `true`). Unpacked installs are
  always internal; any other install can be marked by running
  `docamaticMarkInternal()` in the service worker's DevTools console
  (`docamaticMarkInternal(false)` undoes it).
- README section on renewing the Chrome Web Store credentials used by the
  publish workflow.

### Fixed
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
