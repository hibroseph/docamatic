# Browser tests

These tests load the built extension into a real Chrome (and Firefox), open
real pages, and click, type and drag the way people do. They catch what unit
tests can't: notes that don't show after an update, a site covering a note,
keys leaking to the page, a menu that opens off screen.

```sh
npm run build && npm run build:firefox && npm run site:build
npm run e2e:chrome            # once: downloads the Chrome they run on
npm run e2e                   # every suite
npm run e2e -- board keys     # just these
```

They also run in CI on every push (`.github/workflows/e2e.yml`), with
Firefox and an update from the store version.

Each suite's temp folder is under the system's temp folder, not
`e2e/output`: on Linux, Chrome puts a socket there, and socket paths can't
be longer than 108 characters. In CI's deep checkout folder they were, and
Chrome quit as it started ("Target closed"). The workflow checks that Chrome
starts before running the suites.

## What you get

`npm run e2e` serves `e2e/pages` on http://localhost:8765, runs each suite in
its own process (each with its own temp folder, deleted afterwards), and
prints one line per suite:

```
passed           board           19 checks  23s
passed on retry  escape           3 checks  26s
FAILED           fillsite         1 checks  37s
    FAIL the popup says Docamatic isn't allowed on the site
skipped          updatetabs       0 checks  1s
    SKIP no previous version to update from (set DOCAMATIC_OLD_EXT)
```

A suite that fails is run once more. Passing the second time shows as
"passed on retry": it doesn't fail the run, but it's a flaky suite worth
looking at. Each suite's full output is in `e2e/output/logs` (and
`<suite>.first-try.log` for retried ones), and screenshots are in
`e2e/output`. Neither is committed. The run exits non-zero if any suite
failed.

## Settings

Everything has a default; CI sets these:

| Variable | What it is | Default |
|---|---|---|
| `CHROME_PATH` | The Chrome to test with | The pinned Chrome for Testing (below) |
| `FIREFOX_PATH` | Firefox, for the `firefox` suite | none: the suite is skipped |
| `DOCAMATIC_OLD_EXT` | The previous store version's build, for `updatetabs` | none: the suite is skipped |
| `DOCAMATIC_EXT`, `DOCAMATIC_EXT_FIREFOX`, `DOCAMATIC_SITE` | The builds under test | `dist/chrome-mv3`, `dist/firefox-mv3`, `dist/site` |
| `E2E_OUT` | Where output goes | `e2e/output` |

To get a previous version for the update test, build master (the 5.0.x line)
in another folder and point `DOCAMATIC_OLD_EXT` at its `dist`.

### Why Chrome is pinned (148)

Most suites install the build twice: once to set up the stored notes, then
again to start it the way an update does. On Chrome 154 (the version
puppeteer 25 bundles), an extension that puppeteer has just reinstalled
doesn't receive messages for about 30 seconds. Any extension does this, even
an empty one, so it isn't Docamatic. Notes don't show and the suites time out.
Chrome 148 answers in half a second. `CHROME_BUILD` in `env.mjs` sets the
version; move it forward once a newer Chrome fixes this.

(Real updates from the Chrome Web Store aren't affected: they don't go
through DevTools. And when the extension does start slowly, a page asks for
its notes a few more times anyway; see `src/entrypoints/content.ts`.)

## The suites

| Suite | What it covers |
|---|---|
| board | The board page: both views, dragging, remembering, rearranging |
| boardsites | The board grouped by website |
| notepages | A note on more than one page: the picker in a note, and the popup's "Can't find a note?" |
| collapse | Collapsing a note to its title bar and opening it again |
| contactform | The website's contact form (PostHog is answered locally, nothing is sent) |
| diagnostics | Download diagnostic report, from Settings and from safe mode |
| emptypages | An install with `pages: []` starts normally after updating |
| escape | A note's menu closes with Escape; keys don't reach the site |
| feedback | Asking active users for feedback in the popup, and from Settings |
| fillsite | Old notes get their missing details on a visit; the site access notice |
| firefox | The Firefox build in Firefox: install, welcome page, popup, a note |
| firstnote | Add my first note, the tips in a new note and in the popup, page storage access |
| installsource | What `extension_installed` says about where the install came from |
| interact3 | Pages that scroll inside a fixed panel; notes over two parts |
| interact4 | A marketplace-like layout (feed and sticky sidebar), fast drags |
| interact5 | Notes stay above site elements added later with the top z-index |
| interact7 | Infinite scroll: off-screen status, Bring here, Keep on screen |
| keys | Typing in a note doesn't fire the site's keyboard shortcuts |
| menufit | The popup's note menu opens where it fits |
| recover | When a note can't go on the page, the popup offers to reload and retry |
| shortcut | The welcome page names the new note shortcut, or offers to set one |
| siteposthog | The built website's analytics (caught locally, never sent) |
| startfresh | Unusable saved data with no notes starts fresh |
| surveys | PostHog surveys shown in the popup (PostHog is a local stand-in) |
| typing | Fast typing into a brand-new note: every character, in order |
| updatetabs | A tab open during an update keeps working notes without a reload |
| welcome | The welcome page's practice area and its menu |

## Writing a suite

A suite is a script in `e2e/suites` that prints `PASS <what>` or
`FAIL <what>` for each check (or `SKIP <why>` to skip itself) and exits.
Start from a similar one. `env.mjs` has the paths and helpers:

- `backgroundReady(browser)` waits for the background to load the notes
  after an install or update. Use it instead of a fixed pause.
- `extensionWorker(browser)` returns the live service worker (not one being
  replaced), for setting up storage.
- `notesShown(page)` waits for the notes layer on a page.
- `launchChrome(options)` instead of `puppeteer.launch`: it adds the flags
  CI needs and, in CI, puts Chrome's own output in the suite's log.

Rules:

- No personal data. The test pages are made up (`fb.html` is a made-up
  marketplace, not a copy of a real site).
- No requests to real services. Suites map PostHog and Sentry to 127.0.0.1
  (`--host-resolver-rules`) and answer them locally when they need to.
- Look elements up by `data-testid` (`src/utils/testIds.js`). Test ids that have
  shipped are never renamed or removed.
