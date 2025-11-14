function isValidUrl(value) {
  try {
    // The URL constructor will throw for invalid URLs
    const url = new URL(value);
    // Only allow http(s) protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  isValidUrl
};