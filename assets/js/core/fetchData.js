
const DATA_BASE_PATH = "data/";
const cache = new Map();

/**
 * @param {string} fileName 
 * @param {boolean} useCache 
 * @returns {Promise<any>}
 */
async function fetchJSON(fileName, useCache = true) {
  if (useCache && cache.has(fileName)) {
    return cache.get(fileName);
  }

  try {
    const response = await fetch(`${DATA_BASE_PATH}${fileName}`/**,{cache:" no-store"}*/);
    if (!response.ok) {
      throw new Error(`ডাটা লোড করা যায়নি: ${fileName} (স্ট্যাটাস ${response.status})`);
    }
    const data = await response.json();
    if (useCache) cache.set(fileName, data);
    return data;
  } catch (error) {
    console.error("[fetchJSON Error]", error);
    throw error;
  }
}


function showLoading(container, message = "লোড হচ্ছে...") {
  if (!container) return;
  container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${message}</p></div>`;
}


function showError(container, message = "দুঃখিত, তথ্য লোড করা যায়নি। পরে আবার চেষ্টা করুন।") {
  if (!container) return;
  container.innerHTML = `<div class="error-state"><p>⚠️ ${message}</p></div>`;
}

export { fetchJSON, showLoading, showError };
