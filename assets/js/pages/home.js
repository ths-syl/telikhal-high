import { fetchJSON, showError } from "../core/fetchData.js";
import { initHeroSlider } from "../components/slider.js";
import { renderNoticeWidget } from "../components/noticeWidget.js";
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
  if (navList) {
    navList.innerHTML = config.navigation.map((n) => `<li><a href="${n.url}">${n.label}</a></li>`).join("");
  }

  const footerQuick = document.getElementById("footer-quick-links");
  if (footerQuick) {
    footerQuick.innerHTML = config.footerLinks.quick.map((n) => `<li><a href="${n.url}">${n.label}</a></li>`).join("");
  }
  const footerImportant = document.getElementById("footer-important-links");
  if (footerImportant) {
    footerImportant.innerHTML = config.footerLinks.important
      .map((n) => `<li><a href="${n.url}" target="_blank" rel="noopener">${n.label}</a></li>`)
      .join("");
  }
  const footerSocial = document.getElementById("footer-social");
  if (footerSocial) {
    footerSocial.innerHTML = config.socialLinks.map((s) => `<a href="${s.url}" aria-label="${s.platform}">🔗</a>`).join("");
  }
  const footerContact = document.getElementById("footer-contact");
  if (footerContact) {
    footerContact.innerHTML = `
      <li>${config.contact.address}</li>
      <li>${config.contact.phone}</li>
      <li>${config.contact.email}</li>
    `;
  }

  initNavbar();
}

async function renderHero() {
  const config = await fetchJSON("site-config.json");
  const heroEl = document.getElementById("hero-slider");
  if (config && heroEl) initHeroSlider(heroEl, config.heroSlides);
}

async function renderAboutAndMessages() {
  const info = await fetchJSON("school-info.json");
  if (!info) return;

  const aboutEl = document.getElementById("about-content");
  if (aboutEl) aboutEl.textContent = info.aboutSchool;

  const headmasterEl = document.getElementById("headmaster-message");
  if (headmasterEl) {
    const h = info.headmasterMessage;
    headmasterEl.innerHTML = `
      <img class="avatar-img" data-name="${h.name}" src="${h.photo}" alt="${h.name}">
      <div>
        <p class="name">${h.name}</p>
        <p class="role">${h.designation}</p>
        <p class="quote">"${h.message}"</p>
      </div>
    `;
    bindAvatarFallbacks(headmasterEl);
  }

  const smcEl = document.getElementById("smc-message");
  if (smcEl) {
    const s = info.smcPresidentMessage;
    smcEl.innerHTML = `
      <img class="avatar-img" data-name="${s.name}" src="${s.photo}" alt="${s.name}">
      <div>
        <p class="name">${s.name}</p>
        <p class="role">${s.designation}</p>
        <p class="quote">"${s.message}"</p>
      </div>
    `;
    bindAvatarFallbacks(smcEl);
  }

  const mapEl = document.getElementById("map-widget");
  if (mapEl) {
    mapEl.innerHTML = `<iframe loading="lazy" src="https://www.google.com/maps?q=${info.location.lat},${info.location.lng}&z=14&output=embed"></iframe>`;
  }
}

async function renderAchievements() {
  const data = await fetchJSON("achievements.json");
  const el = document.getElementById("achievements-grid");
  if (!el) return;
  if (!data) return showError(el);

  const icons = { trophy: "🏆", medal: "🥇", star: "⭐", award: "🎖️" };
  el.innerHTML = data
    .map(
      (a) => `
    <div class="achievement-card">
      <div class="icon">${icons[a.icon] || "🏅"}</div>
      <div class="year">${a.year}</div>
      <h4>${a.title}</h4>
      <p>${a.description}</p>
    </div>`
    )
    .join("");
}

async function renderNotableStudents() {
  const data = await fetchJSON("notable-students.json");
  const el = document.getElementById("notable-students-grid");
  if (!el) return;
  if (!data) return showError(el);

  el.innerHTML = data
    .map(
      (s) => `
    <div class="info-card">
      <div class="photo-wrap">
        <img class="avatar-img" data-name="${s.name}" src="${s.photo}" alt="${s.name}" loading="lazy">
      </div>
      <div class="card-body">
        <p class="card-name">${s.name}</p>
        <p class="card-role">${s.batch}</p>
        <span class="card-tag">${s.achievement}</span>
      </div>
    </div>`
    )
    .join("");
  bindAvatarFallbacks(el);
}

async function renderNotices() {
  const data = await fetchJSON("notices.json");
  const el = document.getElementById("notice-widget-body");
  renderNoticeWidget(el, data);
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderFooter();
  renderHero();
  renderAboutAndMessages();
  renderAchievements();
  renderNotableStudents();
  renderNotices();
});
