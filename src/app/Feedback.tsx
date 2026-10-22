// Asking people who use Docamatic how to make it better (model/feedback.ts):
// a one-time prompt in the popup, and the same form from Settings.
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { trackEvent } from "../redux/actions";
import type { State } from "../model/types";
import { allNotes } from "../model/notes";
import { FEEDBACK_STORAGE_KEY, MAX_MESSAGE, shouldAsk, today, withDayUsed, withShown, type FeedbackState } from "../model/feedback";
import { CHROME_MESSAGES } from "../utils/constants";
import { TEST_IDS } from "../utils/testIds";
import type { Surface } from "./hooks";

const readState = async (): Promise<FeedbackState> =>
  ((await chrome.storage.local.get(FEEDBACK_STORAGE_KEY))[FEEDBACK_STORAGE_KEY] as FeedbackState | undefined) || {};
const writeState = (state: FeedbackState) => chrome.storage.local.set({ [FEEDBACK_STORAGE_KEY]: state }).catch(() => {});

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

/**
 * Asks once, in the popup, people who have used Docamatic for a while (see
 * model/feedback.ts). Small until they choose to answer.
 */
export const FeedbackPrompt = ({ surface }: { surface: Surface }) => {
  const dispatch = useDispatch();
  const noteCount = useSelector((state: State) => allNotes(state).length);
  const [state, setState] = useState<FeedbackState | null>(null);
  const [asking, setAsking] = useState(false);
  const [phase, setPhase] = useState<"ask" | "form" | "thanks">("ask");

  // Counts today as a day Docamatic was used, then decides whether to ask
  useEffect(() => {
    readState()
      .then((stored) => {
        const day = today();
        let next = withDayUsed(stored, day);
        const ask = shouldAsk(next, noteCount, day);
        if (ask && !(next.shown || []).includes(day)) {
          next = withShown(next, day);
          dispatch(trackEvent("feedback_prompt_shown", { surface }));
        }
        if (next !== stored) writeState(next);
        setState(next);
        setAsking(ask);
      })
      .catch(() => {});
  }, []);

  const finish = (done: "sent" | "dismissed") => {
    const next = { ...(state || {}), done };
    setState(next);
    writeState(next);
  };

  if (!asking) return null;

  if (phase === "thanks") {
    return (
      <div className="feedback-prompt" role="status" data-testid={TEST_IDS.feedbackPrompt}>
        <p className="feedback-prompt__title">Thank you! Every message is read.</p>
      </div>
    );
  }

  return (
    <div className="feedback-prompt" data-testid={TEST_IDS.feedbackPrompt}>
      {phase === "ask" ? (
        <>
          <p className="feedback-prompt__title">You've been using Docamatic for a while. What would make it better for you?</p>
          <div className="feedback-form__buttons">
            <button type="button" className="dm-btn dm-btn--primary dm-btn--sm" data-testid={TEST_IDS.feedbackOpen} onClick={() => setPhase("form")}>
              Tell us
            </button>
            <button
              type="button"
              className="dm-btn dm-btn--ghost dm-btn--sm"
              data-testid={TEST_IDS.feedbackDismiss}
              onClick={() => {
                finish("dismissed");
                setAsking(false);
                dispatch(trackEvent("feedback_prompt_dismissed", { surface }));
              }}
            >
              No thanks
            </button>
          </div>
        </>
      ) : (
        <FeedbackForm
          surface={surface}
          prompted
          onSent={() => {
            finish("sent");
            setPhase("thanks");
          }}
          onCancel={() => setPhase("ask")}
        />
      )}
    </div>
  );
};
