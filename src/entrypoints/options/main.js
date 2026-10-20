// The Backup & restore page (the extension's options page).
//
// Deliberately simple and independent of the rest of the extension: no
// React, no redux store. Downloads read chrome.storage.local directly, so
// they work even if the notes UI or the background is broken, and changes
// (import, restore) are done by the background, which backs up the current
// notes first and verifies the result.
import {
  BACKUPS_STORAGE_KEY,
  BACKUP_REASONS,
  createBackupFile,
  parseBackupFile,
} from "../../redux/backups";
import { CHROME_MESSAGES } from "../../utils/constants";
import "../../styles/fonts.css";
import "../../styles/tokens.css";
import "../../../design-system/components/bundle.css";
import "../../styles/page-full.css";

// The theme chosen in Settings (System follows the OS)
chrome.storage.local.get("metadata").then(({ metadata }) => {
  const theme = metadata?.preferences?.theme;
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
});

const version = chrome.runtime.getManifest().version;
const $ = (id) => document.getElementById(id);

const REASON_LABELS = {
  [BACKUP_REASONS.BEFORE_UPDATE]: "Before an update",
  [BACKUP_REASONS.DAILY]: "Daily",
  [BACKUP_REASONS.BEFORE_RESTORE]: "Before a restore",
  [BACKUP_REASONS.BEFORE_IMPORT]: "Before an import",
  [BACKUP_REASONS.BEFORE_DELETE_ALL]: "Before deleting all notes",
};

const showResult = (element, message, kind) => {
  element.textContent = message;
  element.className = `result ${kind}`;
};

const downloadJson = (data, fileName) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

const dateForFileName = (date) => date.toISOString().slice(0, 19).replace(/[T:]/g, "-");

const send = async (message) => {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || "Docamatic didn't respond. Try reloading this page.");
  return response;
};

const noteCountText = (count) => (count === null ? "unknown number of notes" : `${count} note${count === 1 ? "" : "s"}`);

// --- Download ---------------------------------------------------------------

$("download-current").addEventListener("click", async () => {
  try {
    const storage = await chrome.storage.local.get(null);
    const file = createBackupFile(storage, { extensionVersion: version });
    downloadJson(file, `docamatic-backup-${dateForFileName(new Date())}.json`);
    showResult($("download-result"), `Downloaded ${noteCountText(file.note_count)}.`, "success");
  } catch (err) {
    showResult($("download-result"), "Couldn't create the backup: " + err.message, "error");
  }
});

// --- Import -----------------------------------------------------------------

$("import-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const result = $("import-result");

  try {
    const { state, noteCount } = parseBackupFile(await file.text());
    if (!confirm(`Add ${noteCountText(noteCount)} from "${file.name}" to your notes?`)) return;

    const response = await send({ type: CHROME_MESSAGES.IMPORT_BACKUP, state });
    showResult(
      result,
      `Imported. ${noteCountText(response.addedCount)} added (notes you already had were kept). Reload open tabs to see them.`,
      "success"
    );
    renderBackupList();
  } catch (err) {
    showResult(result, err.message, "error");
  } finally {
    event.target.value = "";
  }
});

// --- Automatic backups ------------------------------------------------------

const renderBackupList = async () => {
  const container = $("backup-list");
  const { [BACKUPS_STORAGE_KEY]: backups } = await chrome.storage.local.get(BACKUPS_STORAGE_KEY);

  if (!backups?.length) {
    container.textContent = "No automatic backups yet.";
    return;
  }

  const table = document.createElement("table");
  table.className = "backups";
  table.innerHTML = "<tr><th>When</th><th>Why</th><th>Notes</th><th><span class=\"visually-hidden\">Actions</span></th></tr>";

  [...backups].reverse().forEach((backup) => {
    const row = table.insertRow();
    row.dataset.testid = "backup-entry";
    row.insertCell().textContent = new Date(backup.created_at).toLocaleString();
    row.insertCell().textContent = REASON_LABELS[backup.reason] || backup.reason;
    row.insertCell().textContent = backup.readable ? noteCountText(backup.note_count) : "Can't be read by this version";

    const actions = row.insertCell();
    actions.className = "actions";

    const download = document.createElement("button");
    download.className = "dm-btn dm-btn--sm dm-btn--ghost";
    download.textContent = "Download";
    download.addEventListener("click", () => {
      const file = createBackupFile(backup.storage, {
        extensionVersion: backup.extension_version,
        now: new Date(backup.created_at),
      });
      downloadJson(file, `docamatic-backup-${dateForFileName(new Date(backup.created_at))}-${backup.reason}.json`);
    });

    const restore = document.createElement("button");
    restore.textContent = "Restore";
    restore.className = "dm-btn dm-btn--sm";
    restore.dataset.testid = "backup-restore";
    restore.disabled = !backup.readable;
    restore.addEventListener("click", async () => {
      const when = new Date(backup.created_at).toLocaleString();
      if (!confirm(`Replace your current notes with the backup from ${when}? Your current notes will be backed up first.`)) return;
      try {
        const response = await send({ type: CHROME_MESSAGES.RESTORE_BACKUP, backupId: backup.id });
        showResult($("restore-result"), `Restored ${noteCountText(response.noteCount)}. Reload open tabs to see them.`, "success");
        renderBackupList();
      } catch (err) {
        showResult($("restore-result"), err.message, "error");
      }
    });

    actions.append(download, " ", restore);
  });

  container.replaceChildren(table);
};

// --- Safe mode --------------------------------------------------------------

const showStatus = async () => {
  try {
    const { safeMode } = await send({ type: CHROME_MESSAGES.GET_BACKUP_STATUS });
    if (safeMode) {
      $("safe-mode-banner").hidden = false;
      $("safe-mode-detail").textContent = `Details: ${safeMode.message}`;
      // Changing notes is blocked in safe mode, so don't offer it
      $("import-file").disabled = true;
    }
  } catch {
    // The background isn't responding; downloads still work without it
  }
};

renderBackupList();
showStatus();
