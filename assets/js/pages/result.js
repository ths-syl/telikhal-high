import { fetchJSON } from "../core/fetchData.js";
import { initNavbar } from "../components/navbar.js";
import { initScrollReveal } from "../core/scrollReveal.js";

/**
 * ⚠️  Google Apps Script Web App এর /exec 
 */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbznGyudras3QpvQ-P701PKfP4P1JFoEs9XOqnYE2Bsu4F0xjx-z2qJNjOTTP6n9b7JK/exec";

let schoolInfo = null;
let schoolInfoPromise = null;

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
  if (footerSocial) footerSocial.innerHTML = config.socialLinks.map((s) => `<a href="${s.url}" target="_blank"  aria-label="${s.platform}"><i class="fa-brands fa-${s.icon}"></i></a>`).join(""); 

  const footerContact = document.getElementById("footer-contact");
  if (footerContact)
    footerContact.innerHTML = `<li>${config.contact.address}</li><li>${config.contact.phone}</li><li>${config.contact.email}</li>`;

  initNavbar();
}

function classNeedsGroup(studentClass) {
  return studentClass === "৯ম" || studentClass === "১০ম";
}

function toggleGroupField() {
  const classSelect = document.getElementById("rf-class");
  const groupField = document.getElementById("rf-group-field");
  const groupSelect = document.getElementById("rf-group");
  const needsGroup = classNeedsGroup(classSelect.value);
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

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
function toBnDigits(num) {
  return String(num).replace(/\d/g, (d) => BN_DIGITS[d]);
}

function dashIfNA(hasPart, value) {
  return hasPart ? value : "–";
}

function subjectRowHTML(s) {
  const gradeClass = s.grade === "F" ? "grade-f" : "";

  if (s.isMultiPaper) {
    const subjectShortName = s.name.split(" (")[0];
    return s.papers
      .map((p, idx) => {
        const componentNote =
          idx === 0 && s.componentFail
            ? `<div class="component-fail-note">* কোনো একটি অংশে (সৃজনশীল/বহুনির্বাচনি) ন্যূনতম ৩৩% পাসমার্ক পাননি</div>`
            : "";
        const mergedCells =
          idx === 0
            ? `
              <td class="num" rowspan="2">${s.rawTotal}</td>
              <td class="num" rowspan="2">${s.classMax}</td>
              <td class="num ${gradeClass}" rowspan="2">${s.grade}</td>
              <td class="num ${gradeClass}" rowspan="2">${s.gpa.toFixed(2)}</td>
            `
            : "";
        return `
          <tr>
            <td>${subjectShortName} - ${p.label}${componentNote}</td>
            <td class="num">${p.cq === null ? "–" : p.cq}</td>
            <td class="num">${p.mcq === null ? "–" : p.mcq}</td>
            <td class="num">–</td>
            <td class="num">${p.ca}</td>
            ${mergedCells}
          </tr>
        `;
      })
      .join("");
  }

  const componentNote = s.componentFail
    ? `<div class="component-fail-note">* কোনো একটি অংশে (সৃজনশীল/বহুনির্বাচনি/ব্যবহারিক) ন্যূনতম ৩৩% পাসমার্ক পাননি</div>`
    : "";
  return `
    <tr>
      <td>${s.name}${componentNote}</td>
      <td class="num">${dashIfNA(s.hasCq, s.cq)}</td>
      <td class="num">${dashIfNA(s.hasMcq, s.mcq)}</td>
      <td class="num">${dashIfNA(s.hasPractical, s.practical)}</td>
      <td class="num">${s.ca}</td>
      <td class="num">${s.rawTotal}</td>
      <td class="num">${s.classMax}</td>
      <td class="num ${gradeClass}">${s.grade}</td>
      <td class="num ${gradeClass}">${s.gpa.toFixed(2)}</td>
    </tr>
  `;
}

function todayBnDate() {
  const now = new Date();
  const dd = toBnDigits(String(now.getDate()).padStart(2, "0"));
  const mm = toBnDigits(String(now.getMonth() + 1).padStart(2, "0"));
  const yyyy = toBnDigits(now.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

function renderMarksheet(data) {
  const wrap = document.getElementById("marksheet-wrap");
  const statusClass = data.status === "Pass" ? "status-pass" : "status-fail";
  const statusText = data.status === "Pass" ? "উত্তীর্ণ (Pass)" : "অনুত্তীর্ণ (Fail)";
  const meritText = data.status === "Pass" ? `${data.merit}` : "প্রযোজ্য নয়";

  wrap.innerHTML = `
    <div class="marksheet-card reveal-on-scroll" id="printable-marksheet">
      <!-- watermark: আসল <img>, CSS background নয় — তাই "Print backgrounds" অপশন বন্ধ থাকলেও প্রিন্ট হবে -->
      <img class="marksheet-watermark" src="${schoolInfo.logo}" alt="" aria-hidden="true">

      <div class="marksheet-content">
        <div class="marksheet-header">
          <img class="marksheet-header-logo" src="${schoolInfo.logo}" alt="স্কুল লোগো" onerror="this.style.display='none'">
          <div class="marksheet-header-text">
            <h2>${schoolInfo.schoolName.bn}</h2>
            <p class="marksheet-address">${schoolInfo.address.full} | EIIN: ${schoolInfo.eiin}</p>
            <p class="marksheet-doc-label">একাডেমিক মার্কশিট</p>
          </div>
        </div>

        <div class="marksheet-meta-row">
          <span>নাম: <strong>${data.student.name}</strong></span>
          <span>রোল: <strong>${data.student.roll}</strong></span>
          <span>শ্রেণি: <strong>${data.meta.class}${data.meta.group ? ` (${data.meta.group})` : ""}</strong></span>
        </div>
        <div class="marksheet-meta-row">
          <span>পরীক্ষা: <strong>${data.meta.exam}</strong></span>
          <span>শিক্ষাবর্ষ: <strong>${toBnDigits(data.meta.year)}</strong></span>
          <span>শাখা: <strong>${data.student.section || "-"}</strong></span>
        </div>

        <div class="marksheet-table-wrap">
          <table class="marksheet-table">
            <thead>
              <tr>
                <th>বিষয়</th>
                <th>সৃজনশীল</th>
                <th>বহুনির্বাচনি</th>
                <th>ব্যবহারিক</th>
                <th>ধারাবাহিক<br>মূল্যায়ন</th>
                <th>মোট</th>
                <th>সর্বোচ্চ<br>(ক্লাস)</th>
                <th>গ্রেড</th>
                <th>জিপিএ</th>
              </tr>
            </thead>
            <tbody>
              ${data.subjects.map(subjectRowHTML).join("")}
            </tbody>
          </table>
        </div>

        <div class="gpa-summary-grid">
          <div class="gpa-summary-card">
            <div class="label">সর্বমোট নম্বর</div>
            <div class="value">${data.grandTotal}</div>
          </div>
          <div class="gpa-summary-card">
            <div class="label">শ্রেণির সর্বোচ্চ মোট নম্বর</div>
            <div class="value">${data.classTopperTotal}</div>
          </div>
          <div class="gpa-summary-card">
            <div class="label">মেধাক্রম</div>
            <div class="value">${meritText}</div>
          </div>
          <div class="gpa-summary-card">
            <div class="label">চূড়ান্ত জিপিএ</div>
            <div class="value">${data.finalGPA.toFixed(2)}</div>
          </div>
          <div class="gpa-summary-card">
            <div class="label">ফলাফল</div>
            <div class="value ${statusClass}">${statusText}</div>
          </div>
        </div>

        <div class="marksheet-comment">
          <span class="comment-label">শ্রেণিশিক্ষকের মন্তব্য:</span>
          <span class="comment-text">${data.comment || "—"}</span>
        </div>

        <div class="marksheet-signatures">
          <div class="signature-box">
            <img class="signature-img" src="${schoolInfo.headmasterSignature || ""}" alt="প্রধান শিক্ষকের স্বাক্ষর" onerror="this.style.display='none'">
            <div class="signature-line"></div>
            <p>প্রধান শিক্ষকের স্বাক্ষর</p>
          </div>
          <div class="signature-box">
            <div class="signature-blank"></div>
            <div class="signature-line"></div>
            <p>অভিভাবকের স্বাক্ষর</p>
          </div>
        </div>

        <p class="marksheet-print-date">এই মার্কশিট ডাউনলোড করা হয়েছে: ${todayBnDate()}</p>

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
  const roll = document.getElementById("rf-roll").value.trim();
  const pin = document.getElementById("rf-pin").value.trim();

  const submitBtn = document.getElementById("result-submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "খোঁজা হচ্ছে...";

  try {
    const params = new URLSearchParams({ year, exam, studentClass, roll, pin });
    // বিভাগ শুধু ৯ম/১০ম শ্রেণির জন্যই পাঠানো হবে — নাহলে ৬ষ্ঠ-৮ম এর ফলাফলেও ভুলভাবে বিভাগ দেখানো হয়
    if (classNeedsGroup(studentClass)) {
      params.set("group", document.getElementById("rf-group").value);
    }

    const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
    const data = await response.json();

    if (!data.success) {
      showError(data.message || "ফলাফল পাওয়া যায়নি।");
    } else {
      if (!schoolInfo) await schoolInfoPromise; // দ্রুত সাবমিট করলেও schoolInfo লোড শেষ হওয়া নিশ্চিত করা
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
  schoolInfoPromise = renderHeaderFooter();
  initForm();
});
