/**
 * সাইডবার নোটিশ উইজেট রেন্ডার করে (সর্বোচ্চ ৫টি সাম্প্রতিক নোটিশ)
 */
function renderNoticeWidget(containerEl, notices) {
  if (!containerEl) return;

  if (!notices || notices.length === 0) {
    containerEl.innerHTML = `<p>এই মুহূর্তে কোনো নোটিশ নেই।</p>`;
    return;
  }

  const recent = [...notices]
    .sort((a, b) => (a.isImportant === b.isImportant ? 0 : a.isImportant ? -1 : 1))
    .slice(0, 5);

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
