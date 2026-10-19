// Note urls are used as link targets in the popup. Only allow web/file urls,
// so a crafted note key (e.g. "javascript:...") from an imported file can't
// become a clickable script url.
export const safeHref = (url) => (/^(https?|file):\/\//i.test(url || "") ? url : undefined);

// Opened links must not get a window.opener reference back to the popup.
// Only target="_blank" gets that protection by default, not "_new".
export const EXTERNAL_LINK_PROPS = { target: "_blank", rel: "noopener noreferrer" };
