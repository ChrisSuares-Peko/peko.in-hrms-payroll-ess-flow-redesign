const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const rules = require("../../models/use-cases/ondc_catalog_rules");
const { countTopDealsRuleExclusions } = require("../../models/use-cases/ondc_product_with_transactionId");
const { deleteMatchedProducts } = require("../../services/ondcCatalogRules");
const { recomputeVisibility, SCOPES } = require("../../services/ondcProductVisibility");
const { getTopDealsSettings, saveTopDealsSettings } = require("../../services/ondcTopDealsSettings");
const { normalizeKeyword } = require("../../utils/ondcKeywordMatch");
const { toDomainCode, domainLabel } = require("../../utils/ondcDomainLabels");
const { domainAliases } = require("../../utils/ondc_helper");

/**
 * Manage > Products > Rules. A switched-off domain or a blocked seller hides
 * matching products (stored with a hiddenReason — see
 * services/ondcProductVisibility.js); lifting the rule shows them again. A
 * banned word keeps them out of the database entirely. Price
 * sanity and the minimum price only filter the storefront Top deals rail.
 *
 * Adding a rule can instead delete the products already stored that it
 * matches — the admin chooses (`deleteExisting`) after a `/preview` call
 * returns the count.
 */

const SECTIONS = ["domains", "sellers", "keywords", "priceSanity", "topDeals"];
const MAX_WORDS = 100;
const MAX_WORD_LENGTH = 60;
const MAX_REASON_LENGTH = 160;
const SAMPLE_SIZE = 5;

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

/** Who to show as "changed by" — the gateway's userdata header becomes req.user. */
const actorFrom = (req) => {
    const u = req.user || {};
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return {
        id: u.id != null ? String(u.id) : null,
        name: u.name || u.fullName || fullName || u.username || u.email || "Admin",
    };
};

const lastChange = (latest, ...sections) =>
    sections
        .map((s) => latest[s])
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;

const sampleNames = (products) => products.slice(0, SAMPLE_SIZE).map((p) => p.name).filter(Boolean);

const parseDeleteExisting = (body) => {
    const value = body?.deleteExisting;
    if (value === undefined) return false;
    if (typeof value !== "boolean") throw new ErrorResponse("`deleteExisting` must be a boolean", 422);
    return value;
};

/** Accepts an array or a comma/newline separated string; returns normalised, unique words. */
const parseWords = (input) => {
    const raw = Array.isArray(input) ? input : String(input ?? "").split(/[,\n]/);
    const words = [...new Set(raw.map((w) => normalizeKeyword(w)).filter(Boolean))];
    if (!words.length) throw new ErrorResponse("At least one word is required", 422);
    if (words.length > MAX_WORDS) throw new ErrorResponse(`At most ${MAX_WORDS} words per request`, 422);
    const tooLong = words.find((w) => w.length > MAX_WORD_LENGTH);
    if (tooLong) throw new ErrorResponse(`"${tooLong.slice(0, 20)}…" is longer than ${MAX_WORD_LENGTH} characters`, 422);
    return words;
};

const parseSeller = (body) => {
    const bppId = String(body?.bppId ?? "").trim();
    const providerId = String(body?.providerId ?? "").trim();
    if (!bppId || !providerId) throw new ErrorResponse("`bppId` and `providerId` are required", 422);
    return { bppId, providerId };
};

const parseId = (value) => {
    const id = parseInt(value, 10);
    if (!Number.isFinite(id) || id <= 0) throw new ErrorResponse("Invalid id", 422);
    return id;
};

// ─── Summary & history ─────────────────────────────────────────────────────

exports.getCatalogRulesSummary = asyncHandler(async (req, res) => {
    const [summary, latest] = await Promise.all([rules.getCatalogSummary(), rules.findLatestRuleLogs()]);
    return ok(res, { ...summary, lastAppliedAt: lastChange(latest, ...SECTIONS)?.createdAt || null }, "Catalog rules summary");
});

exports.getCatalogRuleHistory = asyncHandler(async (req, res, next) => {
    const section = req.query.section || undefined;
    if (section && !SECTIONS.includes(section)) {
        return next(new ErrorResponse(`section must be one of ${SECTIONS.join(", ")}`, 422));
    }
    const { rows, count } = await rules.listRuleLogs({
        section,
        page: req.query.page,
        itemsPerPage: req.query.itemsPerPage,
    });
    return ok(res, { recordsTotal: count, recordsFiltered: count, data: rows }, "Rule history fetched");
});

// ─── Domains ────────────────────────────────────────────────────────────────

exports.getRuleDomains = asyncHandler(async (req, res) => {
    const [rows, latest] = await Promise.all([rules.listDomains(), rules.findLatestRuleLogs()]);
    return ok(res, { data: rows, lastChange: lastChange(latest, "domains") }, "Domains fetched");
});

/** Stored products per domain that switching it off would leave in place. */
exports.previewRuleDomains = asyncHandler(async (req, res, next) => {
    const codes = Array.isArray(req.body?.codes) ? req.body.codes.map(toDomainCode).filter(Boolean) : [];
    if (!codes.length) return next(new ErrorResponse("`codes` (non-empty array) is required", 422));
    const products = await rules.findStoredByDomains(codes);
    const byCode = Object.fromEntries(codes.map((c) => [c, 0]));
    for (const p of products) {
        const code = toDomainCode(p.ondcDomain);
        if (code in byCode) byCode[code] += 1;
    }
    return ok(res, { total: products.length, byCode, sample: sampleNames(products) }, "Domain preview");
});

exports.updateRuleDomains = asyncHandler(async (req, res, next) => {
    const changes = req.body?.changes;
    if (!Array.isArray(changes) || !changes.length) {
        return next(new ErrorResponse("`changes` (non-empty array of {code, enabled}) is required", 422));
    }
    for (const c of changes) {
        if (!toDomainCode(c?.code) || typeof c?.enabled !== "boolean") {
            return next(new ErrorResponse("Each change needs a `code` and a boolean `enabled`", 422));
        }
    }
    const deleteExisting = parseDeleteExisting(req.body);
    const actor = actorFrom(req);

    const changed = await rules.setDomainsEnabled(changes);
    let deletedCount = 0;
    const turnedOff = changed.filter((c) => !c.enabled).map((c) => c.code);
    if (deleteExisting && turnedOff.length) {
        deletedCount = await deleteMatchedProducts(await rules.findStoredByDomains(turnedOff));
    }
    if (changed.length) {
        const aliases = changed.flatMap((c) => domainAliases(c.code));
        await recomputeVisibility({ ondcDomain: { [Op.in]: aliases } });
    }
    if (changed.length) {
        const action = changed
            .map((c) => `Turned ${c.enabled ? "on" : "off"} ${c.name || domainLabel(c.code)} (${c.code.replace(/^ONDC:/, "")})`)
            .join(", ");
        await rules.createRuleLogSafely({ section: "domains", action, detail: { changes: changed, deletedCount }, actor });
    }
    return ok(res, { changed, deletedCount }, changed.length ? "Domains updated" : "No changes");
});

// ─── Blocked sellers ────────────────────────────────────────────────────────

exports.getBlockedSellers = asyncHandler(async (req, res) => {
    const [rows, latest] = await Promise.all([rules.listBlockedSellers(), rules.findLatestRuleLogs()]);
    return ok(res, { data: rows, lastChange: lastChange(latest, "sellers") }, "Blocked sellers fetched");
});

exports.getBlockSellerOptions = asyncHandler(async (req, res) => {
    const rows = await rules.findSellerOptions({ search: req.query.search || req.query.searchText, limit: req.query.limit });
    return ok(res, { data: rows }, "Seller options fetched");
});

exports.previewBlockSeller = asyncHandler(async (req, res) => {
    const seller = parseSeller(req.body);
    const products = await rules.findStoredBySeller(seller);
    return ok(res, { total: products.length, sample: sampleNames(products) }, "Seller preview");
});

exports.blockSeller = asyncHandler(async (req, res, next) => {
    const seller = parseSeller(req.body);
    const reason = String(req.body?.reason ?? "").trim();
    if (!reason) return next(new ErrorResponse("`reason` is required", 422));
    if (reason.length > MAX_REASON_LENGTH) {
        return next(new ErrorResponse(`\`reason\` must be at most ${MAX_REASON_LENGTH} characters`, 422));
    }
    const deleteExisting = parseDeleteExisting(req.body);
    if (await rules.findBlockedSeller(seller)) return next(new ErrorResponse("Seller is already blocked", 409));

    const actor = actorFrom(req);
    const sellerName = String(req.body?.sellerName ?? "").trim().slice(0, 255) || null;
    const row = await rules.createBlockedSeller({ ...seller, sellerName, reason, actor });

    let deletedCount = 0;
    if (deleteExisting) {
        deletedCount = await deleteMatchedProducts(await rules.findStoredBySeller(seller));
    }
    await recomputeVisibility(SCOPES.seller(seller));
    await rules.createRuleLogSafely({
        section: "sellers",
        action: `Blocked ${sellerName || seller.providerId}`,
        detail: { ...seller, reason, deletedCount },
        actor,
    });
    return ok(res, { ...row, deletedCount }, "Seller blocked");
});

exports.unblockSeller = asyncHandler(async (req, res, next) => {
    const removed = await rules.deleteBlockedSeller(parseId(req.params.id));
    if (!removed) return next(new ErrorResponse("Blocked seller not found", 404));
    await rules.createRuleLogSafely({
        section: "sellers",
        action: `Unblocked ${removed.sellerName || removed.providerId}`,
        detail: { bppId: removed.bppId, providerId: removed.providerId },
        actor: actorFrom(req),
    });
    await recomputeVisibility(SCOPES.seller({ bppId: removed.bppId, providerId: removed.providerId }));
    return ok(res, { id: Number(removed.id) }, "Seller unblocked");
});

// ─── Banned keywords ────────────────────────────────────────────────────────

exports.getBannedKeywords = asyncHandler(async (req, res) => {
    const [rows, latest] = await Promise.all([rules.listBannedKeywords(), rules.findLatestRuleLogs()]);
    return ok(res, { data: rows, lastChange: lastChange(latest, "keywords") }, "Banned keywords fetched");
});

/** Backs "Preview matches": what each new word would hit among stored products. */
exports.previewBannedKeywords = asyncHandler(async (req, res) => {
    const words = parseWords(req.body?.words);
    const existing = new Set(await rules.findBannedWords());
    const fresh = words.filter((w) => !existing.has(w));
    const matches = await rules.findStoredByWords(fresh);
    const perWord = fresh.map((word) => ({
        word,
        count: matches.get(word).length,
        sample: sampleNames(matches.get(word)),
    }));
    return ok(res, {
        words: perWord,
        alreadyBanned: words.filter((w) => existing.has(w)),
        total: perWord.reduce((sum, w) => sum + w.count, 0),
    }, "Keyword preview");
});

// Banned products are never kept (ingest refuses them), so stored matches are always deleted.
exports.addBannedKeywords = asyncHandler(async (req, res) => {
    const words = parseWords(req.body?.words);
    const actor = actorFrom(req);

    const added = await rules.addBannedKeywords(words, actor);
    let deletedCount = 0;
    if (added.length) {
        const matched = [...(await rules.findStoredByWords(added)).values()].flat();
        deletedCount = await deleteMatchedProducts(matched);
    }
    if (added.length) {
        await rules.createRuleLogSafely({
            section: "keywords",
            action: `Added ${added.length} ${added.length === 1 ? "word" : "words"}`,
            detail: { words: added, deletedCount },
            actor,
        });
    }
    return ok(res, { added, deletedCount }, added.length ? "Keywords banned" : "Words were already banned");
});

exports.removeBannedKeyword = asyncHandler(async (req, res, next) => {
    const removed = await rules.deleteBannedKeyword(parseId(req.params.id));
    if (!removed) return next(new ErrorResponse("Keyword not found", 404));
    await rules.createRuleLogSafely({
        section: "keywords",
        action: `Removed "${removed.word}"`,
        detail: { word: removed.word },
        actor: actorFrom(req),
    });
    // refused products return with the next sync; leftover stored rows may now pass
    await rules.deleteKeywordSkips(removed.word);
    await recomputeVisibility({ hiddenReason: "keyword", hiddenDetail: removed.word });
    return ok(res, { id: Number(removed.id) }, "Keyword removed");
});

// ─── Top deals (min price + price sanity) ─────────────────────────────────

exports.getTopDealsRules = asyncHandler(async (req, res) => {
    const [settings, exclusions, latest] = await Promise.all([
        getTopDealsSettings(),
        countTopDealsRuleExclusions(),
        rules.findLatestRuleLogs(),
    ]);
    return ok(res, {
        ...settings,
        ...exclusions,
        lastChange: {
            topDeals: latest.topDeals || null,
            priceSanity: latest.priceSanity || null,
        },
    }, "Top deals rules fetched");
});

/** Body: `{ minPrice?, maxDiscountPct? }` — a key set to null clears that filter. */
exports.updateTopDealsRules = asyncHandler(async (req, res, next) => {
    const body = req.body || {};
    const patch = {};
    if ("minPrice" in body) {
        const v = body.minPrice;
        if (v !== null && (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 10000000)) {
            return next(new ErrorResponse("`minPrice` must be a number ≥ 0, or null", 422));
        }
        patch.minPrice = v;
    }
    if ("maxDiscountPct" in body) {
        const v = body.maxDiscountPct;
        if (v !== null && (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 99)) {
            return next(new ErrorResponse("`maxDiscountPct` must be a whole number from 1 to 99, or null", 422));
        }
        patch.maxDiscountPct = v;
    }
    if (!Object.keys(patch).length) {
        return next(new ErrorResponse("Send `minPrice` and/or `maxDiscountPct`", 422));
    }

    const actor = actorFrom(req);
    const { before, after } = await saveTopDealsSettings(patch);
    const fmt = (v, unit) => (v == null ? "off" : unit === "₹" ? `₹${v}` : `${v}%`);
    if ("minPrice" in patch && before.minPrice !== after.minPrice) {
        await rules.createRuleLogSafely({
            section: "topDeals",
            action: `Minimum price ${fmt(before.minPrice, "₹")} → ${fmt(after.minPrice, "₹")}`,
            detail: { before: before.minPrice, after: after.minPrice },
            actor,
        });
    }
    if ("maxDiscountPct" in patch && before.maxDiscountPct !== after.maxDiscountPct) {
        await rules.createRuleLogSafely({
            section: "priceSanity",
            action: `Max discount ${fmt(before.maxDiscountPct, "%")} → ${fmt(after.maxDiscountPct, "%")}`,
            detail: { before: before.maxDiscountPct, after: after.maxDiscountPct },
            actor,
        });
    }
    const exclusions = await countTopDealsRuleExclusions();
    return ok(res, { ...after, ...exclusions }, "Top deals rules updated");
});
