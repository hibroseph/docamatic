# Uninstall feedback review (October 2026)

What 877 uninstall survey responses (December 2020 to September 2026) said,
and where each problem stands in 5.1. Most responses are about versions
before 5.0 (the 2019 to 2022 Manifest V2 extension). 235 responses were
blank.

## The big ones

| What people said | Responses | Status |
|---|---|---|
| "Note didn't show up on webpage" | 210 | **Fixed.** The January 2020 version hid new notes on pages by default, and notes couldn't be added to tabs opened before installing. Since 5.0 the extension injects into open tabs; since 5.1 a new note appears on the page, beside what you're reading, with the cursor in it. |
| "Didn't work as expected" / "Create note does nothing" / "can't add a note to this page", even on google.com | ~170 | **Fixed** (5.0 rewrite: content script added to tabs open since before install, Manifest V3). Pages no extension can touch (browser pages, extension stores) say so clearly. |
| "I didn't know how to work the extension" | 95 | **Much better.** Welcome page with a practice note on install; one obvious "New note on this page" button; keyboard shortcut (Alt+Shift+D); right-click "Add a note here"; empty states that say what to do. 5.1's welcome page points an arrow at the toolbar and lets you practice the right-click menu. |
| "Was buggy" | 41 | Mostly the problems in this table. |
| Popup window was white/blank | 20 | **Fixed in 5.1.** The popup always shows something: "Opening your notes…", then Try again / Restart Docamatic if the background doesn't answer, and a message instead of a blank page if something breaks. |
| Couldn't move, resize or remove a note; note too bulky | 39 | **Fixed in 5.1.** New drag (keeps up with fast moves, works over iframes, arrow keys), right edge sets width, bottom right corner sets height (long notes scroll), collapse to the title bar, smaller design, delete with Undo. |
| "Chrome says it's no longer supported" | 13 | **Fixed** in 5.0 (Manifest V3). |

## Smaller themes

| What people said | Status |
|---|---|
| Notes lost on Amazon (address changes); "doesn't support dynamic URLs"; one note showing on every page | **Fixed.** 5.0 saves notes under the parts of the address that identify the page (YouTube videos, `?id=`, `#/routes`); 5.1 saves Amazon notes by product id. |
| Click a note in the list, jump to that note on the page | **Fixed in 5.1** ("Find on page"). |
| Keep a note on screen while scrolling | **Fixed in 5.1** ("Keep on screen"). |
| Notes in web apps that scroll a panel (Gmail, Facebook) | **5.1, preview setting** ("Move notes with scrolling panels"). |
| Right-click menu to add a note | **Fixed in 5.1.** |
| Hotkey to add a note | **Fixed in 5.1** (Alt+Shift+D, changeable). |
| Collapse a note to a small icon / out of the way | **5.1:** collapse to the title bar. A floating icon is not done. |
| Font size | **Fixed in 5.1** (Settings, text size). |
| Red spell-check underlines everywhere | **Fixed in 5.1** (only while typing). |
| Popup has no dark mode | **Fixed in 5.1.** |
| Typing in a note triggers the site's shortcuts (YouTube space bar, a letter) | **Fixed in 5.1.** Keys typed in a note never reach the site, even sites that listen before anything else (tested with a page like PostHog's shortcuts); not verified on YouTube itself. |
| Japanese IME in the title | Not reproduced; keys are no longer intercepted in a way that breaks composition. Worth checking by hand. |
| Text unreadable with Dark Reader | **Fixed** (notes are in a closed shadow root with their own colors). |
| Didn't work on Brave, Vivaldi, Edge, AVG, Ungoogled Chromium | The 5.0 rewrite was the fix (these are Chromium browsers); not tested on each. Edge users would also need a listing on the Edge store. |
| Specific sites (Canvas, Jira, Notion, Google Docs, Evernote, eBay, Classroom) | Should work since 5.0 (single page apps, open tabs). Not tested on each. |
| Local .html files | **5.1** explains how to turn on "Allow access to file URLs" instead of failing. |
| Hidden notes couldn't be shown again | **Fixed** ("Show on page" in the popup). |
| "Nuke" was confusing | **Fixed:** "Delete all notes", with a confirmation and an automatic backup. |
| Export notes / move to another computer | **Fixed** in 5.0 (Backup & restore). |

## Not done (ideas.md)

| Asked for | Responses |
|---|---|
| Sync across devices / Chrome profiles | 7 |
| Share notes with someone else / group work | 3 |
| A note that shows on every page | 2 |
| Adjustable transparency | 1 |
| More formatting and styles | 1 |
| Note pops up as a floating icon until hovered | 2 |
