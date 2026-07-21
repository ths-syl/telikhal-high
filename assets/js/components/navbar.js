/**
 * মোবাইল হ্যামবার্গার মেনু টগল
 */
function initNavbar() {
  const toggleBtn = document.querySelector(".nav-toggle");
  const navbar = document.querySelector(".navbar");
  if (!toggleBtn || !navbar) return;

  toggleBtn.addEventListener("click", () => {
    navbar.classList.toggle("open");
  });

  navbar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navbar.classList.remove("open"));
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
