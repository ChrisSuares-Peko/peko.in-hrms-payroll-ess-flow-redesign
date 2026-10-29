const orders = require("../../entities/order");
const serviceOperator = require("../../entities/serviceOperator");
const vendor = require("../../entities/vendor");
const credential = require("../../entities/credential");
const { refreshConfigurationGaps } = require("../journalConfigurationGate");
const { WALLET_JOURNAL_KEYS, journalContextFor, settleConfigurationGaps } = require("../journalContext");

jest.mock("../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn(), deleteKey: jest.fn() }));
jest.mock("../journalConfigurationGate", () => ({
    ...jest.requireActual("../journalConfigurationGate"),
    refreshConfigurationGaps: jest.fn(),
}));

const order = (overrides = {}) => ({
    corporateTxnId: "TXN-1",
    credentialId: 900,
    serviceOperatorId: 3,
    journalData: { vendorPayable: 90, recordJournalEntry: false, adminRefund: { refundAmount: 50, totalOrderAmount: 100 }, cashback: { amount: 12 } },
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();
    serviceOperator.findOne.mockResolvedValue({ id: 3, vendorId: 1 });
    vendor.findOne.mockResolvedValue({ vendorName: "Acme" });
    credential.findOne.mockResolvedValue({ registeredBy: "55" });
    refreshConfigurationGaps.mockImplementation(async (_order, journalData) => ({ journalData, refusal: null }));
});

describe("journalContextFor", () => {
    it("assembles the sale context with the split edits folded in and the operator toggle forced on", async () => {
        const context = await journalContextFor(order(), "transaction", { editedJournalData: { vendorPayable: 95 } });

        expect(context).toEqual({
            ok: true,
            reportData: { journalData: expect.objectContaining({ vendorPayable: 95, recordJournalEntry: true }) },
            amounts: {},
            contextSnapshot: { vendor: { vendorName: "Acme" }, credentialId: 900, registeredBy: "55" },
            editedJournalData: { vendorPayable: 95 },
        });
    });

    it("reports no split edits when none were given", async () => {
        expect((await journalContextFor(order(), "transaction")).editedJournalData).toBeNull();
        expect((await journalContextFor(order(), "transaction", { editedJournalData: {} })).editedJournalData).toBeNull();
    });

    it("skips the vendor lookup for subscriptions and wallet events", async () => {
        await journalContextFor(order({ journalData: { netSubscriptionIncome: 200 } }), "transaction");
        expect(serviceOperator.findOne).not.toHaveBeenCalled();

        const wallet = await journalContextFor(order(), "cashback");
        expect(serviceOperator.findOne).not.toHaveBeenCalled();
        expect(wallet).toMatchObject({ ok: true, reportData: undefined, amounts: { amount: 12 }, editedJournalData: null });
        expect(WALLET_JOURNAL_KEYS.has("cashbackReversal")).toBe(true);
    });

    it("needs a positive amount for a wallet event and both amounts for an admin refund", async () => {
        expect(await journalContextFor(order({ journalData: {} }), "cashback")).toEqual({
            ok: false,
            reason: "A positive amount is required to retry a wallet journal",
        });
        expect((await journalContextFor(order({ journalData: {} }), "cashback", { amount: 5 })).amounts).toEqual({ amount: 5 });

        expect(await journalContextFor(order({ journalData: {} }), "adminRefund")).toEqual({
            ok: false,
            reason: "refundAmount and totalOrderAmount are required to retry an admin refund",
        });
        expect((await journalContextFor(order(), "adminRefund")).amounts).toEqual({ refundAmount: 50, totalOrderAmount: 100 });
    });
});

describe("the commission and platform-fee hold", () => {
    const HELD = 'Commission for "Electricity Bill" is still not marked as configured. Mark the commission of the service as configured, then retry.';
    const stored = { vendorPayable: 90, recordJournalEntry: false, commissionNotConfiguredFor: "Electricity Bill" };

    it("holds a sale or refund while the marker still stands and writes nothing", async () => {
        refreshConfigurationGaps.mockResolvedValue({ journalData: stored, refusal: HELD });

        const context = await journalContextFor(order({ journalData: stored }), "transaction", { editedJournalData: { vendorPayable: 95 } });

        expect(refreshConfigurationGaps).toHaveBeenCalledWith(expect.objectContaining({ corporateTxnId: "TXN-1" }), { ...stored, vendorPayable: 95 });
        expect(context).toEqual({ ok: false, held: true, reason: HELD });
        expect(orders.update).not.toHaveBeenCalled();
        expect(serviceOperator.findOne).not.toHaveBeenCalled();
    });

    it("drops a marker the live flags no longer justify, saving the stored figures without it before the entry is built", async () => {
        refreshConfigurationGaps.mockImplementation(async (_order, journalData) => {
            const rest = { ...journalData };
            delete rest.commissionNotConfiguredFor;
            return { journalData: rest, refusal: null };
        });

        const context = await journalContextFor(order({ journalData: stored }), "transaction", { editedJournalData: { vendorPayable: 95 } });

        expect(orders.update).toHaveBeenCalledWith(
            { journalData: { vendorPayable: 90, recordJournalEntry: false } },
            { where: { corporateTxnId: "TXN-1" } }
        );
        expect(context.reportData).toEqual({ journalData: { vendorPayable: 95, recordJournalEntry: true } });
        expect(context.editedJournalData).toEqual({ vendorPayable: 95 });
    });

    it("leaves wallet events out of the check", async () => {
        await journalContextFor(order(), "cashback");
        expect(refreshConfigurationGaps).not.toHaveBeenCalled();
    });

    it("settles the stored markers on their own for a lookup, writing only when one was dropped", async () => {
        refreshConfigurationGaps.mockResolvedValue({ journalData: { vendorPayable: 90, recordJournalEntry: false }, refusal: null });
        expect(await settleConfigurationGaps(order({ journalData: stored }), stored)).toEqual({
            held: null,
            journalData: { vendorPayable: 90, recordJournalEntry: false },
        });
        expect(orders.update).toHaveBeenCalledTimes(1);

        orders.update.mockClear();
        await settleConfigurationGaps(order({ journalData: { vendorPayable: 90 } }), { vendorPayable: 90 });
        expect(orders.update).not.toHaveBeenCalled();

        refreshConfigurationGaps.mockResolvedValue({ journalData: stored, refusal: HELD });
        expect(await settleConfigurationGaps(order({ journalData: stored }), stored)).toEqual({ held: HELD, journalData: stored });
        expect(orders.update).not.toHaveBeenCalled();
    });
});
