// When Docamatic isn't allowed on the site that's open, notes can't show
// there and new ones can't be put on it. Browsers let people limit where an
// extension runs (Chrome's site access "On click" or "On specific sites",
// Firefox's "Access your data for all websites"), and it's easy to forget.
// This says so, and asks for the site in one click. Once allowed, the
// background shows the notes in its open tabs (permissions.onAdded).
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { trackEvent } from "../redux/actions";
import { canHaveNotes } from "../utils/expectedFailures";
import { TEST_IDS } from "../utils/testIds";
import type { Surface } from "./hooks";

/** The pattern for the whole site, e.g. https://example.com/* (web pages only) */
export const sitePattern = (href: string | undefined) => {
  if (!href || !canHaveNotes(href)) return null;
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:" ? `${url.protocol}//${url.hostname}/*` : null;
  } catch {
    return null;
  }
};

export const SiteAccess = ({ tab, surface }: { tab: chrome.tabs.Tab | null | undefined; surface: Surface }) => {
  const dispatch = useDispatch();
  const pattern = sitePattern(tab?.url);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (!pattern) return setAllowed(true);
    chrome.permissions
      .contains({ origins: [pattern] })
      .then((has) => {
        setAllowed(has);
        if (!has) dispatch(trackEvent("site_access_missing", { surface }));
      })
      .catch(() => setAllowed(true));
  }, [pattern]);

  if (allowed || !pattern) return null;
  const host = new URL(tab!.url!).hostname.replace(/^www\./, "");
  return (
    <div className="site-access" role="alert" data-testid={TEST_IDS.siteAccess}>
      <p>
        Docamatic isn't allowed on <strong>{host}</strong>, so your notes can't show here.
      </p>
      <button
        type="button"
        className="dm-btn dm-btn--sm"
        data-testid={TEST_IDS.siteAccessAllow}
        onClick={() => {
          dispatch(trackEvent("site_access_requested", { surface }));
          chrome.permissions
            .request({ origins: [pattern] })
            .then((granted) => {
              setAllowed(granted);
              dispatch(trackEvent("site_access_answered", { granted, surface }));
            })
            .catch(() => {});
        }}
      >
        Allow on {host}
      </button>
    </div>
  );
};
