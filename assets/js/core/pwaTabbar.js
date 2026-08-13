function initPwaTabbar() {
  const tabbar = document.querySelector(".pwa-tabbar");
  if (!tabbar) return;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  tabbar.querySelectorAll(".pwa-tab-item").forEach((item) => {
    if (item.getAttribute("href") === currentPage) item.classList.add("active");
  });

  const menuBtn = document.getElementById("pwa-menu-toggle");
  const hamburger = document.querySelector(".nav-toggle");
  if (menuBtn && hamburger) {
    menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      hamburger.click(); // বিদ্যমান হ্যামবার্গার মেনু খুলে দেবে
    });
  }
}

export { initPwaTabbar };