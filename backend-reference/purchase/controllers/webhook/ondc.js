const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");

// Same literal as models/use-cases/ondc_product_with_transactionId.js and
// services/ondcCityCatalogSearch.js, which each declare it locally.
const OFFICE_SUPPLIES = "OFFICE_SUPPLIES";
const ondcProductsUseCase = require("../../models/use-cases/ondc_product_with_transactionId");
const userSearchUseCase = require("../../models/use-cases/user_search_ondc");
const { notifyOnSearch } = require("../../services/ondcSearchWaiter");
const { notifyOnSelect } = require("../../services/ondcSelectWaiter");
const { notifyOnInit } = require("../../services/ondcInitWaiter");
const { notifyOnConfirm } = require("../../services/ondcConfirmWaiter");
const { notifyOnStatus } = require("../../services/ondcStatusWaiter");
const { notifyOnTrack } = require("../../services/ondcTrackWaiter");
const { notifyOnCancel } = require("../../services/ondcCancelWaiter");
const { notifyOnUpdate } = require("../../services/ondcUpdateWaiter");
const {
    updateOndcOrderStatus,
    updateOndcOrderTracking,
    findOndcOrderByTransactionId,
} = require("../../models/use-cases/ondc_order");
const { sendOndcInvoiceEmail } = require("../../services/ondcInvoiceNotify");
const { dispatchOndcStatusEmails, checkOndcEtaRevision } = require("../../services/ondcOrderStatusNotify");
const ondcIssuesUseCase = require("../../models/use-cases/ondc_issue");
const ondcIssueEventsUseCase = require("../../models/use-cases/ondc_issue_event");
const { notifyOnIssue } = require("../../services/ondcIssueWaiter");
const { mapWireActionToStatus, fallbackActionMessage, toWireIssueLevel } = require("../../utils/ondcIgmStatus");
const { sessionFromIssuePayload } = require("../../services/ondcIgm2");
const { createCallbackLog } = require("../../models/use-cases/ondc_callback_log");
const { customLog } = require("../../utils/loggerHelper");
const { parseOndcAmount } = require("../../utils/ondc_helper");
const { sellerCategoryOf } = require("../../utils/ondcSellerCategory");
const { hasUsableProductImage, usableImageUrls } = require("../../utils/ondc_product_images");
const { extractSellerNpContact } = require("../../utils/ondcSeller");
const { upsertOndcSeller } = require("../../models/use-cases/ondc_seller");
const {
    upsertOndcSellerNp,
    countOndcSellerNps,
    shouldIngestCatalogBpp,
} = require("../../models/use-cases/ondc_seller_np");
const { recordSeenDomain, findBannedWords, destroyProductsByKeys } = require("../../models/use-cases/ondc_catalog_rules");
const { matchBannedKeyword } = require("../../utils/ondcKeywordMatch");
const { bumpListCacheForCities } = require("../../services/ondcProductListCache");
const { upsertSellerCategories, normalizeCategoryKey } = require("../../models/use-cases/ondc_seller_category");
const { toDomainCode } = require("../../utils/ondcDomainLabels");
const { recordIngestSkips } = require("../../services/ondcCatalogRules");
const { recomputeVisibility } = require("../../services/ondcProductVisibility");
const { waitForSellerCategorySeed } = require("../../services/ondcSellerCategorySeed");
const { scheduleCategoryCountRefresh } = require("../../services/ondcCategoryCountRefresher");
const { scheduleCatalogSweepReconcile } = require("../../services/ondcCatalogSweepReconcile");
const { recordDeliveryAndHoldPayout } = require("../../services/ondcPayoutHold");
const { getReturnFulfillments } = require("../../utils/ondcReturnEligibility");
const { collectOrderDocuments } = require("../../utils/ondcDocuments");
const { reportInbound } = require("../../services/ondcObservability");

const ONDC_ACK = { message: { ack: { status: "ACK" } } };

const sendOndcAck = (req, res, ackBody = ONDC_ACK, httpStatus = 200) => {
    reportInbound({ reqBody: req.body, ackBody });
    return res.status(httpStatus).json(ackBody);
};

// BPPs send booleans either as JSON booleans or as "true"/"false" strings.
const toBooleanOrNull = (value) => {
    if (value === true || value === "true") return true
    if (value === false || value === "false") return false
    return null
}

/** Normalize ONDC statutory blocks from a catalog item — null when both absent. */
const buildStatutory = (product) => {
    const packagedCommodities = product['@ondc/org/statutory_reqs_packaged_commodities'] || null
    const prepackagedFood = product['@ondc/org/statutory_reqs_prepackaged_food'] || null
    if (!packagedCommodities && !prepackagedFood) return null
    return { packagedCommodities, prepackagedFood }
}

/**
 * Map a counterparty's raw IGM action code onto our internal issue-status
 * vocabulary. Lives in utils/ondcIgmStatus.js so the inbound translation, the
 * outbound one and the terminal set cannot drift apart.
 *
 * This used to substring-match here, which had a trap that IGM 2.0 triggers
 * routinely: "RESOLUTION_PROPOSED".includes("RESOLV") is true, so a merely
 * proposed resolution was recorded as RESOLVED — terminal — locking the buyer
 * out of accepting or rejecting it. The mapping is exact now.
 */
const mapRespondentAction = mapWireActionToStatus

/**
 * The idempotency key for one ingested action, guarding
 * ondc_issue_events_issue_dedupe so an at-least-once webhook redelivery is a
 * no-op.
 *
 * IGM 2.0 gives every action its own stable `id` — use it, because it is the
 * counterparty's own identity for that action and survives redelivery exactly.
 *
 * IGM 1.0 has no such id, so fall back to (message_id + raw action + timestamp)
 * as before. That composite is only safe for 1.0: under 2.0 the raw action sits
 * at `descriptor.code`, so `action.respondent_action` is undefined and two
 * distinct actions sharing an `updated_at` would collapse to the same key — the
 * second silently swallowed as a duplicate.
 */
const buildIssueEventDedupeKey = ({ messageId, action, rawAction }) =>
    action?.id
        ? `action_${action.id}`
        : `${messageId}_${rawAction}_${action?.updated_at}`

/**
 * IGM 2.0 puts every action's evidence under `descriptor.images` as Beckn Image
 * objects (`{url, size_type}`), while ondcIssueEvents.images and the frontend
 * both hold plain URL strings. `media[]` is the same idea for non-images.
 */
const extractIssueActionImages = (action) => {
    const fromDescriptor = [
        ...(action?.descriptor?.images || []),
        ...(action?.descriptor?.media || []),
    ]
        .map((entry) => (typeof entry === "string" ? entry : entry?.url))
        .filter(Boolean)
    if (fromDescriptor.length) return fromDescriptor
    // IGM 1.0 shapes.
    return action?.description?.images || action?.images || []
}

/**
 * Normalize one action from either IGM version into the fields we store.
 *
 * @param {object} action the raw action
 * @param {boolean} isV2 whether it came from `issue.actions[]`
 */
const normalizeIssueAction = (action, isV2) => {
    const code = isV2 ? action?.descriptor?.code : action?.respondent_action;
    const rawMessage = isV2 ? action?.descriptor?.short_desc : action?.short_desc;
    return isV2
        ? {
            code,
            message: fallbackActionMessage(code, rawMessage),
            actorName: action?.actor_details?.name || action?.action_by || "Seller",
            actionBy: action?.action_by,
            updatedAt: action?.updated_at,
            images: extractIssueActionImages(action),
        }
        : {
            code,
            message: fallbackActionMessage(code, rawMessage),
            actorName:
                action?.updated_by?.person?.name || action?.updated_by?.org?.name || "Seller",
            actionBy: undefined,
            updatedAt: action?.updated_at,
            images: extractIssueActionImages(action),
        };
};

const upsertIssueFromCallback = async (issuePayload, context, logTraceId, sourceAction) => {
    const transactionId = context.transaction_id || context.transactionId;
    const order = await findOndcOrderByTransactionId(transactionId);
    if (!order) {
        customLog(logTraceId, "warn", {
            message: `${sourceAction}: issue not found and no order for transaction`,
            issueId: issuePayload.id,
            transactionId,
        }, "VENDOR");
        return null;
    }
    const descriptor = issuePayload.descriptor || {};
    const openAction = (issuePayload.actions || []).find((a) => a?.descriptor?.code === "OPEN");
    const firstEvent = openAction
        ? {
            eventType: "OPEN",
            actorType: "COMPLAINANT",
            actorName: openAction.actor_details?.name || "You",
            message: fallbackActionMessage("OPEN", openAction.descriptor?.short_desc || descriptor.short_desc),
            sourceAction,
            occurredAt: openAction.updated_at || issuePayload.created_at,
            dedupeKey: openAction.id ? `action_${openAction.id}` : `upsert_open_${issuePayload.id}`,
        }
        : undefined;
    try {
        const created = await ondcIssuesUseCase.createOndcIssue({
            ondcOrderId: order.id,
            orderId: order.orderId,
            transactionId: order.transactionId,
            corporateUserId: order.corporateUserId,
            subCorporateUserId: order.subCorporateUserId,
            bppId: order.bppId || context.bpp_id,
            bppUri: order.bppUri || context.bpp_uri,
            issueId: issuePayload.id,
            category: issuePayload.category || "ITEM",
            subCategory: issuePayload.sub_category || descriptor.code || null,
            description: descriptor.long_desc || descriptor.short_desc || "",
            igmMeta: sessionFromIssuePayload(issuePayload),
            level: toWireIssueLevel(issuePayload.level),
            firstEvent,
        });
        return created || await ondcIssuesUseCase.findOndcIssueByIssueId({ issueId: issuePayload.id });
    } catch (err) {
        // Raise persisted in the same window — unique issueId. Re-read.
        const existing = await ondcIssuesUseCase.findOndcIssueByIssueId({ issueId: issuePayload.id });
        if (existing) return existing;
        customLog(logTraceId, "error", {
            message: `${sourceAction}: failed to upsert unknown issue`,
            issueId: issuePayload.id,
            error: err?.message || String(err),
        }, "VENDOR");
        return null;
    }
};

/**
 * Ingest a seller-pushed issue callback (on_issue / on_issue_status). Records
 * every COUNTERPARTY action in the payload (oldest first) as its own event,
 * de-duped per action, so an at-least-once webhook redelivery is a no-op.
 * Best-effort — never throws to the caller so the ACK always goes out.
 *
 * Handles both IGM versions:
 *   2.0  `issue.actions[]`, each with `descriptor.code` / `action_by` / `id`
 *   1.0  `issue.issue_actions.respondent_actions[]`, each with `respondent_action`
 *
 * The 2.0 payload replays OUR OWN actions back to us alongside the seller's, and
 * we already recorded those locally when we sent them (sourceAction LOCAL_RAISE /
 * LOCAL_RESPOND). The replay carries a different id, so it would not dedupe
 * against the local row — ingesting it would show the buyer their own complaint
 * twice. Hence the own-action filter below.
 */
const ingestOndcIssueCallback = async (req, sourceAction) => {
    const issuePayload = req.body?.message?.issue
    const error = req.body?.error
    if (!issuePayload?.id || error) return

    let dbIssue = await ondcIssuesUseCase.findOndcIssueByIssueId({ issueId: issuePayload.id })
    if (!dbIssue) {
        dbIssue = await upsertIssueFromCallback(
            issuePayload,
            req.body?.context || {},
            req?.LogTraceId,
            sourceAction
        )
        if (!dbIssue) {
            customLog(req?.LogTraceId, "warn", {
                message: `${sourceAction}: issue not found in database`,
                issueId: issuePayload.id,
            }, "VENDOR")
            return
        }
    }

    const context = req.body?.context || {}
    const messageId = context.message_id || context.messageId || "webhook"

    const v2Actions = Array.isArray(issuePayload.actions) ? issuePayload.actions : null
    const isV2 = Boolean(v2Actions)
    const rawActions = v2Actions || issuePayload.issue_actions?.respondent_actions || []

    // Our own identities on this thread. `context.bap_id` is us (we are the BAP
    // receiving the callback); complainant_id / source_id cover the same actor
    // under whichever id the counterparty chose to echo.
    const ourIds = new Set(
        [context.bap_id, issuePayload.complainant_id, issuePayload.source_id].filter(Boolean)
    )

    const sortedActions = [...rawActions].sort(
        (a, b) => new Date(a?.updated_at).getTime() - new Date(b?.updated_at).getTime()
    )

    for (const action of sortedActions) {
        const normalized = normalizeIssueAction(action, isV2)
        // Skip anything we authored — already recorded locally when we sent it.
        if (normalized.actionBy && ourIds.has(normalized.actionBy)) continue
        if (!normalized.code) continue

        await ondcIssueEventsUseCase.recordOndcIssueEvent({
            ondcIssueId: dbIssue.id,
            eventType: mapRespondentAction(normalized.code),
            actorType: "RESPONDENT",
            actorName: normalized.actorName,
            message: normalized.message,
            // seller-attached evidence, if any (already public URLs from the seller)
            images: normalized.images,
            sourceAction,
            occurredAt: normalized.updatedAt,
            dedupeKey: buildIssueEventDedupeKey({
                messageId,
                action,
                rawAction: normalized.code,
            }),
        })
    }

    // The wire-level fields have no per-event home: level and the proposed
    // resolutions describe the issue as a whole, and the buyer needs the
    // resolutions to see what was actually offered.
    if (isV2) {
        await ondcIssuesUseCase.updateOndcIssueFromCallback({
            id: dbIssue.id,
            level: toWireIssueLevel(issuePayload.level),
            resolution: Array.isArray(issuePayload.resolutions) ? issuePayload.resolutions : null,
            igmMeta: sessionFromIssuePayload(issuePayload, dbIssue.igmMeta),
        })
    }
}

/**
 * Fire-and-forget audit persistence of an order-lifecycle callback (raw body
 * to ondcCallbackLogs) — must never delay or break the webhook ACK.
 */
const logCallback = (action, req) => {
    const context = req.body?.context || {}
    createCallbackLog({
        action,
        transactionId: context.transaction_id || context.transactionId || null,
        messageId: context.message_id || context.messageId || null,
        bppId: context.bpp_id || null,
        bppUri: context.bpp_uri || null,
        domain: context.domain || null,
        hasError: Boolean(req.body?.error),
        error: req.body?.error || null,
        payload: req.body,
    }).catch((err) => {
        customLog(req?.LogTraceId, "error", {
            message: `ondc callback audit write failed (${action})`,
            transactionId: context.transaction_id,
            error: err?.message || err,
        }, "VENDOR")
    })
}

// Stats only — a failure here must never cost us the catalog.
const recordSkipsSafely = async (req, rows) => {
    if (!rows.length) return
    try {
        await recordIngestSkips(rows)
    } catch (error) {
        customLog(req?.LogTraceId, "error", {
            scope: "ondcIngestSkips",
            step: "record-failed",
            message: "Could not record skipped catalog items",
            error: error?.message || String(error),
        }, "VENDOR")
    }
}

/**
 * Ingest one on_search catalog: drop the whole catalog unless the seller NP
 * (bpp_id) is enabled, drop items without a usable http(s) image or with a
 * banned word, and store everything else — then settle the pending /ondc/search.
 *
 * Whether a stored product is shown is decided afterwards by
 * services/ondcProductVisibility.js: it needs its seller category (the
 * item's category_id) mapped to a Peko category on Products > Review, and
 * must pass the Products > Rules checks (domain on, seller not blocked).
 * Products that don't are stored hidden, with the reason.
 * New seller categories land in the Review queue as unmapped.
 *
 * Runs AFTER the ACK has gone out so a large catalog cannot trip the
 * gateway TTL — the waiter is notified only once the upsert has committed.
 */
const ingestOnSearchCatalog = async (req) => {
    const catalog = req.body?.message?.catalog || {}
    const vendorAndProducts = catalog["bpp/providers"] || []
    const context = req.body?.context || {}
    // ONDC context uses snake_case; fall back to camelCase just in case
    const transactionId = context.transaction_id || context.transactionId
    // seller app (BPP) identity — part of the product dedup key
    const bppUri = context?.bpp_uri || context?.bppUri
    const bppId = context?.bpp_id || context?.bppId
    const ondcDomainFromContext = context?.domain || null

    // Seller NP identity from the catalog descriptor — used to stamp the NP
    // row even when we will not persist products.
    const npContact = extractSellerNpContact(catalog)

    const skipCatalog = () => {
        try {
            notifyOnSearch(transactionId, [])
        } catch (notifyErr) {
            // ignore — waiter is best-effort
        }
    }

    // Catalog ignored — missing bpp_id.
    if (!String(bppId || "").trim()) {
        skipCatalog()
        return
    }

    const tableWasEmpty = (await countOndcSellerNps().catch(() => 0)) === 0

    let sellerNp = null
    try {
        sellerNp = await upsertOndcSellerNp({
            bppId,
            bppUri,
            npName: npContact.npName,
            domain: ondcDomainFromContext,
            lastTransactionId: transactionId,
        })
    } catch (npErr) {
        customLog(req?.LogTraceId, "error", {
            scope: "ondcSellerNp",
            step: "upsert-failed",
            message: "Could not record seller NP from on_search",
            bppId,
            error: npErr?.message || String(npErr),
        }, "VENDOR")
    }

    // Catalog ignored — bpp_id not on the default seller-NP allowlist (empty NP
    // table / no NP row), or the seller NP is disabled.
    if (!shouldIngestCatalogBpp({ bppId, sellerNp, tableWasEmpty })) {
        skipCatalog()
        return
    }

    // Keeps Products > Rules > "Domains we ingest" current (new domains arrive
    // switched off). Whether the domain hides its products is applied below.
    try {
        await recordSeenDomain(ondcDomainFromContext)
    } catch (domainErr) {
        customLog(req?.LogTraceId, "error", {
            scope: "ondcDomain",
            step: "record-failed",
            message: "Could not record the catalog's domain",
            domain: ondcDomainFromContext,
            error: domainErr?.message || String(domainErr),
        }, "VENDOR")
    }

    // Look up the search that produced this catalog (the registry row). For
    // office-supply searches this carries the local/ondc category + source,
    // which we stamp onto every product so the "show" query can scope to
    // office supplies and group by category.
    let registry = null
    try {
        registry = await userSearchUseCase.findByTransactionId({ transactionId })
    } catch (lookupErr) {
        registry = null
    }

    // Tag products with the city the search was FIRED for (registry), not
    // whatever city the BPP echoes back — otherwise the requested city's
    // product filter may never match the ingested rows.
    // Incremental search uses context.city "*" — never persist that as a
    // storefront city; upsert with null refreshes existing SKUs in place.
    const rawCity = registry?.city || context?.city
    const city = rawCity === "*" ? null : rawCity
    const ondcDomain = ondcDomainFromContext || registry?.ondcDomain || null

    const products = []
    const sellerCategoryLabels = [] // parallel to products
    const allWebhookProductIds = []
    const skipped = []
    // unreadable list → store; ondcProductVisibility still hides banned words
    const bannedWords = await findBannedWords().catch(() => [])

    for (const vendor of vendorAndProducts) {
        // Providers may arrive without items/descriptor (incremental
        // catalogs) — skip instead of throwing away the whole batch.
        const vendorName = vendor?.descriptor?.name
        const ondcVendorId = vendor?.id

        if (bppId && ondcVendorId && (npContact.npName || npContact.npContactEmail || npContact.npContactPhone)) {
            try {
                await upsertOndcSeller({ bppId, providerId: ondcVendorId, bppUri, domain: ondcDomain, ...npContact })
            } catch (sellerErr) {
                customLog(req?.LogTraceId, "error", {
                    scope: "ondcSeller",
                    step: "np-contact-upsert-failed",
                    message: "Could not store seller NP contact from on_search",
                    bppId, providerId: ondcVendorId,
                    error: sellerErr?.message || String(sellerErr),
                }, "VENDOR")
            }
        }

        for (const product of (vendor?.items || [])) {
            if (product?.id) allWebhookProductIds.push(product.id)

            const images = usableImageUrls(product.descriptor?.images)
            const symbol = product.descriptor?.symbol
            const bannedWord = matchBannedKeyword(
                [product.descriptor?.name, product.descriptor?.short_desc, product.descriptor?.long_desc],
                bannedWords
            )
            // A banned word or no usable http(s) image (images[] or symbol) → do not persist.
            // Product id is still recorded so notifyOnSearch can settle waiters.
            if (bannedWord || !hasUsableProductImage({ images, symbol })) {
                skipped.push({
                    bppId,
                    providerId: ondcVendorId,
                    ondcProductId: product?.id,
                    productName: product?.descriptor?.name,
                    sellerName: vendorName,
                    ondcDomain,
                    reason: bannedWord ? "keyword" : "noImage",
                    ruleKey: bannedWord,
                })
                continue
            }

            const sellerCategory = sellerCategoryOf(product, vendor, catalog)
            const item = {
                name: product.descriptor?.name,
                symbol,
                vendorName,
                shortDesc: product.descriptor?.short_desc,
                longDesc: product.descriptor?.long_desc,
                images,
                bppUri,
                bppId,
                ondcProductId: product.id,
                ondcVendorId,
                uom: product.quantity?.unitized?.measure?.unit,
                measureValue: product.quantity?.unitized?.measure?.value,
                availableQuantity: product.quantity?.available?.count,
                maxQuantity: product.quantity?.maximum?.count,
                minQuantity: product.quantity?.minimum?.count,
                // Normalised, not stored raw: these land in DECIMAL(12,2)
                // columns, so a seller sending "₹50.00" would persist as ₹0.
                price: parseOndcAmount(product.price?.value),
                maxPrice: parseOndcAmount(product.price?.maximum_value),
                // item policy fields (@ondc/org/* siblings on the item)
                returnable: toBooleanOrNull(product["@ondc/org/returnable"]),
                cancellable: toBooleanOrNull(product["@ondc/org/cancellable"]),
                returnWindow: product["@ondc/org/return_window"] || null,
                timeToShip: product["@ondc/org/time_to_ship"] || null,
                consumerCare: product["@ondc/org/contact_details_consumer_care"] || null,
                // provider location + fulfillment serving this item — /select
                // must echo both. 1.2.x catalogs use the singular keys; some
                // sellers send plural arrays instead.
                locationId: product.location_id || (Array.isArray(product.location_ids) && product.location_ids[0]) || null,
                fulfillmentId: product.fulfillment_id || (Array.isArray(product.fulfillment_ids) && product.fulfillment_ids[0]) || null,
                categoryId: sellerCategory.categoryKey,
                tags: product.tags,
                statutory: buildStatutory(product),
                transactionId,
                // `city` is set by the upsert (array) — not per item here.
                // category / localCategory / hidden reason are stamped by
                // recomputeVisibility after the upsert.
                // the callback's context.domain is the seller's REAL domain
                // (a B2B seller may answer a RET14 search under RETeB2B) —
                // directed product refreshes must talk to the BPP on it.
                ondcDomain,
                // Fall back to OFFICE_SUPPLIES rather than null: an unsolicited
                // push (e.g. a GCR incremental update whose transaction id we
                // never registered) persisted with source null would silently
                // never appear in the storefront, which filters every listing
                // query on source = OFFICE_SUPPLIES.
                source: registry?.source || OFFICE_SUPPLIES,
                ...(city && registry?.catalogSweepId
                    ? { catalogSweepId: registry.catalogSweepId }
                    : {}),
            }
            products.push(item)
            sellerCategoryLabels.push(sellerCategory.label)
        }
    }

    // Seller categories first (new ones join the Review queue), so each
    // product row carries its sellerCategoryId.
    if (products.length) {
        try {
            await waitForSellerCategorySeed()
            const ids = await upsertSellerCategories(products.map((p, i) => ({
                ondcDomain: p.ondcDomain,
                categoryKey: p.categoryId,
                label: sellerCategoryLabels[i],
            })))
            for (const p of products) {
                const key = `${toDomainCode(p.ondcDomain) || "UNKNOWN"}|${normalizeCategoryKey(p.categoryId)}`
                p.sellerCategoryId = ids.get(key) ?? null
            }
        } catch (categoryErr) {
            // stored without a seller category = hidden as unmapped until the next sync
            customLog(req?.LogTraceId, "error", {
                scope: "ondcSellerCategories",
                step: "upsert-failed",
                message: "Could not record seller categories; products stay hidden",
                error: categoryErr?.message || String(categoryErr),
            }, "VENDOR")
        }
    }

    // `city` tags every persisted row (null for incremental city "*").
    if (products.length) {
        await ondcProductsUseCase.upsertProductsWithCity(products, city)
        try {
            await recomputeVisibility({
                bppId,
                ondcVendorId: { [Op.in]: [...new Set(products.map((p) => p.ondcVendorId))] },
                ondcProductId: { [Op.in]: products.map((p) => p.ondcProductId) },
            })
        } catch (visibilityErr) {
            customLog(req?.LogTraceId, "error", {
                scope: "ondcProductVisibility",
                step: "recompute-failed",
                message: "Could not stamp category / hidden reason for ingested products",
                error: visibilityErr?.message || String(visibilityErr),
            }, "VENDOR")
        }
        // Debounced and fire-and-forget: the catalog arrives as many
        // callbacks, which collapse into one recompute once they go quiet.
        scheduleCategoryCountRefresh()
        if (city && registry?.catalogSweepId) {
            scheduleCatalogSweepReconcile({
                city,
                domain: ondcDomain || registry?.ondcDomain,
                sweepId: registry.catalogSweepId,
                ingested: products.length,
            })
        }
    }
    // rows stored before their word was banned are deleted, not kept hidden
    const banned = skipped.filter((s) => s.reason === "keyword")
    if (banned.length) {
        await destroyProductsByKeys(bppId, banned)
            .then((n) => n && Promise.all([bumpListCacheForCities([]), scheduleCategoryCountRefresh()]))
            .catch((err) => customLog(req?.LogTraceId, "error", { scope: "ondcBannedKeywords", error: err?.message }, "VENDOR"))
    }
    await recordSkipsSafely(req, skipped)

    // Signal any pending /ondc/search with every product id in the webhook
    // so a directed refresh does not hang. Last on purpose: the controller
    // reads scoped rows as soon as this resolves, so the upsert must commit first.
    try {
        notifyOnSearch(transactionId, allWebhookProductIds)
    } catch (notifyErr) {
        // ignore — waiter is best-effort
    }
}

exports.ingestOnSearchCatalog = ingestOnSearchCatalog

exports.onSearch = asyncHandler(async (req, res) => {
    const context = req.body?.context || {}
    const transactionId = context.transaction_id || context.transactionId
    const error = req.body?.error || null

    // A NACK carries no catalog, and neither does a malformed body — settle the
    // pending storefront search now rather than letting it wait out the full
    // timeout for an answer the seller has already given.
    if (error || !req.body?.message?.catalog) {
        try {
            notifyOnSearch(transactionId, [], error)
        } catch (notifyErr) {
            // ignore — waiter is best-effort, the ACK must always go out
        }
        return sendOndcAck(req, res)
    }

    // ONDC requires the BAP to ACK the asynchronous callback. Ingestion of a
    // full catalog takes far longer than the gateway is willing to wait, so it
    // runs after the response — the waiter is settled at the end of it.
    const ack = sendOndcAck(req, res)

    setImmediate(() => {
        ingestOnSearchCatalog(req).catch((err) => {
            // Without this the whole catalog vanishes leaving no ONDC-scoped trace.
            customLog(req?.LogTraceId, "error", {
                message: "ONDC on_search failed, catalog discarded",
                transactionId: transactionId || null,
                error: err?.message || String(err),
                stack: err?.stack,
            }, "VENDOR")
            // Ingestion died — release the storefront instead of stranding it
            // until the timeout with no idea why nothing arrived.
            try {
                notifyOnSearch(transactionId, [], { type: "CORE-ERROR", message: "catalog ingestion failed" })
            } catch (notifyErr) {
                // ignore — waiter is best-effort
            }
        })
    })

    return ack
})

/**
 * on_select callback: the BPP returns the quote (message.order with
 * quote.price/quote.breakup + fulfillment serviceability) — or an `error`
 * object on NACK — for a /select we fired. Hand it to the waiter so the
 * pending validateCart request resolves, then ACK.
 */
exports.onSelect = asyncHandler(async (req, res) => {
    const transactionId = req.body?.context?.transaction_id || req.body?.context?.transactionId
    logCallback("on_select", req)
    try {
        notifyOnSelect(transactionId, req.body?.message?.order, req.body?.error)
    } catch (notifyErr) {
        // ignore — waiter is best-effort, the ACK must always go out
    }
    return sendOndcAck(req, res)
})

/**
 * on_init callback: the BPP returns the initialized order (message.order with
 * the final quote + payment/settlement terms) — or an `error` object on NACK —
 * for an /init we fired. Hand it to the waiter so the pending initOrder
 * request resolves, then ACK.
 */
exports.onInit = asyncHandler(async (req, res) => {
    const transactionId = req.body?.context?.transaction_id || req.body?.context?.transactionId
    logCallback("on_init", req)
    try {
        notifyOnInit(transactionId, req.body?.message?.order, req.body?.error)
    } catch (notifyErr) {
        // ignore — waiter is best-effort, the ACK must always go out
    }
    return sendOndcAck(req, res)
})

/**
 * on_confirm: BPP returns the confirmed order (or error on NACK).
 * Notify any pending confirmOrder waiter, ACK immediately, then background:
 * settle the seller's confirm attempt (services/ondcConfirmAfterPayment.js), then
 * persist ondc_orders + Easy Split vendor/split — or, when the seller confirmed
 * after its attempt had already failed and been refunded, cancel it instead.
 */
exports.onConfirm = asyncHandler(async (req, res) => {
    const transactionId = req.body?.context?.transaction_id || req.body?.context?.transactionId
    const order = req.body?.message?.order
    const error = req.body?.error
    logCallback("on_confirm", req)

    try {
        notifyOnConfirm(transactionId, order, error)
    } catch (notifyErr) {
        // ignore - waiter is best-effort, the ACK must always go out
    }

    // ACK first - persist / Easy Split must never delay the ONDC gateway response.
    const ack = sendOndcAck(req, res)

    setImmediate(() => {
        // Required here, not at the top: the confirm-after-payment flow pulls in the
        // gateway, mail and ONDC transport modules, and this controller is loaded by
        // suites that exercise the other callbacks (same as onCancel's lazy require).
        // It settles the seller's confirm attempt (or cancels a late confirm), then
        // runs the same persist / Easy Split as before.
        const { handleOnConfirmCallback } = require("../../services/ondcConfirmAfterPayment")
        handleOnConfirmCallback({
            transactionId,
            order,
            error: error || null,
            context: req.body?.context || null,
            logTraceId: req?.LogTraceId,
        }).catch((asyncErr) => {
            customLog(req?.LogTraceId, "error", {
                flow: "ondcPgDirectConfirm",
                scope: "onConfirm",
                step: "on-confirm-async",
                message: "on_confirm persist/settle failed (order may still be placed at BPP)",
                transactionId,
                error: asyncErr?.message || String(asyncErr),
            }, "VENDOR")
        })
    })

    return ack
})

/**
 * on_status callback: the BPP returns the order's CURRENT state (message.order
 * — state + fulfillments), either in reply to a /status we fired OR
 * UNSOLICITED (a seller-initiated push with no prior /status call and no
 * pending waiter — ONDC allows this). Persistence therefore happens
 * unconditionally, independent of the waiter notify: a pending
 * getOndcOrderById live-refresh is a bonus wake-up, not a precondition for
 * saving the data.
 */
exports.onStatus = asyncHandler(async (req, res) => {
    const transactionId = req.body?.context?.transaction_id || req.body?.context?.transactionId
    logCallback("on_status", req)
    const order = req.body?.message?.order
    const error = req.body?.error
    if (transactionId && order && !error) {
        // The seller's paperwork — [{ url, label:"Invoice" }]. Sellers put it either on
        // message.order or on the fulfillment; collectOrderDocuments looks in both,
        // because keying on order.documents alone meant fulfillment-level sellers
        // never triggered the invoice mail.
        const documents = collectOrderDocuments(order)
        // The status events this callback GENUINELY introduced — empty on a replay.
        // Drives the buyer notification emails below.
        let appended = []
        try {
            const persisted = await updateOndcOrderStatus({
                transactionId,
                orderId: order.id,
                orderState: order.state,
                fulfillments: order.fulfillments,
                cancellationTerms: order.cancellation_terms,
                source: "on_status",
                // Only written when non-empty, so a later documents-less callback
                // can't wipe it (see updateOndcOrderStatus).
                documents,
            })
            appended = persisted?.appended || []
        } catch (persistErr) {
            customLog(req?.LogTraceId, "error", {
                message: "onStatus: failed to persist order status",
                transactionId,
                error: persistErr?.message || persistErr,
            }, "VENDOR")
        }

        // Tell the buyer what just changed — accepted / packed / shipped / out for
        // delivery / delivered / delayed / cancelled. Keyed on `appended`, so the
        // hourly delivery poll re-reporting the same state mails nothing, and
        // claimed per (order, event) on top of that. Fire-and-forget for the same
        // reason as the blocks below: the ONDC ACK must not wait on SMTP.
        if (appended.length) {
            setImmediate(() => {
                dispatchOndcStatusEmails({
                    transactionId,
                    order,
                    appended,
                    source: "on_status",
                    logTraceId: req?.LogTraceId,
                }).catch((mailErr) => {
                    customLog(req?.LogTraceId, "error", {
                        flow: "ondcOrderStatusNotify",
                        step: "on-status-async",
                        message: "onStatus: status mail handling failed (order status itself was saved)",
                        transactionId,
                        error: mailErr?.message || String(mailErr),
                    }, "VENDOR")
                })
            })
        }

        // A REVISED delivery promise is not a state change, so it can arrive on a
        // callback that appends nothing — hence its own hook rather than a branch of
        // the dispatcher. Cheap when there is no news: it returns before any query
        // unless the callback actually carries an @ondc/org/TAT.
        setImmediate(() => {
            checkOndcEtaRevision({
                transactionId,
                order,
                logTraceId: req?.LogTraceId,
            }).catch((etaErr) => {
                customLog(req?.LogTraceId, "error", {
                    flow: "ondcOrderStatusNotify",
                    step: "on-status-eta-async",
                    message: "onStatus: ETA revision check failed (order status itself was saved)",
                    transactionId,
                    error: etaErr?.message || String(etaErr),
                }, "VENDOR")
            })
        })

        // Delivery starts the return clock that holds the seller's payout. Runs
        // AFTER the status write (it reads the persisted quote/split columns) and
        // fire-and-forget, since the ONDC ACK below must not wait on Cashfree.
        // A no-op unless this callback is the FIRST to report Order-delivered.
        setImmediate(() => {
            recordDeliveryAndHoldPayout({
                transactionId,
                order,
                logTraceId: req?.LogTraceId,
            }).catch((holdErr) => {
                customLog(req?.LogTraceId, "error", {
                    scope: "easySplit",
                    flow: "payoutHold",
                    step: "on-status-async",
                    message: "onStatus: delivery/payout-hold handling failed (order status itself was saved)",
                    transactionId,
                    error: holdErr?.message || String(holdErr),
                }, "VENDOR")
            })
        })

        // A /status reply carries the WHOLE order, Return legs included — so when a
        // return is in flight, this callback reports its current state just as an
        // on_update would. Without this the return lifecycle advanced only on a
        // seller-volunteered on_update: the scheduler could poll a returning order
        // forever and returnStatus would never move off Return_Initiated.
        //
        // Same function on_update calls, so this adds no new refund rule — only a
        // second route for the same seller-reported state. Guarded on the order
        // actually carrying a Return fulfillment, so a plain delivery status never
        // enters the return path. Fire-and-forget for the same reason as the payout
        // hold above: it can reach Cashfree, and the ACK must not wait on that.
        // The seller issued the invoice. Runs AFTER the status write so the row it
        // re-reads already carries the documents, and fire-and-forget for the same
        // reason as the payout hold. Guarded on the callback actually carrying
        // documents, so an ordinary status reply costs no query. Sending at most once
        // is the notify service's job (it claims invoiceEmailSentAt before mailing) —
        // this hook fires on EVERY poll cycle by design.
        if (documents.length) {
            setImmediate(async () => {
                try {
                    const row = await findOndcOrderByTransactionId(transactionId)
                    if (row) await sendOndcInvoiceEmail({ row, logTraceId: req?.LogTraceId })
                } catch (invoiceErr) {
                    customLog(req?.LogTraceId, "error", {
                        flow: "ondcInvoiceNotify",
                        step: "on-status-async",
                        message: "onStatus: invoice mail handling failed (order status itself was saved)",
                        transactionId,
                        error: invoiceErr?.message || String(invoiceErr),
                    }, "VENDOR")
                }
            })
        }

        if (getReturnFulfillments(order.fulfillments).length) {
            setImmediate(() => {
                const { applyOndcReturnOnUpdate } = require("../../services/ondcReturnLifecycle")
                applyOndcReturnOnUpdate({
                    transactionId,
                    order,
                    logTraceId: req?.LogTraceId,
                }).catch((returnErr) => {
                    customLog(req?.LogTraceId, "error", {
                        scope: "ondcReturnLifecycle",
                        step: "on-status-async",
                        message: "onStatus: return lifecycle handling failed (order status itself was saved)",
                        transactionId,
                        error: returnErr?.message || String(returnErr),
                    }, "VENDOR")
                })
            })
        }
    }

    try {
        notifyOnStatus(transactionId, order, error)
    } catch (notifyErr) {
        // ignore — waiter is best-effort, the ACK must always go out
    }
    return sendOndcAck(req, res)
})

/**
 * on_track callback: the BPP returns live tracking (message.tracking — courier
 * location/url/status), either in reply to a /track we fired OR UNSOLICITED.
 * Same unconditional-persistence rule as on_status.
 */
exports.onTrack = asyncHandler(async (req, res) => {
    const transactionId = req.body?.context?.transaction_id || req.body?.context?.transactionId
    logCallback("on_track", req)
    const tracking = req.body?.message?.tracking
    const error = req.body?.error

    if (transactionId && tracking && !error) {
        try {
            await updateOndcOrderTracking({ transactionId, tracking })
        } catch (persistErr) {
            customLog(req?.LogTraceId, "error", {
                message: "onTrack: failed to persist tracking",
                transactionId,
                error: persistErr?.message || persistErr,
            }, "VENDOR")
        }
    }

    try {
        notifyOnTrack(transactionId, tracking, error)
    } catch (notifyErr) {
        // ignore — waiter is best-effort, the ACK must always go out
    }
    return sendOndcAck(req, res)
})

/**
 * on_cancel callback: the BPP returns the cancelled order (message.order with
 * state "Cancelled") — or an `error` object on NACK — for a /cancel we fired
 * from the admin cancellation-approval flow. Hand it to the waiter so the
 * pending request resolves, then ACK. The authoritative DB write (marking the
 * ondcOrders row Cancelled) happens in the controller that awaits this
 * waiter, not here — same pattern as on_confirm.
 */
exports.onCancel = asyncHandler(async (req, res) => {
    const transactionId = req.body?.context?.transaction_id || req.body?.context?.transactionId
    const order = req.body?.message?.order
    logCallback("on_cancel", req)
    try {
        notifyOnCancel(transactionId, order, req.body?.error)
    } catch (notifyErr) {
        // ignore — waiter is best-effort, the ACK must always go out
    }

    // An UNSOLICITED seller cancel (stock-out, non-serviceable, LSP gave up) has no
    // waiter to resolve, so the note above about the controller owning the write
    // holds only for cancels WE requested. Without this branch a seller-cancelled
    // order left cancelledAt/cancelReason null and the buyer heard nothing at all.
    //
    // Safe to run for our own cancels too: markOndcOrderCancelledFromCallback is a
    // write-once CAS the controller has already won, and the mail is claimed per
    // (order, cancel:buyer|cancel:seller), so this is a no-op on that path.
    if (transactionId && order && !req.body?.error) {
        setImmediate(async () => {
            try {
                const { notifyOndcCancellationFromCallback } = require("../../services/ondcOrderStatusNotify")
                const row = await findOndcOrderByTransactionId(transactionId)
                if (row) {
                    await notifyOndcCancellationFromCallback({
                        row,
                        order,
                        logTraceId: req?.LogTraceId,
                    })
                }
            } catch (cancelErr) {
                customLog(req?.LogTraceId, "error", {
                    flow: "ondcOrderStatusNotify",
                    step: "on-cancel-async",
                    message: "onCancel: cancellation persist/mail failed (the ACK still went out)",
                    transactionId,
                    error: cancelErr?.message || String(cancelErr),
                }, "VENDOR")
            }
        })
    }

    // A late-confirmed order (the seller confirmed after we had already refunded its
    // share) is cancelled by the confirm-after-payment flow and never has an
    // ondcOrders row, so the branch above skips it. Record whether the seller
    // actually cancelled it — a no-op for every other on_cancel.
    if (transactionId) {
        setImmediate(async () => {
            try {
                const { recordLateConfirmCancelOutcome } = require("../../services/ondcConfirmAfterPayment")
                await recordLateConfirmCancelOutcome({
                    transactionId,
                    order: order || null,
                    error: req.body?.error || null,
                    logTraceId: req?.LogTraceId,
                })
            } catch (lateErr) {
                customLog(req?.LogTraceId, "error", {
                    flow: "ondcConfirmAfterPayment",
                    step: "on-cancel-late-confirm",
                    message: "onCancel: could not record the late-confirm cancel outcome (the ACK still went out)",
                    transactionId,
                    error: lateErr?.message || String(lateErr),
                }, "VENDOR")
            }
        })
    }

    return sendOndcAck(req, res)
})

/**
 * on_update callback: BPP returns the updated order. Solicited after a buyer
 * /update (return/replace) OR unsolicited (IGM replacement after issue close).
 * ACK first, then persist the order snapshot by transaction_id even when we
 * never sent /update.
 */
exports.onUpdate = asyncHandler(async (req, res) => {
    const transactionId = req.body?.context?.transaction_id || req.body?.context?.transactionId
    const order = req.body?.message?.order
    logCallback("on_update", req)
    try {
        notifyOnUpdate(transactionId, order, req.body?.error)
    } catch (notifyErr) {
        // ignore — waiter is best-effort, the ACK must always go out
    }
    // ACK before persist. Workbench TTL is PT30S; holding the ACK for
    // Cashfree/settlement makes the BPP treat on_update as un-ACKed.
    sendOndcAck(req, res)
    if (!transactionId || !order || req.body?.error) return
    let appended = []
    try {
        const persisted = await updateOndcOrderStatus({
            transactionId,
            orderId: order.id,
            orderState: order.state,
            fulfillments: order.fulfillments,
            documents: collectOrderDocuments(order),
            source: "on_update",
        })
        appended = persisted?.appended || []
    } catch (persistErr) {
        customLog(req?.LogTraceId, "error", {
            message: "onUpdate: failed to persist order snapshot",
            error: persistErr?.message || persistErr,
            transactionId,
        }, "VENDOR")
    }

    // Return_Approved (the pickup-scheduled mail) and the return's terminal states
    // arrive here rather than on on_status, so the same dispatcher runs on both.
    if (appended.length) {
        setImmediate(() => {
            dispatchOndcStatusEmails({
                transactionId,
                order,
                appended,
                source: "on_update",
                logTraceId: req?.LogTraceId,
            }).catch((mailErr) => {
                customLog(req?.LogTraceId, "error", {
                    flow: "ondcOrderStatusNotify",
                    step: "on-update-async",
                    message: "onUpdate: status mail handling failed (order snapshot itself was saved)",
                    transactionId,
                    error: mailErr?.message || String(mailErr),
                }, "VENDOR")
            })
        })
    }
    try {
        const hasReturnLeg = getReturnFulfillments(order.fulfillments).length > 0
        if (hasReturnLeg) {
            const { applyOndcReturnOnUpdate } = require("../../services/ondcReturnLifecycle")
            await applyOndcReturnOnUpdate({
                transactionId,
                order,
                logTraceId: req?.LogTraceId,
            })
        }
    } catch (persistErr) {
        customLog(req?.LogTraceId, "error", {
            message: "onUpdate: failed to persist return lifecycle",
            error: persistErr?.message || persistErr,
            transactionId,
        }, "VENDOR")
    }
})

/**
 * on_issue callback: seller pushes issue-thread updates asynchronously
 * (solicited or unsolicited). Persists the seller's actions, then notifies the
 * in-process waiter so a raise/respond call that's briefly holding its HTTP
 * response (waitForOnIssue) returns as soon as the seller's first callback
 * lands — falling back to its own timeout otherwise. Always ACKs regardless of
 * internal errors.
 */
exports.onIssue = asyncHandler(async (req, res) => {
    logCallback("on_issue", req)
    try {
        await ingestOndcIssueCallback(req, "on_issue")
    } catch (persistErr) {
        customLog(req?.LogTraceId, "error", {
            message: "onIssue: failed to process callback",
            error: persistErr?.message || persistErr,
        }, "VENDOR")
    }
    try {
        notifyOnIssue(req.body?.message?.issue?.id, req.body?.message?.issue, req.body?.error)
    } catch (notifyErr) {
        // ignore — waiter is best-effort, the ACK must always go out
    }
    return sendOndcAck(req, res)
})

/**
 * on_issue_status callback: reply to a poll we didn't send in v1, but some
 * sellers push it unsolicited too — handled identically so it's never
 * silently swallowed by the webhook route's /:action catch-all.
 */
exports.onIssueStatus = asyncHandler(async (req, res) => {
    logCallback("on_issue_status", req)
    try {
        await ingestOndcIssueCallback(req, "on_issue_status")
    } catch (persistErr) {
        customLog(req?.LogTraceId, "error", {
            message: "onIssueStatus: failed to process callback",
            error: persistErr?.message || persistErr,
        }, "VENDOR")
    }
    try {
        notifyOnIssue(req.body?.message?.issue?.id, req.body?.message?.issue, req.body?.error)
    } catch (notifyErr) {
        // ignore — waiter is best-effort, the ACK must always go out
    }
    return sendOndcAck(req, res)
})
