const serviceOperator = require("../../entities/serviceOperator");
const vendor = require("../../entities/vendor");
const systemUser = require("../../entities/systemUser");
const subscription = require("../../entities/subscription");
const serviceSubscription = require("../../entities/serviceSubscription");
const { getGstDetails } = require("../setting");
const {
    OWN_REVENUE,
    paymentThroughOf,
    gatewayAccountOf,
    setupDefaultsFor,
    commissionOn,
    templateFor,
    splitTemplateFor,
    isSubscriptionTag,
} = require("../manualJournalSetup");

jest.mock("../setting", () => ({ getGstDetails: jest.fn() }));

const ACCOUNTS = [
    { id: "A-COMM", name: "Commission", type: "income" },
    { id: "A-CF-EXP", name: "Cashfree", type: "expense" },
    { id: "A-CF", name: "Cashfree", type: "bank" },
];

// Order 1791369896179 as the pipeline worked it out: ₹1,104.84 of goods under a 20% platform
// fee, a FLAT ₹50 commission quoted including GST on a principal markup, and a 10% partner.
const PRINCIPAL_SETUP = {
    paymentThrough: "GATEWAY",
    orderAmount: 1104.84,
    pgAmount: 1365.58,
    gateway: { name: "Cashfree", accountId: "A-CF" },
    subscription: { is: false, billingType: null },
    vendor: { present: true },
    commission: { present: true, type: "FLAT", mode: "PRINCIPAL_MARKUP", value: 50, fixed: 0, inclusiveOfGst: true },
    mixed: { principalAmount: null, marginAmount: null },
    platformFee: { type: "PERCENTAGE", value: 20 },
    partner: { present: true, sharePercentage: 10 },
    coupon: { used: false },
};

const INTRA = { customer: false, vendor: false, partner: false };

const order = (overrides = {}) => ({
    corporateTxnId: "TXN-1",
    amountInINR: "1365.5800",
    surcharge: "260.7400",
    paymentMode: "PAYMENT GATEWAY",
    paymentModeResponse: '{"paymentGatewayName":"Cashfree","pgAmount":"1365.58"}',
    optional: null,
    serviceOperatorId: 3,
    serviceOperator: {
        id: 3,
        serviceProvider: "Government Services",
        vendorId: 9,
        commissionMode: "PRINCIPAL_MARKUP",
        commissionType: "FLAT",
        providerCommission: "50.0000",
        fixedCommissionPerTransaction: "0.0000",
        isCommissionInclGST: 1,
    },
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();
    getGstDetails.mockResolvedValue({ details: { gst: 18 } });
    systemUser.findOne.mockResolvedValue({ state: "Delhi", sharePercentage: "10.0000" });
    serviceOperator.findOne.mockResolvedValue({ vendorId: 9 });
    vendor.findOne.mockResolvedValue({ state: "Kerala" });
    subscription.findAll.mockResolvedValue([]);
    serviceSubscription.findAll.mockResolvedValue([]);
});

describe("what the form opens with", () => {
    it("reads the payment, the gateway account, the amounts and the partner off the order, and the commission off the service", async () => {
        const setup = await setupDefaultsFor({ order: order(), accounts: ACCOUNTS, partnerId: 55, gstRatePct: 18 });

        expect(setup).toEqual({
            paymentThrough: "GATEWAY",
            orderAmount: 1104.84,
            pgAmount: 1365.58,
            gateway: { name: "Cashfree", accountId: "A-CF" },
            subscription: { is: false, billingType: null },
            vendor: { present: true },
            commission: { present: true, type: "FLAT", mode: "PRINCIPAL_MARKUP", value: 50, fixed: 0, inclusiveOfGst: true },
            mixed: { principalAmount: null, marginAmount: null },
            platformFee: { type: "FLAT", value: 220.97 },
            partner: { present: true, sharePercentage: 10, gatewayCharge: null },
            coupon: { used: false, totalDiscount: null },
            gstRatePct: 18,
        });
        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: 55 },
            attributes: ["state", "sharePercentage", "gatewayCharge"],
            raw: true,
        });
    });

    it("reads the partner's gateway charge terms when it has them", async () => {
        systemUser.findOne.mockResolvedValue({
            state: "Delhi",
            sharePercentage: "10.0000",
            gatewayCharge: { percentage: "1.95", fixed: "3" },
        });

        const setup = await setupDefaultsFor({ order: order(), accounts: ACCOUNTS, partnerId: 55, gstRatePct: 18 });

        expect(setup.partner).toEqual({ present: true, sharePercentage: 10, gatewayCharge: { percentage: 1.95, fixed: 3 } });
    });

    it("reads a wallet order, a subscription tag and a service with no vendor or commission", async () => {
        systemUser.findOne.mockResolvedValue(null);
        const setup = await setupDefaultsFor({
            order: order({
                paymentMode: "PAYMENT GATEWAY + WALLET",
                paymentModeResponse: '{"paymentGatewayName":"Razorpay","pgAmount":"500.00"}',
                optional: "SUBSCRIPTION",
                surcharge: "0.0000",
                serviceOperator: { id: 3, serviceProvider: "Peko+", vendorId: null, commissionMode: null, providerCommission: null },
            }),
            accounts: ACCOUNTS,
            partnerId: null,
            gstRatePct: 18,
        });

        expect(setup).toMatchObject({
            paymentThrough: "BOTH",
            orderAmount: 1365.58,
            pgAmount: 500,
            gateway: { name: "Razorpay", accountId: null },
            subscription: { is: true },
            vendor: { present: false },
            commission: { present: false, type: "PERCENTAGE", mode: "MARGIN", value: null, inclusiveOfGst: false },
            platformFee: { type: "FLAT", value: 0 },
            partner: { present: false, sharePercentage: null },
        });
    });

    it("opens a Peko subscription with the plan's own discount already counted as Peko's cost", async () => {
        subscription.findAll.mockResolvedValue([{ discount: "200.0000" }, { discount: "0.0000" }]);

        const setup = await setupDefaultsFor({
            order: order({ optional: "SUBSCRIPTION", serviceOperator: { id: 3, serviceProvider: "Peko+", vendorId: null } }),
            accounts: ACCOUNTS,
            partnerId: null,
            gstRatePct: 18,
        });

        expect(subscription.findAll).toHaveBeenCalledWith({
            where: { subscriptionPaymentRefId: "TXN-1" },
            attributes: ["discount"],
            raw: true,
        });
        expect(setup.coupon).toEqual({ used: true, totalDiscount: 200 });
    });

    it("reads a Peko Commerce plan's discount off its own subscription rows", async () => {
        serviceSubscription.findAll.mockResolvedValue([{ discount: "149.5000" }]);

        const setup = await setupDefaultsFor({
            order: order({ optional: "ECOMMERCE-SUBSCRIPTION", serviceOperator: { id: 3, serviceProvider: "Peko Commerce", vendorId: null } }),
            accounts: ACCOUNTS,
            partnerId: null,
            gstRatePct: 18,
        });

        expect(serviceSubscription.findAll).toHaveBeenCalledWith({
            where: { subscriptionPaymentRefId: "TXN-1" },
            attributes: ["discount"],
            raw: true,
        });
        expect(subscription.findAll).not.toHaveBeenCalled();
        expect(setup.coupon).toEqual({ used: true, totalDiscount: 149.5 });
    });

    it("asks for no plan discount on a vendor-service order, and leaves the discount off a plan without one", async () => {
        await setupDefaultsFor({ order: order(), accounts: ACCOUNTS, partnerId: 55, gstRatePct: 18 });
        expect(subscription.findAll).not.toHaveBeenCalled();
        expect(serviceSubscription.findAll).not.toHaveBeenCalled();

        subscription.findAll.mockResolvedValue([{ discount: "0.0000" }]);
        const setup = await setupDefaultsFor({
            order: order({ optional: "SUBSCRIPTION" }),
            accounts: ACCOUNTS,
            partnerId: 55,
            gstRatePct: 18,
        });
        expect(setup.coupon).toEqual({ used: false, totalDiscount: null });
    });

    it("names the way the money came in, and prefers the bank account of the gateway's name", () => {
        expect(paymentThroughOf("PAYMENT GATEWAY")).toBe("GATEWAY");
        expect(paymentThroughOf("WALLET")).toBe("WALLET");
        expect(paymentThroughOf("PAYMENT GATEWAY + WALLET")).toBe("BOTH");
        expect(paymentThroughOf(null)).toBe("GATEWAY");
        expect(gatewayAccountOf(ACCOUNTS, "cashfree")).toBe("A-CF");
        expect(gatewayAccountOf(ACCOUNTS, "Razorpay")).toBeNull();
        expect(gatewayAccountOf(ACCOUNTS, null)).toBeNull();
    });
});

describe("one item's commission", () => {
    it("works a flat amount, a percentage and a fixed charge out the way the pipeline does, inclusive or exclusive of GST", () => {
        const flatIncl = commissionOn({ present: true, type: "FLAT", value: 50, fixed: 0, inclusiveOfGst: true }, 1104.84, 0.18);
        expect([flatIncl.incl, flatIncl.excl, flatIncl.gst].map(v => Math.round(v * 100) / 100)).toEqual([50, 42.37, 7.63]);

        const percentExcl = commissionOn({ present: true, type: "PERCENTAGE", value: 2, fixed: 5, inclusiveOfGst: false }, 1000, 0.18);
        expect([percentExcl.incl, percentExcl.excl, percentExcl.gst].map(v => Math.round(v * 100) / 100)).toEqual([29.5, 25, 4.5]);

        expect(commissionOn({ present: false, type: "FLAT", value: 50 }, 1000, 0.18)).toEqual({ incl: 0, excl: 0, gst: 0 });
        expect(commissionOn({ present: true, type: "FLAT", value: 50 }, 0, 0.18)).toEqual({ incl: 0, excl: 0, gst: 0 });
    });
});

describe("the figures worked out from the set-up", () => {
    it("reproduces the pipeline's own breakdown of a principal markup with a platform fee and a partner", () => {
        const { split, enabledKeys, facts, journalAccountIds } = templateFor({ setup: PRINCIPAL_SETUP, gstRate: 0.18, interState: INTRA });

        expect(split).toEqual({
            totalTransactionAmount: 1365.58,
            netTransactionAmount: 1365.58,
            paymentThroughGateway: 1365.58,
            paymentThroughWallet: 0,
            commissionIncludingGST: 0,
            commissionExcludingGST: 0,
            outputGSTonCommission: 0,
            vendorPayable: 0,
            principalSalesPayable: 1054.84,
            principalCommissionExcludingGST: 42.37,
            outputGSTonPrincipalCommission: 7.63,
            platformFeeIncludingGST: 260.74,
            platformFeeExcludingGST: 220.97,
            outputGSTonPlatformFee: 39.77,
            partnerShipFee: 26.33,
            inputGSTonPartnerShipFee: 4.74,
            partnerPayable: 31.07,
            couponTotalDiscount: 0,
        });
        expect(enabledKeys).toEqual([
            "totalTransactionAmount",
            "netTransactionAmount",
            "paymentThroughGateway",
            "principalSalesPayable",
            "principalCommissionExcludingGST",
            "outputGSTonPrincipalCommission",
            "platformFeeIncludingGST",
            "platformFeeExcludingGST",
            "outputGSTonPlatformFee",
            "partnerShipFee",
            "inputGSTonPartnerShipFee",
            "partnerPayable",
        ]);
        expect(facts).toEqual({
            commissionMode: "PRINCIPAL_MARKUP",
            isInterState: false,
            vendorIsInterState: false,
            salesIsInterState: false,
            partnerIsInterState: false,
            gstRatePct: 18,
            paymentGatewayName: "Cashfree",
        });
        expect(journalAccountIds).toEqual({ paymentGateway: "A-CF" });
    });

    it("books a margin sale: commission off the vendor's share, the rest payable, no principal figures", () => {
        const setup = {
            ...PRINCIPAL_SETUP,
            paymentThrough: "BOTH",
            orderAmount: 1000,
            pgAmount: 500,
            commission: { present: true, type: "PERCENTAGE", mode: "MARGIN", value: 2, fixed: 0, inclusiveOfGst: false },
            platformFee: { type: "FLAT", value: 50 },
            partner: { present: false, sharePercentage: null },
            coupon: { used: true, totalDiscount: 20 },
        };
        const { split, enabledKeys, facts } = templateFor({ setup, gstRate: 0.18, interState: { customer: true, vendor: false, partner: false } });

        expect(split).toMatchObject({
            totalTransactionAmount: 1059,
            netTransactionAmount: 1039,
            paymentThroughGateway: 500,
            paymentThroughWallet: 539,
            commissionExcludingGST: 20,
            outputGSTonCommission: 3.6,
            commissionIncludingGST: 23.6,
            vendorPayable: 976.4,
            principalSalesPayable: 0,
            principalCommissionExcludingGST: 0,
            platformFeeExcludingGST: 50,
            outputGSTonPlatformFee: 9,
            platformFeeIncludingGST: 59,
            partnerShipFee: 0,
            partnerPayable: 0,
            couponTotalDiscount: 20,
        });
        expect(enabledKeys).toEqual([
            "totalTransactionAmount",
            "netTransactionAmount",
            "paymentThroughGateway",
            "paymentThroughWallet",
            "commissionIncludingGST",
            "commissionExcludingGST",
            "outputGSTonCommission",
            "vendorPayable",
            "platformFeeIncludingGST",
            "platformFeeExcludingGST",
            "outputGSTonPlatformFee",
            "couponTotalDiscount",
        ]);
        expect(facts).toMatchObject({ commissionMode: "MARGIN", isInterState: true, salesIsInterState: true, vendorIsInterState: false });
    });

    it("splits a mixed order by the amount sold each way", () => {
        const setup = {
            ...PRINCIPAL_SETUP,
            orderAmount: 1000,
            pgAmount: 1059,
            commission: { present: true, type: "PERCENTAGE", mode: "MIXED", value: 10, fixed: 0, inclusiveOfGst: false },
            mixed: { principalAmount: 600, marginAmount: 400 },
            platformFee: { type: "FLAT", value: 50 },
            partner: { present: true, sharePercentage: 10 },
            coupon: { used: true, totalDiscount: 50 },
        };
        const { split, enabledKeys } = templateFor({ setup, gstRate: 0.18, interState: INTRA });

        expect(split).toMatchObject({
            commissionExcludingGST: 40,
            outputGSTonCommission: 7.2,
            commissionIncludingGST: 47.2,
            vendorPayable: 352.8,
            principalCommissionExcludingGST: 60,
            outputGSTonPrincipalCommission: 10.8,
            principalSalesPayable: 529.2,
            partnerShipFee: 15,
            inputGSTonPartnerShipFee: 2.7,
            partnerPayable: 17.7,
        });
        expect(enabledKeys).toEqual(expect.arrayContaining(["commissionExcludingGST", "principalSalesPayable", "partnerShipFee", "couponTotalDiscount"]));
    });

    it("books a sale with no vendor, or a subscription, as Peko's own revenue with GST on the revenue", () => {
        const own = templateFor({
            setup: { ...PRINCIPAL_SETUP, pgAmount: 1180, vendor: { present: false } },
            gstRate: 0.18,
            interState: { customer: true, vendor: false, partner: true },
        });
        expect(own.split).toEqual({
            paymentThroughGateway: 1180,
            netSubscriptionIncome: 1000,
            outputGSTonRevenue: 180,
            partnerShipFee: 100,
            inputGSTonPartnerShipFee: 18,
            partnerPayable: 118,
            couponTotalDiscount: 0,
        });
        expect(own.enabledKeys).toEqual([
            "paymentThroughGateway",
            "netSubscriptionIncome",
            "outputGSTonRevenue",
            "partnerShipFee",
            "inputGSTonPartnerShipFee",
            "partnerPayable",
        ]);
        expect(own.facts).toEqual({
            commissionMode: OWN_REVENUE,
            isInterState: true,
            salesIsInterState: true,
            partnerIsInterState: true,
            gstRatePct: 18,
            paymentGatewayName: "Cashfree",
        });

        const annual = templateFor({
            setup: {
                ...PRINCIPAL_SETUP,
                pgAmount: 1180,
                subscription: { is: true, billingType: "ANNUALLY" },
                partner: { present: false, sharePercentage: null },
                coupon: { used: true, totalDiscount: 100 },
            },
            gstRate: 0.18,
            interState: INTRA,
        });
        expect(annual.split).toMatchObject({ netSubscriptionIncome: 1100, outputGSTonRevenue: 180, partnerShipFee: 0, couponTotalDiscount: 100 });
        expect(annual.facts).toMatchObject({ commissionMode: OWN_REVENUE, billingType: "ANNUALLY" });
        expect(annual.enabledKeys).toContain("couponTotalDiscount");
    });

    it("takes the partner's gateway charge off Peko's earnings before the share", () => {
        const { split, enabledKeys } = templateFor({
            setup: {
                ...PRINCIPAL_SETUP,
                partner: { present: true, sharePercentage: 10, gatewayCharge: { percentage: 1.95, fixed: 3 } },
            },
            gstRate: 0.18,
            interState: INTRA,
        });

        expect(split).toMatchObject({
            paymentThroughGateway: 1365.58,
            gatewayCharge: 29.63,
            partnerShipFee: 23.37,
            inputGSTonPartnerShipFee: 4.21,
            partnerPayable: 27.58,
        });
        expect(enabledKeys).toEqual(expect.arrayContaining(["gatewayCharge", "partnerShipFee"]));
        expect(enabledKeys.indexOf("gatewayCharge")).toBeLessThan(enabledKeys.indexOf("partnerShipFee"));
    });

    it("leaves the gateway charge off a set-up whose partner has no terms, and writes nought for one that does not bear it", () => {
        const none = templateFor({ setup: PRINCIPAL_SETUP, gstRate: 0.18, interState: INTRA });
        expect(none.split).not.toHaveProperty("gatewayCharge");
        expect(none.enabledKeys).not.toContain("gatewayCharge");

        const free = templateFor({
            setup: {
                ...PRINCIPAL_SETUP,
                partner: { present: true, sharePercentage: 10, gatewayCharge: { percentage: 0, fixed: 0 } },
            },
            gstRate: 0.18,
            interState: INTRA,
        });
        expect(free.split).toMatchObject({ gatewayCharge: 0, partnerShipFee: 26.33 });
        expect(free.enabledKeys).toContain("gatewayCharge");
    });

    it("leaves the gateway account out when none was picked", () => {
        const { journalAccountIds, facts } = templateFor({
            setup: { ...PRINCIPAL_SETUP, gateway: { name: null, accountId: null } },
            gstRate: 0.18,
            interState: INTRA,
        });
        expect(journalAccountIds).toBeNull();
        expect(facts.paymentGatewayName).toBeUndefined();
    });
});

describe("reading the facts before working the figures out", () => {
    it("reads the GST rate, the vendor's state through the service and the partner's state and share", async () => {
        vendor.findOne.mockResolvedValue({ state: "Kerala" });
        systemUser.findOne.mockResolvedValue({ state: "Goa", sharePercentage: "10.0000" });

        const template = await splitTemplateFor({ order: { serviceOperatorId: 3 }, customerState: "Kerala", partnerId: 55, setup: PRINCIPAL_SETUP });

        expect(serviceOperator.findOne).toHaveBeenCalledWith({ where: { id: 3 }, attributes: ["vendorId"], raw: true });
        expect(vendor.findOne).toHaveBeenCalledWith({ where: { id: 9 }, attributes: ["state"], raw: true });
        expect(template.facts).toMatchObject({ isInterState: true, vendorIsInterState: true, partnerIsInterState: true, gstRatePct: 18 });
        expect(template.split.principalSalesPayable).toBe(1054.84);
    });

    it("asks for no vendor or partner it does not need, and falls back to 18% GST", async () => {
        getGstDetails.mockRejectedValue(new Error("db"));

        const template = await splitTemplateFor({
            order: { serviceOperatorId: 3 },
            customerState: null,
            partnerId: null,
            setup: { ...PRINCIPAL_SETUP, subscription: { is: true, billingType: "MONTHLY" }, partner: { present: false } },
        });

        expect(serviceOperator.findOne).not.toHaveBeenCalled();
        expect(systemUser.findOne).not.toHaveBeenCalled();
        expect(template.facts).toMatchObject({ commissionMode: OWN_REVENUE, gstRatePct: 18, isInterState: false });
    });
});

describe("which order tags are subscriptions", () => {
    it("counts a Peko Commerce purchase as a subscription, like a plan or an add-on", () => {
        expect(isSubscriptionTag("ECOMMERCE-SUBSCRIPTION")).toBe(true);
        expect(isSubscriptionTag(" ecommerce-subscription ")).toBe(true);
        expect(isSubscriptionTag("SUBSCRIPTION")).toBe(true);
        expect(isSubscriptionTag("SUBSCRIPTION-ADDONS")).toBe(true);
        expect(isSubscriptionTag(null)).toBe(false);
        expect(isSubscriptionTag("ORDER")).toBe(false);
    });
});
