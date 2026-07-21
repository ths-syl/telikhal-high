/**
 * ছবি লোড ব্যর্থ হলে (বা ছবি এখনো আপলোড না হলে) নামের প্রথম অক্ষর দিয়ে
 * একটা রঙিন অ্যাভাটার দেখানোর হেল্পার। সম্পূর্ণ অফলাইন — কোনো এক্সটার্নাল
 * সার্ভিসের উপর নির্ভর করে না।
 */

const PALETTE = ["#0E3A5C", "#4FA3D1", "#E8912E", "#4C8C6B", "#8E5A9E", "#C97418"];

function getInitial(name) {
  const cleaned = name.replace(/\(.*?\)/g, "").trim();
  return cleaned.charAt(0) || "?";
}

function colorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/**
 * img এর বদলে বসানোর জন্য অ্যাভাটার div এর HTML স্ট্রিং
 */
function avatarDivHTML(name) {
  return `<div class="avatar-fallback" style="background:${colorFromName(name)}">${getInitial(name)}</div>`;
}

/**
 * rootEl এর ভেতরে থাকা সব img.avatar-img এ error listener বসায়;
 * লোড ব্যর্থ হলে img কে অ্যাভাটার div দিয়ে প্রতিস্থাপন করে।
 */
function bindAvatarFallbacks(rootEl) {
  if (!rootEl) return;
  rootEl.querySelectorAll("img.avatar-img").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const name = img.dataset.name || "?";
        const div = document.createElement("div");
        div.className = img.className.replace("avatar-img", "avatar-fallback").trim();
        div.style.background = colorFromName(name);
        div.textContent = getInitial(name);
        img.replaceWith(div);
      },
      { once: true }
    );
  });
}

export { avatarDivHTML, bindAvatarFallbacks };
