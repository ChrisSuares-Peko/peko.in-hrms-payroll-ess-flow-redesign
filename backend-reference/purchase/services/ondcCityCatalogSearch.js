const { v4: uuidv4 } = require("uuid");
const { customLog } = require("../utils/loggerHelper");
const {
  findMissingCatalogDomainsForCity,
} = require("../models/use-cases/ondc_product_with_transactionId");
const {
  createUserSearch,
  findLatestCatalogInc,
  findDistinctCatalogIncDomains,
  hasRecentCityDomainFullSearch,
} = require("../models/use-cases/user_search_ondc");
const { getDistinctOndcDomains } = require("../models/use-cases/ondc_category");
const { findEnabledDomainCodes } = require("../models/use-cases/ondc_catalog_rules");
const { toOndcContextDomain } = require("../utils/ondc_helper");
const ondc = require("./ondc");
const citySearchGate = require("./ondcCitySearchGate");

const OFFICE_SUPPLIES = "OFFICE_SUPPLIES";
const INC_CITY = "*";
const INC_SEARCH = {
  start: "catalog_inc_start",
  pull: "catalog_inc_pull",
  stop: "catalog_inc_stop",
};

const cachedPayload = (city, reason) => ({
  status: true,
  message: "catalog already stored",
  data: {
    city,
    batchTransactionId: null,
    transactionIds: [],
    received: true,
    searched: false,
    reason,
  },
  responseCode: "000",
});

const noDomainsPayload = (city) => ({
  status: true,
  message: "search failed",
  data: {
    city,
    batchTransactionId: null,
    transactionIds: [],
    received: false,
    searched: false,
    reason: "no_domains",
  },
  responseCode: "000",
});

const acceptedPayload = ({ city, batchTransactionId, transactionIds, reason }) => ({
  status: true,
  message: "search accepted",
  data: {
    city,
    batchTransactionId,
    transactionIds,
    received: true,
    searched: true,
    reason,
  },
  responseCode: "000",
});

/** Unique protocol domains (`ONDC:RET16`) from category-tab codes (`RET16`). */
const uniqueContextDomains = (codes) => {
  const seen = new Set();
  const out = [];
  for (const code of codes || []) {
    const domain = toOndcContextDomain(code);
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    out.push(domain);
  }
  return out;
};

/**
 * Domains for this city's catalog /search.
 *
 * Production: every enabled subcategory domain from officeSupplyCategories.
 * Workbench (`forceTransactionId`): one search — a multi-domain fan-out against
 * a single seller URL NACKs. Prefer the first category domain, else vendor domain.
 */
const resolveSearchDomains = async (cfg) => {
  let fromCategories = uniqueContextDomains(
    await getDistinctOndcDomains().catch(() => [])
  );
  // A domain switched off on Products > Rules would be dropped at ingest
  // anyway — don't search it. No rows yet / lookup failure → search all.
  const enabled = await findEnabledDomainCodes().catch(() => null);
  if (enabled) fromCategories = fromCategories.filter((d) => enabled.has(d));
  if (cfg?.forceTransactionId) {
    const pinned = fromCategories[0] || toOndcContextDomain(cfg?.domain);
    return pinned ? [pinned] : [];
  }
  return fromCategories;
};

const registerUserSearch = async ({
  transactionId,
  search,
  domain,
  city,
  catalogSweepId,
  logTraceId,
}) => {
  try {
    await createUserSearch({
      transactionId,
      search: search || "",
      source: OFFICE_SUPPLIES,
      ondcDomain: domain,
      city,
      ...(catalogSweepId ? { catalogSweepId } : {}),
    });
  } catch (registryError) {
    customLog(logTraceId, "error", {
      message: "ONDC city search: failed to register search (continuing)",
      transactionId,
      domain,
      error: registryError?.message || registryError,
    });
  }
};

const isIncArmed = async (domain) => {
  const start = await findLatestCatalogInc({ domain, search: INC_SEARCH.start }).catch(() => null);
  if (!start) return false;
  const stop = await findLatestCatalogInc({ domain, search: INC_SEARCH.stop }).catch(() => null);
  if (!stop) return true;
  return (start.id || 0) > (stop.id || 0);
};

const fireIncSearch = async ({ catalogMode, domain, searchLabel, startTime, endTime, logTraceId }) => {
  const gateKey = `inc:${catalogMode}:${domain}`;
  if (citySearchGate.isCooling(gateKey)) return { skipped: true, transactionId: null };
  return citySearchGate.runExclusive(gateKey, async () => {
    if (citySearchGate.isCooling(gateKey)) return { skipped: true, transactionId: null };
    const transactionId = uuidv4();
    try {
      await ondc.search({
        searchText: "",
        domain,
        city: INC_CITY,
        transactionId,
        catalogMode,
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
      });
    } catch (err) {
      customLog(logTraceId, "error", {
        message: `ONDC city search ${catalogMode} failed`,
        domain,
        transactionId,
        error: err?.ondcMessage || err?.message || err,
      });
      return { skipped: false, acked: false, transactionId };
    }
    await registerUserSearch({
      transactionId,
      search: searchLabel,
      domain,
      city: INC_CITY,
      logTraceId,
    });
    citySearchGate.markSearched(gateKey);
    return { skipped: false, acked: true, transactionId };
  });
};

const ensureIncStart = async (domain, logTraceId) => {
  if (await isIncArmed(domain)) return { skipped: true, transactionId: null };
  return fireIncSearch({
    catalogMode: "inc_start",
    domain,
    searchLabel: INC_SEARCH.start,
    logTraceId,
  });
};

const stopRemovedIncDomains = async (activeDomains, logTraceId) => {
  const active = new Set(activeDomains);
  const seen = await findDistinctCatalogIncDomains().catch(() => []);
  for (const domain of seen) {
    if (active.has(domain)) continue;
    if (!(await isIncArmed(domain))) continue;
    await fireIncSearch({
      catalogMode: "inc_stop",
      domain,
      searchLabel: INC_SEARCH.stop,
      logTraceId,
    });
  }
};

/**
 * catalog_full when the domain has no in-stock city catalog, or its last
 * full search is older than 12 hours. A recent registry row alone must not
 * skip an empty / all-OOS city.
 */
const domainsNeedingFullSearch = async (city, searchDomains) => {
  const missing = await findMissingCatalogDomainsForCity({
    city,
    domains: searchDomains,
  }).catch(() => searchDomains);
  const missingSet = new Set(missing || []);
  const flags = await Promise.all(
    searchDomains.map(async (domain) => ({
      domain,
      recent: await hasRecentCityDomainFullSearch({ city, domain }).catch(() => false),
    }))
  );
  return flags
    .filter(({ domain, recent }) => missingSet.has(domain) || !recent)
    .map(({ domain }) => domain);
};

const fireFullDomainSearches = async ({
  city,
  searchDomains,
  forcedTransactionId,
  logTraceId,
}) => {
  const batchTransactionId = uuidv4();
  const workbench = Boolean(forcedTransactionId);
  const domainSearches = searchDomains.map((domain, index) => ({
    domain,
    transactionId:
      forcedTransactionId && index === 0 ? forcedTransactionId : uuidv4(),
    sweepId: workbench ? null : uuidv4(),
  }));

  await Promise.all(
    domainSearches.map(({ domain, transactionId, sweepId }) =>
      registerUserSearch({
        transactionId,
        search: "",
        domain,
        city,
        catalogSweepId: sweepId,
        logTraceId,
      })
    )
  );

  const searchOutcomes = await Promise.allSettled(
    domainSearches.map(({ domain, transactionId }) =>
      ondc.search({
        searchText: "",
        domain,
        city,
        transactionId,
        catalogMode: "full",
      })
    )
  );

  searchOutcomes.forEach((outcome, index) => {
    if (outcome.status === "rejected") {
      const { domain, transactionId } = domainSearches[index];
      customLog(logTraceId, "error", {
        message: "ONDC city search /search call failed for one domain",
        city,
        domain,
        transactionId,
        error: outcome.reason?.message || outcome.reason,
      });
    }
  });

  return { batchTransactionId, domainSearches, searchOutcomes };
};

/**
 * On a city visit: catalog_full per category domain that is empty or whose
 * last full search is older than 12 hours. catalog_inc start stays armed
 * per domain. Workbench pins one domain and never incremental / reconcile.
 */
const runOndcCityCatalogSearch = async ({ city, logTraceId } = {}) => {
  const cfg = await ondc.getOndcConfig().catch(() => null);
  const forcedTransactionId = cfg?.forceTransactionId || null;
  const workbench = Boolean(forcedTransactionId);
  const searchDomains = await resolveSearchDomains(cfg);

  if (!workbench) {
    await stopRemovedIncDomains(searchDomains, logTraceId);
  }

  if (!searchDomains.length) {
    customLog(logTraceId, "error", {
      message: "ONDC city search: no category domains configured, nothing to search",
      city,
    });
    return noDomainsPayload(city);
  }

  const domainsToSearch = workbench
    ? searchDomains
    : await domainsNeedingFullSearch(city, searchDomains);

  if (!domainsToSearch.length) {
    return cachedPayload(city, "cached");
  }
  if (citySearchGate.isCooling(city)) {
    return cachedPayload(city, "in_flight");
  }

  return citySearchGate.runExclusive(city, async () => {
    const stillNeeded = workbench
      ? domainsToSearch
      : await domainsNeedingFullSearch(city, domainsToSearch);
    if (!stillNeeded.length) {
      return cachedPayload(city, "cached");
    }
    if (citySearchGate.isCooling(city)) {
      return cachedPayload(city, "in_flight");
    }

    const { batchTransactionId, domainSearches, searchOutcomes } =
      await fireFullDomainSearches({
        city,
        searchDomains: stillNeeded,
        forcedTransactionId,
        logTraceId,
      });

    if (searchOutcomes.every((outcome) => outcome.status === "rejected")) {
      const firstRejection = searchOutcomes[0]?.reason;
      return {
        status: true,
        message: "search failed",
        data: {
          city,
          batchTransactionId,
          transactionIds: [],
          received: false,
          searched: false,
          reason: "search_failed",
          error: firstRejection?.ondcMessage || firstRejection?.message || null,
          errorCode: firstRejection?.ondcCode || null,
        },
        responseCode: "000",
      };
    }

    citySearchGate.markSearched(city);
    const transactionIds = domainSearches.map((d) => d.transactionId);

    if (!workbench) {
      for (const domain of stillNeeded) {
        const start = await ensureIncStart(domain, logTraceId);
        if (start?.acked && start.transactionId) transactionIds.push(start.transactionId);
      }
    }

    const missing = workbench
      ? []
      : await findMissingCatalogDomainsForCity({ city, domains: stillNeeded }).catch(() => []);

    customLog(logTraceId, "info", {
      message: "ONDC city search acked — catalog will arrive on on_search",
      city,
      domains: stillNeeded,
      missingDomains: missing,
      batchTransactionId,
      transactionIds,
    });

    return acceptedPayload({
      city,
      batchTransactionId,
      transactionIds,
      reason: missing.length && missing.length === stillNeeded.length
        ? "missing_domains"
        : "search_acked",
    });
  });
};

module.exports = {
  runOndcCityCatalogSearch,
  uniqueContextDomains,
  resolveSearchDomains,
  INC_SEARCH,
};
