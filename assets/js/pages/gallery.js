import { fetchJSON, showLoading, showError } from "../core/fetchData.js";
import { openModal } from "../components/modal.js";
import { initNavbar } from "../components/navbar.js";

const PAGE_SIZE = 8;
let allPhotos = [];
let activeCategory = "সব";
let visibleCount = PAGE_SIZE;

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
  initFacebookWidget(config.facebookPage);
}

function initFacebookWidget(fbConfig) {
  const wrapEl = document.getElementById("fb-widget-wrap");
  const noteEl = document.getElementById("fb-widget-note");
  if (!wrapEl || !fbConfig) return;

  // ফেসবুক পেজ প্লাগইন — SDK ও fb-page div যোগ করা হচ্ছে
  wrapEl.innerHTML = `
    <div id="fb-root"></div>
    <div class="fb-page"
      data-href="${fbConfig.pageUrl}"
      data-tabs="timeline"
      data-width="500"
      data-height="480"
      data-small-header="true"
      data-adapt-container-width="true"
      data-hide-cover="false"
      data-show-facepile="false">
    </div>
  `;
  if (noteEl) noteEl.textContent = fbConfig.note;

  if (!document.getElementById("facebook-jssdk")) {
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = "https://connect.facebook.net/bn_BD/sdk.js#xfbml=1&version=v19.0";
    document.body.appendChild(script);
  } else if (window.FB) {
    window.FB.XFBML.parse();
  }
}

function renderFilters(categories) {
  const el = document.getElementById("gallery-filters");
  if (!el) return;

  const allTabs = ["সব", ...categories];
  el.innerHTML = allTabs
    .map((cat) => `<button class="filter-btn ${cat === activeCategory ? "active" : ""}" data-category="${cat}">${cat}</button>`)
    .join("");

  el.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      visibleCount = PAGE_SIZE;
      el.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderGrid();
    });
  });
}

function galleryItemHTML(photo) {
  return `
    <figure class="gallery-item" tabindex="0" data-id="${photo.id}" role="button" aria-label="${photo.title} - বড় করে দেখুন">
      <img src="${photo.thumb}" alt="${photo.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300.png?text=${encodeURIComponent(photo.category)}'">
      <figcaption class="overlay">
        <div>
          <p>${photo.title}</p>
          <time>${photo.date}</time>
        </div>
      </figcaption>
    </figure>
  `;
}

function openLightbox(photo) {
  openModal(
    `
    <div class="lightbox-content">
      <img src="${photo.image}" alt="${photo.title}" onerror="this.src='https://via.placeholder.com/700x500.png?text=${encodeURIComponent(photo.category)}'">
      <h3>${photo.title}</h3>
      <p class="meta">${photo.category} • ${photo.date}</p>
    </div>
  `,
    "modal-wide"
  );
}

function renderGrid() {
  const gridEl = document.getElementById("gallery-grid");
  const loadMoreWrap = document.getElementById("load-more-wrap");
  if (!gridEl) return;

  const filtered = activeCategory === "সব" ? allPhotos : allPhotos.filter((p) => p.category === activeCategory);

  if (filtered.length === 0) {
    gridEl.innerHTML = `<p>এই ক্যাটাগরিতে কোনো ছবি পাওয়া যায়নি।</p>`;
    loadMoreWrap.innerHTML = "";
    return;
  }

  const visible = filtered.slice(0, visibleCount);
  gridEl.innerHTML = visible.map(galleryItemHTML).join("");

  gridEl.querySelectorAll(".gallery-item").forEach((item) => {
    const photo = filtered.find((p) => p.id === item.dataset.id);
    const open = () => openLightbox(photo);
    item.addEventListener("click", open);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });

  if (visibleCount < filtered.length) {
    loadMoreWrap.innerHTML = `<button class="btn btn-primary" id="load-more-btn">আরও ছবি দেখুন</button>`;
    document.getElementById("load-more-btn").addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      renderGrid();
    });
  } else {
    loadMoreWrap.innerHTML = "";
  }
}

async function initGallery() {
  const gridEl = document.getElementById("gallery-grid");
  showLoading(gridEl, "গ্যালারির ছবি লোড হচ্ছে...");

  const photos = await fetchJSON("gallery.json");
  if (!photos) return showError(gridEl);

  allPhotos = photos;
  const categories = [...new Set(photos.map((p) => p.category))];
  renderFilters(categories);
  renderGrid();
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderFooter();
  initGallery();
});
