import { fetchJSON, showError } from "../core/fetchData.js";
import { initHeroSlider } from "../components/slider.js";
import { renderNoticeWidget } from "../components/noticeWidget.js";
import { initNavbar } from "../components/navbar.js";
import { bindAvatarFallbacks } from "../core/avatar.js";
import { parseBnDate } from "../core/domUtils.js";
import { initScrollReveal } from "../core/scrollReveal.js";

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

  const aboutPhotoEl = document.getElementById("about-photo");
  if (aboutPhotoEl && info.aboutPhoto) {
    aboutPhotoEl.style.backgroundImage = `url('${info.aboutPhoto}')`;
  }

  /**
   * ছবির স্পেসিফিকেশন (headmasterMessage.photo / smcPresidentMessage.photo):
   *   ফরম্যাট: WebP
   *   ডাইমেনশন: 200x200px (1:1 বৃত্তাকার ছবি হিসেবে দেখানো হয়)
   *   ম্যাক্স সাইজ: ~30KB প্রতি ছবি
   */
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
    <div class="achievement-card reveal-on-scroll">
      <div class="icon">${icons[a.icon] || "🏅"}</div>
      <div class="year">${a.year}</div>
      <h4>${a.title}</h4>
      <p>${a.description}</p>
    </div>`
    )
    .join("");
  initScrollReveal(el);
}

async function renderNotableStudents() {
  const data = await fetchJSON("notable-students.json");
  const el = document.getElementById("notable-students-grid");
  if (!el) return;
  if (!data) return showError(el);

  /**
   * ছবির স্পেসিফিকেশন (notable-students.json এর photo ফিল্ড — কৃতি/প্রাক্তন শিক্ষার্থী):
   *   ফরম্যাট: WebP
   *   ডাইমেনশন: 400x400px (1:1 বর্গাকার হেডশট)
   *   ম্যাক্স সাইজ: ~40-60KB প্রতি ছবি
   */
  el.innerHTML = data
    .map(
      (s) => `
    <div class="info-card reveal-on-scroll">
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
  initScrollReveal(el);
}

async function renderNotices() {
  const data = await fetchJSON("notices.json");
  const el = document.getElementById("notice-widget-body");
  renderNoticeWidget(el, data);
}

async function renderNewsTicker() {
  const el = document.getElementById("news-ticker");
  if (!el) return;

  const notices = await fetchJSON("notices.json");
  if (!notices || notices.length === 0) return;

  const latestTwo = [...notices].sort((a, b) => parseBnDate(b.date) - parseBnDate(a.date)).slice(0, 2);

  const itemsHTML = latestTwo
    .map((n) => `<a href="notices.html#${n.id}"><span class="ticker-date">${n.date}</span>${n.title}</a>`)
    .join("");

  // seamless লুপের জন্য কন্টেন্ট দুইবার বসানো হয়েছে
  el.innerHTML = `
    <span class="news-ticker-label">📢 সর্বশেষ নোটিশ</span>
    <div class="news-ticker-track-wrap">
      <div class="news-ticker-track" id="news-ticker-track">${itemsHTML}${itemsHTML}</div>
    </div>
  `;

  startTickerAnimation();
}

/**
 * CSS @keyframes এর বদলে requestAnimationFrame দিয়ে স্ক্রল করানো হয় —
 * এতে base.css এর গ্লোবাল prefers-reduced-motion override (যেটা সব CSS animation
 * বন্ধ করে দেয়, এবং কিছু dev-preview এনভায়রনমেন্টে ভুলবশত ট্রু হয়ে যায়) এর কারণে
 * টিকার আটকে/ফ্রিজ হয়ে থাকার সমস্যা হয় না।
 */
function startTickerAnimation() {
  const track = document.getElementById("news-ticker-track");
  if (!track) return;

  const speed = 40; // পিক্সেল/সেকেন্ড
  let lastTime = null;
  let offset = 0;
  const singleCopyWidth = track.scrollWidth / 2; // কন্টেন্ট দুইবার বসানো, তাই অর্ধেক = এক কপির প্রস্থ

  function step(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    offset -= speed * delta;
    if (Math.abs(offset) >= singleCopyWidth) offset += singleCopyWidth;

    track.style.transform = `translateX(${offset}px)`;
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderFooter();
  renderHero();
  renderNewsTicker();
  renderAboutAndMessages();
  renderAchievements();
  renderNotableStudents();
  renderNotices();
  initScrollReveal(document); // স্ট্যাটিক সেকশন (about-grid, message-card, sidebar) রিভিল করার জন্য
});
