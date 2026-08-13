function initPullToRefresh() {
  if (!document.documentElement.classList.contains("pwa-standalone")) return;

  const indicator = document.getElementById("ptr-indicator");
  if (!indicator) return;

  let startY = 0;
  let pulling = false;
  const threshold = 70;

  document.addEventListener("touchstart", (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  });

  document.addEventListener("touchmove", (e) => {
    if (!pulling) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      indicator.style.opacity = Math.min(diff / threshold, 1);
      indicator.style.transform = `translateX(-50%) translateY(${Math.min(diff, threshold)}px)`;
    }
  });

  document.addEventListener("touchend", (e) => {
    if (!pulling) return;
    const diff = e.changedTouches[0].clientY - startY;
    if (diff > threshold) {
      indicator.classList.add("spinning");
      setTimeout(() => location.reload(), 300);
    } else {
      indicator.style.opacity = 0;
      indicator.style.transform = "translateX(-50%) translateY(0)";
    }
    pulling = false;
  });
}

export { initPullToRefresh };