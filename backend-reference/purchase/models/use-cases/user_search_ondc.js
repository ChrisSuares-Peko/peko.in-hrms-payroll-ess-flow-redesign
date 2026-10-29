const { Op } = require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const userSearchOndc = require('./../entities/user_search_ondc');

const OFFICE_SUPPLIES = "OFFICE_SUPPLIES";
const INC_CITY = "*";
const FULL_SEARCH_TTL_MS = 12 * 60 * 60 * 1000;
const INC_SEARCH_LABELS = ["catalog_inc_start", "catalog_inc_pull", "catalog_inc_stop"];

const domainAliases = (domain) => {
    if (!domain) return []
    const code = String(domain).trim().replace(/^ONDC:/i, "").toUpperCase()
    if (!code) return []
    return [`ONDC:${code}`, code]
}

exports.createUserSearch = asyncHandler(async (data) => {
    return await userSearchOndc.create(data)
})

/**
 * The search that a given transaction_id belongs to — used by the on_search
 * webhook to stamp the requested city/category onto the ingested catalog.
 *
 * Newest row wins. A transaction_id is normally unique per search, but the
 * Workbench test lever (optionals.forceTransactionId) pins every search to one
 * id, so each storefront search adds another row under it. Unordered, the FIRST
 * row won forever and every later catalog was stamped with the city and
 * category of whatever was searched first — leaving the city the user actually
 * picked with no products.
 */
exports.findByTransactionId = asyncHandler(async (params) => {
    return await userSearchOndc.findOne({
        where: {
            transactionId: params.transactionId,
        },
        order: [["id", "DESC"]],
        nest: true,
        raw: true
    })
})

/**
 * Latest incremental catalog registry row for a domain (`catalog_inc_start` /
 * `catalog_inc_pull` / `catalog_inc_stop`). Used to arm push once and to size
 * the next catch-up pull window.
 */
exports.findLatestCatalogInc = asyncHandler(async ({ domain, search } = {}) => {
    if (!domain || !search) return null
    return await userSearchOndc.findOne({
        where: {
            source: OFFICE_SUPPLIES,
            city: INC_CITY,
            ondcDomain: domain,
            search,
        },
        order: [["id", "DESC"]],
        nest: true,
        raw: true,
    })
})

/** Distinct domains that have ever had an incremental start or stop registered. */
exports.findDistinctCatalogIncDomains = asyncHandler(async () => {
    const rows = await userSearchOndc.findAll({
        where: {
            source: OFFICE_SUPPLIES,
            city: INC_CITY,
            search: { [Op.in]: ["catalog_inc_start", "catalog_inc_stop"] },
        },
        attributes: ["ondcDomain"],
        group: ["ondcDomain"],
        raw: true,
    })
    return (rows || []).map((r) => r.ondcDomain).filter(Boolean)
})

/**
 * True when this city+domain already had a catalog_full (non-incremental)
 * search registered within `maxAgeMs` (default 12 hours). Combined with
 * findMissingCatalogDomainsForCity: skip the gateway only when the domain
 * still has in-stock rows and this window has not lapsed. Empty / all-OOS
 * domains search again (citySearchGate still caps retries at 2 min).
 */
exports.hasRecentCityDomainFullSearch = asyncHandler(async ({
    city,
    domain,
    maxAgeMs = FULL_SEARCH_TTL_MS,
} = {}) => {
    if (!city || city === "undefined" || city === INC_CITY || !domain) return false
    const aliases = domainAliases(domain)
    if (!aliases.length) return false
    const since = new Date(Date.now() - (Number(maxAgeMs) || FULL_SEARCH_TTL_MS))
    const row = await userSearchOndc.findOne({
        where: {
            source: OFFICE_SUPPLIES,
            city,
            ondcDomain: { [Op.in]: aliases },
            createdAt: { [Op.gte]: since },
            [Op.not]: { search: { [Op.in]: INC_SEARCH_LABELS } },
        },
        order: [["id", "DESC"]],
        raw: true,
    })
    return Boolean(row)
})

exports.FULL_SEARCH_TTL_MS = FULL_SEARCH_TTL_MS
