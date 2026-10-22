// "Send feedback" from Settings (app/Feedback.tsx): checking what may be sent.
// Questions Docamatic asks on its own are surveys written in PostHog
// (model/surveys.ts).

export const MAX_MESSAGE = 2000;
const MAX_EMAIL = 200;

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
