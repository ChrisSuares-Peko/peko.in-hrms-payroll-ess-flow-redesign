const order = require("../../entities/order");
const { persistJournalRecord } = require("../order");

beforeEach(() => jest.clearAllMocks());

const existing = (journalData, journalRecordStatus = {}) => {
    order.findOne.mockResolvedValue({ journalData, journalRecordStatus });
};

const written = () => order.update.mock.calls[0][0];

describe("persistJournalRecord", () => {
    it("writes the event payload and verdict next to what is already there", async () => {
        existing({ vendorPayable: 90, transaction: { lineItems: [] } }, { transaction: true });

        await persistJournalRecord("TXN-1", "refund", { payload: { lineItems: [1] }, recorded: false, reason: "Refused" });

        expect(written()).toEqual({
            journalData: { vendorPayable: 90, transaction: { lineItems: [] }, refund: { lineItems: [1], reason: "Refused" } },
            journalRecordStatus: { transaction: true, refund: false },
        });
        expect(order.update.mock.calls[0][1]).toEqual({ where: { corporateTxnId: "TXN-1" } });
    });

    it("merges the account ids a refund records into the slot instead of replacing it", async () => {
        existing({ journalAccountIds: { isInternalAccount: false, paymentGateway: "PG1", commission: "C1" } });

        await persistJournalRecord("TXN-1", "refund", {
            payload: {},
            recorded: true,
            journalAccountIds: { isInternalAccount: false, inputCGST: "I1" },
        });

        expect(written().journalData.journalAccountIds).toEqual({
            isInternalAccount: false,
            paymentGateway: "PG1",
            commission: "C1",
            inputCGST: "I1",
        });
    });

    it("writes the edited split figures only when the caller passes them", async () => {
        existing({ vendorPayable: 90, commissionIncludingGST: 10 });

        await persistJournalRecord("TXN-1", "transaction", { payload: {}, recorded: true, flatFields: { vendorPayable: 95 } });
        expect(written().journalData).toMatchObject({ vendorPayable: 95, commissionIncludingGST: 10 });

        order.update.mockClear();
        await persistJournalRecord("TXN-1", "transaction", { payload: {}, recorded: false });
        expect(written().journalData).toMatchObject({ vendorPayable: 90 });
    });

    it("does nothing without a transaction id", async () => {
        await persistJournalRecord(null, "transaction", { payload: {}, recorded: true });
        expect(order.update).not.toHaveBeenCalled();
    });
});
