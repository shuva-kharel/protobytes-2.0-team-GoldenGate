const crypto = require("crypto");

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input = "") {
  const clean = String(input).toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const ch of clean) {
    const val = BASE32_ALPHABET.indexOf(ch);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateBase32Secret(bytes = 20) {
  const random = crypto.randomBytes(bytes);
  let bits = "";
  for (const b of random) bits += b.toString(2).padStart(8, "0");

  let out = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    out += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return out;
}

function hotp({ secret, counter, digits = 6 }) {
  const key = base32Decode(secret);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(codeInt % 10 ** digits).padStart(digits, "0");
}

function verifyTotp({ token, secret, window = 1, step = 30, digits = 6 }) {
  const normalized = String(token || "").trim();
  if (!/^\d{6}$/.test(normalized) || !secret) return false;

  const nowCounter = Math.floor(Date.now() / 1000 / step);
  for (let i = -window; i <= window; i += 1) {
    if (hotp({ secret, counter: nowCounter + i, digits }) === normalized) {
      return true;
    }
  }
  return false;
}

function buildOtpAuthUrl({ issuer, accountName, secret }) {
  const safeIssuer = encodeURIComponent(issuer);
  const safeAccount = encodeURIComponent(accountName);
  const label = `${safeIssuer}:${safeAccount}`;
  return `otpauth://totp/${label}?secret=${secret}&issuer=${safeIssuer}&algorithm=SHA1&digits=6&period=30`;
}

module.exports = {
  generateBase32Secret,
  verifyTotp,
  buildOtpAuthUrl,
};
