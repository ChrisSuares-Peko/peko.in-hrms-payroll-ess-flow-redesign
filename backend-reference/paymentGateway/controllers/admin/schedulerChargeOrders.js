const { Op } = require("sequelize");
const moment = require("moment");

const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");

const PG_Orders = require("../../models/entities/paymentGatewayOrders");
const Subscription = require("../../models/entities/subscription");
const WhatsAppSubscription = require("../../models/entities/whatsappSubscription");
const CorporateUser = require("../../models/entities/corporateUser");
const Package = require("../../models/entities/package");
const { findAllAddonSubscription, findAddonPrice } = require("../../models/use-cases/subscription");
const { findOnePackage } = require("../../models/use-cases/packages");
const { findOneCorporate } = require("../../models/use-cases/corporateUser");
// SAME recompute fn the scheduler used to set the stored charge amount — so the canonical figure matches.
// (Price validity now mirrors the live webhook directly: charged vs stored order amount, not a recompute.)
const { calculatePlanAmount, resolvePlanMaxAmount } = require("../corporate/cashFreeGateway");
const { computeWhatsAppRenewalCharge } = require("../../utils/whatsappRenewalCharge");
// Single shared source for Cashfree creds + the live mandate lookup (same merchant resolution as the scheduler).
const { fetchMandateStatus } = require("./renewalChargeActions");


const DEFAULT_LOOKBACK_DAYS = 30; // scheduler stamps a charge order ~2 days before expiry — 30d covers a full cycle of them
const MAX_ITEMS_PER_PAGE = 25; // page size cap — each visible row does an individual live Cashfree mandate lookup
const STUCK_IN_PROGRESS_DAYS = 2; // an IN_PROGRESS charge with no terminal webhook after this long is likely stuck

// A mandate can be charged only in these live Cashfree states; anything else (ON_HOLD / CANCELLED /
// BANK_APPROVAL_PENDING / etc.) means the upcoming CHARGE will not succeed.
const CHARGEABLE_MANDATE_STATUSES = ["ACTIVE"];

const safeParse = json => {
    try {
        return typeof json === "string" ? JSON.parse(json) : json;
    } catch {
        return null;
    }
};

const verdict = reasons => {
    if (reasons.some(r => r.level === "RISK")) return "RISK";
    if (reasons.length) return "WARNING";
    return "OK";
};

// Map an order's terminal/processing state + verdict into a single prediction of the webhook outcome.
const predictOutcome = (orderStatus, reasons) => {
    if (orderStatus === "COMPLETE") return "COMPLETED";
    if (orderStatus === "FAILED") return "FAILED";
    if (reasons.some(r => r.level === "RISK")) return "WILL_FAIL";
    if (reasons.length) return "AT_RISK";
    return "WILL_SUCCEED";
};

// Structural signals that need NO pricing math — computed cheaply for EVERY candidate so the summary,
// filter and sort run over the whole set without per-row DB/Cashfree calls.
const structuralReasons = ({ sub, isMissing, order, storedAmount }) => {
    const reasons = [];
    if (isMissing || !sub) {
        reasons.push({ code: "SUBSCRIPTION_MISSING", level: "RISK", detail: "The charge order references a subscription that no longer exists — the webhook will have nothing to renew." });
        return reasons;
    }
    if (!sub.vendorSubscriptionId) {
        reasons.push({ code: "MANDATE_MISSING", level: "RISK", detail: "No Cashfree mandate (vendorSubscriptionId) — the charge cannot fire." });
    }
    if (order.status === "FAILED") {
        reasons.push({ code: "PRIOR_FAILURE", level: "RISK", detail: "This charge order is already marked FAILED — the renewal did not go through." });
    }
    if (order.status === "IN_PROGRESS" && moment(order.updatedAt || order.createdAt).isBefore(moment().subtract(STUCK_IN_PROGRESS_DAYS, "days"))) {
        reasons.push({ code: "STUCK_IN_PROGRESS", level: "WARNING", detail: `Charge has been IN_PROGRESS for over ${STUCK_IN_PROGRESS_DAYS} days with no terminal renewal webhook — it may be stuck or the webhook was missed.` });
    }
    // Cap is billing-cycle based (annual ₹1L, monthly ₹14,999) — billingType is on the sub.
    const planMaxAmount = resolvePlanMaxAmount(sub.billingType);
    if (storedAmount != null && storedAmount > planMaxAmount) {
        reasons.push({ code: "EXCEEDS_CAP", level: "RISK", detail: `Charge amount ₹${storedAmount} exceeds the ₹${planMaxAmount} per-charge mandate cap — Cashfree will never charge it, so no success webhook arrives.` });
    }
    return reasons;
};

// The exact DB rows the CHARGE webhook will write on success (mirrors processWebhookEventById →
// createSubscription / renewAddonSubscriptions for Peko, renewWhatsAppSubscription for WhatsApp).
const predictWebhookWrites = ({ product, sub, pkg, storedAmount, recurringAddons, addOnLabels = [], billingType }) => {
    const rows = [];
    const sideEffects = [];
    const period = String(billingType || "").toUpperCase() === "ANNUALLY" ? 365 : 30;
    const newEnd = sub?.subscriptionEndDate
        ? moment(sub.subscriptionEndDate).add(period, "days").endOf("day").format("YYYY-MM-DD")
        : null;
    const endLabel = newEnd ? ` (ends ≈ ${newEnd})` : "";

    if (product === "WHATSAPP") {
        rows.push({ table: "whatsAppSubscriptions", operation: "UPDATE", detail: "Current base plan row → EXPIRED" });
        addOnLabels.forEach((label) => rows.push({ table: "whatsAppSubscriptions", operation: "UPDATE", detail: `Current ${label} add-on row → EXPIRED` }));
        rows.push({ table: "whatsAppSubscriptions", operation: "CREATE", detail: `New base plan row → ACTIVE${endLabel}` });
        addOnLabels.forEach((label) => rows.push({ table: "whatsAppSubscriptions", operation: "CREATE", detail: `New ${label} add-on row → ACTIVE` }));
        rows.push({ table: "orders", operation: "CREATE", detail: `Payment ledger entry ₹${storedAmount ?? "-"} (status SUCCESS)` });
        rows.push({ table: "paymentGatewayOrders", operation: "UPDATE", detail: "This charge order → COMPLETE" });
        sideEffects.push("AiSensy reactivate-project call (re-enables WhatsApp billing for the project)");
        sideEffects.push("In-app 'Renewal Successful' notification + confirmation email with receipt PDF");
        return { rows, sideEffects };
    }

    // ── Peko ──
    const isGroup = pkg?.packageType === "GROUP";
    rows.push({ table: "subscriptions", operation: "CREATE", detail: `New "${pkg?.packageName ?? "plan"}" subscription row${endLabel} — ACTIVE (or PENDING successor if the current plan is still active)` });
    rows.push({ table: "orders", operation: "CREATE", detail: `Payment ledger entry ₹${storedAmount ?? "-"} (status SUCCESS)` });
    if (isGroup) rows.push({ table: "corporateUser", operation: "UPDATE", detail: "Re-stamp the customer's current GROUP packageId" });
    for (const a of recurringAddons) {
        rows.push({
            table: "subscriptions",
            operation: "CREATE",
            detail: `Renew add-on "${a.name}"${a.maxLimit != null ? ` (${a.maxLimit} units)` : ""} — packageId re-anchored to the current plan tier`,
        });
    }
    rows.push({ table: "subscriptions", operation: "UPDATE", detail: "Stamp the latest vendorSubscriptionId on the main subscription row" });
    rows.push({ table: "paymentGatewayOrders", operation: "UPDATE", detail: "This charge order → COMPLETE" });
    sideEffects.push("In-app 'Renewal Successful' notification + confirmation email with receipt PDF");
    return { rows, sideEffects };
};

// Heavy per-row enrichment — runs ONLY for the visible page: account holder, plan, addons, the canonical
// recompute, the webhook price verdict, the predicted webhook writes, and the live Cashfree mandate status.
const enrichRow = async (cand, opts, traceId) => {
    const { order, product, referenceNo, orderStatus, targetDate, subscriptionId, sub, storedAmount } = cand;
    const reasons = [...cand.structuralReasons];

    const base = {
        orderId: order?.id ?? null,
        referenceNo,
        orderKind: order?.orderKind ?? "SUBSCRIPTION_CHARGE",
        orderStatus,
        product,
        triggeredBy: cand.triggeredBy,
        createdAt: order?.createdAt ?? null,
        targetDate,
        subscriptionId,
        vendorSubscriptionId: sub?.vendorSubscriptionId ?? cand.vendorSubscriptionId ?? null,
        customerName: null,
        customerEmail: null,
        companyName: null,
        username: null,
        planName: null,
        billingType: sub?.billingType ?? null,
        subscriptionEndDate: sub?.subscriptionEndDate ?? null,
        chargeAmount: storedAmount, // the amount that WILL be charged (paymentData.amount — the webhook's source of truth)
        canonicalAmount: null, // independent recompute (the figure the webhook logs as drift)
        amountMatchesCanonical: null,
        webhookPriceValid: null,
        mandateStatus: null,
        mandateError: null,
        addons: [],
        predictedWrites: [],
        predictedSideEffects: [],
    };

    if (!sub) {
        return { ...base, predictedOutcome: predictOutcome(orderStatus, reasons), validationResult: verdict(reasons), reasons };
    }

    // Account holder (corporateUser + credential).
    try {
        if (sub.corporateUserId) {
            const corp = await findOneCorporate({ id: sub.corporateUserId }, ["id", "name", "email"], ["username", "email", "name", "registeredBy"]);
            base.customerName = corp?.name ?? corp?.credential?.name ?? null;
            base.companyName = corp?.name ?? null;
            base.customerEmail = corp?.email ?? corp?.credential?.email ?? null;
            base.username = corp?.credential?.username ?? null;
            cand.partnerId = corp?.credential?.registeredBy ?? null;
        }
    } catch (e) {
        customLog(traceId, "error", { message: "schedulerChargeOrders: customer lookup failed", subscriptionId, error: e?.message });
    }
    if (!base.customerEmail) {
        reasons.push({ code: "NO_EMAIL", level: "WARNING", detail: "No customer email on file — the renewal confirmation + receipt email will not be delivered." });
    }

    // ── Live Cashfree mandate status (individual lookup per visible row) ──
    if (opts.checkMandate && base.vendorSubscriptionId) {
        const m = await fetchMandateStatus(product, base.vendorSubscriptionId, traceId);
        base.mandateStatus = m.subscriptionStatus ?? null;
        base.mandateError = m.error ?? null;
        // Only flag a definitively-non-chargeable status; a soft lookup error (mandateError) is NOT a verdict.
        if (base.mandateStatus && !CHARGEABLE_MANDATE_STATUSES.includes(String(base.mandateStatus).toUpperCase())) {
            reasons.push({ code: "MANDATE_NOT_ACTIVE", level: "RISK", detail: `Cashfree mandate is "${base.mandateStatus}" (not ACTIVE) — the upcoming charge will not succeed.` });
        }
    }

    if (product === "WHATSAPP") {
        base.planName = sub.billingPlan ? `WhatsApp ${sub.billingPlan}` : "WhatsApp";
        let addOnLabels = [];
        try {
            const addOnLabelMap = { BOT_BUILDER: "Bot Builder", SHOPIFY_INTEGRATION: "Shopify Integration" };
            // Canonical = exactly what whatsAppTriggerSubscriptionCharges charges: current plan -
            // discount + platform fee + current add-on prices.
            const charge = await computeWhatsAppRenewalCharge({
                packageId: sub.packageId,
                billingType: sub.billingType,
                corporateUserId: sub.corporateUserId,
                credentialId: sub.credentialId,
            });
            base.canonicalAmount = charge?.amount ?? null;
            addOnLabels = (charge?.addOns || []).map((addOn) => addOnLabelMap[addOn.addOnType] || "Bot Builder");
            addOnLabels.forEach((label) => base.addons.push({ packageName: label, maxLimit: null }));
        } catch (e) {
            customLog(traceId, "error", { message: "schedulerChargeOrders: WA addon lookup failed", subscriptionId, error: e?.message });
        }
        // WhatsApp renewal silently marks the order COMPLETE even if no ACTIVE base sub exists at webhook time
        // (money charged, nothing renewed). If the resolved sub isn't ACTIVE, surface that gap.
        if (sub.status && sub.status !== "ACTIVE") {
            reasons.push({ code: "WA_SILENT_GAP_RISK", level: "RISK", detail: `Base WhatsApp subscription is ${sub.status} (not ACTIVE) — the webhook would charge the mandate but renew nothing and still mark the order COMPLETE.` });
        }
        const writes = predictWebhookWrites({ product, sub, pkg: null, storedAmount, recurringAddons: [], addOnLabels, billingType: base.billingType });
        base.predictedWrites = writes.rows;
        base.predictedSideEffects = writes.sideEffects;
        if (base.chargeAmount != null && base.canonicalAmount != null) {
            base.amountMatchesCanonical = Number(base.chargeAmount).toFixed(2) === Number(base.canonicalAmount).toFixed(2);
            if (!base.amountMatchesCanonical) {
                reasons.push({ code: "AMOUNT_DRIFT", level: "WARNING", detail: `Stored charge ₹${base.chargeAmount} differs from the recomputed ₹${base.canonicalAmount} (plan price - discount + fee + active add-ons) — the renewal may charge a stale amount.` });
            }
        }
        return { ...base, predictedOutcome: predictOutcome(orderStatus, reasons), validationResult: verdict(reasons), reasons };
    }

    // ── Peko ──
    let pkg = null;
    try {
        pkg = await findOnePackage(sub.packageId);
        base.planName = pkg?.packageName ?? null;
    } catch (e) {
        customLog(traceId, "error", { message: "schedulerChargeOrders: package lookup failed", subscriptionId, error: e?.message });
    }

    const priceKey = String(sub.billingType || "").toLowerCase();
    const prices = pkg ? (typeof pkg.packagePrices === "string" ? safeParse(pkg.packagePrices) : pkg.packagePrices) : null;
    if (pkg && !(Number(prices?.[priceKey]) > 0)) {
        reasons.push({ code: "PRICE_NOT_CONFIGURED", level: "RISK", detail: `No ${priceKey || "billing"} price configured on plan "${pkg.packageName}".` });
    }

    // Active add-ons; only isDynamicUnitPricing ones are RENEWED by the webhook (renewAddonSubscriptions).
    const recurringAddons = [];
    try {
        const list = (await findAllAddonSubscription(sub.corporateUserId)) || [];
        const groupPackageId = pkg?.packageType === "GROUP" ? sub.packageId : null;
        for (const a of list) {
            const name = a.package?.packageName ?? "Add-on";
            base.addons.push({ packageName: name, maxLimit: a.maxLimit ?? null });
            // calculateSubscriptionPrice throws for ANY active add-on lacking a cashback row → renewal price calc fails.
            const addonData = await findAddonPrice({ packageId: a.packageId, serviceOperatorId: a.serviceOperatorId, groupPackageId });
            if (!addonData || !addonData.serviceOperator) {
                reasons.push({ code: "CASHBACK_MISSING", level: "RISK", detail: `Add-on "${name}" has no cashback/pricing configured — the renewal price calculation will fail.` });
            } else if (addonData.serviceOperator.isDynamicUnitPricing) {
                recurringAddons.push({ name, maxLimit: a.maxLimit ?? null });
            }
        }
    } catch (e) {
        customLog(traceId, "error", { message: "schedulerChargeOrders: addon list failed", subscriptionId, error: e?.message });
    }

    // Canonical recompute with the SAME fn the scheduler used to set the stored amount.
    try {
        const r = await calculatePlanAmount(pkg, sub.billingType, false, null, null, sub.corporateUserId);
        const amt = Number(r?.periodicPrice);
        base.canonicalAmount = Number.isNaN(amt) ? null : amt;
    } catch (e) {
        reasons.push({ code: "FORECAST_ERROR", level: "RISK", detail: `Could not recompute the renewal amount: ${e?.message ?? e}` });
    }

    // Mirror the LIVE CHARGE webhook: it validates Cashfree's charged amount against the amount the scheduler
    // REQUESTED (the order's paymentData.amount = base.chargeAmount), NOT a recompute. Cashfree charges exactly
    // what we requested, so the webhook accepts any positive stored amount. (The old validatePrice/recompute
    // check here falsely predicted "Invalid subscription amount" whenever the recompute under-counted addons.)
    if (pkg && base.chargeAmount != null) {
        base.webhookPriceValid = base.chargeAmount > 0;
    }
    // Drift between stored and recomputed (the webhook logs this; informative for the admin).
    if (base.chargeAmount != null && base.canonicalAmount != null) {
        base.amountMatchesCanonical = Number(base.chargeAmount).toFixed(2) === Number(base.canonicalAmount).toFixed(2);
        if (!base.amountMatchesCanonical) {
            reasons.push({ code: "AMOUNT_DRIFT", level: "WARNING", detail: `Stored charge ₹${base.chargeAmount} differs from the recomputed canonical ₹${base.canonicalAmount} — the renewal will charge the stored amount.` });
        }
    }

    const writes = predictWebhookWrites({ product, sub, pkg, storedAmount, recurringAddons, addOnLabels: [], billingType: base.billingType });
    base.predictedWrites = writes.rows;
    base.predictedSideEffects = writes.sideEffects;

    return { ...base, predictedOutcome: predictOutcome(orderStatus, reasons), validationResult: verdict(reasons), reasons };
};

// GET /scheduler-charge-orders — order-centric prediction of every scheduler-initiated SUBSCRIPTION_CHARGE
// order: live mandate status, the price that will be charged, the validation verdict, and the rows the
// webhook will write — so an admin can predict the renewal webhook before it fires.
exports.getSchedulerChargeOrders = asyncHandler(async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const itemsPerPage = Math.min(Math.max(parseInt(req.query.itemsPerPage, 10) || 10, 1), MAX_ITEMS_PER_PAGE);
        const product = (req.query.product || "ALL").toUpperCase();
        const statusFilter = (req.query.orderStatus || "").toUpperCase();
        const triggerFilter = (req.query.triggeredBy || "").toUpperCase();
        const validationFilter = (req.query.validationStatus || "").toUpperCase();
        const searchText = (req.query.searchText || "").trim().toLowerCase();
        const checkMandate = String(req.query.checkMandate ?? "true") !== "false";

        const from = req.query.from ? moment(req.query.from).startOf("day") : moment().subtract(DEFAULT_LOOKBACK_DAYS, "days").startOf("day");
        const to = req.query.to ? moment(req.query.to).endOf("day") : moment().endOf("day");

        const includePeko = product === "ALL" || product === "PEKO";
        const includeWa = product === "ALL" || product === "WHATSAPP";

        // ── 1. Cheap bulk gather: the scheduler-initiated CHARGE orders in range ──
        const where = { orderKind: "SUBSCRIPTION_CHARGE", createdAt: { [Op.between]: [from.toDate(), to.toDate()] } };
        if (["ORDERED", "IN_PROGRESS", "FAILED", "COMPLETE"].includes(statusFilter)) where.status = statusFilter;
        const orders = await PG_Orders.findAll({ where, order: [["id", "DESC"]], raw: true });

        const pekoSubIds = [];
        const waSubIds = [];
        for (const o of orders) {
            const ref = String(o.referenceNo || "");
            const subId = safeParse(o.paymentData)?.subscriptionId;
            if (!subId) continue;
            if (ref.startsWith("wa_charge_")) waSubIds.push(subId);
            else if (ref.startsWith("charge_")) pekoSubIds.push(subId);
        }
        const [pekoSubs, waSubs] = await Promise.all([
            pekoSubIds.length ? Subscription.findAll({ where: { id: { [Op.in]: pekoSubIds } }, raw: true }) : [],
            waSubIds.length ? WhatsAppSubscription.findAll({ where: { id: { [Op.in]: waSubIds } }, raw: true }) : [],
        ]);
        const pekoSubById = new Map(pekoSubs.map(s => [s.id, s]));
        const waSubById = new Map(waSubs.map(s => [s.id, s]));

        // Bulk-load customer + plan names so search can match across ALL pages (cheap — no per-row calls,
        // no live mandate lookups). Heavy per-row enrichment still runs only on the visible page.
        const allSubs = [...pekoSubs, ...waSubs];
        const corpIds = [...new Set(allSubs.map(s => s.corporateUserId).filter(Boolean))];
        const pekoPackageIds = [...new Set(pekoSubs.map(s => s.packageId).filter(Boolean))];
        const [corps, pkgs] = await Promise.all([
            corpIds.length
                ? CorporateUser.findAll({ where: { id: { [Op.in]: corpIds } }, attributes: ["id", "name", "email", "companyName", "contactPersonName"], raw: true })
                : [],
            pekoPackageIds.length
                ? Package.findAll({ where: { id: { [Op.in]: pekoPackageIds } }, attributes: ["id", "packageName"], raw: true })
                : [],
        ]);
        const corpById = new Map(corps.map(c => [c.id, c]));
        const pkgNameById = new Map(pkgs.map(p => [p.id, p.packageName]));

        // ── 2. Build candidates with cheap structural verdicts ──
        const candidates = [];
        for (const o of orders) {
            const ref = String(o.referenceNo || "");
            const isWa = ref.startsWith("wa_charge_");
            if (!isWa && !ref.startsWith("charge_")) continue; // not a subscription renewal charge
            if (isWa && !includeWa) continue;
            if (!isWa && !includePeko) continue;
            const data = safeParse(o.paymentData) || {};
            const sub = isWa ? waSubById.get(data.subscriptionId) : pekoSubById.get(data.subscriptionId);
            const storedAmount = data.amount != null && !Number.isNaN(Number(data.amount)) ? Number(data.amount) : null;
            const triggeredBy = data.manualTriggerBy ? "MANUAL" : "SCHEDULER";
            if (["SCHEDULER", "MANUAL"].includes(triggerFilter) && triggeredBy !== triggerFilter) continue;
            const corp = sub ? corpById.get(sub.corporateUserId) : null;
            const planName = isWa ? (sub?.billingPlan ? `WhatsApp ${sub.billingPlan}` : "WhatsApp") : (sub ? pkgNameById.get(sub.packageId) : null);
            const vendorSubscriptionId = data.vendorSubscriptionId ?? o.vendorSubscriptionId ?? sub?.vendorSubscriptionId ?? null;
            const searchBlob = [
                o.referenceNo,
                data.subscriptionId,
                vendorSubscriptionId,
                corp?.name,
                corp?.companyName,
                corp?.contactPersonName,
                corp?.email,
                planName,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            candidates.push({
                product: isWa ? "WHATSAPP" : "PEKO",
                order: o,
                referenceNo: o.referenceNo,
                orderStatus: o.status,
                targetDate: data.targetDate ?? null,
                subscriptionId: data.subscriptionId ?? null,
                vendorSubscriptionId,
                triggeredBy,
                storedAmount,
                sub: sub || null,
                searchBlob,
                structuralReasons: structuralReasons({ sub, isMissing: !sub, order: o, storedAmount }),
            });
        }

        // ── 3. Search (across ALL pages, cheap) + structural filter + summary + sort ──
        let pool = candidates;
        if (searchText) pool = pool.filter(c => c.searchBlob.includes(searchText));
        let filtered = pool;
        if (["OK", "WARNING", "RISK"].includes(validationFilter)) {
            filtered = filtered.filter(c => verdict(c.structuralReasons) === validationFilter);
        }
        const summary = pool.reduce(
            (acc, c) => {
                const v = verdict(c.structuralReasons);
                acc.total += 1;
                if (v === "RISK") acc.atRisk += 1;
                else if (v === "WARNING") acc.warning += 1;
                else acc.ok += 1;
                return acc;
            },
            { total: 0, ok: 0, warning: 0, atRisk: 0 }
        );
        // Newest charge orders first (createdAt desc), matching the raw id-desc gather.
        filtered.sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime());

        // ── 4. Paginate, then heavy-enrich + live-mandate-check ONLY the visible page ──
        const count = filtered.length;
        const start = (page - 1) * itemsPerPage;
        const pageCandidates = filtered.slice(start, start + itemsPerPage);
        const rows = await Promise.all(pageCandidates.map(c => enrichRow(c, { checkMandate }, req?.LogTraceId)));

        return res.status(200).json({
            status: true,
            message: "Scheduler charge orders fetched successfully",
            data: { rows, count, page, itemsPerPage, summary },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "getSchedulerChargeOrders failed", error: error?.message, stack: error?.stack });
        return next(new ErrorResponse("Failed to fetch scheduler charge orders", 500));
    }
});
