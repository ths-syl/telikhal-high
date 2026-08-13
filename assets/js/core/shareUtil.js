function shareContent(title, text, url) {
  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url);
    alert("লিংক কপি হয়েছে!");
  }
}

export { shareContent };