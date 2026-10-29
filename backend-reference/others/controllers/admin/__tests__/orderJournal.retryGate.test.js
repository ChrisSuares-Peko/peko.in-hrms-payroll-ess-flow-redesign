const orders = require("../../../models/entities/order");
const serviceOperator = require("../../../models/entities/serviceOperator");
const credential = require("../../../models/entities/credential");
const vendor = require("../../../models/entities/vendor");
const { dispatchJournalRetry } = require("../../../utils/bull/queue/accountingQueues");
const { refreshConfigurationGaps } = require("../../../models/use-cases/journalConfigurationGate");
const { retryJournal } = require("../orderJournal");

jest.mock("../../../utils/bull/queue/accountingQueues", () => ({ dispatchJournalRetry: jest.fn() }));
jest.mock("../../../models/use-cases/journalConfigurationGate", () => ({
    ...jest.requireActual("../../../models/use-cases/journalConfigurationGate"),
    refreshConfigurationGaps: jest.fn(),
}));
jest.mock("../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn(), deleteKey: jest.fn() }));
jest.mock("../../../utils/pekoRecieptHelper", () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));
jest.mock("../../../models/use-cases/chartOfAccount", () => ({ findAllByProviderAccountIds: jest.fn() }));
jest.mock("../../../models/use-cases/credential", () => ({ findOneCredential: jest.fn() }));
jest.mock("../../../models/use-cases/serviceOperator", () => ({ findServiceOperatorById: jest.fn() }));
jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    loadAccountingFloor: jest.fn(async () => "2026-08-31"),
    goLiveWindowStart: jest.fn(() => new Date("2026-09-01T00:00:00.000Z")),
    isBeforeGoLive: jest.fn(() => false),
}));

const STORED = {
    vendorPayable: 70698.35,
    commissionExcludingGST: 1.4,
    recordJournalEntry: false,
    commissionNotConfiguredFor: "Electricity Bill",
};

const ORDER = {
    corporateTxnId: "1791010579744",
    status: "SUCCESS",
    serviceOperatorId: 12,
    credentialId: 501,
    transactionDate: "2026-10-03T06:56:00.000Z",
    journalData: STORED,
    journalRecordStatus: { transaction: false },
};

const run = async (journalKey, body = {}) => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await retryJournal({ params: { corporateTxnId: ORDER.corporateTxnId, journalKey }, body }, res, next);
    return { res, next, body: res.json.mock.calls[0] && res.json.mock.calls[0][0] };
};

beforeEach(() => {
    jest.clearAllMocks();
    orders.findOne.mockResolvedValue(ORDER);
    orders.update.mockResolvedValue([1]);
    serviceOperator.findOne.mockResolvedValue({ id: 12, vendorId: 9 });
    vendor.findOne.mockResolvedValue({ vendorName: "BBPS" });
    credential.findOne.mockResolvedValue({ registeredBy: null });
});

describe("retrying a journal held back for an unconfigured commission or platform fee", () => {
    it("tells the admin what to configure and touches nothing while it is still not configured", async () => {
        const reason =
            'Commission for "Electricity Bill" is still not marked as configured. Mark the service\'s commission as configured, then retry.';
        refreshConfigurationGaps.mockResolvedValue({ journalData: STORED, refusal: reason });

        const { res, body, next } = await run("transaction");

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(body).toMatchObject({ status: true, message: reason, data: { success: false, skipped: true, reason } });
        expect(orders.update).not.toHaveBeenCalled();
        expect(dispatchJournalRetry).not.toHaveBeenCalled();
    });

    it("posts with the marker cleared once configured, saving the cleared figures first", async () => {
        const cleared = { vendorPayable: 70698.35, commissionExcludingGST: 1.4, recordJournalEntry: false };
        refreshConfigurationGaps.mockResolvedValue({ journalData: cleared, refusal: null });
        dispatchJournalRetry.mockResolvedValue({ success: true, providerJournalId: "Z-1" });

        const { body } = await run("transaction");

        expect(refreshConfigurationGaps).toHaveBeenCalledWith(ORDER, STORED);
        expect(orders.update).toHaveBeenCalledWith(
            { journalData: cleared },
            { where: { corporateTxnId: ORDER.corporateTxnId } }
        );
        expect(dispatchJournalRetry.mock.calls[0][0]).toMatchObject({
            transactionRef: ORDER.corporateTxnId,
            type: "payment",
            reportData: { journalData: { ...cleared, recordJournalEntry: true } },
        });
        expect(body).toMatchObject({ status: true, message: "Journal retried successfully" });
    });

    it("hands the edited figures to the check so the stored markers still decide", async () => {
        refreshConfigurationGaps.mockResolvedValue({ journalData: STORED, refusal: "still not configured" });

        await run("transaction", { journalData: { vendorPayable: 70000 } });

        expect(refreshConfigurationGaps).toHaveBeenCalledWith(ORDER, { ...STORED, vendorPayable: 70000 });
    });

    it("leaves wallet journals, which carry no commission or platform fee, out of the check", async () => {
        orders.findOne.mockResolvedValue({ ...ORDER, journalData: { ...STORED, cashback: { amount: 25 } } });
        dispatchJournalRetry.mockResolvedValue({ success: true });

        await run("cashback");

        expect(refreshConfigurationGaps).not.toHaveBeenCalled();
        expect(dispatchJournalRetry.mock.calls[0][0]).toMatchObject({ type: "cashbackCredit", amounts: { amount: 25 } });
    });
});
