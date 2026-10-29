const { Op, literal } = require("sequelize");
const ondcSellerNps = require("./../entities/ondc_seller_np");
const { isAllowedCatalogBpp } = require("../../utils/ondcCatalogBppAllowlist");
const { containsLike } = require("../../utils/escapeLike");

const REFRESHABLE = ["bppUri", "npName", "domain", "lastTransactionId", "lastSeenAt"];

const normalizeBppId = (bppId) => String(bppId || "").trim().toLowerCase();

/** Enabled rows' display name, lower-cased for A→Z; NULL for disabled rows. */
const ENABLED_NAME_ORDER = literal(
    "CASE WHEN `enabled` = 1 THEN LOWER(COALESCE(NULLIF(TRIM(`npName`), ''), `bppId`)) END"
);

/**
 * Upsert a seller NP keyed on normalized bpp_id. `enabled` is set only on
 * insert (from the token allowlist) and is never overwritten here — admin
 * PATCH is the source of truth after first sight.
 */
const upsertOndcSellerNp = async (data = {}) => {
    const bppId = normalizeBppId(data.bppId);
    if (!bppId) return null;

    const patch = { lastSeenAt: data.lastSeenAt || new Date() };
    for (const field of REFRESHABLE) {
        if (field === "lastSeenAt") continue;
        const value = data[field];
        if (value) patch[field] = value;
    }

    const existing = await ondcSellerNps.findOne({ where: { bppId } });
    if (existing) {
        await existing.update(patch);
        return existing.get({ plain: true });
    }

    try {
        const created = await ondcSellerNps.create({
            bppId,
            ...patch,
            enabled: isAllowedCatalogBpp({ bppId }),
        });
        return created.get({ plain: true });
    } catch (error) {
        const raced = await ondcSellerNps.findOne({ where: { bppId } });
        if (raced) {
            await raced.update(patch);
            return raced.get({ plain: true });
        }
        throw error;
    }
};

const findAllOndcSellerNps = async ({
    searchText = "",
    page = 1,
    itemsPerPage = 10,
    sort = "DESC",
    sortField = "lastSeenAt",
} = {}) => {
    const where = {};
    const q = String(searchText || "").trim();
    if (q) {
        where[Op.or] = [
            { bppId: { [Op.like]: containsLike(q) } },
            { npName: { [Op.like]: containsLike(q) } },
            { bppUri: { [Op.like]: containsLike(q) } },
        ];
    }

    const allowedSort = new Set(["lastSeenAt", "createdAt", "bppId", "npName", "enabled", "id"]);
    const orderField = allowedSort.has(sortField) ? sortField : "lastSeenAt";
    const orderDir = String(sort).toUpperCase() === "ASC" ? "ASC" : "DESC";

    const limit = Math.max(1, parseInt(itemsPerPage, 10) || 10);
    const offset = Math.max(0, ((parseInt(page, 10) || 1) - 1) * limit);

    const { rows, count } = await ondcSellerNps.findAndCountAll({
        where,
        // Enabled NPs always lead, A→Z by the name the admin table shows (npName,
        // falling back to bpp id). The CASE is NULL for disabled rows, so they keep
        // the requested order (default: most recently seen first).
        order: [
            ["enabled", "DESC"],
            [ENABLED_NAME_ORDER, "ASC"],
            [orderField, orderDir],
            ["id", "DESC"],
        ],
        limit,
        offset,
        raw: true,
    });

    return {
        rows: rows.map((r) => ({ ...r, enabled: r.enabled === true || r.enabled === 1 })),
        count,
    };
};

const setOndcSellerNpEnabled = async ({ id, enabled }) => {
    if (!id) return [0];
    return ondcSellerNps.update({ enabled: !!enabled }, { where: { id } });
};

const findOndcSellerNpById = async (id) => {
    if (!id) return null;
    return ondcSellerNps.findOne({ where: { id }, raw: true });
};

/** Normalized bpp ids of disabled NPs — their stored products are hidden (hiddenReason `sellerNp`). */
const findDisabledSellerNpBppIds = async () => {
    const rows = await ondcSellerNps.findAll({ attributes: ["bppId"], where: { enabled: false }, raw: true });
    return new Set(rows.map((r) => normalizeBppId(r.bppId)));
};

const countOndcSellerNps = async () => {
    const n = await ondcSellerNps.count();
    return parseInt(n, 10) || 0;
};

/**
 * Ingest gate. Empty admin list (or failed upsert) falls back to the five
 * seller-app name tokens. Once any NP rows exist, `enabled` is source of truth.
 */
const shouldIngestCatalogBpp = ({ bppId, sellerNp, tableWasEmpty } = {}) => {
    if (tableWasEmpty || !sellerNp) return isAllowedCatalogBpp({ bppId });
    return sellerNp.enabled === true || sellerNp.enabled === 1;
};

module.exports = {
    normalizeBppId,
    upsertOndcSellerNp,
    findAllOndcSellerNps,
    setOndcSellerNpEnabled,
    findOndcSellerNpById,
    findDisabledSellerNpBppIds,
    countOndcSellerNps,
    shouldIngestCatalogBpp,
};
