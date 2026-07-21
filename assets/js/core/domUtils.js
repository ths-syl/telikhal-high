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

/**
 * বাংলা সংখ্যার "DD-MM-YYYY" ফরম্যাটের তারিখকে সাজানোর জন্য সংখ্যায় (timestamp) রূপান্তর করে।
 * যেমন: "২০-০৭-২০২৬" -> Date timestamp
 */
function parseBnDate(bnDateStr) {
  const bnDigits = "০১২৩৪৫৬৭৮৯";
  const enDateStr = bnDateStr.replace(/[০-৯]/g, (d) => bnDigits.indexOf(d));
  const firstPart = enDateStr.split(" ")[0]; // রেঞ্জ ডেট হলে (যেমন "০৫-০৫-... থেকে ...") প্রথম তারিখ নেয়
  const [day, month, year] = firstPart.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1).getTime();
}

export { debounce, parseBnDate };
