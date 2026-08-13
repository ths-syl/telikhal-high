const SEEN_KEY = "telikhal_last_seen_notice";

function updateAppBadge(notices) {
  if (!("setAppBadge" in navigator) || !notices || notices.length === 0) return;

  const lastSeenId = localStorage.getItem(SEEN_KEY);
  const newCount = lastSeenId ? notices.findIndex((n) => n.id === lastSeenId) : notices.length;
  const count = newCount === -1 ? notices.length : newCount;

  if (count > 0) navigator.setAppBadge(count).catch(() => {});
  else navigator.clearAppBadge().catch(() => {});
}

function markNoticesSeen(notices) {
  if (notices && notices.length > 0) localStorage.setItem(SEEN_KEY, notices[0].id);
  if ("clearAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
}

export { updateAppBadge, markNoticesSeen };