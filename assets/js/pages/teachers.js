import { fetchJSON, showLoading, showError } from "../core/fetchData.js";
import { openModal } from "../components/modal.js";
import { initNavbar } from "../components/navbar.js";
import { bindAvatarFallbacks } from "../core/avatar.js";

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

function teacherCardHTML(t) {
  return `
    <div class="info-card" tabindex="0" data-id="${t.id}" role="button" aria-label="${t.name} এর বিস্তারিত দেখুন">
      <div class="photo-wrap">
        <img class="avatar-img" data-name="${t.name}" src="${t.photo}" alt="${t.name}" loading="lazy">
      </div>
      <div class="card-body">
        <p class="card-name">${t.name}</p>
        <p class="card-role">${t.designation}</p>
        <span class="card-tag">${t.subject}</span>
      </div>
    </div>
  `;
}

function committeeCardHTML(c) {
  return `
    <div class="info-card" tabindex="0" data-id="${c.id}" role="button" aria-label="${c.name} এর বিস্তারিত দেখুন">
      <div class="photo-wrap">
        <img class="avatar-img" data-name="${c.name}" src="${c.photo}" alt="${c.name}" loading="lazy">
      </div>
      <div class="card-body">
        <p class="card-name">${c.name}</p>
        <p class="card-role">${c.designation}</p>
        <span class="card-tag">${c.occupation}</span>
      </div>
    </div>
  `;
}

function openTeacherModal(t) {
  const html = `
    <div class="modal-header">
      <img class="avatar-img" data-name="${t.name}" src="${t.photo}" alt="${t.name}">
      <div>
        <h3>${t.name}</h3>
        <p class="role" style="color:var(--color-amber-dark); font-family:var(--font-ui); font-size:0.85rem;">${t.designation}</p>
      </div>
    </div>
    <div class="modal-body">
      <dl>
        <dt>বিষয়</dt><dd>${t.subject}</dd>
        <dt>শিক্ষাগত যোগ্যতা</dt><dd>${t.qualification}</dd>
        <dt>ফোন</dt><dd>${t.phone}</dd>
        <dt>ইমেইল</dt><dd>${t.email}</dd>
        <dt>রক্তের গ্রুপ</dt><dd>${t.bloodGroup}</dd>
      </dl>
      <p class="address-note">${t.address}</p>
    </div>
  `;
  openModal(html);
  bindAvatarFallbacks(document.querySelector(".modal-overlay"));
}

function openCommitteeModal(c) {
  const html = `
    <div class="modal-header">
      <img class="avatar-img" data-name="${c.name}" src="${c.photo}" alt="${c.name}">
      <div>
        <h3>${c.name}</h3>
        <p class="role" style="color:var(--color-amber-dark); font-family:var(--font-ui); font-size:0.85rem;">${c.designation}</p>
      </div>
    </div>
    <div class="modal-body">
      <dl>
        <dt>পেশা</dt><dd>${c.occupation}</dd>
      </dl>
    </div>
  `;
  openModal(html);
  bindAvatarFallbacks(document.querySelector(".modal-overlay"));
}

async function renderTeachers() {
  const gridEl = document.getElementById("teachers-grid");
  if (!gridEl) return;
  showLoading(gridEl, "শিক্ষকদের তথ্য লোড হচ্ছে...");

  const teachers = await fetchJSON("teachers.json");
  if (!teachers) return showError(gridEl);

  gridEl.innerHTML = teachers.map(teacherCardHTML).join("");
  bindAvatarFallbacks(gridEl);

  gridEl.querySelectorAll(".info-card").forEach((card) => {
    const teacher = teachers.find((t) => t.id === card.dataset.id);
    const open = () => openTeacherModal(teacher);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

async function renderCommittee() {
  const gridEl = document.getElementById("committee-grid");
  if (!gridEl) return;
  showLoading(gridEl, "কমিটির তথ্য লোড হচ্ছে...");

  const committee = await fetchJSON("committee.json");
  if (!committee) return showError(gridEl);

  gridEl.innerHTML = committee.map(committeeCardHTML).join("");
  bindAvatarFallbacks(gridEl);

  gridEl.querySelectorAll(".info-card").forEach((card) => {
    const member = committee.find((c) => c.id === card.dataset.id);
    const open = () => openCommitteeModal(member);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderFooter();
  renderTeachers();
  renderCommittee();
});
