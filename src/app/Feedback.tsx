// "Send feedback" in Settings: what would make Docamatic better, any time.
// (Questions Docamatic asks on its own come from PostHog: app/Survey.tsx.)
import React, { useState } from "react";
import { MAX_MESSAGE } from "../model/feedback";
import { CHROME_MESSAGES } from "../utils/constants";
import { TEST_IDS } from "../utils/testIds";
import type { Surface } from "./hooks";

/** The form: what would make it better, and an email if they'd like a reply */
export const FeedbackForm = ({
  surface,
  prompted,
  onSent,
  onCancel,
}: {
  surface: Surface;
  prompted: boolean;
  onSent: () => void;
  onCancel: () => void;
}) => {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "failed">("idle");

  const send = async () => {
    setStatus("sending");
    const result = await chrome.runtime
      .sendMessage({ type: CHROME_MESSAGES.SEND_FEEDBACK, message, email, prompted, surface })
      .catch(() => null);
    if (result?.ok) onSent();
    else setStatus("failed");
  };

  return (
    <form
      className="feedback-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (message.trim()) send();
      }}
    >
      <label className="feedback-form__label" htmlFor="feedback-message">
        What would make Docamatic more useful for you?
      </label>
      <textarea
        id="feedback-message"
        className="dm-input feedback-form__message"
        data-testid={TEST_IDS.feedbackMessage}
        rows={4}
        maxLength={MAX_MESSAGE}
        autoFocus
        placeholder="Something that's missing, confusing, or that you love…"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <label className="feedback-form__label feedback-form__label--small" htmlFor="feedback-email">
        Your email, if you'd like a reply (optional)
      </label>
      <input
        id="feedback-email"
        className="dm-input"
        type="email"
        data-testid={TEST_IDS.feedbackEmail}
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      {status === "failed" && <p className="error">Couldn't send it. Check your connection and try again.</p>}
      <div className="feedback-form__buttons">
        <button type="submit" className="dm-btn dm-btn--primary dm-btn--sm" data-testid={TEST_IDS.feedbackSend} disabled={!message.trim() || status === "sending"}>
          {status === "sending" ? "Sending…" : "Send"}
        </button>
        <button type="button" className="dm-btn dm-btn--sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <p className="feedback-form__fine">Sent only when you press Send, with how many notes you have and your Docamatic version.</p>
    </form>
  );
};
