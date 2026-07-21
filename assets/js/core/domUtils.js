/**
 * সার্চ ইনপুটের মতো দ্রুত-repeated ইভেন্টে অতিরিক্ত রি-রেন্ডার এড়াতে debounce ব্যবহার হয়।
 * এতে মোবাইলে টাইপ করার সময় স্ক্রল/রেন্ডার স্মুথ থাকে।
 */
function debounce(fn, delay = 250) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}

export { debounce };
