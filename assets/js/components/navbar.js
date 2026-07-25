/**
 * মোবাইল হ্যামবার্গার মেনু টগল
 */
function initNavbar() {
  const toggleBtn = document.querySelector(".nav-toggle");
  const navbar = document.querySelector(".navbar");
  if (!toggleBtn || !navbar) return;

  // খালি জায়গায় ট্যাপ করলে মেনু বন্ধ করার জন্য একটা ব্যাকড্রপ
  const backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  document.body.appendChild(backdrop);

  function openMenu() {
    navbar.classList.add("open");
    backdrop.classList.add("open");
  }
  function closeMenu() {
    navbar.classList.remove("open");
    backdrop.classList.remove("open");
  }

  toggleBtn.addEventListener("click", () => {
    navbar.classList.contains("open") ? closeMenu() : openMenu();
  });

  backdrop.addEventListener("click", closeMenu);

  navbar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // বর্তমান পেজ অনুযায়ী active লিংক হাইলাইট
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  navbar.querySelectorAll("a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}

export { initNavbar };
