// Visit counts for the website, in PostHog (the same project as the
// extension's usage events, see src/utils/analytics.js). Replaces Google
// Analytics.
//
// Kept small and private on purpose:
//   - Nothing is stored on the visitor's device (no cookies, no
//     localStorage): the visitor's id lives in memory, so every page load
//     counts as a new visitor. No cookie banner is needed.
//   - No autocapture: clicks are only recorded for the few things below, so
//     nothing typed into the demo notes can end up in an event.
//   - No session recording, surveys or other add-ons, and the "no-external"
//     build never loads more code from PostHog.
//   - Only on the published site, not when working on it locally or opening
//     the built pages from disk.
import posthog from "posthog-js/dist/module.slim.no-external";
import config from "../../../config.json";

const isPublishedSite = () => location.protocol === "https:" && !/^(localhost|127\.|\[::1\])/.test(location.hostname);

let started = false;

export const startAnalytics = () => {
  if (started || !config.posthog_api_key || !isPublishedSite()) return;
  started = true;
  posthog.init(config.posthog_api_key, {
    api_host: config.posthog_host,
    persistence: "memory",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_exceptions: false,
    capture_performance: false,
    rageclick: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_web_experiments: true,
    disable_external_dependency_loading: true,
    advanced_disable_flags: true,
  });
  // Tells website events apart from the extension's in the shared project
  posthog.register({ surface: "website" });

  // Clicks on "Add to Chrome": the step from reading about Docamatic to
  // installing it. `placement` says which button (header, hero, ...).
  document.addEventListener("click", (event) => {
    const link = event.target?.closest?.('a[href*="chromewebstore.google.com"]');
    if (!link) return;
    const placement = link.closest("header") ? "header" : link.closest(".hero") ? "hero" : link.closest("footer") ? "footer" : "page";
    posthog.capture("website_add_to_chrome_clicked", { placement });
  });
};

/** An event from the website (no-op until analytics has started) */
export const trackWebsite = (event, properties = {}) => {
  if (started) posthog.capture(event, properties);
};
