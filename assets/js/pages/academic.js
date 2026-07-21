import { fetchJSON, showLoading, showError } from "../core/fetchData.js";
import { initNavbar } from "../components/navbar.js";

const CLASS_ORDER = ["৬ষ্ঠ শ্রেণি", "৭ম শ্রেণি", "৮ম শ্রেণি", "৯ম শ্রেণি (বিজ্ঞান)", "১০ম শ্রেণি (বিজ্ঞান)"];

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

let routineData = null;

function renderRoutineForClass(className) {
  const tableWrap = document.getElementById("routine-table-wrap");
  const dayCardsWrap = document.getElementById("routine-day-cards");
  if (!routineData) return;

  const classData = routineData.classes.find((c) => c.className === className);
  if (!classData) return;

  // ডেস্কটপ টেবিল
  const allSubjects = classData.days.map((d) => d.periods);
  const maxPeriods = Math.max(...allSubjects.map((p) => p.length));

  let tableHTML = `<table class="routine-table"><thead><tr><th>দিন</th>`;
  for (let i = 1; i <= maxPeriods; i++) tableHTML += `<th>${i} নং ক্লাস</th>`;
  tableHTML += `</tr></thead><tbody>`;
  classData.days.forEach((d) => {
    tableHTML += `<tr><td class="day-label">${d.day}</td>`;
    for (let i = 0; i < maxPeriods; i++) tableHTML += `<td>${d.periods[i] || "-"}</td>`;
    tableHTML += `</tr>`;
  });
  tableHTML += `</tbody></table>`;
  tableWrap.innerHTML = tableHTML;

  // মোবাইল দিনভিত্তিক কার্ড
  dayCardsWrap.innerHTML = classData.days
    .map(
      (d) => `
    <div class="routine-day-card">
      <div class="day-header">${d.day}</div>
      <ul>
        ${d.periods.map((p, i) => `<li><span class="period-no">${i + 1}.</span> ${p}</li>`).join("")}
      </ul>
    </div>
  `
    )
    .join("");
}

async function initRoutine() {
  const wrap = document.getElementById("routine-content");
  showLoading(wrap, "রুটিন লোড হচ্ছে...");

  routineData = await fetchJSON("routine.json");
  if (!routineData) return showError(wrap);

  wrap.innerHTML = `
    <p class="routine-updated">সর্বশেষ হালনাগাদ: ${routineData.updatedOn}</p>
    <select class="routine-class-select" id="routine-class-select" aria-label="শ্রেণি নির্বাচন করুন"></select>
    <div class="routine-table-wrap" id="routine-table-wrap"></div>
    <div class="routine-day-cards" id="routine-day-cards"></div>
  `;

  const presentClasses = routineData.classes.map((c) => c.className);
  const ordered = CLASS_ORDER.filter((c) => presentClasses.includes(c));
  const select = document.getElementById("routine-class-select");
  select.innerHTML = ordered.map((c) => `<option value="${c}">${c}</option>`).join("");

  select.addEventListener("change", () => renderRoutineForClass(select.value));
  renderRoutineForClass(ordered[0]);
}

function toBnDigits(num) {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/\d/g, (d) => bn[d]);
}

async function initCalendar() {
  const eventsEl = document.getElementById("event-list");
  const holidaysEl = document.getElementById("holiday-grid");
  const yearEl = document.getElementById("academic-year-label");
  showLoading(eventsEl, "ক্যালেন্ডার লোড হচ্ছে...");

  const data = await fetchJSON("calendar.json");
  if (!data) return showError(eventsEl);

  if (yearEl) yearEl.textContent = `শিক্ষাবর্ষ ${toBnDigits(data.academicYear)}`;

  eventsEl.innerHTML = data.events
    .map(
      (e) => `
    <div class="event-item">
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
    <div class="holiday-card">
      <p class="title">${h.title}</p>
      <p class="date">${h.date}</p>
    </div>
  `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderFooter();
  initTabs();
  initRoutine();
  initCalendar();
});
