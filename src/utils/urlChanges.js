// Lets the notes UI know the page's url changed without a page load (single
// page apps). Kept inside the extension's isolated world on purpose: a DOM
// event would also be visible to the page's own scripts.
const listeners = new Set();

/** Calls `listener` whenever the url changes; returns an unsubscribe function */
export const onUrlChange = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const notifyUrlChange = () => listeners.forEach((listener) => listener());
