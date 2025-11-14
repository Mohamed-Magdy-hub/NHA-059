// simple base62 short code generator
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateShortCode(length = 7) {
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    result += ALPHABET[idx];
  }
  return result;
}

module.exports = {
  generateShortCode
};