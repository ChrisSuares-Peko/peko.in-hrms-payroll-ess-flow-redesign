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

const purchase = extra =>
    computeJournalData({
        serviceDetails: { surcharge: 0, vendor: { state: "Kerala" }, recordJournalEntry: true },
        pgAmount: 290,
        amount: 290,
        paymentMethod: "UPI",
        partnerDetails: { sharePercentage: 0, state: "Kerala" },
        corporateState: "Kerala",
        ...extra,
    });

beforeEach(() => {
    jest.clearAllMocks();
    getGstDetails.mockResolvedValue({ details: { gst: 18 } });
    findServiceOperatorByAccessKey.mockResolvedValue({ vendor: { state: "Kerala" } });
    partnerLogos.mockResolvedValue({ state: "Kerala" });
});

const subscription = extra => purchase({ isSubscription: true, ...extra });

describe("the journal data of a physical card purchase", () => {
    it("is marked as a physical card, with no billing cycle", async () => {
        const { journalData } = await purchase({ isPhysicalCard: true });

        expect(journalData.isPhysicalCard).toBe(true);
        expect(journalData).not.toHaveProperty("billingType");
    });

    it("has the income of a subscription, and no commission, platform fee or vendor payable", async () => {
        const { journalData } = await purchase({ isPhysicalCard: true });

        expect(journalData.netSubscriptionIncome).toBe(245.76);
        expect(journalData.outputGSTonRevenue).toBe(44.24);
        expect(journalData).not.toHaveProperty("vendorPayable");
        expect(journalData).not.toHaveProperty("commissionIncludingGST");
        expect(journalData).not.toHaveProperty("platformFeeIncludingGST");
    });

    it("does not need isSubscription: it comes out the same whether or not that is passed", async () => {
        const alone = await purchase({ isPhysicalCard: true });
        const withSubscription = await purchase({ isPhysicalCard: true, isSubscription: true });

        expect(alone.journalData).toEqual(withSubscription.journalData);
    });

    it("has every figure of a subscription of the same amount", async () => {
        const card = (await purchase({ isPhysicalCard: true })).journalData;
        const { billingType, ...plan } = (await subscription({})).journalData;

        expect(billingType).toBe("MONTHLY");
        expect(card).toEqual({ ...plan, isPhysicalCard: true });
    });

    it("pays the partner on the amount before GST, as a subscription does", async () => {
        const partnerDetails = { sharePercentage: 10, state: "Kerala" };
        const card = (await purchase({ isPhysicalCard: true, partnerDetails })).journalData;
        const plan = (await subscription({ partnerDetails })).journalData;

        expect(card.partnerShipFee).toBe(24.58);
        expect(card.partnerShipFee).toBe(plan.partnerShipFee);
        expect(card.partnerPayable).toBe(plan.partnerPayable);
    });

    it("charges no surcharge and works out no commission", async () => {
        await purchase({ isPhysicalCard: true });

        expect(calculateSurchargeWithTax).not.toHaveBeenCalled();
    });

    it("is never held back for a commission or surcharge that is not configured", async () => {
        const { journalData } = await purchase({
            isPhysicalCard: true,
            serviceDetails: {
                surcharge: 0,
                vendor: { state: "Kerala" },
                recordJournalEntry: true,
                isCommissionConfigured: false,
                isSurchargeConfigured: false,
            },
        });

        expect(journalData.commissionNotConfiguredFor).toBeNull();
        expect(journalData.surchargeNotConfiguredFor).toBeNull();
    });
});

describe("the journal data of a subscription, which a physical card must not change", () => {
    it("keeps a billing cycle and carries no card mark", async () => {
        const { journalData } = await subscription({});

        expect(journalData.billingType).toBe("MONTHLY");
        expect(journalData).not.toHaveProperty("isPhysicalCard");
        expect((await subscription({ billingType: "ANNUALLY" })).journalData.billingType).toBe("ANNUALLY");
    });
});
