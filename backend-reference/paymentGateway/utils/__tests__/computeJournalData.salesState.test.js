jest.mock("../../models/use-cases/setting", () => ({ getGstDetails: jest.fn() }));
jest.mock("../checkAndFetchServiceDetails", () => ({
    calculateSurchargeWithTax: jest.fn(),
    findServiceOperatorByAccessKey: jest.fn(),
}));
jest.mock("../partnerLogos", () => ({ partnerLogos: jest.fn() }));
jest.mock("../loggerHelper", () => ({ customLog: jest.fn() }));

const { getGstDetails } = require("../../models/use-cases/setting");
const {
    calculateSurchargeWithTax,
    findServiceOperatorByAccessKey,
} = require("../checkAndFetchServiceDetails");
const { partnerLogos } = require("../partnerLogos");
const { computeJournalData } = require("../computeJournalData");

const PEKO_STATE = "Kerala";

// A principal-markup sale, so Peko's margin carries GST on the Sales account.
const sale = ({ corporateState, vendorState }) =>
    computeJournalData({
        serviceDetails: {
            commissionType: "PERCENTAGE",
            commission: 10,
            commissionMode: "PRINCIPAL_MARKUP",
            surcharge: 0,
            vendor: { state: vendorState },
        },
        pgAmount: 1000,
        amount: 1000,
        paymentMethod: "UPI",
        partnerDetails: { sharePercentage: 0, state: PEKO_STATE },
        corporateState,
    });

beforeEach(() => {
    jest.clearAllMocks();
    getGstDetails.mockResolvedValue({ details: { gst: 18 } });
    calculateSurchargeWithTax.mockResolvedValue({ surchargeWithoutTax: 0, surcharge: 0 });
    findServiceOperatorByAccessKey.mockResolvedValue({ vendor: { state: PEKO_STATE } });
    partnerLogos.mockResolvedValue({ state: PEKO_STATE });
});

describe("the state the Sales GST is split by", () => {
    it("is the customer's, not the vendor's: a customer in another state is inter-state", async () => {
        const { journalData } = await sale({ corporateState: "Tamil Nadu", vendorState: PEKO_STATE });

        expect(journalData.outputGSTonPrincipalCommission).toBeGreaterThan(0);
        // The vendor's price carries GST too: the GST inside it is recorded, so Sales + its GST is still what was paid.
        const { principalSalesPayable, principalCommissionExcludingGST, outputGSTonPrincipalCommission, outputGSTonPrincipalSales } = journalData;
        expect(outputGSTonPrincipalSales).toBeCloseTo(principalSalesPayable - principalSalesPayable / 1.18, 1);
        expect(principalSalesPayable + principalCommissionExcludingGST + outputGSTonPrincipalCommission).toBeCloseTo(1000, 1);
        expect(journalData.salesIsInterState).toBe(true);
        expect(journalData.vendorIsInterState).toBe(false);
    });

    it("is intra-state for a customer in Peko's state, whichever state the vendor is in", async () => {
        const { journalData } = await sale({ corporateState: PEKO_STATE, vendorState: "Maharashtra" });

        expect(journalData.salesIsInterState).toBe(false);
        expect(journalData.vendorIsInterState).toBe(true);
    });

    it("always agrees with the customer's state on the journal, which the platform fee also uses", async () => {
        for (const [corporateState, vendorState] of [
            ["Tamil Nadu", "Tamil Nadu"],
            ["Kerala", "Tamil Nadu"],
            ["Tamil Nadu", "Kerala"],
            ["", "Tamil Nadu"],
        ]) {
            // eslint-disable-next-line no-await-in-loop
            const { journalData } = await sale({ corporateState, vendorState });

            expect(journalData.salesIsInterState).toBe(journalData.isInterState);
        }
    });

    it("ignores letter case when comparing the states", async () => {
        const { journalData } = await sale({ corporateState: "KERALA", vendorState: "Maharashtra" });

        expect(journalData.salesIsInterState).toBe(false);
    });

    it("is intra-state when the customer's state is not known, as it is for the other fees", async () => {
        const { journalData } = await sale({ corporateState: "", vendorState: "Maharashtra" });

        expect(journalData.salesIsInterState).toBe(false);
    });

    it("leaves the commission's state on the vendor", async () => {
        const { journalData } = await sale({ corporateState: "Tamil Nadu", vendorState: "Maharashtra" });

        expect(journalData.vendorIsInterState).toBe(true);
        expect(journalData.salesIsInterState).toBe(true);
    });
});

describe("when a state cannot be told apart", () => {
    const FLAGS = ["isInterState", "vendorIsInterState", "salesIsInterState", "partnerIsInterState"];

    it("is intra-state, a real false, when Peko's own state is not known", async () => {
        partnerLogos.mockResolvedValue(null);

        const { journalData } = await sale({ corporateState: "Tamil Nadu", vendorState: "Maharashtra" });

        FLAGS.forEach(flag => expect(journalData[flag]).toBe(false));
    });

    it("is intra-state, a real false, when Peko's own state is blank", async () => {
        partnerLogos.mockResolvedValue({ state: "   " });

        const { journalData } = await sale({ corporateState: "Tamil Nadu", vendorState: "Maharashtra" });

        FLAGS.forEach(flag => expect(journalData[flag]).toBe(false));
    });

    it.each([[undefined], [null], [""], ["   "]])(
        "is intra-state, a real false, when the other party's state is %p",
        async state => {
            const { journalData } = await sale({ corporateState: state, vendorState: state });

            expect(journalData.isInterState).toBe(false);
            expect(journalData.vendorIsInterState).toBe(false);
            expect(journalData.salesIsInterState).toBe(false);
        }
    );

    it("ignores stray spaces and letter case on either side when comparing", async () => {
        partnerLogos.mockResolvedValue({ state: " Kerala " });

        const { journalData } = await sale({ corporateState: "  KERALA", vendorState: "kerala  " });

        expect(journalData.isInterState).toBe(false);
        expect(journalData.vendorIsInterState).toBe(false);
    });

    it("still tells a different state apart once both are known", async () => {
        const { journalData } = await sale({ corporateState: " Tamil Nadu ", vendorState: "Maharashtra" });

        expect(journalData.isInterState).toBe(true);
        expect(journalData.vendorIsInterState).toBe(true);
        expect(journalData.salesIsInterState).toBe(true);
    });

    it("never leaves a state flag undecided on the journal", async () => {
        for (const [corporateState, vendorState] of [
            [undefined, undefined],
            ["Kerala", undefined],
            [undefined, "Kerala"],
            ["Tamil Nadu", "Maharashtra"],
        ]) {
            // eslint-disable-next-line no-await-in-loop
            const { journalData } = await sale({ corporateState, vendorState });

            FLAGS.forEach(flag => expect(typeof journalData[flag]).toBe("boolean"));
        }
    });
});

describe("the commission mode of the order", () => {
    const item = (commissionMode) => ({
        commissionType: "PERCENTAGE",
        commission: 10,
        amount: 500,
        quantity: 1,
        ...(commissionMode && { commissionMode }),
    });

    const modeOf = async ({ serviceMode, modes }) => {
        const { journalData } = await computeJournalData({
            serviceDetails: { commissionType: "PERCENTAGE", commission: 10, commissionMode: serviceMode, surcharge: 0 },
            planDetails: modes ? modes.map(item) : [],
            pgAmount: 1000,
            amount: 1000,
            paymentMethod: "UPI",
            partnerDetails: { sharePercentage: 0, state: PEKO_STATE },
            corporateState: PEKO_STATE,
        });
        return journalData.commissionMode;
    };

    it("is the service's own mode when the order has no plan lines", async () => {
        expect(await modeOf({ serviceMode: "PRINCIPAL_MARKUP" })).toBe("PRINCIPAL_MARKUP");
        expect(await modeOf({ serviceMode: "AGENT_MARKUP" })).toBe("AGENT_MARKUP");
        expect(await modeOf({ serviceMode: "MARGIN" })).toBe("MARGIN");
        expect(await modeOf({})).toBe("MARGIN");
    });

    it("is MIXED when principal markup items sit with items of any other mode", async () => {
        expect(await modeOf({ modes: ["PRINCIPAL_MARKUP", "MARGIN"] })).toBe("MIXED");
        expect(await modeOf({ modes: ["PRINCIPAL_MARKUP", "AGENT_MARKUP"] })).toBe("MIXED");
        expect(await modeOf({ modes: ["PRINCIPAL_MARKUP", "PRINCIPAL_MARKUP"] })).toBe("PRINCIPAL_MARKUP");
    });

    it("is AGENT_MARKUP when any item is, since agent markup and margin share one commission", async () => {
        expect(await modeOf({ modes: ["AGENT_MARKUP", "MARGIN"] })).toBe("AGENT_MARKUP");
        expect(await modeOf({ modes: ["MARGIN", "MARGIN"] })).toBe("MARGIN");
        expect(await modeOf({ modes: [undefined] })).toBe("MARGIN");
    });
});
