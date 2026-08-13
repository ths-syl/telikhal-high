import { fetchJSON, showLoading, showError } from "../core/fetchData.js";
import { initNavbar } from "../components/navbar.js";
import { initScrollReveal } from "../core/scrollReveal.js";
import { initPwaTabbar } from "../core/pwaTabbar.js";
import { initOfflineStatus } from "../core/offlineStatus.js";
import { initPullToRefresh } from "../core/pullToRefresh.js";

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

function regulationBodyHTML(r) {
  if (r.type === "notavailable") {
    return `<div class="regulation-not-available">⏳ ${r.message}</div>`;
  }
  return `<ul>${r.items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function regulationItemHTML(r) {
  return `
    <div class="regulation-item" data-id="${r.id}">
      <div class="regulation-header">
        <span class="icon">${r.icon}</span>
        <h3>${r.title}</h3>
        <span class="toggle-arrow">▾</span>
      </div>
      <div class="regulation-body">
        <div class="regulation-body-inner">${regulationBodyHTML(r)}</div>
      </div>
    </div>
  `;
}

async function initRegulations() {
  const listEl = document.getElementById("regulation-list");
  showLoading(listEl, "নিয়মাবলী লোড হচ্ছে...");

  const data = await fetchJSON("regulations.json");
  if (!data) return showError(listEl);

  listEl.innerHTML = data.map(regulationItemHTML).join("");

  listEl.querySelectorAll(".regulation-header").forEach((header) => {
    header.addEventListener("click", () => {
      header.closest(".regulation-item").classList.toggle("open");
    });
  });

  initScrollReveal(listEl);
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderFooter();
  initRegulations();
  initPwaTabbar();
  initOfflineStatus();
  initPullToRefresh();
});
