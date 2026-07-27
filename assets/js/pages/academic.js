import { fetchJSON, showLoading, showError } from "../core/fetchData.js";
import { initNavbar } from "../components/navbar.js";
import { initScrollReveal } from "../core/scrollReveal.js";

let academicData = null;
const CLASS_ORDER = ["৬ষ্ঠ শ্রেণি", "৭ম শ্রেণি", "৮ম শ্রেণি", "৯ম শ্রেণি", "১০ম শ্রেণি"];
const GROUP_NAMES = ["বিজ্ঞান", "মানবিক", "ব্যবসায় শিক্ষা"];

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

function initTabs() {
  const tabBtns = document.querySelectorAll(".academic-tab-btn");
  const panels = document.querySelectorAll(".academic-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.target).classList.add("active");
    });
  });
}

function initSubTabs() {
  const subTabBtns = document.querySelectorAll(".academic-subtab-btn");
  const subPanels = document.querySelectorAll(".academic-subpanel");

  subTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      subTabBtns.forEach((b) => b.classList.remove("active"));
      subPanels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.subtarget).classList.add("active");
    });
  });
}

function getOrderedClasses() {
  const present = academicData.classes.map((c) => c.class);
  return CLASS_ORDER.filter((c) => present.includes(c));
}

function getClassData(className) {
  return academicData.classes.find((c) => c.class === className);
}

/**
 * class + (প্রযোজ্য হলে) group নির্বাচনের জন্য দুটো <select> বসায় এবং
 * নির্বাচন পরিবর্তন হলে onChange(classData, groupName|null) কল করে।
 */
function buildClassGroupSelector(containerId, classSelectId, groupSelectId, onChange) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <select class="academic-select" id="${classSelectId}" aria-label="শ্রেণি নির্বাচন করুন"></select>
    <select class="academic-select" id="${groupSelectId}" aria-label="বিভাগ নির্বাচন করুন" style="display:none;"></select>
  `;
  const classSelect = document.getElementById(classSelectId);
  const groupSelect = document.getElementById(groupSelectId);

  const orderedClasses = getOrderedClasses();
  classSelect.innerHTML = orderedClasses.map((c) => `<option value="${c}">${c}</option>`).join("");

  function handleClassChange() {
    const classData = getClassData(classSelect.value);
    if (classData.hasGroups) {
      groupSelect.style.display = "";
      groupSelect.innerHTML = GROUP_NAMES.map((g) => `<option value="${g}">${g}</option>`).join("");
      onChange(classData, groupSelect.value);
    } else {
      groupSelect.style.display = "none";
      onChange(classData, null);
    }
  }

  classSelect.addEventListener("change", handleClassChange);
  groupSelect.addEventListener("change", () => onChange(getClassData(classSelect.value), groupSelect.value));

  handleClassChange();
}

/* ===================== ক্লাস রুটিন ===================== */
function renderRoutineLink(classData, groupName) {
  const wrap = document.getElementById("routine-link-wrap");
  const pdfUrl = groupName ? classData.groups[groupName].routinePdf : classData.routinePdf;
  const label = groupName ? `${classData.class} (${groupName})` : classData.class;

  wrap.innerHTML = `
    <div class="pdf-resource-card">
      <div>
        <p class="pdf-resource-title">${label} — ক্লাস রুটিন ${academicData?.academicYear}</p>
        <p class="pdf-resource-sub">গুগল ড্রাইভ থেকে সরাসরি দেখুন বা ডাউনলোড করুন</p>
      </div>
      <a class="pdf-link-btn" href="${pdfUrl}" target="_blank" rel="noopener">📄 পিডিএফ দেখুন</a>
    </div>
  `;
}

async function initRoutine() {
  buildClassGroupSelector("routine-selector", "routine-class-select", "routine-group-select", renderRoutineLink);
}

/* ===================== পরীক্ষার রুটিন ===================== */
function renderExamRoutineLink(classData, groupName) {
  const wrap = document.getElementById("exam-routine-link-wrap");
  const pdfUrl = groupName ? classData.groups[groupName].examRoutinePdf : classData.examRoutinePdf;
  const label = groupName ? `${classData.class} (${groupName})` : classData.class;

  wrap.innerHTML = `
    <div class="pdf-resource-card">
      <div>
        <p class="pdf-resource-title">${label} — পরীক্ষার রুটিন ${academicData?.academicYear}</p>
        <p class="pdf-resource-sub">গুগল ড্রাইভ থেকে সরাসরি দেখুন বা ডাউনলোড করুন</p>
      </div>
      <a class="pdf-link-btn" href="${pdfUrl}" target="_blank" rel="noopener">📄 পিডিএফ দেখুন</a>
    </div>
  `;
}

async function initExamRoutine() {
  buildClassGroupSelector("exam-routine-selector", "exam-routine-class-select", "exam-routine-group-select", renderExamRoutineLink);
}

/* ===================== বার্ষিক ক্যালেন্ডার ===================== */
async function initCalendarPdf() {
  const wrap = document.getElementById("calendar-pdf-wrap");
  wrap.innerHTML = `
    <div class="pdf-resource-card pdf-resource-card-highlight">
      <div>
        <p class="pdf-resource-title">বার্ষিক একাডেমিক ক্যালেন্ডার ${academicData?.academicYear}</p>
        <p class="pdf-resource-sub">সম্পূর্ণ বছরের ছুটি, পরীক্ষা ও গুরুত্বপূর্ণ দিনের তালিকা</p>
      </div>
      <a class="pdf-link-btn" href="${academicData.calendarPdf}" target="_blank" rel="noopener">📄 পিডিএফ দেখুন</a>
    </div>
  `;
}

/* ===================== সিলেবাস ও পাঠ্যপুস্তক (একই কাঠামো) ===================== */
function subjectListHTML(subjects, pdfField, btnLabel) {
  return subjects
    .map(
      (s) => `
    <div class="subject-resource-row reveal-on-scroll">
      <span class="subject-name">${s.subject}  — ${academicData?.academicYear} শিক্ষাবর্ষ </span>
      <a class="pdf-link-btn pdf-link-btn-sm" href="${s[pdfField]}" target="_blank" rel="noopener">📄 ${btnLabel}</a>
    </div>
  `
    )
    .join("");
}

function renderSyllabus(classData, groupName) {
  const wrap = document.getElementById("syllabus-list-wrap");
  const subjects = groupName ? classData.groups[groupName].subjects : classData.subjects;
  wrap.innerHTML = subjectListHTML(subjects, "syllabusPdf", "সিলেবাস দেখুন");
  initScrollReveal(wrap);
}

function renderTextbooks(classData, groupName) {
  const wrap = document.getElementById("textbook-list-wrap");
  const subjects = groupName ? classData.groups[groupName].subjects : classData.subjects;
  wrap.innerHTML = subjectListHTML(subjects, "textbookPdf", "বই দেখুন");
  initScrollReveal(wrap);
}

async function initSyllabus() {
  buildClassGroupSelector("syllabus-selector", "syllabus-class-select", "syllabus-group-select", renderSyllabus);
}

async function initTextbooks() {
  buildClassGroupSelector("textbook-selector", "textbook-class-select", "textbook-group-select", renderTextbooks);
}

/* ===================== গুরুত্বপূর্ণ দিন ও ছুটি (calendar.json থেকে সহায়ক তথ্য) ===================== */
function toBnDigits(num) {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/\d/g, (d) => bn[d]);
}

async function initCalendarHighlights() {
  const eventsEl = document.getElementById("event-list");
  const holidaysEl = document.getElementById("holiday-grid");
  const yearEl = document.getElementById("academic-year-label");
  if (!eventsEl || !holidaysEl) return;

  const data = await fetchJSON("calendar.json");
  if (!data) return showError(eventsEl);

  if (yearEl) yearEl.textContent = `শিক্ষাবর্ষ ${toBnDigits(data.academicYear)}`;

  eventsEl.innerHTML = data.events
    .map(
      (e) => `
    <div class="event-item reveal-on-scroll">
      <div class="event-date">${e.date}</div>
      <div>
        <p class="event-title">${e.title}</p>
        <span class="event-type-badge">${e.type}</span>
      </div>
    </div>
  `
    )
    .join("");

  holidaysEl.innerHTML = data.holidays
    .map(
      (h) => `
    <div class="holiday-card reveal-on-scroll">
      <p class="title">${h.title}</p>
      <p class="date">${h.date}</p>
    </div>
  `
    )
    .join("");

  initScrollReveal(eventsEl);
  initScrollReveal(holidaysEl);
}

async function initAcademicPage() {
  const wrap = document.getElementById("routine-link-wrap");
  showLoading(wrap, "একাডেমিক রিসোর্স লোড হচ্ছে...");

  academicData = await fetchJSON("academic-resources.json");
  if (!academicData) return showError(wrap);

  initRoutine();
  initExamRoutine();
  initCalendarPdf();
  initSyllabus();
  initTextbooks();
  initCalendarHighlights();
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderFooter();
  initTabs();
  initSubTabs();
  initAcademicPage();
});
