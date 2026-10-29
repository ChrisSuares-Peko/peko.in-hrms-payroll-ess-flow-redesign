const partnerLogos = require("../../public/partnerLogos");
const serviceOperator = require("../entities/serviceOperator");
const vendor = require("../entities/vendor");
const systemUser = require("../entities/systemUser");
const subscription = require("../entities/subscription");
const serviceSubscription = require("../entities/serviceSubscription");
const { getGstDetails } = require("./setting");
const { gatewayChargeTermsOf, gatewayChargeOn } = require("../../utils/gatewayChargeTerms");

const PAYMENT_THROUGH = { gateway: "GATEWAY", wallet: "WALLET", both: "BOTH" };
const COMMISSION_TYPES = ["PERCENTAGE", "FLAT"];
const COMMISSION_MODES = ["MARGIN", "PRINCIPAL_MARKUP", "MIXED"];
const BILLING_TYPES = ["MONTHLY", "ANNUALLY"];
const FEE_TYPES = ["FLAT", "PERCENTAGE"];
// A sale Peko makes on its own account: a subscription, or a service with no vendor behind
// it in the books. Stored as the mode so neither Other Sales nor a vendor profile claims it.
const OWN_REVENUE = "OWN_REVENUE";
const SUBSCRIPTION_TAGS = ["SUBSCRIPTION", "SUBSCRIPTION-ADDONS", "ECOMMERCE-SUBSCRIPTION"];
const DEFAULT_GST_RATE_PCT = 18;

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

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

const stateOf = value => (typeof value === "string" ? value.trim().toLowerCase() : "");

const pekoState = () => {
    const peko = Array.isArray(partnerLogos) ? partnerLogos[0] : partnerLogos;
    return stateOf(peko && peko.state);
};

// Unknown states are read as Peko's own, which is what the pipeline does too.
const interStateOf = state => {
    const own = stateOf(state);
    return own ? own !== pekoState() : false;
};

const loadGstRatePct = async () => {
    try {
        const row = await getGstDetails();
        const percent = Number(row && row.details && row.details.gst);
        return Number.isFinite(percent) && percent > 0 ? percent : DEFAULT_GST_RATE_PCT;
    } catch {
        return DEFAULT_GST_RATE_PCT;
    }
};

const loadGstRate = async () => (await loadGstRatePct()) / 100;

const loadPartner = async partnerId => {
    if (!partnerId) return null;
    const partner = await systemUser.findOne({
        where: { credentialId: partnerId },
        attributes: ["state", "sharePercentage", "gatewayCharge"],
        raw: true,
    });
    return partner
        ? {
              state: partner.state || null,
              sharePercentage:
                  partner.sharePercentage === null || partner.sharePercentage === undefined
                      ? null
                      : round2(partner.sharePercentage),
              gatewayCharge: gatewayChargeTermsOf(partner.gatewayCharge),
          }
        : null;
};

// The discount on a Peko plan is Peko's cost like a coupon, and the subscription rows of the order
// keep it: a Peko Commerce plan on serviceSubscriptions (where it already carries any coupon), every
// other Peko plan on subscriptions. The set-up opens with it already in the discount field.
const DISCOUNT_ROWS_BY_TAG = { "ECOMMERCE-SUBSCRIPTION": serviceSubscription };

const loadPlanDiscount = async order => {
    if (!order || !order.corporateTxnId || !isSubscriptionTag(order.optional)) return 0;
    const tag = String(order.optional || "").trim().toUpperCase();
    const source = DISCOUNT_ROWS_BY_TAG[tag] || subscription;
    const rows = await source.findAll({
        where: { subscriptionPaymentRefId: String(order.corporateTxnId) },
        attributes: ["discount"],
        raw: true,
    });
    return round2((rows || []).reduce((sum, row) => sum + toNumber(row.discount), 0));
};

const loadPartnerState = async partnerId => {
    const partner = await loadPartner(partnerId);
    return partner ? partner.state : null;
};

const loadVendorState = async serviceOperatorId => {
    if (!serviceOperatorId) return null;
    const operator = await serviceOperator.findOne({
        where: { id: serviceOperatorId },
        attributes: ["vendorId"],
        raw: true,
    });
    if (!operator || !operator.vendorId) return null;
    const row = await vendor.findOne({ where: { id: operator.vendorId }, attributes: ["state"], raw: true });
    return row ? row.state || null : null;
};

const paymentThroughOf = paymentMode => {
    const mode = String(paymentMode || "").toUpperCase();
    const wallet = /WALLET/.test(mode);
    const gateway = /GATEWAY|CARD|UPI|NET/.test(mode) || mode.includes("+");
    if (wallet && gateway) return PAYMENT_THROUGH.both;
    if (wallet) return PAYMENT_THROUGH.wallet;
    return PAYMENT_THROUGH.gateway;
};

// The gateway account is the chart-of-accounts row named after the gateway; a bank-typed
// row of that name wins over any other.
const gatewayAccountOf = (accounts, name) => {
    const wanted = String(name || "").trim().toLowerCase();
    if (!wanted) return null;
    const matches = (accounts || []).filter(account => String(account.name || "").trim().toLowerCase() === wanted);
    const bank = matches.find(account => String(account.type || "").toLowerCase() === "bank");
    return (bank || matches[0] || null) && String((bank || matches[0]).id);
};

const isSubscriptionTag = optional => SUBSCRIPTION_TAGS.includes(String(optional || "").trim().toUpperCase());

const numberOrNull = value => (value === null || value === undefined || value === "" ? null : toNumber(value));

// What the form opens with: everything the order itself records, and the service's own
// commission and the package's platform fee as defaults the accounts team confirms or changes.
const setupDefaultsFor = async ({ order, accounts, partnerId, gstRatePct }) => {
    const operator = order.serviceOperator && order.serviceOperator.id ? order.serviceOperator : null;
    const response = responseOf(order.paymentModeResponse);
    const rate = toNumber(gstRatePct) / 100;
    const paymentThrough = paymentThroughOf(order.paymentMode);
    const amountInINR = round2(order.amountInINR);
    const surcharge = round2(order.surcharge);
    const orderAmount = round2(Math.max(0, amountInINR - surcharge));
    const pgFromResponse = numberOrNull(response && response.pgAmount);
    const pgAmount =
        pgFromResponse !== null
            ? round2(pgFromResponse)
            : paymentThrough === PAYMENT_THROUGH.wallet
              ? 0
              : amountInINR;
    const gatewayName = (response && response.paymentGatewayName) || null;
    const partner = await loadPartner(partnerId);
    const planDiscount = await loadPlanDiscount(order);
    const commissionValue = numberOrNull(operator && operator.providerCommission);
    const fixed = numberOrNull(operator && operator.fixedCommissionPerTransaction);

    return {
        paymentThrough,
        orderAmount,
        pgAmount,
        gateway: { name: gatewayName, accountId: gatewayAccountOf(accounts, gatewayName) },
        subscription: { is: isSubscriptionTag(order.optional), billingType: null },
        vendor: { present: Boolean(operator && operator.vendorId) },
        commission: {
            present: toNumber(commissionValue) > 0 || toNumber(fixed) > 0,
            type: operator && COMMISSION_TYPES.includes(operator.commissionType) ? operator.commissionType : "PERCENTAGE",
            mode: operator && COMMISSION_MODES.includes(operator.commissionMode) ? operator.commissionMode : "MARGIN",
            value: commissionValue === null ? null : round2(commissionValue),
            fixed: fixed === null ? null : round2(fixed),
            inclusiveOfGst: Boolean(Number(operator && operator.isCommissionInclGST)),
        },
        mixed: { principalAmount: null, marginAmount: null },
        platformFee: { type: "FLAT", value: surcharge > 0 ? round2(surcharge / (1 + rate)) : 0 },
        partner: {
            present: Boolean(partnerId),
            sharePercentage: partner ? partner.sharePercentage : null,
            gatewayCharge: partner ? partner.gatewayCharge : null,
        },
        coupon: { used: planDiscount > 0, totalDiscount: planDiscount > 0 ? planDiscount : null },
        gstRatePct: toNumber(gstRatePct),
    };
};

// One item's commission, exactly as the pipeline's computeOne works it out.
const commissionOn = (config, baseAmount, gstRate) => {
    if (!config || !config.present || !(baseAmount > 0)) return { incl: 0, excl: 0, gst: 0 };
    const value = toNumber(config.value);
    let base = config.type === "FLAT" ? value : (baseAmount * value) / 100;
    base += toNumber(config.fixed);
    if (config.inclusiveOfGst) {
        const excl = base / (1 + gstRate);
        return { incl: base, excl, gst: base - excl };
    }
    const gst = base * gstRate;
    return { incl: base + gst, excl: base, gst };
};

const partnerTermsOf = setup =>
    setup.partner && setup.partner.present ? gatewayChargeTermsOf(setup.partner.gatewayCharge) : null;

const partnerFigures = (setup, surplus, gstRate) => {
    const share = setup.partner && setup.partner.present ? toNumber(setup.partner.sharePercentage) : 0;
    const terms = partnerTermsOf(setup);
    const charge = gatewayChargeOn(terms, setup.pgAmount);
    const net = surplus - charge;
    const fee = share > 0 && net > 0 ? round2((net * share) / 100) : 0;
    const inputGst = round2(fee * gstRate);
    return {
        ...(terms ? { gatewayCharge: charge } : {}),
        partnerShipFee: fee,
        inputGSTonPartnerShipFee: inputGst,
        partnerPayable: round2(fee + inputGst),
    };
};

const partnerKeysOf = setup =>
    setup.partner && setup.partner.present ? [...(partnerTermsOf(setup) ? ["gatewayCharge"] : []), ...PARTNER_KEYS] : [];

const couponOf = setup =>
    setup.coupon && setup.coupon.used
        ? { totalDiscount: round2(setup.coupon.totalDiscount) }
        : { totalDiscount: 0 };

const couponKeys = coupon => ({
    couponTotalDiscount: coupon.totalDiscount,
});

const PARTNER_KEYS = ["partnerShipFee", "inputGSTonPartnerShipFee", "partnerPayable"];
const COUPON_KEYS = ["couponTotalDiscount"];
const MARGIN_KEYS = ["commissionIncludingGST", "commissionExcludingGST", "outputGSTonCommission", "vendorPayable"];
const PRINCIPAL_KEYS = ["principalSalesPayable", "principalCommissionExcludingGST", "outputGSTonPrincipalCommission"];
const FEE_KEYS = ["platformFeeIncludingGST", "platformFeeExcludingGST", "outputGSTonPlatformFee"];

const ownRevenueTemplate = ({ setup, gstRate, interState }) => {
    const pg = round2(setup.pgAmount);
    const coupon = couponOf(setup);
    const netOfGst = pg / (1 + gstRate);
    // Same base as the pipeline: the sale before GST plus the discount Peko bore.
    const partner = partnerFigures(setup, netOfGst + coupon.totalDiscount, gstRate);
    const subscription = Boolean(setup.subscription && setup.subscription.is);

    const split = {
        paymentThroughGateway: pg,
        netSubscriptionIncome: round2(netOfGst + coupon.totalDiscount),
        outputGSTonRevenue: round2(pg - netOfGst),
        ...partner,
        ...couponKeys(coupon),
    };
    const enabledKeys = [
        "paymentThroughGateway",
        "netSubscriptionIncome",
        "outputGSTonRevenue",
        ...partnerKeysOf(setup),
        ...(setup.coupon && setup.coupon.used ? COUPON_KEYS : []),
    ];
    const facts = {
        commissionMode: OWN_REVENUE,
        isInterState: interState.customer,
        salesIsInterState: interState.customer,
        partnerIsInterState: interState.partner,
        ...(subscription && BILLING_TYPES.includes(setup.subscription.billingType)
            ? { billingType: setup.subscription.billingType }
            : {}),
    };
    return { split, enabledKeys, facts };
};

const vendorSaleTemplate = ({ setup, gstRate, interState }) => {
    const amount = round2(setup.orderAmount);
    const pg = round2(setup.pgAmount);
    const coupon = couponOf(setup);
    const mode = setup.commission && COMMISSION_MODES.includes(setup.commission.mode) ? setup.commission.mode : "MARGIN";
    const fee = setup.platformFee || { type: "FLAT", value: 0 };
    const feeExcl = round2(fee.type === "PERCENTAGE" ? (amount * toNumber(fee.value)) / 100 : toNumber(fee.value));
    const feeIncl = round2(feeExcl * (1 + gstRate));
    const feeGst = round2(feeIncl - feeExcl);

    const principalAmount =
        mode === "PRINCIPAL_MARKUP" ? amount : mode === "MIXED" ? round2(setup.mixed && setup.mixed.principalAmount) : 0;
    const marginAmount = mode === "MARGIN" ? amount : mode === "MIXED" ? round2(setup.mixed && setup.mixed.marginAmount) : 0;
    const margin = commissionOn(setup.commission, marginAmount, gstRate);
    const principal = commissionOn(setup.commission, principalAmount, gstRate);

    const total = round2(amount + feeIncl);
    const wallet =
        setup.paymentThrough === PAYMENT_THROUGH.gateway ? 0 : round2(Math.max(0, total - coupon.totalDiscount - pg));
    const partner = partnerFigures(setup, margin.excl + principal.excl + feeExcl, gstRate);

    const split = {
        totalTransactionAmount: total,
        netTransactionAmount: round2(total - coupon.totalDiscount),
        paymentThroughGateway: pg,
        paymentThroughWallet: wallet,
        commissionIncludingGST: round2(margin.incl),
        commissionExcludingGST: round2(margin.excl),
        outputGSTonCommission: round2(margin.gst),
        vendorPayable: round2(amount - principalAmount - margin.incl),
        principalSalesPayable: round2(principalAmount - principal.incl),
        principalCommissionExcludingGST: round2(principal.excl),
        outputGSTonPrincipalCommission: round2(principal.gst),
        platformFeeIncludingGST: feeIncl,
        platformFeeExcludingGST: feeExcl,
        outputGSTonPlatformFee: feeGst,
        ...partner,
        ...couponKeys(coupon),
    };
    const enabledKeys = [
        "totalTransactionAmount",
        "netTransactionAmount",
        "paymentThroughGateway",
        ...(setup.paymentThrough === PAYMENT_THROUGH.gateway ? [] : ["paymentThroughWallet"]),
        ...(mode === "PRINCIPAL_MARKUP" ? [] : MARGIN_KEYS),
        ...(mode === "MARGIN" ? [] : PRINCIPAL_KEYS),
        ...FEE_KEYS,
        ...partnerKeysOf(setup),
        ...(setup.coupon && setup.coupon.used ? COUPON_KEYS : []),
    ];
    const facts = {
        commissionMode: mode,
        isInterState: interState.customer,
        vendorIsInterState: interState.vendor,
        salesIsInterState: interState.customer,
        partnerIsInterState: interState.partner,
    };
    return { split, enabledKeys, facts };
};

// The figures the pipeline would have stored for this order, worked out from how the
// accounts team says it was sold. Pure: every fact it needs is passed in.
const templateFor = ({ setup, gstRate, interState }) => {
    const ownRevenue = Boolean(setup.subscription && setup.subscription.is) || !(setup.vendor && setup.vendor.present);
    const built = ownRevenue
        ? ownRevenueTemplate({ setup, gstRate, interState })
        : vendorSaleTemplate({ setup, gstRate, interState });
    const facts = {
        ...built.facts,
        gstRatePct: round2(gstRate * 100),
        ...(setup.gateway && setup.gateway.name ? { paymentGatewayName: setup.gateway.name } : {}),
    };
    return {
        split: built.split,
        enabledKeys: built.enabledKeys,
        facts,
        journalAccountIds:
            setup.gateway && setup.gateway.accountId ? { paymentGateway: String(setup.gateway.accountId) } : null,
    };
};

const splitTemplateFor = async ({ order, customerState, partnerId, setup }) => {
    const [gstRate, vendorState, partner] = await Promise.all([
        loadGstRate(),
        setup.vendor && setup.vendor.present && !(setup.subscription && setup.subscription.is)
            ? loadVendorState(order.serviceOperatorId)
            : null,
        setup.partner && setup.partner.present ? loadPartner(partnerId) : null,
    ]);
    return templateFor({
        setup,
        gstRate,
        interState: {
            customer: interStateOf(customerState),
            vendor: interStateOf(vendorState),
            partner: interStateOf(partner && partner.state),
        },
    });
};

module.exports = {
    PAYMENT_THROUGH,
    COMMISSION_TYPES,
    COMMISSION_MODES,
    BILLING_TYPES,
    FEE_TYPES,
    OWN_REVENUE,
    stateOf,
    pekoState,
    interStateOf,
    loadGstRatePct,
    loadGstRate,
    loadPartner,
    loadPartnerState,
    paymentThroughOf,
    gatewayAccountOf,
    isSubscriptionTag,
    setupDefaultsFor,
    commissionOn,
    templateFor,
    splitTemplateFor,
};
