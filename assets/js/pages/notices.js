import { fetchJSON, showLoading, showError } from "../core/fetchData.js";
import { debounce, parseBnDate } from "../core/domUtils.js";
import { initNavbar } from "../components/navbar.js";
import { initScrollReveal } from "../core/scrollReveal.js";

const PAGE_SIZE = 6;
let allNotices = [];
let visibleCount = PAGE_SIZE;
let filters = { category: "সব", search: "" };

async function renderHeaderFooter() {
  const config = await fetchJSON("site-config.json");
  const info = await fetchJSON("school-info.json");
  if (!config || !info) return;

  document.querySelectorAll(".school-name-bn").forEach((el) => (el.textContent = info.schoolName.bn));
  document.querySelectorAll(".school-eiin").forEach((el) => (el.textContent = `EIIN: ${info.eiin}`));
  document.querySelectorAll(".school-logo").forEach((el) => (el.src = info.logo));

  const navList = document.getElementById("nav-list");
  if (navList) navList.innerHTML = config.navigation.map((n) => `<li><a href="${n.url}">${n.label}</a></li>`).join("");

  const footerQuick = document.getElementById("footer-quick-links");
  if (footerQuick) footerQuick.innerHTML = config.footerLinks.quick.map((n) => `<li><a href="${n.url}">${n.label}</a></li>`).join("");

  const footerImportant = document.getElementById("footer-important-links");
  if (footerImportant)
    footerImportant.innerHTML = config.footerLinks.important
      .map((n) => `<li><a href="${n.url}" target="_blank" rel="noopener">${n.label}</a></li>`)
      .join("");

  const footerSocial = document.getElementById("footer-social");
  if (footerSocial) footerSocial.innerHTML = config.socialLinks.map((s) => `<a href="${s.url}" target="_blank"  aria-label="${s.platform}"><i class="fa-brands fa-${s.icon}"></i></a>`).join("");

  const footerContact = document.getElementById("footer-contact");
  if (footerContact)
    footerContact.innerHTML = `<li>${config.contact.address}</li><li>${config.contact.phone}</li><li>${config.contact.email}</li>`;

  initNavbar();
}

function populateFilterOptions(notices) {
  const categorySelect = document.getElementById("filter-category");
  if (!categorySelect) return;
  const categories = [...new Set(notices.map((n) => n.category))];
  categorySelect.innerHTML = `<option value="সব">সব ক্যাটাগরি</option>` + categories.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function getFilteredNotices() {
  return allNotices
    .filter((n) => {
      const matchCategory = filters.category === "সব" || n.category === filters.category;
      const matchSearch = !filters.search || n.title.toLowerCase().includes(filters.search.toLowerCase());
      return matchCategory && matchSearch;
    })
    .sort((a, b) => parseBnDate(b.date) - parseBnDate(a.date)); // সর্বশেষ নোটিশ সবার উপরে
}

function noticeItemHTML(n) {
  return `
    <div class="notice-board-item reveal-on-scroll ${n.isImportant ? "is-important" : ""}" id="${n.id}" data-id="${n.id}">
      <div class="notice-meta-row">
        <span class="notice-date">📅 ${n.date}</span>
        <span class="notice-category-badge">${n.category}</span>
        ${n.isImportant ? `<span class="notice-important-badge">জরুরি</span>` : ""}
      </div>
      <h3>${n.title}</h3>
      <p class="notice-details-text" id="details-${n.id}">${n.details}</p>
      <div class="notice-actions">
        <button class="notice-toggle-btn" data-id="${n.id}">বিস্তারিত দেখুন ▾</button>
        <a class="notice-pdf-btn" href="${n.pdfUrl}" target="_blank" rel="noopener">📄 পিডিএফ কপি দেখুন</a>
      </div>
    </div>
  `;
}

function renderList() {
  const listEl = document.getElementById("notice-board-list");
  const loadMoreWrap = document.getElementById("load-more-wrap");
  const countEl = document.getElementById("result-count");
  if (!listEl) return;

  const filtered = getFilteredNotices();
  if (countEl) countEl.textContent = `${filtered.length} টি নোটিশ পাওয়া গেছে`;

  if (filtered.length === 0) {
    listEl.innerHTML = `<p>কোনো নোটিশ পাওয়া যায়নি।</p>`;
    loadMoreWrap.innerHTML = "";
    return;
  }

  const visible = filtered.slice(0, visibleCount);
  listEl.innerHTML = visible.map(noticeItemHTML).join("");
  initScrollReveal(listEl);

  listEl.querySelectorAll(".notice-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const detailsEl = document.getElementById(`details-${btn.dataset.id}`);
      const expanded = detailsEl.classList.toggle("expanded");
      btn.textContent = expanded ? "বিস্তারিত লুকান ▴" : "বিস্তারিত দেখুন ▾";
    });
  });

  if (visibleCount < filtered.length) {
    loadMoreWrap.innerHTML = `<button class="btn btn-primary" id="load-more-btn">আরও নোটিশ দেখুন</button>`;
    document.getElementById("load-more-btn").addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      renderList();
    });
  } else {
    loadMoreWrap.innerHTML = "";
  }

  // হোমপেজ থেকে #id দিয়ে এলে সেই নোটিশে স্ক্রল করে হাইলাইট করা
  const hashId = window.location.hash.replace("#", "");
  if (hashId) {
    const target = document.getElementById(hashId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("highlight");
    }
  }
}

function bindFilterEvents() {
  const categorySelect = document.getElementById("filter-category");
  const searchInput = document.getElementById("filter-search");

  categorySelect.addEventListener("change", () => {
    filters.category = categorySelect.value;
    visibleCount = PAGE_SIZE;
    renderList();
  });

  searchInput.addEventListener(
    "input",
    debounce(() => {
      filters.search = searchInput.value.trim();
      visibleCount = PAGE_SIZE;
      renderList();
    }, 250)
  );
}

async function initNotices() {
  const listEl = document.getElementById("notice-board-list");
  showLoading(listEl, "নোটিশ লোড হচ্ছে...");

  const notices = await fetchJSON("notices.json");
  if (!notices) return showError(listEl);

  allNotices = notices;
  populateFilterOptions(notices);
  bindFilterEvents();
  renderList();
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderFooter();
  initNotices();
});
