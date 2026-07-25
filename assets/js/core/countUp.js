/**
 * .count-up ক্লাসযুক্ত এলিমেন্ট (data-count-target="N" সহ) ভিউপোর্টে ঢুকলে
 * ০ থেকে N পর্যন্ত গুনে উঠে আসার অ্যানিমেশন দেখায় (বাংলা সংখ্যায়)।
 */
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
function toBnDigits(num) {
  return String(Math.round(num)).replace(/\d/g, (d) => BN_DIGITS[d]);
}

function animateNumber(el) {
  const target = Number(el.dataset.countTarget);
  if (!Number.isFinite(target)) return;
  const duration = 1200;
  let startTime = null;

  function step(timestamp) {
    if (startTime === null) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic — শেষে গিয়ে ধীর হয়
    el.textContent = toBnDigits(target * eased);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = toBnDigits(target);
    }
  }
  requestAnimationFrame(step);
}

function initCountUp(rootEl = document) {
  const targets = rootEl.querySelectorAll(".count-up:not(.counted)");
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateNumber(entry.target);
          entry.target.classList.add("counted");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  targets.forEach((el) => observer.observe(el));
}

export { initCountUp };
