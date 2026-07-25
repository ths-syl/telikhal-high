import { fetchJSON } from "../core/fetchData.js";
import { initNavbar } from "../components/navbar.js";
import { initScrollReveal } from "../core/scrollReveal.js";

/**
 * ⚠️ এখানে আপনার ডিপ্লয় করা Google Apps Script Web App এর /exec URL বসান।
 * (Apps Script এডিটরে Deploy > New deployment > Web app করার পর যে URL পাবেন)
 */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/আপনার_ডিপ্লয়মেন্ট_আইডি/exec";

let schoolInfo = null;

async function renderHeaderFooter() {
  const config = await fetchJSON("site-config.json");
  const info = await fetchJSON("school-info.json");
  if (!config || !info) return;
  schoolInfo = info;

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

function toggleGroupField() {
  const classSelect = document.getElementById("rf-class");
  const groupField = document.getElementById("rf-group-field");
  const groupSelect = document.getElementById("rf-group");
  const needsGroup = classSelect.value === "৯ম" || classSelect.value === "১০ম";
  groupField.style.display = needsGroup ? "" : "none";
  groupSelect.required = needsGroup;
}

function showError(message) {
  const errorEl = document.getElementById("result-error");
  const marksheetEl = document.getElementById("marksheet-wrap");
  marksheetEl.innerHTML = "";
  errorEl.textContent = message;
  errorEl.style.display = "block";
}

function clearError() {
  document.getElementById("result-error").style.display = "none";
}

function subjectRowHTML(s) {
  const gradeClass = s.grade === "F" ? "grade-f" : "";
  const componentNote = s.componentFail
    ? `<div class="component-fail-note">* কোনো একটি অংশে (CQ/MCQ/Practical) ন্যূনতম ৩৩% পাসমার্ক পাননি</div>`
    : "";
  return `
    <tr>
      <td>${s.name}${componentNote}</td>
      <td class="num">${s.examTotal} / ${s.examMax}</td>
      <td class="num">${s.ca} / ২০</td>
      <td class="num">${s.finalMark.toFixed(1)}</td>
      <td class="num ${gradeClass}">${s.grade}</td>
      <td class="num ${gradeClass}">${s.gpa.toFixed(2)}</td>
    </tr>
  `;
}

function renderMarksheet(data) {
  const wrap = document.getElementById("marksheet-wrap");
  const statusClass = data.status === "Pass" ? "status-pass" : "status-fail";
  const statusText = data.status === "Pass" ? "উত্তীর্ণ (Pass)" : "অনুত্তীর্ণ (Fail)";

  wrap.innerHTML = `
    <div class="marksheet-card reveal-on-scroll" id="printable-marksheet">
      <!--
        watermark একটা আসল <img> এলিমেন্ট হিসেবে বসানো হয়েছে (CSS background-image নয়) —
        কারণ ব্রাউজারের "Print backgrounds/graphics" অপশন বন্ধ থাকলে CSS background প্রিন্টে
        বাদ পড়ে যায়, কিন্তু সাধারণ <img> কনটেন্ট সবসময় প্রিন্ট হয়, ডিভাইস/ব্রাউজার নির্বিশেষে।
      -->
      <img class="marksheet-watermark" src="${schoolInfo.logo}" alt="" aria-hidden="true">

      <div class="marksheet-content">
        <div class="marksheet-header">
          <img class="marksheet-header-logo" src="${schoolInfo.logo}" alt="স্কুল লোগো" onerror="this.style.display='none'">
          <div>
            <h2>${schoolInfo.schoolName.bn}</h2>
            <p>একাডেমিক মার্কশিট — কোম্পানীগঞ্জ, সিলেট</p>
          </div>
        </div>

        <div class="marksheet-meta-row">
          <span>নাম: <strong>${data.student.name}</strong></span>
          <span>রোল: <strong>${data.student.roll}</strong></span>
          <span>শ্রেণি: <strong>${data.meta.class}${data.meta.group ? ` (${data.meta.group})` : ""}</strong></span>
        </div>
        <div class="marksheet-meta-row">
          <span>পরীক্ষা: <strong>${data.meta.exam}</strong></span>
          <span>শিক্ষাবর্ষ: <strong>${data.meta.year}</strong></span>
          <span>শাখা: <strong>${data.student.section || "-"}</strong></span>
        </div>

        <div class="marksheet-table-wrap">
          <table class="marksheet-table">
            <thead>
              <tr><th>বিষয়</th><th>পরীক্ষার নম্বর</th><th>ধারাবাহিক মূল্যায়ন</th><th>মোট</th><th>গ্রেড</th><th>জিপিএ</th></tr>
            </thead>
            <tbody>
              ${data.subjects.map(subjectRowHTML).join("")}
            </tbody>
          </table>
        </div>

        <div class="gpa-summary-grid">
          <div class="gpa-summary-card">
            <div class="label">চূড়ান্ত জিপিএ</div>
            <div class="value">${data.finalGPA.toFixed(2)}</div>
          </div>
          <div class="gpa-summary-card">
            <div class="label">ফলাফল</div>
            <div class="value ${statusClass}">${statusText}</div>
          </div>
        </div>

        <div class="marksheet-actions">
          <button class="btn btn-primary" id="print-btn">🖨️ Print / Save as PDF</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("print-btn").addEventListener("click", () => window.print());
  initScrollReveal(wrap);
}

async function handleSearchSubmit(e) {
  e.preventDefault();
  clearError();

  const year = document.getElementById("rf-year").value;
  const exam = document.getElementById("rf-exam").value;
  const studentClass = document.getElementById("rf-class").value;
  const group = document.getElementById("rf-group").value;
  const roll = document.getElementById("rf-roll").value.trim();
  const pin = document.getElementById("rf-pin").value.trim();

  const submitBtn = document.getElementById("result-submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "খোঁজা হচ্ছে...";

  try {
    const params = new URLSearchParams({ year, exam, studentClass, roll, pin });
    if (group) params.set("group", group);

    const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
    const data = await response.json();

    if (!data.success) {
      showError(data.message || "ফলাফল পাওয়া যায়নি।");
    } else {
      document.getElementById("marksheet-wrap").innerHTML = "";
      renderMarksheet(data);
    }
  } catch (err) {
    showError("সার্ভারের সাথে সংযোগ করা যায়নি। পরে আবার চেষ্টা করুন।");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "ফলাফল দেখুন";
  }
}

function initForm() {
  document.getElementById("rf-class").addEventListener("change", toggleGroupField);
  toggleGroupField();
  document.getElementById("result-search-form").addEventListener("submit", handleSearchSubmit);
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderFooter();
  initForm();
});
