const axios = require("axios");
const { customLog } = require("./loggerHelper");

const INDIAN_PIN_RE = /^[1-9]\d{5}$/;

const POSTAL_URL = (pin) => `https://api.postalpincode.in/pincode/${pin}`;
const ZIPPO_URL = (pin) => `https://api.zippopotam.us/in/${pin}`;

const POSTAL_TIMEOUT_MS = 3000;
const ZIPPO_TIMEOUT_MS = 4000;
const POSTAL_ATTEMPTS = 3;
const RETRY_DELAY_MS = process.env.NODE_ENV === "test" ? 0 : 250;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE = 2000;

const REQUEST_HEADERS = {
  Accept: "application/json",
  "User-Agent": "Peko-OfficeSupplies/1.0",
};

const cache = new Map();

class PincodeLookupError extends Error {
  constructor(message) {
    super(message);
    this.name = "PincodeLookupError";
    this.code = "PINCODE_UPSTREAM";
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fromCache = (pin) => {
  const hit = cache.get(pin);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(pin);
    return null;
  }
  return { city: hit.city, state: hit.state };
};

const toCache = (pin, city, state) => {
  if (!city && !state) return;
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(pin, { city, state, expiresAt: Date.now() + CACHE_TTL_MS });
};

const parsePostal = (data) => {
  const row = Array.isArray(data) ? data[0] : data;
  const offices = row?.PostOffice;
  const first = Array.isArray(offices) && offices.length ? offices[0] : null;
  if (!first) return null;
  const city = first.District || first.Block || first.Name || "";
  const state = first.State || "";
  if (!city && !state) return null;
  return { city, state };
};

const parseZippopotam = (data) => {
  const place = Array.isArray(data?.places) ? data.places[0] : null;
  if (!place) return null;
  const city = place["place name"] || "";
  const state = place.state || "";
  if (!city && !state) return null;
  return { city, state };
};

const getJson = async (url, timeout) => {
  const resp = await axios.get(url, { timeout, headers: REQUEST_HEADERS });
  return resp?.data;
};

/**
 * One India Post attempt. `ok` is a city/state hit. `notFound` is a definite
 * miss (HTTP 200, no offices). Network / timeout / 5xx throw.
 *
 * Their Error/empty body is *not* treated as a miss here when thrown — that
 * API often returns Error for a valid PIN while it is down.
 */
const fetchPostalOnce = async (pin) => {
  const data = await getJson(POSTAL_URL(pin), POSTAL_TIMEOUT_MS);
  const parsed = parsePostal(data);
  if (parsed) return { ok: parsed };
  const status = String(Array.isArray(data) ? data[0]?.Status : data?.Status || "");
  return { notFound: status === "Error" || status === "404" };
};

const fetchPostal = async (pin) => {
  let lastErr = null;
  let sawNotFound = false;
  for (let attempt = 1; attempt <= POSTAL_ATTEMPTS; attempt += 1) {
    try {
      const result = await fetchPostalOnce(pin);
      if (result.ok) return result.ok;
      if (result.notFound) sawNotFound = true;
    } catch (err) {
      lastErr = err;
    }
    if (attempt < POSTAL_ATTEMPTS) await delay(RETRY_DELAY_MS);
  }
  if (lastErr) {
    customLog(null, "warn", {
      message: "India Post pincode lookup failed after retries, trying fallback",
      postcode: pin,
      error: lastErr?.message || lastErr,
    });
  }
  return { notFound: sawNotFound && !lastErr };
};

const fetchZippopotam = async (pin) => {
  try {
    const data = await getJson(ZIPPO_URL(pin), ZIPPO_TIMEOUT_MS);
    return parseZippopotam(data);
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404) return null;
    customLog(null, "warn", {
      message: "Zippopotam pincode fallback failed",
      postcode: pin,
      error: err?.message || err,
    });
    throw err;
  }
};

/**
 * Resolve an Indian PIN to { city, state }.
 *
 * Throws PincodeLookupError when every upstream is unreachable (caller maps
 * that to "try again"). Returns empty strings when the PIN is confirmed unknown.
 */
const resolveIndianPincode = async (postcode) => {
  const pin = INDIAN_PIN_RE.test(String(postcode || "").trim())
    ? String(postcode).trim()
    : "";
  if (!pin) return { city: "", state: "" };

  const cached = fromCache(pin);
  if (cached) return cached;

  let postalMiss = false;
  let postal;
  try {
    postal = await fetchPostal(pin);
  } catch (err) {
    postal = null;
    customLog(null, "warn", {
      message: "India Post pincode lookup threw",
      postcode: pin,
      error: err?.message || err,
    });
  }
  if (postal?.city || postal?.state) {
    toCache(pin, postal.city, postal.state);
    return postal;
  }
  if (postal?.notFound) postalMiss = true;

  let zippo;
  let zippoUnreachable = false;
  try {
    zippo = await fetchZippopotam(pin);
  } catch (err) {
    zippoUnreachable = true;
    zippo = null;
  }
  if (zippo?.city || zippo?.state) {
    toCache(pin, zippo.city, zippo.state);
    return zippo;
  }

  if (postalMiss && !zippoUnreachable) return { city: "", state: "" };

  throw new PincodeLookupError("pincode lookup upstream failed");
};

const resetIndianPincodeLookupCacheForTests = () => {
  cache.clear();
};

module.exports = {
  resolveIndianPincode,
  PincodeLookupError,
  resetIndianPincodeLookupCacheForTests,
};
