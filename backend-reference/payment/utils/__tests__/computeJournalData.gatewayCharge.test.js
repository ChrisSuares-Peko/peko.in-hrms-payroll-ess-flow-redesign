jest.mock("../../models/use-cases/setting", () => ({ getGstDetails: jest.fn() }));
jest.mock("../checkAndFetchServiceDetails", () => ({
    calculateSurchargeWithTax: jest.fn(),
    findServiceOperatorByAccessKey: jest.fn(),
}));
jest.mock("../partnerLogos", () => ({ partnerLogos: jest.fn() }));
jest.mock("../loggerHelper", () => ({ customLog: jest.fn() }));

const { getGstDetails } = require("../../models/use-cases/setting");
const { calculateSurchargeWithTax, findServiceOperatorByAccessKey } = require("../checkAndFetchServiceDetails");
const { partnerLogos } = require("../partnerLogos");
const { computeJournalData } = require("../computeJournalData");

const TERMS = { percentage: 2, fixed: 5 };
const partner = (gatewayCharge = TERMS) => ({ sharePercentage: 10, state: "Kerala", gatewayCharge });

const vendorSale = extra =>
    computeJournalData({
        serviceDetails: { surcharge: 0, vendor: { state: "Kerala" }, recordJournalEntry: true },
        pgAmount: 1000,
        amount: 1000,
        paymentMethod: "UPI",
        partnerDetails: partner(),
        corporateState: "Kerala",
        planDetails: [{ commissionType: "PERCENTAGE", commission: 10, amount: 1000, quantity: 1 }],
        ...extra,
    });

const ownSale = extra =>
    vendorSale({ isSubscription: true, pgAmount: 1180, amount: 1180, planDetails: [], couponTotalDiscount: 20, ...extra });

beforeEach(() => {
    jest.clearAllMocks();
    getGstDetails.mockResolvedValue({ details: { gst: 18 } });
    calculateSurchargeWithTax.mockResolvedValue({ surchargeWithoutTax: 0, surcharge: 0 });
    findServiceOperatorByAccessKey.mockResolvedValue({ vendor: { state: "Kerala" } });
    partnerLogos.mockResolvedValue({ state: "Kerala" });
});

describe("the gateway charge a partner bears", () => {
    it("is a percentage of what went through the gateway plus a fixed sum, written on the entry, and comes off the share's base", async () => {
        const { journalData } = await vendorSale({});

        expect(journalData.gatewayCharge).toBe(25);
        expect(journalData.paymentThroughGateway).toBe(1000);
        expect(journalData.commissionExcludingGST).toBe(100);
        expect(journalData.partnerShipFee).toBe(7.5);
        expect(journalData.inputGSTonPartnerShipFee).toBe(1.35);
        expect(journalData.partnerPayable).toBe(8.85);
    });

    it("comes off Peko's own sale the same way, after the coupon is added back", async () => {
        const { journalData } = await ownSale({});

        expect(journalData.gatewayCharge).toBe(28.6);
        expect(journalData.partnerShipFee).toBe(99.14);
    });

    it("is nothing when nothing went through the gateway", async () => {
        const { journalData } = await vendorSale({ pgAmount: 0 });

        expect(journalData.gatewayCharge).toBe(0);
        expect(journalData.partnerShipFee).toBe(10);
    });

    it("is worked out on the gateway part alone of a mixed payment", async () => {
        const { journalData } = await vendorSale({ pgAmount: 400 });

        expect(journalData.gatewayCharge).toBe(13);
        expect(journalData.paymentThroughWallet).toBe(600);
        expect(journalData.partnerShipFee).toBe(8.7);
    });

    it("is written as zero for a partner that does not bear it, leaving the share as it was", async () => {
        const { journalData } = await vendorSale({ partnerDetails: partner({ percentage: 0, fixed: 0 }) });

        expect(journalData.gatewayCharge).toBe(0);
        expect(journalData.partnerShipFee).toBe(10);
    });

    it("is left off the entry when the partner has no terms", async () => {
        const noTerms = (await vendorSale({ partnerDetails: partner(null) })).journalData;
        const legacy = (await vendorSale({ partnerDetails: { sharePercentage: 10, state: "Kerala" } })).journalData;

        expect(noTerms).not.toHaveProperty("gatewayCharge");
        expect(legacy).not.toHaveProperty("gatewayCharge");
        expect(noTerms.partnerShipFee).toBe(10);
        expect(legacy).toEqual(noTerms);
    });

    it("leaves the partner nothing when the charge is above what Peko earned, but still writes the charge", async () => {
        const { journalData } = await vendorSale({
            planDetails: [{ commissionType: "PERCENTAGE", commission: 1, amount: 1000, quantity: 1 }],
        });

        expect(journalData.gatewayCharge).toBe(25);
        expect(journalData.partnerShipFee).toBe(0);
        expect(journalData.inputGSTonPartnerShipFee).toBe(0);
        expect(journalData.partnerPayable).toBe(0);
    });

    it("is rounded to the paisa", async () => {
        const { journalData } = await vendorSale({
            pgAmount: 333.33,
            amount: 333.33,
            partnerDetails: partner({ percentage: 1.95, fixed: 0 }),
        });

        expect(journalData.gatewayCharge).toBe(6.5);
    });

    it("reads the terms whether they arrive parsed or as stored text", async () => {
        const parsed = (await vendorSale({})).journalData;
        const text = (await vendorSale({ partnerDetails: partner(JSON.stringify(TERMS)) })).journalData;

        expect(text).toEqual(parsed);
    });
});
