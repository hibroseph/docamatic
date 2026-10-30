# Browsers

One codebase, two builds: `npm run build` (Chrome and every Chromium browser)
and `npm run build:firefox`.

## Chromium browsers (Chrome, Edge, Brave, Vivaldi, Opera, Arc, ...)

The Chrome build (`dist/chrome-mv3`) is the one for all of them. Tested in
Chrome. Edge users show up in production (Sentry, PostHog) using the Chrome
Web Store build. Differences handled in the code:

- **Side panel:** only where `chrome.sidePanel` exists (Chrome, Edge, Brave).
  Elsewhere the popup's side panel button is hidden.
- **Pages extensions can't touch:** each browser's own pages (`edge://`,
  `brave://`, ...) and add-on stores (Chrome, Edge and Opera stores are listed in
  `utils/expectedFailures.js`). The popup says notes can't go there and offers
  to keep one in Docamatic instead.
- **Browser refusals:** Edge says just "Blocked" when it won't let extensions
  run on a tab (a policy or setting). Expected, not reported.
- **Site access:** Chromium lets people limit where an extension runs ("On
  click", "On specific sites"). With `activeTab`, clicking Docamatic still
  works on the open tab, and the popup offers "Allow on this site"; once
  allowed, the open tabs show their notes.
- **Shortcut settings link:** opens `chrome://extensions/shortcuts`, which
  Chromium browsers map to their own extensions page. Not checked in each.

Not tested by hand yet: Edge, Brave, Vivaldi, Opera, Arc.

## Firefox

The Firefox build (`dist/firefox-mv3`), Manifest V3, Firefox 128 or newer (the
ESR; before 127 Firefox didn't grant host permissions at install). Tested in
Firefox 158: install, welcome page, popup, adding and typing in a note on a
page, its menu, the board, site access off and on again.

Differences handled in the code:

- **Keyboard guard:** Firefox makes key events created by an extension
  "composed" whatever they're told, so the copy handed to a note is a plain
  event there (`page/keyGuard.ts`); otherwise keys typed in a note reached the
  site again, and looped.
- **Files on the computer:** Firefox doesn't let extensions run on `file://`
  pages at all; the popup says so (`files_not_supported`) and can keep a note
  in Docamatic instead.
- **Sidebar** instead of the side panel (`sidebar_action`, from the same page).
- **Site access:** Firefox lets people turn off "Access your data for all
  websites"; same notice and "Allow on this site" as above.
- **No `storage.local.getBytesInUse`, no client hints:** guarded; usage
  statistics name the browser from the user agent.
- **No `storage.local.setAccessLevel`:** on Chrome, content scripts can't
  read storage at all; Firefox has no such setting, so there they still
  could. Docamatic's page scripts never do (a page gets its notes from the
  background, only its own), so this only matters for a compromised page.
- Mozilla's own sites (addons.mozilla.org, accounts and support) are off
  limits to extensions, like the stores.

To publish: an addons.mozilla.org listing, and the extension signed by Mozilla.
The add-on id (`docamatic@hibroseph.github.io`) must never change. Notes don't
move between browsers (each keeps its own storage); Backup & restore does that.

## Testing in Firefox

Puppeteer drives Firefox over WebDriver BiDi, with these quirks: it can't
navigate to `moz-extension://` pages (open them from a web page instead, with
the test copy of the build making them web accessible), can't screenshot
them, and Firefox's match patterns don't take ports. The pref
`extensions.webextOptionalPermissionPrompts = false` accepts permission
requests without the prompt.
