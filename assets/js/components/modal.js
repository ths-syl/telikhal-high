/**
 
 * ব্যবহার: openModal(innerHTML) অথবা প্রশস্ত (lightbox) মডালের জন্য openModal(innerHTML, "modal-wide")
 */

let overlayEl = null;

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement("div");
  overlayEl.className = "modal-overlay";
  overlayEl.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="বন্ধ করুন">&times;</button>
      <div class="modal-content"></div>
    </div>
  `;
  document.body.appendChild(overlayEl);

  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) closeModal();
  });
  overlayEl.querySelector(".modal-close").addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
  return overlayEl;
}

function openModal(innerHTML, sizeClass = "") {
  const overlay = ensureOverlay();
  const box = overlay.querySelector(".modal-box");
  box.classList.remove("modal-wide");
  if (sizeClass) box.classList.add(sizeClass);
  overlay.querySelector(".modal-content").innerHTML = innerHTML;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!overlayEl) return;
  overlayEl.classList.remove("open");
  document.body.style.overflow = "";
}

export { openModal, closeModal };
