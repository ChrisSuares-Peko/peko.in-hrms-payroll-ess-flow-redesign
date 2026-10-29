const crypto = require("crypto");
const axios = require("axios");
const cryptoJSEncryption = require("./encryptionUtils");
const { customLog } = require("./loggerHelper");

// Secret for encrypting stored merchant credentials at rest. Reuses the existing SESSION_SECRET
// if a dedicated NUPAY_CRED_SECRET isn't set (dev fallback last). Changing it invalidates stored creds.
const CRED_SECRET = process.env.NUPAY_CRED_SECRET || process.env.SESSION_SECRET || "nupay-credential-secret-dev";
exports.encryptCred = (text) => (text ? cryptoJSEncryption.encrypt(String(text), CRED_SECRET) : text);
exports.decryptCred = (text) => (text ? cryptoJSEncryption.decrypt(String(text), CRED_SECRET) : text);

// NuPay delivers merchant credentials via a Bitwarden Send link (Vaultwarden), e.g.
// https://vault.nupaybiz.com/#/send/<idB64>/<keyB64>, unlocked by the onboarding mobile number.
// This fetches + decrypts it entirely server-side (no browser) and extracts access_key/access_secret.

const b64urlToBuf = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");

const parseLink = (link) => {
  const m = String(link || "").match(/#\/send\/([^/]+)\/([^/?]+)/);
  if (!m) return null;
  const [, idB64, keyB64] = m;
  const base = link.split("/#/")[0];
  // Bitwarden Send access expects the raw base64url id from the URL (NOT a UUID-formatted one).
  return { base, sendId: idB64, keyMaterial: b64urlToBuf(keyB64) };
};

const decryptEncString = (encString, encKey, macKey) => {
  const [ivB64, ctB64, macB64] = String(encString).slice(2).split("|");
  const iv = Buffer.from(ivB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const mac = Buffer.from(macB64, "base64");
  const computedMac = crypto.createHmac("sha256", macKey).update(Buffer.concat([iv, ct])).digest();
  if (!crypto.timingSafeEqual(mac, computedMac)) throw new Error("MAC mismatch — wrong key/password");
  const decipher = crypto.createDecipheriv("aes-256-cbc", encKey, iv);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
};

const extractField = (text, field) => {
  const jsonMatch = text.match(new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`));
  if (jsonMatch) return jsonMatch[1];
  const plainMatch = text.match(new RegExp(`${field}\\s*[:=]\\s*([^\\s",}]+)`));
  return plainMatch ? plainMatch[1] : null;
};

/**
 * Fetches + decrypts a NuPay credentials_link and returns { accessKey, accessSecret, providerId }.
 * @param {string} credentialsLink full vault URL (with the #/send/... fragment)
 * @param {string} password the mobile number submitted at onboarding
 */
exports.fetchNupayCredentials = async (credentialsLink, password) => {
  const parsed = parseLink(credentialsLink);
  if (!parsed) throw new Error("Invalid NuPay credentials_link format");
  const { base, sendId, keyMaterial } = parsed;

  const passwordHash = crypto.pbkdf2Sync(String(password), keyMaterial, 100000, 32, "sha256").toString("base64");
  const stretched = crypto.hkdfSync("sha256", keyMaterial, Buffer.from("bitwarden-send"), Buffer.from("send"), 64);
  const encKey = Buffer.from(stretched).subarray(0, 32);
  const macKey = Buffer.from(stretched).subarray(32, 64);

  const accessOnce = async (withPassword) => {
    const res = await axios({
      method: "POST",
      url: `${base}/api/sends/access/${sendId}`,
      headers: { "Content-Type": "application/json" },
      data: withPassword ? { password: passwordHash } : {},
      validateStatus: () => true,
    });
    return res;
  };

  // Password-protected sends return 401 on the no-password probe; retry with the hash.
  let res = await accessOnce(false);
  if (res.status === 401) res = await accessOnce(true);
  if (res.status !== 200) {
    throw new Error(`Vault access failed (${res.status}): ${res.data?.Message || res.data?.message || "unavailable"}`);
  }

  const body = res.data || {};
  const textEnc = body.Text?.Text || body.text?.text;
  if (!textEnc) throw new Error("Vault send has no text payload");
  const text = decryptEncString(textEnc, encKey, macKey);

  const accessKey = extractField(text, "access_key");
  const accessSecret = extractField(text, "access_secret");
  const providerId = extractField(text, "provider_id");
  if (!accessKey || !accessSecret) {
    throw new Error("Could not extract access_key/access_secret from vault content");
  }
  return { accessKey, accessSecret, providerId };
};

// Convenience wrapper used by the onboarding webhook — never throws; logs and returns null on failure.
exports.tryFetchNupayCredentials = async (credentialsLink, password, traceId) => {
  try {
    const creds = await exports.fetchNupayCredentials(credentialsLink, password);
    customLog(traceId, "info", { message: "NuPay credentials fetched from vault", hasKeys: !!(creds.accessKey && creds.accessSecret) }, "VENDOR");
    return creds;
  } catch (error) {
    customLog(traceId, "error", { message: "NuPay credentials vault fetch failed", error: error?.message }, "VENDOR");
    return null;
  }
};
