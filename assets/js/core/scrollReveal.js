/**
 * .reveal-on-scroll ক্লাসযুক্ত এলিমেন্ট ভিউপোর্টে ঢুকলে একবার ফেড/স্লাইড-ইন করে দেখায়।
 * ডাইনামিক্যালি রেন্ডার হওয়া কার্ড/সেকশনের জন্য প্রতিবার রেন্ডারের পর আবার কল করা যাবে —
 * ইতিমধ্যে observe করা এলিমেন্ট (.revealed ক্লাসযুক্ত) বাদ দিয়ে শুধু নতুনগুলো observe করে।
 */
function initScrollReveal(rootEl = document) {
  const targets = rootEl.querySelectorAll(".reveal-on-scroll:not(.revealed)");
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));
}

export { initScrollReveal };
