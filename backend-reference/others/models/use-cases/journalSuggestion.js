const { Op } = require("sequelize");
const chartOfAccounts = require("../entities/chartOfAccount");
const { stateOf, pekoState, loadGstRate, loadPartnerState } = require("./manualJournalSetup");

// Only the rows the order itself can vouch for: an order whose entry was never worked out has
// no breakdown to read, so commission, vendor deposit, sales and coupon rows are never guessed
// here and are added by hand instead.
const ACCOUNT_NAMES = {
    platformFees: "Platform Fees",
    subscribersWallet: "Subscribers Wallet",
    partnershipFees: "Partnership Fees",
    partnershipFeePayable: "Partnership Fee Payable",
    cashbackExpense: "Cashback Expense",
    outputCGST: "Output CGST",
    outputSGST: "Output SGST",
    outputIGST: "Output IGST",
    inputCGST: "Input CGST",
    inputSGST: "Input SGST",
    inputIGST: "Input IGST",
};

// Every figure the profiles read, so the editor offers each of them to be typed in, filled
// where the order knows it and blank where it does not.
const SPLIT_KEYS = [
    "totalTransactionAmount",
    "paymentThroughGateway",
    "paymentThroughWallet",
    "commissionExcludingGST",
    "outputGSTonCommission",
    "commissionIncludingGST",
    "vendorPayable",
    "principalSalesPayable",
    "principalCommissionExcludingGST",
    "outputGSTonPrincipalCommission",
    "platformFeeExcludingGST",
    "outputGSTonPlatformFee",
    "platformFeeIncludingGST",
    "couponTotalDiscount",
];

const PARTNER_SPLIT_KEYS = ["partnerShipFee", "inputGSTonPartnerShipFee", "partnerPayable"];

const WALLET_KEYS = new Set(["cashback", "cashbackReversal"]);

const round2 = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const positive = value => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? round2(number) : null;
};

const parseJson = value => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const responseOf = paymentModeResponse => {
    const parsed = parseJson(paymentModeResponse);
    return Array.isArray(parsed) ? parsed[0] : parsed;
};

const loadAccounts = async names => {
    const rows = await chartOfAccounts.findAll({
        where: {
            account_name: { [Op.in]: names.filter(Boolean) },
            provider_account_id: { [Op.ne]: null },
            vendorId: null,
            partnerId: null,
            corporateUserId: null,
        },
        attributes: ["account_name", "provider_account_id"],
        raw: true,
    });
    return new Map((rows || []).map(item => [item.account_name, String(item.provider_account_id)]));
};

const row = (accounts, name, direction, amount, description) => ({
    accountId: (name && accounts.get(name)) || null,
    accountName: name || null,
    direction,
    amount: amount === null || amount === undefined ? null : round2(amount),
    description,
});

const half = amount => (amount === null ? null : round2(amount / 2));

const gstRows = (accounts, kind, interState, amount, direction, description) =>
    interState
        ? [row(accounts, ACCOUNT_NAMES[`${kind}IGST`], direction, amount, description)]
        : [
              row(accounts, ACCOUNT_NAMES[`${kind}CGST`], direction, half(amount), description),
              row(accounts, ACCOUNT_NAMES[`${kind}SGST`], direction, half(amount), description),
          ];

const flipped = rows =>
    rows.map(line => ({ ...line, direction: line.direction === "debit" ? "credit" : "debit" }));

// What the order record alone says: who collected the money and how much, whether part of it
// came from the wallet, the platform fee it carried and whether a partner is behind it.
const factsOf = async (order, lookupOrder) => {
    const peko = pekoState();
    const interState = state => {
        const own = stateOf(state);
        return own ? own !== peko : false;
    };
    const response = responseOf(order.paymentModeResponse);
    const partnerId = lookupOrder.partnerId || null;
    return {
        paymentGateway: (response && response.paymentGatewayName) || null,
        pgAmount: positive(response && response.pgAmount),
        customerInterState: interState(lookupOrder.customer && lookupOrder.customer.state),
        partnerId,
        partnerInterState: interState(await loadPartnerState(partnerId)),
    };
};

const orderFigures = ({ order, facts, gstRate }) => {
    const amount = positive(order.amountInINR);
    const walletUsed = /WALLET/i.test(order.paymentMode || "");
    const gateway = facts.pgAmount ?? (walletUsed ? null : amount);
    const wallet = walletUsed && gateway !== null && amount !== null ? positive(amount - gateway) : null;
    const feeIncluding = positive(order.surcharge);
    const feeExcluding = feeIncluding === null ? null : round2(feeIncluding / (1 + gstRate));
    const feeGst = feeIncluding === null ? null : round2(feeIncluding - feeExcluding);

    const split = Object.fromEntries(SPLIT_KEYS.map(key => [key, null]));
    Object.assign(split, {
        totalTransactionAmount: amount,
        paymentThroughGateway: gateway,
        paymentThroughWallet: walletUsed ? wallet : gateway === null ? null : 0,
        platformFeeExcludingGST: feeExcluding,
        outputGSTonPlatformFee: feeGst,
        platformFeeIncludingGST: feeIncluding,
    });
    if (facts.partnerId) PARTNER_SPLIT_KEYS.forEach(key => Object.assign(split, { [key]: null }));

    return { walletUsed, split };
};

const saleRows = ({ accounts, order, facts, gstRate, description }) => {
    const { walletUsed, split } = orderFigures({ order, facts, gstRate });

    const rows = [row(accounts, facts.paymentGateway, "debit", split.paymentThroughGateway, description)];
    if (walletUsed) rows.push(row(accounts, ACCOUNT_NAMES.subscribersWallet, "debit", split.paymentThroughWallet, description));

    if (split.platformFeeIncludingGST !== null) {
        rows.push(row(accounts, ACCOUNT_NAMES.platformFees, "credit", split.platformFeeExcludingGST, description));
        rows.push(...gstRows(accounts, "output", facts.customerInterState, split.outputGSTonPlatformFee, "credit", description));
    }

    if (facts.partnerId) {
        rows.push(row(accounts, ACCOUNT_NAMES.partnershipFees, "debit", null, description));
        rows.push(...gstRows(accounts, "input", facts.partnerInterState, null, "debit", description));
        rows.push(row(accounts, ACCOUNT_NAMES.partnershipFeePayable, "credit", null, description));
    }
    return rows;
};

const walletRows = (accounts, journalKey, amount, description) => {
    const rows = [
        row(accounts, ACCOUNT_NAMES.cashbackExpense, "debit", amount, description),
        row(accounts, ACCOUNT_NAMES.subscribersWallet, "credit", amount, description),
    ];
    return journalKey === "cashbackReversal" ? flipped(rows) : rows;
};

const suggestJournalLines = async ({ journalKey, order, lookupOrder, amount = null, refundAmount = null }) => {
    const description = order.corporateTxnId;
    const facts = await factsOf(order, lookupOrder);
    const [accounts, gstRate] = await Promise.all([
        loadAccounts([...Object.values(ACCOUNT_NAMES), facts.paymentGateway]),
        loadGstRate(),
    ]);

    if (WALLET_KEYS.has(journalKey)) {
        return { lineItems: walletRows(accounts, journalKey, positive(amount), description), split: {} };
    }

    const { split } = orderFigures({ order, facts, gstRate });
    const sale = saleRows({ accounts, order, facts, gstRate, description });
    if (journalKey === "transaction") return { lineItems: sale, split };
    if (journalKey === "refund") return { lineItems: flipped(sale), split };
    const refund = positive(refundAmount);
    return {
        lineItems: flipped(sale).map((line, index) => ({ ...line, amount: index === 0 ? refund : null })),
        split,
    };
};

module.exports = { ACCOUNT_NAMES, SPLIT_KEYS, PARTNER_SPLIT_KEYS, suggestJournalLines };
