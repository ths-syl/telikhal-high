/**
 * সব JSON ডাটা ফেচ করার জন্য একটি কেন্দ্রীয় (single-source) হেল্পার।
 * ভবিষ্যতে data/*.json এর বদলে API endpoint ব্যবহার করতে চাইলে
 * শুধু path পরিবর্তন করলেই চলবে — কল করা কোডে কোনো পরিবর্তন লাগবে না।
 */

const DATA_BASE_PATH = "data/";
const cache = new Map();

/**
 * @param {string} fileName - যেমন: "teachers.json"
 * @param {boolean} useCache - একই সেশনে বারবার ফেচ এড়াতে ক্যাশ ব্যবহার করবে কিনা
 * @returns {Promise<any>}
 */
async function fetchJSON(fileName, useCache = true) {
  if (useCache && cache.has(fileName)) {
    return cache.get(fileName);
  }

  try {
    const response = await fetch(`${DATA_BASE_PATH}${fileName}`);
    if (!response.ok) {
      throw new Error(`ডাটা লোড করা যায়নি: ${fileName} (স্ট্যাটাস ${response.status})`);
    }
    const data = await response.json();
    if (useCache) cache.set(fileName, data);
    return data;
  } catch (error) {
    console.error("[fetchJSON Error]", error);
    return null;
  }
}

/**
 * একটি কন্টেইনারে লোডিং স্কেলেটন দেখানোর হেল্পার
 */
function showLoading(container, message = "লোড হচ্ছে...") {
  if (!container) return;
  container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${message}</p></div>`;
}

/**
 * ডাটা ফেচ ব্যর্থ হলে ইউজার-ফ্রেন্ডলি এরর স্টেট দেখানোর হেল্পার
 */
function showError(container, message = "দুঃখিত, তথ্য লোড করা যায়নি। পরে আবার চেষ্টা করুন।") {
  if (!container) return;
  container.innerHTML = `<div class="error-state"><p>⚠️ ${message}</p></div>`;
}

export { fetchJSON, showLoading, showError };
