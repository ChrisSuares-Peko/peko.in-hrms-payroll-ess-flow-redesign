const orders = require("../../../models/entities/order");
const { dispatchJournalRetry } = require("../../../utils/bull/queue/accountingQueues");
const { journalContextFor } = require("../../../models/use-cases/journalContext");
const { retryJournal } = require("../orderJournal");

jest.mock("../../../utils/bull/queue/accountingQueues", () => ({ dispatchJournalRetry: jest.fn() }));
jest.mock("../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn(), deleteKey: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));
jest.mock("../../../utils/pekoRecieptHelper", () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));
jest.mock("../../../models/use-cases/journalAccountNames", () => ({ journalAccountNames: jest.fn() }));
jest.mock("../../../models/use-cases/journalContext", () => ({ journalContextFor: jest.fn() }));
jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    loadAccountingFloor: jest.fn(async () => "2026-08-31"),
    goLiveWindowStart: jest.fn(() => new Date("2026-09-01T00:00:00.000Z")),
    isBeforeGoLive: jest.fn(() => false),
}));

const ORDER = {
    corporateTxnId: "TXN-1",
    status: "SUCCESS",
    credentialId: 900,
    serviceOperatorId: 3,
    transactionDate: "2026-09-10T10:00:00.000Z",
    journalData: { vendorPayable: 90, commissionIncludingGST: 10 },
    journalRecordStatus: { transaction: false },
};

const run = async body => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await retryJournal({ params: { corporateTxnId: "TXN-1", journalKey: "transaction" }, body, user: { id: 7 } }, res, next);
    return { res, next, payload: res.json.mock.calls[0] ? res.json.mock.calls[0][0] : null };
};

beforeEach(() => {
    jest.clearAllMocks();
    orders.findOne.mockResolvedValue(ORDER);
    journalContextFor.mockResolvedValue({
        ok: true,
        reportData: { journalData: { vendorPayable: 95, recordJournalEntry: true } },
        amounts: {},
        contextSnapshot: { vendor: null, credentialId: 900, registeredBy: null },
        editedJournalData: { vendorPayable: 95 },
    });
});

describe("the recompute retry and the admin's split edits", () => {
    it("saves the edits only once the books have accepted the entry", async () => {
        dispatchJournalRetry.mockResolvedValue({ success: true, providerJournalId: "Z-1" });

        const { payload } = await run({ journalData: { vendorPayable: 95 } });

        expect(orders.update).toHaveBeenCalledTimes(1);
        expect(orders.update).toHaveBeenCalledWith(
            { journalData: { vendorPayable: 95, commissionIncludingGST: 10 } },
            { where: { corporateTxnId: "TXN-1" } }
        );
        expect(dispatchJournalRetry.mock.invocationCallOrder[0]).toBeLessThan(orders.update.mock.invocationCallOrder[0]);
        expect(payload).toMatchObject({ message: "Journal retried successfully", data: { success: true } });
    });

    it("writes nothing when the books refuse the entry", async () => {
        dispatchJournalRetry.mockResolvedValue({ success: false, reason: "Account inactive" });

        const { payload } = await run({ journalData: { vendorPayable: 95 } });

        expect(orders.update).not.toHaveBeenCalled();
        expect(payload).toMatchObject({ message: "Account inactive", data: { success: false } });
    });

    it("writes nothing when the admin edited nothing", async () => {
        journalContextFor.mockResolvedValue({ ok: true, reportData: {}, amounts: {}, contextSnapshot: {}, editedJournalData: null });
        dispatchJournalRetry.mockResolvedValue({ success: true });

        await run({});

        expect(orders.update).not.toHaveBeenCalled();
    });

    it("passes the context's refusal straight back", async () => {
        journalContextFor.mockResolvedValue({ ok: false, reason: "refundAmount and totalOrderAmount are required to retry an admin refund" });

        const { next } = await run({});

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }));
        expect(dispatchJournalRetry).not.toHaveBeenCalled();
    });
});
