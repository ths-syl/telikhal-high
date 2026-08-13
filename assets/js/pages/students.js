import { fetchJSON, showLoading, showError } from "../core/fetchData.js";
import { debounce } from "../core/domUtils.js";
import { openModal } from "../components/modal.js";
import { initNavbar } from "../components/navbar.js";
import { initScrollReveal } from "../core/scrollReveal.js";
import { initCountUp } from "../core/countUp.js";
import { initPwaTabbar } from "../core/pwaTabbar.js";
import { initOfflineStatus } from "../core/offlineStatus.js";
import { initPullToRefresh } from "../core/pullToRefresh.js";

const PAGE_SIZE = 8;
let allStudents = [];
let visibleCount = PAGE_SIZE;
let filters = { class: "সব", group: "সব", search: "" };

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

const CLASS_ORDER = ["৬ষ্ঠ", "৭ম", "৮ম", "৯ম", "১০ম"];

function renderStats(stat) {
  const overviewEl = document.getElementById("stats-overview");
  const classWiseEl = document.getElementById("stats-classwise");
  if (!overviewEl || !classWiseEl) return;

  const { total, boys, girls, scholarship, feeWaiver } = stat.overview;

  overviewEl.innerHTML = `
    <div class="stat-card reveal-on-scroll">
      <div class="stat-label">সর্বমোট শিক্ষার্থী</div>
      <div class="stat-number"><span class="count-up" data-count-target="${total}">০</span> জন</div>
    </div>
    <div class="stat-card reveal-on-scroll">
      <div class="stat-label">মোট ছাত্র / ছাত্রী</div>
      <div class="stat-number stat-number-sm">ছাত্র: <span class="count-up" data-count-target="${boys}">০</span> | ছাত্রী: <span class="count-up" data-count-target="${girls}">০</span></div>
    </div>
    <div class="stat-card reveal-on-scroll">
      <div class="stat-label">উপবৃত্তি প্রাপ্ত</div>
      <div class="stat-number"><span class="count-up" data-count-target="${scholarship}">০</span> জন</div>
    </div>
    <div class="stat-card reveal-on-scroll">
      <div class="stat-label">বেতন মওকুফ (মোট)</div>
      <div class="stat-number"><span class="count-up" data-count-target="${feeWaiver}">০</span> জন</div>
    </div>
  `;

  const classesPresent = stat.classWise.map((c) => c.class);
  const orderedClasses = CLASS_ORDER.filter((c) => classesPresent.includes(c));

  classWiseEl.innerHTML = orderedClasses
    .map((cls) => classStatCardHTML(stat.classWise.find((c) => c.class === cls)))
    .join("");

  initScrollReveal(overviewEl);
  initScrollReveal(classWiseEl);
  initCountUp(overviewEl);
  initCountUp(classWiseEl);
}

function genderSplitText(obj) {
  return `(ছাত্র: <span class="count-up" data-count-target="${obj.boys}">০</span> | ছাত্রী: <span class="count-up" data-count-target="${obj.girls}">০</span>)`;
}

function classStatCardHTML(c) {
  const muslim = c.religion["মুসলিম"];
  const hindu = c.religion["হিন্দু"];
  const feeWaiverTotal = c.feeWaiver.fullFree + c.feeWaiver.halfFree;

  const groupWiseHTML = c.groupWise
    ? `
        <div class="class-stat-row">
          <span>📚 বিভাগভিত্তিক শিক্ষার্থী সংখ্যা</span>
          <span></span>
        </div>
        <div class="class-stat-sub group-wise-sub">
          ${Object.entries(c.groupWise)
            .map(([group, count]) => `<span>${group}: <span class="count-up" data-count-target="${count}">০</span> জন</span>`)
            .join(" | ")}
        </div>
      `
    : "";

  return `
    <div class="class-stat-card reveal-on-scroll">
      <div class="class-stat-header">
        <span>${c.class} শ্রেণি</span>
        <span class="class-stat-badge"><span class="count-up" data-count-target="${c.total}">০</span> জন</span>
      </div>
      <div class="class-stat-body">
        <div class="class-stat-row">
          <span>🕌 মুসলিম শিক্ষার্থী</span>
          <span><span class="count-up" data-count-target="${muslim.total}">০</span> জন</span>
        </div>
        <div class="class-stat-sub">${genderSplitText(muslim)}</div>

        <div class="class-stat-row">
          <span>🪔 হিন্দু শিক্ষার্থী</span>
          <span><span class="count-up" data-count-target="${hindu.total}">০</span> জন</span>
        </div>
        <div class="class-stat-sub">${genderSplitText(hindu)}</div>

        <div class="class-stat-row">
          <span>💰 উপবৃত্তি প্রাপ্ত</span>
          <span><span class="count-up" data-count-target="${c.scholarship.total}">০</span> জন</span>
        </div>
        <div class="class-stat-sub">${genderSplitText(c.scholarship)}</div>

        <div class="class-stat-row">
          <span>🎫 ফ্রি-শিপ (বেতন মাফ)</span>
          <span><span class="count-up" data-count-target="${feeWaiverTotal}">০</span> জন</span>
        </div>
        <div class="class-stat-sub">(ফুল ফ্রি: <span class="count-up" data-count-target="${c.feeWaiver.fullFree}">০</span> | হাফ ফ্রি: <span class="count-up" data-count-target="${c.feeWaiver.halfFree}">০</span>)</div>
        ${groupWiseHTML}
      </div>
    </div>
  `;
}

function toBnDigits(num) {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/\d/g, (d) => bn[d]);
}

function populateFilterOptions(students) {
  const classSelect = document.getElementById("filter-class");
  const groupSelect = document.getElementById("filter-group");
  if (!classSelect || !groupSelect) return;

  const classes = [...new Set(students.map((s) => s.class))];
  const groups = [...new Set(students.map((s) => s.group).filter(Boolean))];

  classSelect.innerHTML = `<option value="সব">সব শ্রেণি</option>` + classes.map((c) => `<option value="${c}">${c}</option>`).join("");
  groupSelect.innerHTML = `<option value="সব">সব বিভাগ</option>` + groups.map((g) => `<option value="${g}">${g}</option>`).join("");
}

function getFilteredStudents() {
  return allStudents.filter((s) => {
    const matchClass = filters.class === "সব" || s.class === filters.class;
    const matchGroup = filters.group === "সব" || s.group === filters.group;
    const matchSearch = !filters.search || s.name.toLowerCase().includes(filters.search.toLowerCase()) || s.roll.includes(filters.search);
    return matchClass && matchGroup && matchSearch;
  });
}

function studentCardHTML(s) {
  const groupText = s.group ? ` (${s.group})` : "";
  return `
    <div class="student-list-card reveal-on-scroll" tabindex="0" data-id="${s.id}" role="button" aria-label="${s.name} এর বিস্তারিত দেখুন">
      <div class="student-avatar-icon">🎓</div>
      <p class="student-name">${s.name}</p>
      <p class="student-meta">শ্রেণী: ${s.class}${groupText} | রোল: ${s.roll}</p>
    </div>
  `;
}

function openStudentModal(s) {
  const rows = [["শ্রেণী", s.class]];
  if (s.group) rows.push(["বিভাগ", s.group]);
  rows.push(["রোল নম্বর", s.roll]);
  rows.push(["রক্তের গ্রুপ", s.bloodGroup]);
  rows.push(["অভিভাবক", s.guardian]);
  rows.push(["ঠিকানা", s.address]);

  openModal(`
    <div class="student-modal-header">
      <div class="student-avatar-icon student-avatar-icon-lg">🎓</div>
      <h3>${s.name}</h3>
    </div>
    <div class="student-info-table-wrap">
      <table class="student-info-table">
        ${rows.map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join("")}
      </table>
    </div>
  `);
}

function renderGrid() {
  const gridEl = document.getElementById("students-grid");
  const loadMoreWrap = document.getElementById("load-more-wrap");
  const countEl = document.getElementById("result-count");
  if (!gridEl) return;

  const filtered = getFilteredStudents();
  if (countEl) countEl.textContent = `${toBnDigits(filtered.length)} জন শিক্ষার্থী পাওয়া গেছে`;

  if (filtered.length === 0) {
    gridEl.innerHTML = `<p>কোনো শিক্ষার্থী পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন।</p>`;
    loadMoreWrap.innerHTML = "";
    return;
  }

  const visible = filtered.slice(0, visibleCount);
  gridEl.innerHTML = visible.map(studentCardHTML).join("");

  gridEl.querySelectorAll(".student-list-card").forEach((card) => {
    const student = filtered.find((s) => s.id === card.dataset.id);
    const open = () => openStudentModal(student);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });

  initScrollReveal(gridEl);

  if (visibleCount < filtered.length) {
    loadMoreWrap.innerHTML = `<button class="btn btn-primary" id="load-more-btn">আরও দেখুন</button>`;
    document.getElementById("load-more-btn").addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      renderGrid();
    });
  } else {
    loadMoreWrap.innerHTML = "";
  }
}

function bindFilterEvents() {
  const classSelect = document.getElementById("filter-class");
  const groupSelect = document.getElementById("filter-group");
  const searchInput = document.getElementById("filter-search");

  classSelect.addEventListener("change", () => {
    filters.class = classSelect.value;
    visibleCount = PAGE_SIZE;
    renderGrid();
  });

  groupSelect.addEventListener("change", () => {
    filters.group = groupSelect.value;
    visibleCount = PAGE_SIZE;
    renderGrid();
  });

  searchInput.addEventListener(
    "input",
    debounce(() => {
      filters.search = searchInput.value.trim();
      visibleCount = PAGE_SIZE;
      renderGrid();
    }, 250)
  );
}

async function initStudents() {
  const gridEl = document.getElementById("students-grid");
  const statsOverviewEl = document.getElementById("stats-overview");
  showLoading(gridEl, "শিক্ষার্থীদের তথ্য লোড হচ্ছে...");
  showLoading(statsOverviewEl, "পরিসংখ্যান লোড হচ্ছে...");

  const [students, stat] = await Promise.all([fetchJSON("students.json"), fetchJSON("studentstat.json")]);

  if (!stat) {
    showError(statsOverviewEl);
  } else {
    renderStats(stat);
  }

  if (!students) return showError(gridEl);

  allStudents = students;
  populateFilterOptions(students);
  bindFilterEvents();
  renderGrid();
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderFooter();
  initStudents();
  initPwaTabbar();
  initOfflineStatus();
  initPullToRefresh();
});
