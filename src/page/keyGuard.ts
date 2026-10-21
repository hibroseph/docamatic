// Keys typed in a note are the note's, not the website's.
//
// Notes live in a closed shadow root, so to the page a key typed in a note
// looks like it was pressed on <docamatic-notes>, an element that isn't a
// text field. Sites with keyboard shortcuts (PostHog, GitHub, YouTube, ...)
// then act on it: typing "e" in a note ran PostHog's "e" shortcut instead.
// Stopping the key on its way out of the note doesn't help, because many
// sites listen on the way in, at the window, before the note sees it.
//
// So the content script that runs on every page registers the page's very
// first window listener for keys (at document_start, before the site's own
// scripts), and when a key is headed into a note:
//   - stops it there, so no site listener sees it. The browser still types
//     the character: stopping an event doesn't cancel what it does.
//   - hands a copy to the note UI, which delivers it to the focused element
//     inside the note, so the note's own key handling still works (Enter in
//     the tag field, Escape, arrow keys on the grip). The copy doesn't leave
//     the shadow root, and if the note handles it (preventDefault), so does
//     the original.
// Keys pressed anywhere else go to the page as always.

export const NOTES_ELEMENT = "docamatic-notes";

const KEY_EVENTS = ["keydown", "keyup", "keypress"] as const;

/** Returns false if the key isn't headed into this layer (another copy of the notes, a demo) */
type Deliver = (event: KeyboardEvent) => boolean;

declare global {
  interface Window {
    /** Set by the notes UI: delivers a key to the focused element in the notes */
    __DOCAMATIC_DELIVER_KEY__?: Deliver;
    __DOCAMATIC_KEY_GUARD__?: boolean;
  }
}

/** In the loader, as early as possible */
export const installKeyGuard = () => {
  if (window.__DOCAMATIC_KEY_GUARD__) return;
  window.__DOCAMATIC_KEY_GUARD__ = true;
  const guard = (event: Event) => {
    const target = event.target as Element | null;
    if (target?.localName !== NOTES_ELEMENT) return;
    if (window.__DOCAMATIC_DELIVER_KEY__?.(event as KeyboardEvent)) event.stopImmediatePropagation();
  };
  for (const type of KEY_EVENTS) window.addEventListener(type, guard, true);
};

/** In the notes UI: delivers guarded keys inside the shadow root */
export const deliverKeysTo = (shadow: ShadowRoot) => {
  window.__DOCAMATIC_DELIVER_KEY__ = (original) => {
    // The website's demo notes are <docamatic-notes> too, with their own
    // key handling; only keys for these notes are taken
    if (original.target !== shadow.host) return false;
    const target = shadow.activeElement || shadow.host;
    const copy = new KeyboardEvent(original.type, {
      key: original.key,
      code: original.code,
      location: original.location,
      repeat: original.repeat,
      isComposing: original.isComposing,
      altKey: original.altKey,
      ctrlKey: original.ctrlKey,
      metaKey: original.metaKey,
      shiftKey: original.shiftKey,
      bubbles: true,
      cancelable: true,
      composed: false,
    });
    target.dispatchEvent(copy);
    if (copy.defaultPrevented) original.preventDefault();
    return true;
  };
};
