jest.mock("../../providers", () => ({ getAccountingProvider: jest.fn() }));
jest.mock("../lineItemBuilder", () => ({
    buildTransactionLineItems: jest.fn(),
    buildRefundLineItems: jest.fn(),
    buildCashbackLineItems: jest.fn(),
    buildCashbackReversalLineItems: jest.fn(),
    buildAdminRefundLineItems: jest.fn(),
    buildWalletTransferLineItems: jest.fn(),
    applyRoundingAdjustment: jest.fn().mockResolvedValue({ balanced: true }),
}));
jest.mock("../../../models/use-cases/order", () => ({
    persistJournalRecord: jest.fn(),
    findByCorporateTxnId: jest.fn(),
}));
jest.mock("../../../models/use-cases/setting", () => ({ isJournalRecordingEnabled: jest.fn(), getGstRatePct: jest.fn() }));
jest.mock("../manualJournal", () => ({ splitFromLines: jest.fn(), accountNamesById: jest.fn() }));
jest.mock("../journalLock", () => ({ acquireJournalLock: jest.fn(), releaseJournalLock: jest.fn() }));

const { getAccountingProvider } = require("../../providers");
const { buildTransactionLineItems } = require("../lineItemBuilder");
const { persistJournalRecord, findByCorporateTxnId } = require("../../../models/use-cases/order");
const { isJournalRecordingEnabled } = require("../../../models/use-cases/setting");
const { acquireJournalLock } = require("../journalLock");
const { recordJournal, recordDirectLineItems } = require("../recordJournal");

const LINES = [
    { accountId: "A1", direction: "debit", amount: 100 },
    { accountId: "A2", direction: "credit", amount: 100 },
];

beforeEach(() => {
    jest.clearAllMocks();
    acquireJournalLock.mockResolvedValue(true);
    isJournalRecordingEnabled.mockResolvedValue(true);
    findByCorporateTxnId.mockResolvedValue({ journalRecordStatus: {} });
    getAccountingProvider.mockReturnValue({
        name: "zoho",
        journal: { recordJournal: jest.fn().mockResolvedValue({ success: true, providerJournalId: "Z-1" }) },
    });
});

describe("the pipeline keeps Zoho's journal id", () => {
    it("stores the id on the event payload when the books accept the entry", async () => {
        buildTransactionLineItems.mockResolvedValue({ ok: true, lineItems: LINES, journalAccountIds: { paymentGateway: "PG" } });

        const result = await recordJournal({
            reportData: { journalData: { recordJournalEntry: true } },
            corporateTxnId: "TXN-1",
            occurredAt: "2026-09-10T10:00:00.000Z",
        });

        expect(result).toEqual({ success: true, providerJournalId: "Z-1" });
        expect(persistJournalRecord).toHaveBeenCalledWith("TXN-1", "transaction", {
            payload: expect.objectContaining({ journalDate: "2026-09-10", providerJournalId: "Z-1", provider: "zoho" }),
            recorded: true,
            journalAccountIds: { paymentGateway: "PG" },
            reason: undefined,
        });
    });

    it("stores no id when the books refuse it", async () => {
        buildTransactionLineItems.mockResolvedValue({ ok: true, lineItems: LINES, journalAccountIds: {} });
        getAccountingProvider().journal.recordJournal.mockResolvedValue({ success: false, error: "Refused" });

        await recordJournal({ reportData: { journalData: { recordJournalEntry: true } }, corporateTxnId: "TXN-1" });

        const [, , details] = persistJournalRecord.mock.calls[0];
        expect(details.payload.providerJournalId).toBeUndefined();
        expect(details).toMatchObject({ recorded: false, reason: "Refused" });
    });
});

describe("the direct line-item repost", () => {
    it("refuses to repost a journal that is already in the books, touching nothing", async () => {
        findByCorporateTxnId.mockResolvedValue({ journalRecordStatus: { refund: true } });

        const result = await recordDirectLineItems({ corporateTxnId: "TXN-1", lineItems: LINES }, "refund", "Refund journal entry");

        expect(result).toEqual({
            success: false,
            alreadyRecorded: true,
            reason: "This journal is already in the books; use Edit to change it",
        });
        expect(getAccountingProvider().journal.recordJournal).not.toHaveBeenCalled();
        expect(persistJournalRecord).not.toHaveBeenCalled();
    });

    it("still reposts a failed journal and keeps the new id", async () => {
        findByCorporateTxnId.mockResolvedValue({ journalRecordStatus: { refund: false } });

        const result = await recordDirectLineItems({ corporateTxnId: "TXN-1", lineItems: LINES }, "refund", "Refund journal entry");

        expect(result).toEqual({ success: true, providerJournalId: "Z-1" });
        expect(persistJournalRecord).toHaveBeenCalledWith(
            "TXN-1",
            "refund",
            expect.objectContaining({ recorded: true, payload: expect.objectContaining({ providerJournalId: "Z-1" }) })
        );
    });
});
