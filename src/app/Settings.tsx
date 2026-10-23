import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import config from "../../config.json";
import { TEST_IDS } from "../utils/testIds";
import { nukeNotes, setAnalyticsEnabled, setPreferences } from "../redux/actions";
import { COLOR_LABELS, DEFAULT_NOTE_COLOR, NOTE_COLOR_NAMES, NOTE_PAPER, isNoteColorName } from "../model/colors";
import type { State, ThemePreference } from "../model/types";
import { countNotes } from "../redux/statePipeline";
import { BackIcon } from "../ui/icons";
import { useNewNoteShortcut, type Surface } from "./hooks";
import { FeedbackForm } from "./Feedback";
import { downloadDiagnosticReport } from "./diagnostics";

const SITE = "https://hibroseph.github.io/docamatic";

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const TEXT_SIZES: { value: "small" | "medium" | "large"; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const isFirefox = typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);

const openTab = (url: string) => chrome.tabs.create({ url });

export const Settings = ({ onBack, surface = "popup" }: { onBack: () => void; surface?: Surface }) => {
  const dispatch = useDispatch();
  const preferences = useSelector((state: State) => state.metadata?.preferences) || {};
  const analyticsEnabled = useSelector((state: State) => state.metadata?.analytics_enabled !== false);
  const noteCount = useSelector((state: State) => countNotes(state));
  const shortcut = useNewNoteShortcut();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [feedback, setFeedback] = useState<"closed" | "open" | "sent">("closed");
  const [diagnostics, setDiagnostics] = useState<"downloaded" | "failed" | null>(null);

  const theme = preferences.theme || "system";
  const textSize = preferences.note_text_size || "medium";
  const newColor = isNoteColorName(preferences.new_note_color) ? preferences.new_note_color : DEFAULT_NOTE_COLOR;

  return (
    <div className="settings">
      <div className="list-head">
        <button type="button" className="dm-btn dm-btn--ghost dm-btn--sm back" onClick={onBack}>
          <BackIcon /> Notes
        </button>
      </div>
      <h1 className="view-title">Settings</h1>

      <section className="settings__group" aria-labelledby="settings-look">
        <h2 className="settings__heading" id="settings-look">
          Appearance
        </h2>
        <div className="settings__row">
          <span className="settings__label" id="theme-label">
            Theme
          </span>
          <div className="dm-tabs" role="radiogroup" aria-labelledby="theme-label">
            {THEMES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                className="dm-tab"
                aria-checked={theme === value}
                aria-selected={theme === value}
                onClick={() => dispatch(setPreferences({ theme: value }))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings__row">
          <span className="settings__label" id="color-label">
            New notes
          </span>
          <div className="swatches swatches--settings" role="radiogroup" aria-labelledby="color-label">
            {NOTE_COLOR_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={newColor === name}
                aria-label={COLOR_LABELS[name]}
                title={COLOR_LABELS[name]}
                className="swatch"
                style={{ background: NOTE_PAPER[name] }}
                onClick={() => dispatch(setPreferences({ new_note_color: name }))}
              />
            ))}
          </div>
        </div>
        <div className="settings__row">
          <span className="settings__label">Shortcut for a new note</span>
          <span className="settings__value">
            {shortcut ? <kbd>{shortcut}</kbd> : "Not set"}{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => openTab(isFirefox ? "about:addons" : "chrome://extensions/shortcuts")}
            >
              Change
            </button>
          </span>
        </div>
      </section>

      <section className="settings__group" aria-labelledby="settings-pages">
        <h2 className="settings__heading" id="settings-pages">
          Notes on pages
        </h2>
        <div className="settings__row">
          <span className="settings__label" id="text-size-label">
            Text size
          </span>
          <div className="dm-tabs" role="radiogroup" aria-labelledby="text-size-label">
            {TEXT_SIZES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                className="dm-tab"
                aria-checked={textSize === value}
                aria-selected={textSize === value}
                onClick={() => dispatch(setPreferences({ note_text_size: value }))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={preferences.follow_panels === true}
            onChange={(event) => dispatch(setPreferences({ follow_panels: event.target.checked }))}
          />
          <span>
            <strong>Move notes with scrolling panels</strong> <span className="dm-tag dm-tag--blue preview-tag">Preview</span>
            <br />
            In web apps that scroll part of the screen, like an inbox or a chat, a note you drop there scrolls with it.
            One on a part that doesn't scroll stays put.
          </span>
        </label>
      </section>

      <section className="settings__group" aria-labelledby="settings-notes">
        <h2 className="settings__heading" id="settings-notes">
          Your notes
        </h2>
        <p className="settings__help">
          {noteCount} note{noteCount === 1 ? "" : "s"}, saved on this computer. Download a backup to keep a copy or move
          them to another computer.
        </p>
        <div className="settings__buttons">
          <button
            type="button"
            className="dm-btn dm-btn--sm"
            data-testid={TEST_IDS.settingsBackupRestore}
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            Backup &amp; restore
          </button>
          <button
            type="button"
            className="dm-btn dm-btn--sm dm-btn--ghost danger-text"
            data-testid={TEST_IDS.settingsNuke}
            onClick={() => setConfirmingDelete(true)}
            disabled={confirmingDelete}
          >
            Delete all notes
          </button>
        </div>
        {confirmingDelete && (
          <div className="confirm" role="alertdialog" aria-labelledby="confirm-title">
            <p id="confirm-title">
              <strong>Delete all {noteCount} notes?</strong> A backup is saved first, so you can bring them back from
              Backup &amp; restore.
            </p>
            <div className="settings__buttons">
              <button
                type="button"
                className="dm-btn dm-btn--sm dm-btn--danger"
                data-testid={TEST_IDS.settingsNukeConfirm}
                onClick={() => {
                  dispatch(nukeNotes());
                  setConfirmingDelete(false);
                }}
              >
                Delete all notes
              </button>
              <button
                type="button"
                className="dm-btn dm-btn--sm dm-btn--ghost"
                data-testid={TEST_IDS.settingsNukeCancel}
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="settings__group" aria-labelledby="settings-privacy">
        <h2 className="settings__heading" id="settings-privacy">
          Privacy
        </h2>
        <label className="check">
          <input
            type="checkbox"
            data-testid={TEST_IDS.settingsAnalyticsToggle}
            checked={analyticsEnabled}
            onChange={(event) => dispatch(setAnalyticsEnabled(event.target.checked))}
          />
          <span>
            Share usage statistics, like how many notes are created. Never your notes or the sites you visit.{" "}
            <a href={`${SITE}/privacy.html`} target="_blank" rel="noopener noreferrer">
              Privacy policy
            </a>
          </span>
        </label>
      </section>

      <section className="settings__group" aria-labelledby="settings-help">
        <h2 className="settings__heading" id="settings-help">
          Help
        </h2>
        <div className="settings__links">
          <button type="button" className="link-button" onClick={() => openTab(chrome.runtime.getURL("/onboarding.html"))}>
            Quick tour
          </button>
          <button type="button" className="link-button" data-testid={TEST_IDS.settingsFeedback} onClick={() => setFeedback("open")}>
            Send feedback
          </button>
          <a href={`${SITE}/changelog.html`} target="_blank" rel="noopener noreferrer">
            What's new
          </a>
          <a href={`${SITE}/contactus.html`} target="_blank" rel="noopener noreferrer">
            Contact us
          </a>
          <button
            type="button"
            className="link-button"
            data-testid={TEST_IDS.diagnosticsDownload}
            onClick={async () => setDiagnostics((await downloadDiagnosticReport()) ? "downloaded" : "failed")}
          >
            Download diagnostic report
          </button>
        </div>
        {diagnostics && (
          <p className="settings__help" role="status">
            {diagnostics === "downloaded"
              ? "Downloaded. It describes how Docamatic is set up and doing, with none of your notes or websites in it. Attach it when you write to us."
              : "Couldn't make the report. Try again in a moment."}
          </p>
        )}
        {feedback === "open" ? (
          <FeedbackForm surface={surface} prompted={false} onSent={() => setFeedback("sent")} onCancel={() => setFeedback("closed")} />
        ) : feedback === "sent" ? (
          <p className="settings__help" role="status">Thank you! Every message is read.</p>
        ) : null}
        <p className="settings__version">Docamatic {config.version}</p>
      </section>
    </div>
  );
};
