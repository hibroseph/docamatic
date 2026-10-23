// "Just now", "5 min ago", "Yesterday", "3 days ago", then the date after a week.
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const friendlyDate = (ms: number | string | undefined, now = Date.now()): string => {
  const time = Number(ms);
  if (!time) return "";
  const ago = now - time;
  if (ago < MINUTE) return "Just now";
  if (ago < HOUR) return `${Math.floor(ago / MINUTE)} min ago`;

  const date = new Date(time);
  const today = new Date(now);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (time >= startOfToday) return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (time >= startOfToday - DAY) return "Yesterday";
  const days = Math.ceil((startOfToday - time) / DAY);
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
};
