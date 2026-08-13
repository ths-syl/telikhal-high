function initOfflineStatus() {
  const banner = document.getElementById("offline-banner");
  if (!banner) return;

  function update() {
    banner.style.display = navigator.onLine ? "none" : "block";
  }
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

export { initOfflineStatus };