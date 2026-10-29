const { Op } = require("sequelize");
const moment = require("moment");

const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");

const PG_Orders = require("../../models/entities/paymentGatewayOrders");
const Subscription = require("../../models/entities/subscription");
const WhatsAppSubscription = require("../../models/entities/whatsappSubscription");
const { findAllAddonSubscription, findAddonPrice } = require("../../models/use-cases/subscription");
const { findOnePackage } = require("../../models/use-cases/packages");
const { findOneCorporate } = require("../../models/use-cases/corporateUser");
// SAME functions the order-creation + webhook flow use — so the report predicts webhook outcomes
// with no divergent reimplementation. validatePrice returns false on any error (never throws).
const { validatePrice, calculatePlanAmount, resolvePlanMaxAmount } = require("../corporate/cashFreeGateway");
const { computeWhatsAppRenewalCharge } = require("../../utils/whatsappRenewalCharge");

// "All upcoming": a 366-day forward horizon covers every active sub's next renewal (monthly + annual).
const DEFAULT_WINDOW_DAYS = 366;
const DEFAULT_LOOKBACK_DAYS = 30; // how far back to list already-requested charge orders
const MAX_ITEMS_PER_PAGE = 50; // cap page size — pricing validation runs per visible row

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

// Structural failure signals that need NO pricing math — computed cheaply for EVERY candidate so the
// summary + sort work over the whole forecast without per-row DB pricing calls.
const structuralReasons = ({ sub, isMissing, orderStatus, knownAmount, isPreview }) => {
    const reasons = [];
    if (isMissing || !sub) {
        reasons.push({ code: "SUBSCRIPTION_MISSING", level: "RISK", detail: "References a subscription that no longer exists." });
        return reasons;
    }
    if (!sub.vendorSubscriptionId) {
        reasons.push({ code: "MANDATE_MISSING", level: "RISK", detail: "No Cashfree mandate (vendorSubscriptionId) — the charge cannot fire." });
    }
    if (sub.status && sub.status !== "ACTIVE") {
        reasons.push({ code: "INELIGIBLE", level: "RISK", detail: `Subscription status is ${sub.status} (not ACTIVE).` });
    }
    if (sub.isCancelled) {
        reasons.push({ code: "MANDATE_CANCELLED", level: "RISK", detail: "Subscription is cancelled." });
    }
    if (sub.isGracePeriod) {
        reasons.push({ code: "GRACE_PERIOD", level: "WARNING", detail: "Already in grace-period retry." });
    }
    if (sub.subscriptionEndDate && moment(sub.subscriptionEndDate).isBefore(moment().startOf("day"))) {
        if (isPreview) {
            // Preview = no charge order exists. A past end date means the scheduler (which only picks up
            // subs expiring in exactly 2 days) never created/fired a charge → silent lapse.
            reasons.push({ code: "MISSED_RENEWAL", level: "RISK", detail: "Past its renewal date with no charge order — the scheduler likely missed it, so the renewal won't auto-fire." });
        } else {
            reasons.push({ code: "EXPIRED", level: "WARNING", detail: "Subscription end date is already in the past." });
        }
    }
    if (orderStatus === "FAILED") {
        reasons.push({ code: "PRIOR_FAILURE", level: "RISK", detail: "This charge order is already marked FAILED." });
    }
    // Cap is billing-cycle based (annual ₹1L, monthly ₹14,999) — billingType is on the sub, so this
    // cheap pass can check it precisely.
    const planMaxAmount = resolvePlanMaxAmount(sub.billingType);
    if (knownAmount != null && knownAmount > planMaxAmount) {
        reasons.push({ code: "EXCEEDS_CAP", level: "RISK", detail: `Amount ₹${knownAmount} exceeds the ₹${planMaxAmount} per-charge mandate cap.` });
    }
    return reasons;
};

// Heavy per-row enrichment — runs ONLY for the visible page. Adds customer/plan/addon detail and,
// for Peko, the forecasted charge amount (calculatePlanAmount) validated by the webhook's validatePrice.
const enrichRow = async (cand, traceId) => {
    const { sub, product, rowType, order, referenceNo, orderStatus, targetDate, subscriptionId } = cand;
    const reasons = [...cand.structuralReasons];

    let customerName = null;
    let customerEmail = null;
    let planName = null;
    let billingType = sub?.billingType ?? null;
    let amount = order ? Number(safeParse(order.paymentData)?.amount ?? NaN) : null;
    if (Number.isNaN(amount)) amount = null;
    let webhookPriceValid = null;
    const addons = [];

    if (!sub) {
        return {
            rowType, product, orderId: order?.id ?? null, referenceNo, orderStatus, targetDate, subscriptionId,
            customerName, customerEmail, planName, billingType, subscriptionEndDate: null,
            amount, webhookPriceValid, vendorSubscriptionId: sub?.vendorSubscriptionId ?? null, addons, validationResult: verdict(reasons), reasons,
        };
    }

    // Customer (corporateUser + credential).
    try {
        if (sub.corporateUserId) {
            const corp = await findOneCorporate({ id: sub.corporateUserId }, ["id", "name", "email"], ["username", "email", "name", "registeredBy"]);
            customerName = corp?.name ?? corp?.credential?.name ?? null;
            customerEmail = corp?.email ?? corp?.credential?.email ?? null;
            cand.partnerId = corp?.credential?.registeredBy ?? null;
        }
    } catch (e) {
        customLog(traceId, "error", { message: "renewalCharges: customer lookup failed", subscriptionId, error: e?.message });
    }

    // No email → the renewal confirmation + receipt can't be delivered (charge can still succeed).
    if (!customerEmail) {
        reasons.push({ code: "NO_EMAIL", level: "WARNING", detail: "No customer email on file — the renewal confirmation + receipt email will not be delivered." });
    }
    // Multiple active base subscriptions for one customer → ambiguous / double-charge risk.
    try {
        const Model = product === "WHATSAPP" ? WhatsAppSubscription : Subscription;
        const activeBaseCount = await Model.count({ where: { corporateUserId: sub.corporateUserId, status: "ACTIVE", isCustom: false } });
        if (activeBaseCount > 1) {
            reasons.push({ code: "DUPLICATE_ACTIVE", level: "WARNING", detail: `${activeBaseCount} active base subscriptions for this customer — renewals may double-charge or pick the wrong row.` });
        }
    } catch (e) {
        customLog(traceId, "error", { message: "renewalCharges: duplicate-active count failed", subscriptionId, error: e?.message });
    }

    if (product === "WHATSAPP") {
        // WhatsApp renewal = current plan - discount + platform fee + current add-on prices (what
        // whatsAppTriggerSubscriptionCharges charges). The WhatsApp flow has no
        // price-validator, so webhookPriceValid stays null (N/A).
        planName = sub.billingPlan ? `WhatsApp ${sub.billingPlan}` : "WhatsApp";
        try {
            const addOnLabelMap = { BOT_BUILDER: "Bot Builder", SHOPIFY_INTEGRATION: "Shopify Integration" };
            // Same pricing as the scheduler: current plan - discount + platform fee + current add-on prices
            const charge = await computeWhatsAppRenewalCharge({
                packageId: sub.packageId,
                billingType: sub.billingType,
                corporateUserId: sub.corporateUserId,
                credentialId: sub.credentialId,
            });
            if (rowType === "PREVIEW" && charge) amount = charge.amount;
            (charge?.addOns || []).forEach((addOn) => addons.push({ packageName: addOnLabelMap[addOn.addOnType] || "Bot Builder", maxLimit: null }));
        } catch (e) {
            customLog(traceId, "error", { message: "renewalCharges: WA addon lookup failed", subscriptionId, error: e?.message });
        }
        // Cap can only be evaluated once the forecast amount is known (preview).
        const waPlanMaxAmount = resolvePlanMaxAmount(sub.billingType);
        if (amount != null && amount > waPlanMaxAmount && !reasons.some(r => r.code === "EXCEEDS_CAP")) {
            reasons.push({ code: "EXCEEDS_CAP", level: "RISK", detail: `Amount ₹${amount} exceeds the ₹${waPlanMaxAmount} per-charge mandate cap.` });
        }
        return {
            rowType, product, orderId: order?.id ?? null, referenceNo, orderStatus, targetDate, subscriptionId,
            customerName, customerEmail, planName, billingType, subscriptionEndDate: sub.subscriptionEndDate,
            amount, webhookPriceValid, vendorSubscriptionId: sub?.vendorSubscriptionId ?? null, addons, validationResult: verdict(reasons), reasons,
        };
    }

    // ── Peko ──
    let pkg = null;
    try {
        pkg = await findOnePackage(sub.packageId);
        planName = pkg?.packageName ?? null;
    } catch (e) {
        customLog(traceId, "error", { message: "renewalCharges: package lookup failed", subscriptionId, error: e?.message });
    }

    // Plan price not configured for this billing cycle → charge resolves to 0/NaN and fails.
    const priceKey = String(sub.billingType || "").toLowerCase();
    const prices = pkg ? (typeof pkg.packagePrices === "string" ? safeParse(pkg.packagePrices) : pkg.packagePrices) : null;
    if (pkg && !(Number(prices?.[priceKey]) > 0)) {
        reasons.push({ code: "PRICE_NOT_CONFIGURED", level: "RISK", detail: `No ${priceKey || "billing"} price configured on plan "${pkg.packageName}".` });
    }

    try {
        const list = (await findAllAddonSubscription(sub.corporateUserId)) || [];
        const groupPackageId = pkg?.packageType === "GROUP" ? sub.packageId : null;
        for (const a of list) {
            addons.push({ packageName: a.package?.packageName ?? "Add-on", maxLimit: a.maxLimit ?? null });
            // calculateSubscriptionPrice throws for ANY active add-on lacking a cashback row → renewal fails.
            const addonData = await findAddonPrice({ packageId: a.packageId, serviceOperatorId: a.serviceOperatorId, groupPackageId });
            if (!addonData || !addonData.serviceOperator) {
                reasons.push({ code: "CASHBACK_MISSING", level: "RISK", detail: `Add-on "${a.package?.packageName ?? a.packageId}" has no cashback/pricing configured — the renewal price calculation will fail.` });
            }
        }
    } catch (e) {
        customLog(traceId, "error", { message: "renewalCharges: addon list failed", subscriptionId, error: e?.message });
    }

    // Forecast the charge amount with the SAME fn order-creation uses (plan + recurring addons).
    if (amount == null) {
        try {
            const r = await calculatePlanAmount(pkg, sub.billingType, false, null, null, sub.corporateUserId);
            amount = Number(r?.periodicPrice);
            if (Number.isNaN(amount)) amount = null;
        } catch (e) {
            reasons.push({ code: "FORECAST_ERROR", level: "RISK", detail: `Could not compute the renewal amount: ${e?.message ?? e}` });
        }
    }

    // Validate that amount with the EXACT webhook validator → predicts the "Invalid subscription amount" failure.
    if (pkg && amount != null) {
        webhookPriceValid = await validatePrice(sub.billingType, amount, pkg, "", sub.packageId, sub.corporateUserId, false, cand.partnerId ?? null, traceId);
        if (webhookPriceValid === false) {
            reasons.push({
                code: "WEBHOOK_PRICE_INVALID",
                level: "RISK",
                detail: `The webhook's price validator (validatePrice) would reject ₹${amount} — predicted "Invalid subscription amount".`,
            });
        }
    }
    // Annual plans carry the ₹1L mandate cap; monthly ₹14,999.
    const pekoPlanMaxAmount = resolvePlanMaxAmount(sub.billingType);
    if (amount != null && amount > pekoPlanMaxAmount && !reasons.some(r => r.code === "EXCEEDS_CAP")) {
        reasons.push({ code: "EXCEEDS_CAP", level: "RISK", detail: `Amount ₹${amount} exceeds the ₹${pekoPlanMaxAmount} per-charge mandate cap.` });
    }

    return {
        rowType, product, orderId: order?.id ?? null, referenceNo, orderStatus, targetDate, subscriptionId,
        customerName, customerEmail, planName, billingType, subscriptionEndDate: sub.subscriptionEndDate,
        amount, webhookPriceValid, vendorSubscriptionId: sub?.vendorSubscriptionId ?? null, addons, validationResult: verdict(reasons), reasons,
    };
};

exports.getRenewalCharges = asyncHandler(async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const itemsPerPage = Math.min(Math.max(parseInt(req.query.itemsPerPage, 10) || 10, 1), MAX_ITEMS_PER_PAGE);
        const rowType = (req.query.rowType || "ALL").toUpperCase();
        const product = (req.query.product || "ALL").toUpperCase();
        const validationFilter = (req.query.validationStatus || "").toUpperCase();
        const searchText = (req.query.searchText || "").trim().toLowerCase();
        const windowDays = Math.min(Math.max(parseInt(req.query.windowDays, 10) || DEFAULT_WINDOW_DAYS, 1), 366);

        const from = req.query.from ? moment(req.query.from).startOf("day") : moment().subtract(DEFAULT_LOOKBACK_DAYS, "days").startOf("day");
        const to = req.query.to ? moment(req.query.to).endOf("day") : moment().add(windowDays, "days").endOf("day");
        // Look slightly into the past too, so we surface renewals the scheduler should have charged
        // but didn't (no order) — i.e. MISSED_RENEWAL silent lapses — alongside upcoming ones.
        const missedFrom = moment().subtract(14, "days").startOf("day").toDate();

        const includePeko = product === "ALL" || product === "PEKO";
        const includeWa = product === "ALL" || product === "WHATSAPP";
        const wantRequested = rowType === "ALL" || rowType === "REQUESTED";
        const wantPreview = rowType === "ALL" || rowType === "PREVIEW";

        // ── 1. Cheap bulk gather of all candidates (a handful of queries, no per-row pricing) ──
        const orders = wantRequested
            ? await PG_Orders.findAll({
                  where: { orderKind: "SUBSCRIPTION_CHARGE", createdAt: { [Op.between]: [from.toDate(), to.toDate()] } },
                  order: [["id", "DESC"]],
                  raw: true,
              })
            : [];
        const existingRefs = new Set(orders.map(o => o.referenceNo));

        const pekoOrderSubIds = [];
        const waOrderSubIds = [];
        for (const o of orders) {
            const ref = String(o.referenceNo || "");
            const subId = safeParse(o.paymentData)?.subscriptionId;
            if (!subId) continue;
            if (ref.startsWith("wa_charge_")) waOrderSubIds.push(subId);
            else if (ref.startsWith("charge_")) pekoOrderSubIds.push(subId);
        }

        const [pekoOrderSubs, waOrderSubs] = await Promise.all([
            pekoOrderSubIds.length ? Subscription.findAll({ where: { id: { [Op.in]: pekoOrderSubIds } }, raw: true }) : [],
            waOrderSubIds.length ? WhatsAppSubscription.findAll({ where: { id: { [Op.in]: waOrderSubIds } }, raw: true }) : [],
        ]);
        const pekoSubById = new Map(pekoOrderSubs.map(s => [s.id, s]));
        const waSubById = new Map(waOrderSubs.map(s => [s.id, s]));

        const [duePeko, dueWa] = await Promise.all([
            wantPreview && includePeko
                ? Subscription.findAll({
                      where: {
                          status: "ACTIVE", isCustom: false, isCancelled: false, isGracePeriod: false,
                          vendorSubscriptionId: { [Op.ne]: null },
                          subscriptionEndDate: { [Op.between]: [missedFrom, to.toDate()] },
                      },
                      raw: true,
                  })
                : [],
            wantPreview && includeWa
                ? WhatsAppSubscription.findAll({
                      where: {
                          status: "ACTIVE", isCustom: false,
                          vendorSubscriptionId: { [Op.ne]: null },
                          subscriptionEndDate: { [Op.between]: [missedFrom, to.toDate()] },
                      },
                      raw: true,
                  })
                : [],
        ]);

        // ── 2. Build candidate list with cheap structural verdicts ──
        const candidates = [];
        for (const o of orders) {
            const ref = String(o.referenceNo || "");
            const isWa = ref.startsWith("wa_charge_");
            if (isWa && !includeWa) continue;
            if (!isWa && !ref.startsWith("charge_")) continue;
            if (!isWa && !includePeko) continue;
            const data = safeParse(o.paymentData) || {};
            const sub = isWa ? waSubById.get(data.subscriptionId) : pekoSubById.get(data.subscriptionId);
            const knownAmount = data.amount != null ? Number(data.amount) : null;
            candidates.push({
                product: isWa ? "WHATSAPP" : "PEKO",
                rowType: "REQUESTED",
                order: o,
                referenceNo: o.referenceNo,
                orderStatus: o.status,
                targetDate: data.targetDate ?? null,
                subscriptionId: data.subscriptionId ?? null,
                sub: sub || null,
                structuralReasons: structuralReasons({ sub, isMissing: !sub, orderStatus: o.status, knownAmount }),
            });
        }
        const addPreview = (sub, isWa) => {
            const targetDate = moment(sub.subscriptionEndDate).format("YYYY-MM-DD");
            const referenceNo = `${isWa ? "wa_charge_" : "charge_"}${sub.id}_${targetDate}`;
            if (existingRefs.has(referenceNo)) return; // already a REQUESTED row
            candidates.push({
                product: isWa ? "WHATSAPP" : "PEKO",
                rowType: "PREVIEW",
                order: null,
                referenceNo,
                orderStatus: null,
                targetDate,
                subscriptionId: sub.id,
                sub,
                structuralReasons: structuralReasons({ sub, orderStatus: null, knownAmount: null, isPreview: true }),
            });
        };
        for (const s of duePeko) addPreview(s, false);
        for (const s of dueWa) addPreview(s, true);

        // ── 3. Structural filter + summary + sort (all cheap) ──
        let filtered = candidates;
        if (["OK", "WARNING", "RISK"].includes(validationFilter)) {
            filtered = filtered.filter(c => verdict(c.structuralReasons) === validationFilter);
        }
        const summary = candidates.reduce(
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
        filtered.sort((a, b) => (a.targetDate || "").localeCompare(b.targetDate || ""));

        // ── 4. Paginate, then heavy-validate ONLY the visible page (pricing per row) ──
        const count = filtered.length;
        const start = (page - 1) * itemsPerPage;
        const pageCandidates = filtered.slice(start, start + itemsPerPage);
        let rows = await Promise.all(pageCandidates.map(c => enrichRow(c, req?.LogTraceId)));

        // Search applies to enriched (customer/plan) fields — filter the page after enrichment.
        if (searchText) {
            rows = rows.filter(
                r =>
                    (r.customerName || "").toLowerCase().includes(searchText) ||
                    (r.customerEmail || "").toLowerCase().includes(searchText) ||
                    (r.planName || "").toLowerCase().includes(searchText)
            );
        }

        return res.status(200).json({
            status: true,
            message: "Renewal charges fetched successfully",
            data: { rows, count, page, itemsPerPage, summary },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "getRenewalCharges failed", error: error?.message, stack: error?.stack });
        return next(new ErrorResponse("Failed to fetch renewal charges", 500));
    }
});
