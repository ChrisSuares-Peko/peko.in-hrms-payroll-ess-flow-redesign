/**
 * In-process gate so a city catalog is searched on the ONDC gateway at most
 * once at a time, and not again for CITY_SEARCH_COOLDOWN_MS after a search is
 * accepted (on_search still arriving). Shared across all users of this process.
 */

// Matches the storefront's 2-min poll (every poll GET re-checks the city), so a
// slow search isn't re-fired while its on_search is still arriving.
const CITY_SEARCH_COOLDOWN_MS = 120000;

const inFlight = new Map();
const cooldownUntil = new Map();

const isCooling = (city) => {
  const until = cooldownUntil.get(city);
  return Boolean(until && Date.now() < until);
};

const markSearched = (city) => {
  cooldownUntil.set(city, Date.now() + CITY_SEARCH_COOLDOWN_MS);
};

const runExclusive = async (city, fn) => {
  const existing = inFlight.get(city);
  if (existing) return existing;
  const run = (async () => {
    try {
      return await fn();
    } finally {
      inFlight.delete(city);
    }
  })();
  inFlight.set(city, run);
  return run;
};

const resetForTests = () => {
  inFlight.clear();
  cooldownUntil.clear();
};

module.exports = {
  CITY_SEARCH_COOLDOWN_MS,
  isCooling,
  markSearched,
  runExclusive,
  resetForTests,
};
