const axios = require("axios");
const moment = require("moment");

const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { findServiceOperatorByAccessKey } = require("../../utils/checkAndFetchServiceDetails");
const operatorsData = require("../../utils/operatorsData.json");
const emailer = require("../../utils/emailer");

const PG_Orders = require("../../models/entities/paymentGatewayOrders");
const Subscription = require("../../models/entities/subscription");
const WhatsAppSubscription = require("../../models/entities/whatsappSubscription");
const { findOnePackage } = require("../../models/use-cases/packages");
const { findOneCorporate } = require("../../models/use-cases/corporateUser");
const { createNotification } = require("../../models/use-cases/notification");
// SAME pricing/validation fns the order + webhook flow use — no divergent reimplementation.
const { validatePrice, calculatePlanAmount, resolvePlanMaxAmount } = require("../corporate/cashFreeGateway");
const { computeWhatsAppRenewalCharge } = require("../../utils/whatsappRenewalCharge");

const ORDER_KIND = "SUBSCRIPTION_CHARGE";
const SUBSCRIPTIONS_ACCESS_KEY = operatorsData["cashFreeSubscriptions"]["accessKey"];
const WHATSAPP_ACCESS_KEY = operatorsData["whatsAppForBusiness"]["accessKey"];

const safeParse = json => {
    try {
        return typeof json === "string" ? JSON.parse(json) : json;
    } catch {
        return null;
    }
};

// Connection (baseUrl + version) always from the subscriptions merchant; for WhatsApp swap ONLY the
// clientId/secret to its own merchant — identical to createSubscriptionOrder / the scheduler.
const getCashfreeCreds = async product => {
    const base = await findServiceOperatorByAccessKey(SUBSCRIPTIONS_ACCESS_KEY);
    if (!base?.vendor) return null;
    const baseUrl = base.vendor.apiUrl;
    const version = base.vendor.optional3;
    let clientId = base.vendor.optional1;
    let clientSecret = base.vendor.optional2;
    if (product === "WHATSAPP") {
        const wa = await findServiceOperatorByAccessKey(WHATSAPP_ACCESS_KEY);
        clientId = wa?.paymentclientid;
        clientSecret = wa?.paymentclientsecret;
    }
    if (!baseUrl || !version || !clientId || !clientSecret) return null;
    return { baseUrl, version, clientId, clientSecret };
};

const cfHeaders = creds => ({
    "x-api-version": creds.version,
    "x-client-id": creds.clientId,
    "x-client-secret": creds.clientSecret,
    "Content-Type": "application/json",
});

// Cashfree PG simulate endpoint — apiUrl typically already ends in /pg. Mirrors cashFreeGateway.js +
// scheduler/services/simulateSubscriptionCharges.js (cannot cross-import across microservices).
const buildSimulateUrl = baseUrl => {
    const base = String(baseUrl || "").replace(/\/$/, "");
    return base.endsWith("/pg") ? `${base}/simulate` : `${base}/pg/simulate`;
};

const resolveSub = async (product, subscriptionId) => {
    if (!subscriptionId) return null;
    if (product === "WHATSAPP") return WhatsAppSubscription.findOne({ where: { id: subscriptionId }, raw: true });
    const inst = await Subscription.findOne({ where: { id: subscriptionId } });
    return inst?.get ? inst.get({ plain: true }) : inst;
};

// WhatsApp renewal charge priced fresh (current plan - discount + platform fee + current add-on
// prices) with its breakdown — exactly what whatsAppTriggerSubscriptionCharges charges. Null on failure.
const computeWhatsAppCharge = async (sub, traceId) => {
    try {
        return await computeWhatsAppRenewalCharge({
            packageId: sub.packageId,
            billingType: sub.billingType,
            corporateUserId: sub.corporateUserId,
            credentialId: sub.credentialId,
        });
    } catch (e) {
        customLog(traceId, "error", { message: "renewalChargeActions: computeWhatsAppCharge failed", error: e?.message });
        return null;
    }
};

// Canonical renewal amount — Peko via calculatePlanAmount (plan + recurring addons), WhatsApp via
// computeWhatsAppRenewalCharge (what whatsAppTriggerSubscriptionCharges charges).
const computeCanonical = async (product, sub, traceId) => {
    try {
        if (product === "WHATSAPP") {
            const charge = await computeWhatsAppCharge(sub, traceId);
            return charge?.amount ?? null;
        }
        const pkg = await findOnePackage(sub.packageId);
        if (!pkg) return null;
        const r = await calculatePlanAmount(pkg, sub.billingType, false, null, null, sub.corporateUserId);
        const amt = Number(r?.periodicPrice);
        return Number.isNaN(amt) ? null : amt;
    } catch (e) {
        customLog(traceId, "error", { message: "renewalChargeActions: computeCanonical failed", error: e?.message });
        return null;
    }
};

// Live Cashfree mandate/subscription status for ONE vendorSubscriptionId. Best-effort: returns a soft
// { subscriptionStatus: null, error } on any failure (missing creds / gateway hiccup) — never throws — so
// callers (the on-demand endpoint AND the scheduler-charge-orders report) can fan this out per row safely.
const fetchMandateStatus = async (product, vendorSubscriptionId, traceId) => {
    if (!vendorSubscriptionId) return { subscriptionStatus: null, error: "vendorSubscriptionId is required" };
    const creds = await getCashfreeCreds(product);
    if (!creds) return { subscriptionStatus: null, error: "Cashfree credentials not available" };
    try {
        const resp = await axios({
            method: "GET",
            url: `${creds.baseUrl}/pg/subscriptions/${vendorSubscriptionId}`,
            headers: cfHeaders(creds),
            timeout: 15000,
        });
        const d = resp?.data || {};
        const subscriptionStatus = d.subscription_status ?? d?.subscription_details?.subscription_status ?? null;
        return { subscriptionStatus, raw: d };
    } catch (err) {
        customLog(traceId, "error", { message: "fetchMandateStatus failed", vendorSubscriptionId, error: err?.response?.data ?? err?.message }, "VENDOR");
        return { subscriptionStatus: null, error: err?.response?.data?.message ?? err?.message ?? "Lookup failed" };
    }
};

// ── Live mandate health (on-demand) ────────────────────────────────────────────
// Best-effort: queries Cashfree for the real mandate status so the admin can confirm whether a charge
// would actually go through. Never 500s — a gateway hiccup returns a soft "unknown".
exports.getMandateStatus = asyncHandler(async (req, res) => {
    const { vendorSubscriptionId } = req.query;
    const product = (req.query.product || "PEKO").toUpperCase();
    if (!vendorSubscriptionId) {
        return res.status(200).json({ status: false, message: "vendorSubscriptionId is required", data: {}, responseCode: "001" });
    }
    const result = await fetchMandateStatus(product, vendorSubscriptionId, req?.LogTraceId);
    return res.status(200).json({ status: true, data: result, responseCode: "000" });
});

// ── Fix a drifted stored amount ─────────────────────────────────────────────────
// Recompute the canonical amount and write it onto the SUBSCRIPTION_CHARGE order so the webhook won't
// reject it. Refuses if the charge is already in progress/complete.
exports.fixAmount = asyncHandler(async (req, res, next) => {
    const { referenceNo } = req.body;
    if (!referenceNo) return next(new ErrorResponse("referenceNo is required", 400));
    const order = await PG_Orders.findOne({ where: { referenceNo, orderKind: ORDER_KIND }, order: [["id", "DESC"]] });
    if (!order) return next(new ErrorResponse("Charge order not found", 404));
    if (["COMPLETE", "IN_PROGRESS"].includes(order.status)) {
        return next(new ErrorResponse(`Order is ${order.status} — the amount of a charge already in progress/complete cannot be edited.`, 400));
    }
    const data = safeParse(order.paymentData) || {};
    const product = String(referenceNo).startsWith("wa_charge_") ? "WHATSAPP" : "PEKO";
    const sub = await resolveSub(product, data.subscriptionId);
    if (!sub) return next(new ErrorResponse("Subscription not found", 404));
    // WhatsApp: refresh the breakdown too — the CHARGE webhook splits the renewed rows with it
    const waCharge = product === "WHATSAPP" ? await computeWhatsAppCharge(sub, req?.LogTraceId) : null;
    const canonical = product === "WHATSAPP" ? (waCharge?.amount ?? null) : await computeCanonical(product, sub, req?.LogTraceId);
    if (canonical == null) return next(new ErrorResponse("Could not compute the canonical amount", 422));
    Object.assign(data, waCharge || {});
    data.amount = canonical;
    order.paymentData = JSON.stringify(data);
    await order.save();
    customLog(req?.LogTraceId, "info", { message: "renewalChargeActions: stored amount corrected", referenceNo, canonical, by: req.user?.id });
    return res.status(200).json({ status: true, message: `Stored amount updated to ₹${canonical}.`, data: { amount: canonical }, responseCode: "000" });
});

// ── Trigger / retry a renewal charge now (MONEY ACTION) ─────────────────────────
// Idempotent + guarded: refuses without a mandate, when not ACTIVE, over the cap, when the price
// fails validation, or when a charge is already in progress/complete. Mirrors the scheduler's pay call.
exports.chargeNow = asyncHandler(async (req, res, next) => {
    const { subscriptionId } = req.body;
    const product = (req.body.product || "PEKO").toUpperCase();
    if (!subscriptionId) return next(new ErrorResponse("subscriptionId is required", 400));

    const sub = await resolveSub(product, subscriptionId);
    if (!sub) return next(new ErrorResponse("Subscription not found", 404));
    if (!sub.vendorSubscriptionId) return next(new ErrorResponse("No Cashfree mandate (vendorSubscriptionId) — cannot charge.", 400));
    if (sub.status !== "ACTIVE" || sub.isCancelled) return next(new ErrorResponse("Subscription is not active — cannot charge.", 400));

    const waCharge = product === "WHATSAPP" ? await computeWhatsAppCharge(sub, req?.LogTraceId) : null;
    const amount = product === "WHATSAPP" ? waCharge?.amount : await computeCanonical(product, sub, req?.LogTraceId);
    if (!(amount > 0)) return next(new ErrorResponse("Could not compute a valid charge amount.", 422));

    // Per-charge cap is billing-cycle aware: annual plans get the ₹1L mandate buffer, monthly ₹14,999.
    const pkg = product === "PEKO" ? await findOnePackage(sub.packageId) : null;
    const planMaxAmount = resolvePlanMaxAmount(sub.billingType);
    if (amount > planMaxAmount) {
        return next(new ErrorResponse(`Amount ₹${amount} exceeds the ₹${planMaxAmount} per-charge mandate cap — cannot charge via mandate.`, 400));
    }
    if (product === "PEKO") {
        const ok = await validatePrice(sub.billingType, amount, pkg, "", sub.packageId, sub.corporateUserId, false, null, req?.LogTraceId);
        if (!ok) return next(new ErrorResponse("Amount fails the price validator — fix the amount/pricing before charging.", 400));
    }

    const targetDate = moment(sub.subscriptionEndDate).format("YYYY-MM-DD");
    const referenceNo = `${product === "WHATSAPP" ? "wa_charge_" : "charge_"}${sub.id}_${targetDate}`;

    const existing = await PG_Orders.findOne({ where: { referenceNo, orderKind: ORDER_KIND }, order: [["id", "DESC"]] });
    if (existing && ["IN_PROGRESS", "COMPLETE"].includes(existing.status)) {
        return next(new ErrorResponse(`A charge for this renewal is already ${existing.status}.`, 409));
    }

    const creds = await getCashfreeCreds(product);
    if (!creds) return next(new ErrorResponse("Cashfree credentials not available", 500));

    const paymentData = JSON.stringify({
        kind: product === "WHATSAPP" ? "WA_SUBSCRIPTION_CHARGE" : "SUBSCRIPTION_CHARGE",
        subscriptionId: sub.id,
        targetDate,
        ...(waCharge || {}), // WhatsApp breakdown, read back by the CHARGE webhook
        amount,
        vendorSubscriptionId: sub.vendorSubscriptionId,
        manualTriggerBy: req.user?.id ?? null,
    });

    let order = existing;
    if (order) {
        order.status = "ORDERED";
        order.paymentData = paymentData;
        await order.save();
    } else {
        order = await PG_Orders.create({
            paymentRefId: `${Date.now()}`,
            referenceNo,
            vendorSubscriptionId: sub.vendorSubscriptionId,
            paymentData,
            status: "ORDERED",
            orderKind: ORDER_KIND,
        });
    }

    try {
        const cf = await axios({
            method: "POST",
            url: `${creds.baseUrl}/pg/subscriptions/pay`,
            headers: cfHeaders(creds),
            data: {
                subscription_id: sub.vendorSubscriptionId,
                payment_id: referenceNo,
                payment_amount: amount,
                payment_schedule_date: moment().add(1, "days").startOf("day").utcOffset("+05:30").format(),
                payment_type: "CHARGE",
                payment_remarks: `Manual_renewal_${sub.id}`.replace(/[^a-zA-Z0-9._-]/g, "_"),
            },
            timeout: 30000,
        });
        order.status = "IN_PROGRESS";
        order.paymentResponse = JSON.stringify(cf.data);
        await order.save();
        customLog(req?.LogTraceId, "info", { message: "renewalChargeActions: manual charge initiated", referenceNo, amount, by: req.user?.id }, "VENDOR");
        return res.status(200).json({ status: true, message: `Charge of ₹${amount} initiated. The outcome will arrive via the renewal webhook.`, data: { referenceNo, amount }, responseCode: "000" });
    } catch (err) {
        const errData = err?.response?.data ?? err?.message;
        order.status = "FAILED";
        order.paymentResponse = JSON.stringify(errData);
        await order.save();
        customLog(req?.LogTraceId, "error", { message: "renewalChargeActions: chargeNow Cashfree pay failed", referenceNo, error: errData }, "VENDOR");
        return next(new ErrorResponse("The gateway rejected the charge. It has been logged for review.", 502));
    }
});

// ── Ask the customer to re-authorize their mandate (notification + email) ───────
exports.recollectMandate = asyncHandler(async (req, res, next) => {
    const { subscriptionId } = req.body;
    const product = (req.body.product || "PEKO").toUpperCase();
    const sub = await resolveSub(product, subscriptionId);
    if (!sub) return next(new ErrorResponse("Subscription not found", 404));

    const corp = await findOneCorporate({ id: sub.corporateUserId }, ["id", "name", "email"], ["username", "email"]);
    const username = corp?.credential?.username;
    const email = corp?.email ?? corp?.credential?.email;
    if (!username && !email) return next(new ErrorResponse("No contact details on file for this customer.", 400));

    if (username) {
        try {
            await createNotification({
                notificationTitle: "Action needed: re-enable auto-pay",
                notificationBrief: "Your subscription's auto-pay needs to be re-authorized to avoid an interruption. Please re-set up auto-pay from your subscription settings.",
                notificationTo: [username],
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
            });
        } catch (e) {
            customLog(req?.LogTraceId, "error", { message: "recollectMandate: notification failed", error: e?.message });
        }
    }
    if (email) {
        emailer.email(
            email,
            "Re-enable your subscription auto-pay",
            `<p>Hi ${corp?.name ?? "there"},</p><p>To keep your subscription active, please re-authorize auto-pay from your subscription settings. If auto-pay isn't re-enabled, your next renewal may not go through.</p><p>Thank you,<br/>Team Peko</p>`,
            () => {}
        );
    }
    customLog(req?.LogTraceId, "info", { message: "renewalChargeActions: re-collect mandate requested", subscriptionId, by: req.user?.id });
    return res.status(200).json({ status: true, message: "Re-authorization request sent to the customer.", data: {}, responseCode: "000" });
});

// ── Simulate a Cashfree CHARGE webhook for one order (STAGING-ONLY test action) ──
// Lets an admin drive the full renewal end-to-end from the panel: "Charge now" dispatches the mandate
// charge (order → IN_PROGRESS), then this delivers the SUCCESS/FAILED webhook so the renewal rows get
// written without waiting on Cashfree/the scheduler. Hard-gated to NODE_ENV === "staging".
exports.simulateCharge = asyncHandler(async (req, res, next) => {
    if (process.env.NODE_ENV !== "staging") {
        return next(new ErrorResponse("Simulate is only available in staging.", 403));
    }
    const { referenceNo } = req.body;
    const status = req.body?.status === "FAILED" ? "FAILED" : "SUCCESS";
    if (!referenceNo) return next(new ErrorResponse("referenceNo is required", 400));

    // The charge must have been dispatched to Cashfree first — there's nothing to simulate on an
    // ORDERED row (use "Charge now" to dispatch it, then simulate). Missing rows can't be simulated.
    const order = await PG_Orders.findOne({ where: { referenceNo, orderKind: ORDER_KIND }, order: [["id", "DESC"]] });
    if (!order) return next(new ErrorResponse("Charge order not found.", 404));
    if (order.status === "ORDERED") {
        return next(new ErrorResponse("This charge hasn't been dispatched to Cashfree yet — use 'Charge now' first, then simulate.", 400));
    }

    const product = String(referenceNo).startsWith("wa_charge_") ? "WHATSAPP" : "PEKO";
    const creds = await getCashfreeCreds(product);
    if (!creds) return next(new ErrorResponse("Cashfree credentials not available", 500));

    try {
        const resp = await axios({
            method: "POST",
            url: buildSimulateUrl(creds.baseUrl),
            headers: cfHeaders(creds),
            data: { entity: "SUBS_PAYMENTS", entity_id: referenceNo, entity_simulation: { payment_status: status } },
            timeout: 30000,
        });
        customLog(req?.LogTraceId, "info", { message: "renewalChargeActions: simulate dispatched", referenceNo, status, by: req.user?.id }, "VENDOR");
        return res.status(200).json({
            status: true,
            message: `Simulated ${status} webhook dispatched for ${referenceNo}. The renewal webhook will process shortly — refresh to see the result.`,
            data: resp.data,
            responseCode: "000",
        });
    } catch (err) {
        const errData = err?.response?.data ?? err?.message;
        customLog(req?.LogTraceId, "error", { message: "renewalChargeActions: simulate failed", referenceNo, error: errData }, "VENDOR");
        // Staging-only internal test action — surface the gateway detail so the tester can act on it.
        return res.status(200).json({ status: false, message: "Cashfree rejected the simulate request.", data: { error: errData }, responseCode: "001" });
    }
});

// Shared helpers reused by the scheduler-charge-orders report (single source for Cashfree creds + the
// live mandate lookup — keeps every admin renewal view on the same merchant resolution as the scheduler).
exports.getCashfreeCreds = getCashfreeCreds;
exports.cfHeaders = cfHeaders;
exports.fetchMandateStatus = fetchMandateStatus;
