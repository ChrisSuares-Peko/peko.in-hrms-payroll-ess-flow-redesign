// Internally-tracked BillAvenue vendor wallet balance.
// BillAvenue exposes no balance API, so the balance is maintained in the `settings` table under
// `billAvenueWalletBalance` (admin seeds/tops it up), checked before each BBPS payment, and decremented
// on confirmed success. The settings table is shared across services, so payment / paymentGateway /
// scheduler all read & write the same row.

const setting = require("../models/entities/setting");
const emailer = require("./emailer");
const { customLog } = require("./loggerHelper");

const SETTING_KEY = "billAvenueWalletBalance";
// Recipient emails for alerts are the ones already configured under this settings key.
const EMAIL_SETTING_KEY = "pekoWebsite";

// Read the stored wallet config. `configured` is false when no balance has ever been set.
const getBillAvenueWallet = async () => {
    const row = await setting.findOne({ where: { name: SETTING_KEY } });
    const details = row && row.details ? row.details : null;
    const hasBalance = details && details.balance !== undefined && details.balance !== null;
    return {
        configured: !!hasBalance,
        balance: hasBalance ? Number(details.balance) : null,
        threshold: Number(details && details.threshold) || 0,
        currency: (details && details.currency) || "INR",
        updatedAt: (details && details.updatedAt) || null,
        updatedBy: (details && details.updatedBy) || null,
    };
};

// Pre-transaction guard. Returns { sufficient, balance, configured, threshold }.
// If no balance is configured yet we DO NOT block (a balance that was never entered cannot be
// enforced) — we log it so admins know to set it. Once a balance exists, sufficient = balance >= amount.
// Any failure fails OPEN (never break a live payment because the balance check errored).
const checkBillAvenueBalance = async (amount, traceId) => {
    try {
        const w = await getBillAvenueWallet();
        if (!w.configured) {
            customLog(traceId, "info", {
                message: "BillAvenue wallet balance not configured — skipping pre-transaction block. Set it from Admin > Bill Payments.",
            });
            return { sufficient: true, balance: null, configured: false, threshold: 0 };
        }
        return { sufficient: w.balance >= Number(amount), balance: w.balance, configured: true, threshold: w.threshold };
    } catch (error) {
        customLog(traceId, "error", { message: "checkBillAvenueBalance failed — allowing transaction", error: error && error.message });
        return { sufficient: true, balance: null, configured: false, threshold: 0 };
    }
};

// Decrement on CONFIRMED success only. Row-locked read-modify-write so concurrent BBPS payments can't
// lose updates. No-op when no balance is configured. Never throws (a tracking failure must not break the
// payment, which already succeeded at the vendor).
const decrementBillAvenueBalance = async (amount, meta = {}, traceId) => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    try {
        await setting.sequelize.transaction(async (t) => {
            const row = await setting.findOne({ where: { name: SETTING_KEY }, transaction: t, lock: t.LOCK.UPDATE });
            const details = row && row.details ? row.details : null;
            if (!details || details.balance === undefined || details.balance === null) {
                customLog(traceId, "info", { message: "BillAvenue balance not configured — skipping decrement", ...meta });
                return;
            }
            const previousBalance = Number(details.balance);
            const newBalance = Number((previousBalance - amt).toFixed(2));
            await row.update(
                { details: { ...details, balance: newBalance, updatedAt: new Date().toISOString() } },
                { transaction: t }
            );
            customLog(traceId, "info", { message: "BillAvenue wallet balance debited", amount: amt, previousBalance, newBalance, ...meta }, "VENDOR");
        });
    } catch (error) {
        customLog(traceId, "error", { message: "decrementBillAvenueBalance failed", error: error && error.message, amount: amt, ...meta });
    }
};

// Low-balance / blocked-transaction alert to the configured pekoWebsite recipients. Best-effort.
const notifyBillAvenueLowBalance = async (info = {}, meta = {}, traceId) => {
    try {
        const emailRow = await setting.findOne({ where: { name: EMAIL_SETTING_KEY } });
        const recipients = emailRow && emailRow.details && emailRow.details.emails;
        if (!recipients || !recipients.length) {
            customLog(traceId, "error", { message: "BillAvenue alert skipped — no recipient emails configured (pekoWebsite.details.emails)" });
            return;
        }
        const balanceTxt = info.balance != null ? `&#8377; ${info.balance}` : "not configured";
        const subject = "Peko India | BillAvenue wallet low balance";
        const body = `<p>The BillAvenue vendor wallet balance needs attention.</p>
            <p><b>Current balance:</b> ${balanceTxt}<br/>
            ${info.threshold ? `<b>Alert threshold:</b> &#8377; ${info.threshold}<br/>` : ""}
            ${meta.required ? `<b>Blocked transaction:</b> &#8377; ${meta.required}${meta.corporateTxnId ? ` (Txn ${meta.corporateTxnId})` : ""} could not be processed due to insufficient vendor balance.<br/>` : ""}</p>
            <p>Please top up the BillAvenue wallet and update the balance from Admin &gt; Bill Payments.</p>`;
        emailer.email(recipients, subject, body, () => {});
    } catch (error) {
        customLog(traceId, "error", { message: "notifyBillAvenueLowBalance failed", error: error && error.message });
    }
};

module.exports = {
    SETTING_KEY,
    getBillAvenueWallet,
    checkBillAvenueBalance,
    decrementBillAvenueBalance,
    notifyBillAvenueLowBalance,
};
