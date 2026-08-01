const CACHE_NAME = "telikhal-school-v1";

const CORE_ASSETS = [
  "index.html",
  "assets/css/base.css",
  "assets/css/layout.css",
  "assets/css/components.css",
  "assets/css/pages/home.css",
  "assets/js/pages/home.js",
  "assets/images/logo/school-logo.png",
  "manifest.json",
];

// ইনস্টলের সময় মূল ফাইলগুলো ক্যাশে নিয়ে নেওয়া
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// পুরনো ভার্সনের ক্যাশ মুছে ফেলা
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// নেটওয়ার্ক-ফার্স্ট কৌশল: আগে ইন্টারনেট থেকে চেষ্টা করবে (সবসময় সর্বশেষ ডাটা/নোটিশ পেতে),
// ব্যর্থ হলে (অফলাইন) ক্যাশ থেকে দেখাবে
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});