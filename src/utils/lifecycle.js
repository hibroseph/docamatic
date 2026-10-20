// Remembers how this install got to its current version, so error reports can
// say e.g. "updated from 3.1.3 ten minutes ago". chrome.runtime.onInstalled
// only says which version came before once, in the first service worker run
// after the update, and the error that matters may happen on a later run.
export const LIFECYCLE_STORAGE_KEY = "lifecycle";
const MAX_HISTORY = 5;

/** Saves an install or update; returns the stored lifecycle */
export const recordInstallEvent = async ({ reason, previousVersion }, { version, now = new Date() }) => {
  const { [LIFECYCLE_STORAGE_KEY]: stored } = await chrome.storage.local.get(LIFECYCLE_STORAGE_KEY);
  const entry = { reason, from: previousVersion ?? null, to: version, at: now.toISOString() };
  const lifecycle = { history: [...(Array.isArray(stored?.history) ? stored.history : []), entry].slice(-MAX_HISTORY) };
  await chrome.storage.local.set({ [LIFECYCLE_STORAGE_KEY]: lifecycle });
  return lifecycle;
};

/**
 * Tags for error reports. Installs updated before this was added have no
 * history, so "unknown" rather than a guess.
 */
export const lifecycleTags = (lifecycle, now = new Date()) => {
  const history = Array.isArray(lifecycle?.history) ? lifecycle.history : [];
  const last = history[history.length - 1];
  if (!last) return { previous_version: "unknown", install_reason: "unknown" };
  return {
    previous_version: last.from || "none",
    install_reason: last.reason,
    // Rounded so it groups well in Sentry's tag view
    hours_since_install_or_update: String(Math.floor((now - new Date(last.at)) / 3600000)),
  };
};

/** The whole history as flat fields, for an error report's context */
export const lifecycleContext = (lifecycle) => {
  const history = Array.isArray(lifecycle?.history) ? lifecycle.history : [];
  return Object.fromEntries(
    history.map((entry, i) => [`${i + 1}`, `${entry.reason} ${entry.from || "-"} -> ${entry.to} at ${entry.at}`])
  );
};
