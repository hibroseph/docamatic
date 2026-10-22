// Asking the people who use Docamatic how to make it better (the popup's
// one-time prompt, and "Send feedback" in Settings). Uninstall surveys only
// hear from people who are leaving; this hears from people who stayed.
//
// The prompt is for people who have really used it: at least MIN_NOTES
// notes, and the popup opened on MIN_DAYS different days. It's shown on at
// most MAX_DAYS_SHOWN days; sending or "No thanks" ends it for good. What's
// remembered is in storage.local under "feedback", outside the notes.

export const FEEDBACK_STORAGE_KEY = "feedback";
const MIN_NOTES = 3;
const MIN_DAYS = 3;
const MAX_DAYS_SHOWN = 3;
export const MAX_MESSAGE = 2000;
const MAX_EMAIL = 200;

export interface FeedbackState {
  /** Days the popup was opened on (YYYY-MM-DD), counted up to MIN_DAYS */
  days?: string[];
  /** Days the prompt was shown on */
  shown?: string[];
  /** Asked and answered: never ask again */
  done?: "sent" | "dismissed";
}

export const today = (now = new Date()) => now.toISOString().slice(0, 10);

/** Counts today as a day the popup was used */
export const withDayUsed = (state: FeedbackState, day: string): FeedbackState => {
  const days = state.days || [];
  return days.includes(day) || days.length >= MIN_DAYS ? state : { ...state, days: [...days, day] };
};

/** Whether to ask today */
export const shouldAsk = (state: FeedbackState, noteCount: number, day: string) => {
  if (state.done || noteCount < MIN_NOTES || (state.days || []).length < MIN_DAYS) return false;
  const shown = state.shown || [];
  return shown.includes(day) || shown.length < MAX_DAYS_SHOWN;
};

/** Remembers that the prompt was shown today */
export const withShown = (state: FeedbackState, day: string): FeedbackState => {
  const shown = state.shown || [];
  return shown.includes(day) ? state : { ...state, shown: [...shown, day] };
};

/**
 * What may be sent, from what the popup asked to send: the message (trimmed,
 * at most MAX_MESSAGE characters) and an email only if it looks like one.
 * Null when there's nothing to send.
 */
export const cleanFeedback = (input: { message?: unknown; email?: unknown }) => {
  const message = typeof input.message === "string" ? input.message.trim().slice(0, MAX_MESSAGE) : "";
  if (!message) return null;
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const validEmail = email.length <= MAX_EMAIL && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
  return { message, ...(validEmail ? { email: validEmail } : {}) };
};
