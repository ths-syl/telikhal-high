import { parseBnDate } from "../core/domUtils.js";

/**
 * সাইডবার নোটিশ উইজেট রেন্ডার করে (সর্বশেষ ৫টা নোটিশ, সর্বশেষ সবার উপরে)
 */
function renderNoticeWidget(containerEl, notices) {
  if (!containerEl) return;

  if (!notices || notices.length === 0) {
    containerEl.innerHTML = `<p>এই মুহূর্তে কোনো নোটিশ নেই।</p>`;
    return;
  }

  const recent = [...notices].sort((a, b) => parseBnDate(b.date) - parseBnDate(a.date)).slice(0, 5);

  containerEl.innerHTML = recent
    .map(
      (n) => `
    <a href="notices.html#${n.id}" class="notice-item">
      ${n.isImportant ? '<span class="badge">জরুরি</span>' : ""}
      <h4>${n.title}</h4>
      <time>${n.date}</time>
    </a>
  `
    )
    .join("");
}

export { renderNoticeWidget };
