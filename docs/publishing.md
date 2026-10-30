# Publishing to Firefox and Edge

Docamatic is on the Chrome Web Store. The same 5.1 code builds for Firefox
(addons.mozilla.org, "AMO") and Edge (Microsoft Edge Add-ons). This is what
each store needs and how to submit. Submitting needs the developer accounts,
so it's done by hand.

## Building the packages

```sh
npm ci
npm run zip            # dist/docamatic-<version>-chrome.zip (Chrome and Edge)
npm run zip:firefox    # dist/docamatic-<version>-firefox.zip
                       # and dist/docamatic-<version>-sources.zip (for AMO)
```

Run the browser tests on the builds first (`e2e/README.md`), with Firefox:
`FIREFOX_PATH=... npm run e2e`.

Then Mozilla's own checks, the same ones AMO runs on upload:

```sh
npm run build:firefox && npm run lint:firefox
```

5.1.0: no errors, 16 warnings, all expected. Reviewers may ask about them:

- `UNSUPPORTED_API` offscreen.* and sidePanel.open: Chrome-only features
  (importing 2019-2022 notes; the side panel), used only where the API
  exists. Firefox uses its sidebar.
- `UNSAFE_VAR_ASSIGNMENT` innerHTML: React's own rendering, note text cleaned
  with DOMPurify before display, and fixed markup with no outside data (the
  welcome page's practice menu, the backups table header).

## Edge (Microsoft Edge Add-ons)

Edge runs Chrome extensions as they are: upload the Chrome zip.

1. Partner Center (partner.microsoft.com), enroll in the Edge program
   (free), then **Create new extension** and upload
   `docamatic-<version>-chrome.zip`.
2. Availability: public, all markets.
3. Properties: category **Productivity**; privacy policy URL
   `https://hibroseph.github.io/docamatic/privacy.html`; website
   `https://hibroseph.github.io/docamatic/`; support: the contact page.
4. Store listing (English): the description below; logo `store-assets/icon.png`
   (300x300 is required: scale it up from the 128 px icon or export a larger
   one); screenshots 1280x800 or 640x400 (the Chrome ones fit); small promo
   tile 440x280 (`store-assets/promotile440x280.png`).
5. Notes for certification: "No account or login. To try it: open any
   website, click the Docamatic toolbar button, then New note on this page."
6. Review usually takes a few business days.

Edge specifics, already handled: the side panel works (Edge has
`chrome.sidePanel`); Edge's "Blocked" scripting error isn't reported as a bug.
The listing link on the website and in `installsource` analytics could
later include Edge (`microsoftedge.microsoft.com`).

## Firefox (addons.mozilla.org)

1. Sign in at addons.mozilla.org/developers with a Firefox account, **Submit
   a New Add-on**, "On this site" (listed).
2. Upload `docamatic-<version>-firefox.zip`. The add-on id is
   `docamatic@hibroseph.github.io` (in the manifest): it must never change,
   since Firefox ties installs and their notes to it.
3. **Source code: yes.** The code is bundled and minified, so AMO needs the
   source: upload `docamatic-<version>-sources.zip`, with these build notes
   for the reviewer:

   > Node 22 (see `.nvmrc`), npm 10. `npm ci`, then `npm run build:firefox`.
   > The extension is in `dist/firefox-mv3/`. Built with WXT (Vite). The
   > fonts in `design-system/fonts/page/` are subsets made by
   > `scripts/subset-page-fonts.py` (fontTools); the originals are next to
   > them.

4. **Data collection.** New Firefox add-ons must declare what they collect,
   in the manifest (`browser_specific_settings.gecko.data_collection_permissions`)
   and the listing. Docamatic sends usage statistics (PostHog: which features
   are used, counts, never note text or page addresses; can be turned off in
   Settings) and error reports (Sentry: what went wrong and the website's
   name, no note text). **This needs a decision before submitting:**
   - Firefox's category for this is `technicalAndInteraction`, and Firefox
     only allows it as *optional*: off until the person agrees in a
     Firefox prompt. So on Firefox, usage statistics and error reports would
     start off and be turned on from Settings (asking with
     `permissions.request({ data_collection: [...] })`).
   - Error reports include the website's host name. Mozilla may count that
     as `websiteActivity`. Leaving the host name out of Firefox's reports
     avoids declaring it.
   Recommended: declare `required: ["none"]`, `optional:
   ["technicalAndInteraction"]`, and on Firefox start with statistics and
   error reports off until allowed (and without page host names). Not done
   yet: it changes what the Firefox build sends, so it's the developer's call.
5. Listing: the description below; category **Productivity**; support site
   and email; privacy policy (paste the text of `site/privacy.html`, or link
   it); license (pick one; "All Rights Reserved" is allowed).
6. Screenshots: 1280x800 PNG/JPEG, taken in Firefox ideally.
7. Review: automatic checks right away, a human review within days to weeks
   (longer for the first version, and with source code).

What's different on Firefox is in `docs/browsers.md` (files on the computer
aren't supported, sidebar instead of side panel, ...). The Firefox build
needs Firefox 128 or newer (the ESR).

## Listing text

**Name:** Docamatic - Sticky Notes for Any Website (from the manifest, `wxt.config.ts`)

**Summary** (from the manifest's `description`: 132 characters max, and the
Chrome Web Store dashboard can't change it; AMO summary, Edge short
description)

> Free sticky notes for any web page. No account: your notes stay on your computer. Find them again with search, tags and a board.

**Description** (Chrome: Developer Dashboard, Store listing; no new version
needed to change it. Only describe what the extension does today.)

> Sticky notes for any website. Put a note right next to what you're reading:
> a recipe, an article, a listing, a pull request, a video. Come back
> tomorrow and it's waiting in the same spot.
>
> Free. No account, no sign-in. Your notes stay on your computer.
>
> Docamatic is note taking for the web, without switching to another app.
> Write on the page itself, and every note you've written is one search away.
>
> How it works
> 1. Open any web page.
> 2. Add a note: click Docamatic and choose New note, press Alt+Shift+D, or
>    right-click where you want it.
> 3. Drag it next to the part it's about. Next time you open the page, it's
>    still there.
>
> New in this version
> - A fresh, cleaner design, with dark mode.
> - Notes on more than one page: show a note on every page of a section of a
>   site. A note on Facebook Marketplace can follow you into your searches,
>   or a note on a docs site can show on every page of the docs.
> - "Can't find a note?" If a site moved something to a new address,
>   Docamatic shows your notes from elsewhere on the site and brings them
>   back with one click.
> - The board: every note on one page, grouped by tag or by website. Drag
>   them around to think things through.
> - Notes in web apps (your inbox, chats, documents) can scroll with the
>   part of the screen they're on.
>
> Find anything you've written
> - Search all your notes: titles, text, tags and page names, even with a
>   typo.
> - Tags group notes across sites: "recipes", "to read", "gift ideas",
>   "thesis".
> - Favorites keep the notes you come back to one click away.
> - Find on page: jump straight to a note on the page it's on.
>
> Make them yours
> - Six note colors, collapse a note to its title, or keep it on screen
>   while you scroll.
> - Hide a note from the page and keep it in Docamatic.
>
> Private by design
> - Your notes are stored in your browser, on your computer, not on a
>   server. Nobody else can read them, including us.
> - Backup & restore to a file, plus automatic daily backups.
> - Anonymous usage statistics, never your notes or the pages they're on.
>   You can turn them off in Settings.
>
> Great for studying, research, shopping comparisons, recipes, code reviews,
> job hunting and anything else you read on the web and want to remember.

**Permissions, explained** (for reviewers and the listing's notes):

| Permission | Why |
|---|---|
| Access to all websites | To show your notes on the pages you put them on |
| storage, unlimitedStorage | To keep your notes, however many there are |
| scripting | To add the notes to a page |
| contextMenus | "Add a note here" when you right-click a page |
| activeTab | Clicking Docamatic gives it the current tab, even where you limited its site access |
| offscreen (Chrome and Edge only) | To bring over notes saved by the 2019-2022 version |
