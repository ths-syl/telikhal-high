function debounce(fn, delay = 250) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}
function parseBnDate(bnDateStr) {
  if (!bnDateStr) return 0;

  const bnDigits = "০১২৩৪৫৬৭৮৯";
  const enDateStr = String(bnDateStr).replace(/[০-৯]/g, (d) => bnDigits.indexOf(d));
  const firstPart = enDateStr.split(" ")[0]; // রেঞ্জ ডেট হলে (যেমন "০৫-০৫-... থেকে ...") প্রথম তারিখ নেয়

  if (!firstPart) return 0;

  const segments = firstPart.split("-").map(Number);

  // শুধু বছর দেওয়া থাকলে (যেমন "২০২৩") ঐ বছরের ১লা জানুয়ারি ধরে নেওয়া হয়
  if (segments.length === 1) {
    const year = segments[0];
    if (!year || isNaN(year)) return 0;
    return new Date(year, 0, 1).getTime();
  }

  const [day, month, year] = segments;
  if (!year || isNaN(year)) return 0;
  return new Date(year, (month || 1) - 1, day || 1).getTime();
}

export { debounce, parseBnDate };
