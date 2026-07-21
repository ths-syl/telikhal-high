import { fetchJSON, showLoading, showError } from "../core/fetchData.js";
import { debounce } from "../core/domUtils.js";
import { openModal } from "../components/modal.js";
import { initNavbar } from "../components/navbar.js";

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
  if (footerSocial) footerSocial.innerHTML = config.socialLinks.map((s) => `<a href="${s.url}" aria-label="${s.platform}">🔗</a>`).join("");

  const footerContact = document.getElementById("footer-contact");
  if (footerContact)
    footerContact.innerHTML = `<li>${config.contact.address}</li><li>${config.contact.phone}</li><li>${config.contact.email}</li>`;

  initNavbar();
}

const CLASS_ORDER = ["৬ষ্ঠ", "৭ম", "৮ম", "৯ম", "১০ম"];

function renderStats(students) {
  const overviewEl = document.getElementById("stats-overview");
  const classWiseEl = document.getElementById("stats-classwise");
  if (!overviewEl || !classWiseEl) return;

  const total = students.length;
  const boys = students.filter((s) => s.gender === "ছেলে").length;
  const girls = students.filter((s) => s.gender === "মেয়ে").length;
  const scholarshipCount = students.filter((s) => s.scholarship).length;
  const feeWaiverCount = students.filter((s) => s.feeWaiver).length;

  overviewEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">সর্বমোট শিক্ষার্থী</div>
      <div class="stat-number">${toBnDigits(total)} জন</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">মোট ছাত্র / ছাত্রী</div>
      <div class="stat-number stat-number-sm">ছাত্র: ${toBnDigits(boys)} | ছাত্রী: ${toBnDigits(girls)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">উপবৃত্তি প্রাপ্ত</div>
      <div class="stat-number">${toBnDigits(scholarshipCount)} জন</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">বেতন মওকুফ (মোট)</div>
      <div class="stat-number">${toBnDigits(feeWaiverCount)} জন</div>
    </div>
  `;

  const classesPresent = [...new Set(students.map((s) => s.class))];
  const orderedClasses = CLASS_ORDER.filter((c) => classesPresent.includes(c));

  classWiseEl.innerHTML = orderedClasses.map((cls) => classStatCardHTML(students.filter((s) => s.class === cls), cls)).join("");
}

function genderSplit(list) {
  const boys = list.filter((s) => s.gender === "ছেলে").length;
  const girls = list.filter((s) => s.gender === "মেয়ে").length;
  return `(ছাত্র: ${toBnDigits(boys)} | ছাত্রী: ${toBnDigits(girls)})`;
}

function classStatCardHTML(students, className) {
  const total = students.length;
  const muslim = students.filter((s) => s.religion === "মুসলিম");
  const hindu = students.filter((s) => s.religion === "হিন্দু");
  const scholarship = students.filter((s) => s.scholarship);
  const fullFree = students.filter((s) => s.feeWaiver === "ফুল ফ্রি").length;
  const halfFree = students.filter((s) => s.feeWaiver === "হাফ ফ্রি").length;
  const feeWaiverTotal = fullFree + halfFree;

  return `
    <div class="class-stat-card">
      <div class="class-stat-header">
        <span>${className} শ্রেণি</span>
        <span class="class-stat-badge">${toBnDigits(total)} জন</span>
      </div>
      <div class="class-stat-body">
        <div class="class-stat-row">
          <span>🕌 মুসলিম শিক্ষার্থী</span>
          <span>${toBnDigits(muslim.length)} জন</span>
        </div>
        <div class="class-stat-sub">${genderSplit(muslim)}</div>

        <div class="class-stat-row">
          <span>🪔 হিন্দু শিক্ষার্থী</span>
          <span>${toBnDigits(hindu.length)} জন</span>
        </div>
        <div class="class-stat-sub">${genderSplit(hindu)}</div>

        <div class="class-stat-row">
          <span>💰 উপবৃত্তি প্রাপ্ত</span>
          <span>${toBnDigits(scholarship.length)} জন</span>
        </div>
        <div class="class-stat-sub">${genderSplit(scholarship)}</div>

        <div class="class-stat-row">
          <span>🎫 ফ্রি-শিপ (বেতন মাফ)</span>
          <span>${toBnDigits(feeWaiverTotal)} জন</span>
        </div>
        <div class="class-stat-sub">(ফুল ফ্রি: ${toBnDigits(fullFree)} | হাফ ফ্রি: ${toBnDigits(halfFree)})</div>
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
    <div class="student-list-card" tabindex="0" data-id="${s.id}" role="button" aria-label="${s.name} এর বিস্তারিত দেখুন">
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
  showLoading(gridEl, "শিক্ষার্থীদের তথ্য লোড হচ্ছে...");

  const students = await fetchJSON("students.json");
  if (!students) return showError(gridEl);

  allStudents = students;
  renderStats(students);
  populateFilterOptions(students);
  bindFilterEvents();
  renderGrid();
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderFooter();
  initStudents();
});
