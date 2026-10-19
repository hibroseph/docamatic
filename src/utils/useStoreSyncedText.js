import { useEffect, useRef, useState } from "react";

// Every edit goes to the redux store in the background and comes back as a
// state update. Normally that round trip is near instant, but when the service
// worker has gone idle it has to start up first, and meanwhile the user keeps
// typing. When the store then echoes back an *older* value, writing it into
// the editor would undo the newest keystrokes and move the caret to the start.
//
// So the text being edited lives here, locally:
// - the user's edits show immediately and are remembered as "pending"
// - values from the store are ignored until the store has caught up with the
//   latest pending edit (or it has been a while, e.g. the edit never arrived)
// - while the field has focus, store values never overwrite what's on screen
// - otherwise store values are applied (e.g. the note was edited in another tab)

// After this long, stop waiting for the store to echo an edit and trust it
export const PENDING_TIMEOUT_MS = 5000;

/**
 * Decides whether a value from the store should replace the local text.
 * Returns { accept, clearPending }.
 */
export const decideStoreValue = ({ storeValue, pendingValue, pendingSince, editing, now }) => {
  if (pendingValue !== null) {
    const caughtUp = storeValue === pendingValue;
    const timedOut = now - pendingSince > PENDING_TIMEOUT_MS;
    if (!caughtUp && !timedOut) {
      // An older value echoed back while newer edits are in flight
      return { accept: false, clearPending: false };
    }
    return { accept: !editing, clearPending: true };
  }
  return { accept: !editing, clearPending: false };
};

/**
 * @param storeValue the value currently in the redux store
 * @param transform applied to store values before display (e.g. sanitizing)
 */
export const useStoreSyncedText = (storeValue, transform = (value) => value) => {
  const normalized = storeValue ?? "";
  const [text, setText] = useState(() => transform(normalized));
  const editing = useRef(false);
  const pending = useRef({ value: null, since: 0 });

  useEffect(() => {
    const { accept, clearPending } = decideStoreValue({
      storeValue: normalized,
      pendingValue: pending.current.value,
      pendingSince: pending.current.since,
      editing: editing.current,
      now: Date.now(),
    });
    if (clearPending) pending.current = { value: null, since: 0 };
    if (accept) setText(transform(normalized));
  }, [normalized]);

  return {
    text,
    // Call with the new value on every user edit, before sending it to the store
    onEdit: (value) => {
      setText(value);
      pending.current = { value, since: Date.now() };
    },
    onFocus: () => {
      editing.current = true;
    },
    onBlur: () => {
      editing.current = false;
    },
  };
};
