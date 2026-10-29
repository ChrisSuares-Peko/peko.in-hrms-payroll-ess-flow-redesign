const crypto = require("crypto");

const b64urlToBuf = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

const decryptEncString = (s, encKey, macKey) => {
  const [ivB64, ctB64, macB64] = s.slice(2).split("|");
  const iv = Buffer.from(ivB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const mac = Buffer.from(macB64, "base64");
  const calc = crypto.createHmac("sha256", macKey).update(Buffer.concat([iv, ct])).digest();
  if (!crypto.timingSafeEqual(mac, calc)) throw new Error("MAC mismatch — wrong key or password");
  const d = crypto.createDecipheriv("aes-256-cbc", encKey, iv);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
};

const extractFromVaultText = (text) => {
  const grab = (patterns) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m?.[1]) return m[1].trim();
    }
    return null;
  };

  return {
    accessKey: grab([/"access_key"\s*:\s*"([^"]+)"/, /access_key\s*[-=>:]+\s*(\S+)/i]),
    accessSecret: grab([/"access_secret"\s*:\s*"([^"]+)"/, /access_secret\s*[-=>:]+\s*(\S+)/i]),
    providerId: grab([/provider_id\s*[-=>:]+\s*(\S+)/i, /"provider_id"\s*:\s*"([^"]+)"/]),
    walletAccountId: grab([/Wallet Account ID\s*:\s*(wa_\S+)/i, /"wallet_account_id"\s*:\s*"([^"]+)"/]),
    vaNumber: grab([/Virtual Account Number\s*:\s*(\S+)/i, /VA\s*[-=>:]+\s*(NPT\S+)/i, /"va"\s*:\s*"([^"]+)"/i]),
    vaIfsc: grab([/IFSC\s*(?:Code)?\s*:\s*(\S+)/i, /"ifsc"\s*:\s*"([^"]+)"/i]),
  };
};

exports.fetchNupayCredentials = async (credentialsLink, mobileNumber) => {
  const m = credentialsLink.match(/#\/send\/([^/]+)\/([^/?#]+)/);
  if (!m) throw new Error("Invalid credentials_link format");

  const [, idB64, keyB64] = m;
  const base = credentialsLink.split("/#/")[0];

  // F-PAY-04: SSRF guard — credentials_link is attacker-reachable via the onboarding webhook, so only
  // fetch from the NuPay vault host, never an arbitrary URL.
  let baseUrl;
  try { baseUrl = new URL(base); } catch { throw new Error("Invalid credentials_link"); }
  if (baseUrl.protocol !== "https:" || baseUrl.hostname !== "vault.nupaybiz.com") {
    throw new Error("credentials_link host not allowed");
  }

  const keyMaterial = b64urlToBuf(keyB64);
  const passwordHash = crypto.pbkdf2Sync(mobileNumber, keyMaterial, 100000, 32, "sha256").toString("base64");

  const stretched = crypto.hkdfSync("sha256", keyMaterial, Buffer.from("bitwarden-send"), Buffer.from("send"), 64);
  const encKey = Buffer.from(stretched).subarray(0, 32);
  const macKey = Buffer.from(stretched).subarray(32, 64);

  const apiUrl = `${base}/api/sends/access/${idB64}`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: passwordHash }),
  });

  const body = await res.json();
  // F-PAY-10: don't log the response body — it carries the decrypted NuPay credentials.
  console.log("[fetchNupayCredentials] response", { status: res.status });
  if (res.status !== 200) throw new Error(body?.message || JSON.stringify(body));

  const text = decryptEncString(body.Text?.Text || body.text?.text, encKey, macKey);

  return extractFromVaultText(text);
};

const FALLBACK_ENC_KEY = "4a7d9e2f8c1b3a5e6d0f2c4b8e1a3d7f9c2b4e6a8d0f3c5b7e9a1d4f6c8b2e4a";

const getEncryptionKey = () => {
  const key = process.env.NUPAY_CREDENTIALS_ENCRYPTION_KEY || FALLBACK_ENC_KEY;
  return Buffer.from(key, "hex");
};

exports.encryptCredential = (plaintext) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${ct.toString("hex")}:${tag.toString("hex")}`;
};

exports.decryptCredential = (encrypted) => {
  const key = getEncryptionKey();
  const [ivHex, ctHex, tagHex] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const ct = Buffer.from(ctHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
};
