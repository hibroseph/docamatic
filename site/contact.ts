// The contact form (contactus.html): messages go to PostHog as
// `contact_form_submitted` events, so people can write without opening an
// email app. Read them in PostHog (Activity, filter by that event), or set up
// a PostHog destination to forward them by email or Slack.
//
// Sent straight to PostHog's capture endpoint (not through posthog-js's
// queue) so the page knows whether it arrived: if it didn't (offline, an ad
// blocker), it says so and points to the email address instead.
import { posthog_api_key, posthog_host } from "../config.json";
import { isPublishedSite, websiteDistinctId } from "./analytics";

const MAX_MESSAGE = 3000;
const MAX_EMAIL = 200;
// Filled in faster than this, it's a bot
const MIN_MS_ON_PAGE = 3000;
const TOPICS = ["question", "idea", "problem", "other"];

const randomId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export const attachContactForm = (form: HTMLFormElement) => {
  const openedAt = Date.now();
  const status = form.querySelector<HTMLElement>("[data-status]")!;
  const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;

  const show = (state: "sending" | "sent" | "failed" | "invalid" | "local", text: string) => {
    status.dataset.state = state;
    status.textContent = text;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = (field("message")?.value || "").trim().slice(0, MAX_MESSAGE);
    const email = (field("email")?.value || "").trim();
    const topic = (form.querySelector<HTMLInputElement>("input[name=topic]:checked")?.value || "other").trim();

    if (!message) return show("invalid", "Write a message first.");
    if (email && (email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return show("invalid", "That email address doesn't look right. Leave it empty if you don't need a reply.");
    }
    // Bots fill in the hidden field, or send instantly: pretend it worked
    if (field("website")?.value || Date.now() - openedAt < MIN_MS_ON_PAGE) {
      form.reset();
      return show("sent", "Thanks! Your message is on its way.");
    }
    if (!isPublishedSite() || !posthog_api_key) {
      return show("local", "Sending is off on a local copy of the site.");
    }

    button.disabled = true;
    show("sending", "Sending…");
    try {
      const response = await fetch(`${posthog_host}/i/v0/e/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: posthog_api_key,
          event: "contact_form_submitted",
          distinct_id: websiteDistinctId() || randomId(),
          timestamp: new Date().toISOString(),
          properties: {
            message,
            ...(email ? { email } : {}),
            topic: TOPICS.includes(topic) ? topic : "other",
            surface: "website",
            $process_person_profile: false,
          },
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      form.reset();
      show("sent", email ? "Thanks! Your message is on its way. We'll reply by email." : "Thanks! Your message is on its way.");
    } catch {
      show("failed", "That didn't send (your connection, or something blocking it). Please email sticknoteapp@gmail.com instead.");
    } finally {
      button.disabled = false;
    }
  });
};
