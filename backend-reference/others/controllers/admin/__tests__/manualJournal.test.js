const orders = require("../../../models/entities/order");
const useCases = require("../../../models/use-cases/manualJournal");
const { dispatchJournalRetry } = require("../../../utils/bull/queue/accountingQueues");
const { dropAccountingCaches } = require("../../../models/use-cases/accountingPeriod");
const { journalContextFor } = require("../../../models/use-cases/journalContext");
const { suggestJournalLines } = require("../../../models/use-cases/journalSuggestion");
const {
    getManualJournal,
    listManualJournalAccounts,
    previewManualJournal,
    generateManualJournalSplit,
    recordManualJournal,
} = require("../manualJournal");

jest.mock("../../../utils/bull/queue/accountingQueues", () => ({ dispatchJournalRetry: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));
jest.mock("../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn(), deleteKey: jest.fn() }));
jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    ...jest.requireActual("../../../models/use-cases/accountingPeriod"),
    dropAccountingCaches: jest.fn(),
}));
jest.mock("../../../models/use-cases/journalContext", () => ({ journalContextFor: jest.fn() }));
jest.mock("../../../models/use-cases/journalSuggestion", () => ({ suggestJournalLines: jest.fn() }));
jest.mock("../../../models/use-cases/manualJournalSetup", () => ({ splitTemplateFor: jest.fn() }));
jest.mock("../../../models/use-cases/journalAccountNames", () => ({
    withAccountNames: jest.fn(async lines => lines.map(line => ({ ...line, accountName: `Name of ${line.accountId}` }))),
}));
jest.mock("../../../models/use-cases/manualJournal", () => ({
    ...jest.requireActual("../../../models/use-cases/manualJournal"),
    buildLookup: jest.fn(),
    listPostableAccounts: jest.fn(),
    recordAdjustment: jest.fn(),
    serializeAdjustment: jest.fn(row => ({ id: row.id, serialized: true })),
}));

const LINES = [
    { accountId: "A1", direction: "credit", amount: 100 },
    { accountId: "A2", direction: "debit", amount: 100 },
];

const EVENT = (overrides = {}) => ({
    key: "transaction",
    label: "Sale",
    verdict: null,
    journal: null,
    defaults: { journalDate: "2026-09-10" },
    eligibility: { canRecord: true, reasons: ["Not in the books yet; record it first"] },
    warnings: [],
    ...overrides,
});

const lookup = (overrides = {}) => ({
    order: { corporateTxnId: "TXN-1" },
    split: { vendorPayable: 90 },
    recordingPaused: false,
    beforeGoLive: false,
    accountingFloor: "2026-08-31",
    events: [EVENT(), EVENT({ key: "refund", label: "Refund", defaults: { journalDate: "2026-09-12" } }), EVENT({ key: "cashback", defaults: { journalDate: "2026-09-10", amount: 12 } })],
    history: [],
    ...overrides,
});

const run = async (handler, { params = {}, body = {} } = {}) => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await handler({ params, body, user: { id: 7, name: "Ibrahim" } }, res, next);
    return { res, next, payload: res.json.mock.calls[0] ? res.json.mock.calls[0][0] : null };
};

const ENTRY = { journalDate: "2026-09-10", lineItems: LINES, journalData: { vendorPayable: 95 }, reason: "Worker never ran" };

beforeEach(() => {
    jest.clearAllMocks();
    useCases.buildLookup.mockResolvedValue(lookup());
    useCases.recordAdjustment.mockImplementation(async row => ({ id: 9, ...row }));
    orders.findOne.mockResolvedValue({ corporateTxnId: "TXN-1", journalData: { vendorPayable: 90 } });
    journalContextFor.mockResolvedValue({
        ok: true,
        reportData: { journalData: { vendorPayable: 90 } },
        amounts: {},
        contextSnapshot: { vendor: null, credentialId: 900, registeredBy: null },
    });
    dispatchJournalRetry.mockResolvedValue({ success: true, action: "recorded", providerJournalId: "Z-1", reason: null });
});

describe("looking an order up", () => {
    it("returns the lookup, or 404 for an unknown order", async () => {
        const { payload } = await run(getManualJournal, { params: { corporateTxnId: "TXN-1" } });
        expect(payload).toMatchObject({ status: true, data: lookup(), responseCode: "000" });

        useCases.buildLookup.mockResolvedValue(null);
        const { next } = await run(getManualJournal, { params: { corporateTxnId: "NOPE" } });
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }));
    });

    it("lists the accounts an entry may post to", async () => {
        useCases.listPostableAccounts.mockResolvedValue([{ id: "A1", name: "Commission" }]);
        const { payload } = await run(listManualJournalAccounts);
        expect(payload.data).toEqual({ accounts: [{ id: "A1", name: "Commission" }] });
    });
});

describe("previewing the lines", () => {
    it("asks the worker to build without posting, filling the event's defaults, and names the accounts", async () => {
        dispatchJournalRetry.mockResolvedValue({ ok: true, lineItems: LINES, journalAccountIds: { paymentGateway: "PG1" }, balanced: true, reason: null });

        const { payload } = await run(previewManualJournal, {
            params: { corporateTxnId: "TXN-1", journalKey: "cashback" },
            body: { journalData: { vendorPayable: 95 } },
        });

        expect(journalContextFor).toHaveBeenCalledWith(
            expect.objectContaining({ corporateTxnId: "TXN-1" }),
            "cashback",
            { editedJournalData: { vendorPayable: 95 }, amount: 12, refundAmount: undefined, totalOrderAmount: undefined }
        );
        expect(dispatchJournalRetry).toHaveBeenCalledWith(
            expect.objectContaining({ transactionRef: "TXN-1", type: "journalPreview", journalKey: "cashback", sourceMs: "others-manual-operations" })
        );
        expect(payload.data).toEqual({
            ok: true,
            lineItems: [expect.objectContaining({ accountId: "A1", accountName: "Name of A1" }), expect.anything()],
            journalAccountIds: { paymentGateway: "PG1" },
            balanced: true,
            reason: null,
        });
    });

    it("suggests the usual rows when the builder cannot work the lines out, and refuses an unknown event or order", async () => {
        const suggested = [{ accountId: null, accountName: "Cashfree", direction: "debit", amount: 1180, description: "TXN-1" }];
        dispatchJournalRetry.mockResolvedValue({ ok: false, reason: "No COA accounts found" });
        suggestJournalLines.mockResolvedValue({ lineItems: suggested, split: { vendorPayable: null } });
        const { payload } = await run(previewManualJournal, { params: { corporateTxnId: "TXN-1", journalKey: "transaction" } });
        expect(suggestJournalLines).toHaveBeenCalledWith(
            expect.objectContaining({ journalKey: "transaction", lookupOrder: { corporateTxnId: "TXN-1" }, order: expect.objectContaining({ corporateTxnId: "TXN-1" }) })
        );
        expect(payload.data).toEqual({ ok: false, suggested: true, lineItems: suggested, split: { vendorPayable: null }, journalAccountIds: null, balanced: false, reason: "No COA accounts found" });

        dispatchJournalRetry.mockResolvedValue({ ok: true, lineItems: [], journalAccountIds: null, balanced: true, reason: null });
        const empty = await run(previewManualJournal, { params: { corporateTxnId: "TXN-1", journalKey: "transaction" } });
        expect(empty.payload.data).toMatchObject({ ok: false, suggested: true, lineItems: suggested, reason: null });

        const unknown = await run(previewManualJournal, { params: { corporateTxnId: "TXN-1", journalKey: "walletTransfer" } });
        expect(unknown.next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }));

        orders.findOne.mockResolvedValue(null);
        const missing = await run(previewManualJournal, { params: { corporateTxnId: "NOPE", journalKey: "transaction" } });
        expect(missing.next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }));
    });

    it("turns a dispatch that never came back into a 504", async () => {
        dispatchJournalRetry.mockRejectedValue(new Error("[journal retry dispatch] type: journalPreview timeout after 30000ms"));
        const { next } = await run(previewManualJournal, { params: { corporateTxnId: "TXN-1", journalKey: "transaction" } });
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 504 }));
    });
});

describe("recording an entry", () => {
    const params = { corporateTxnId: "TXN-1", journalKey: "transaction" };

    it("posts through the worker with the actor, writes the audit row and drops the caches", async () => {
        const { payload } = await run(recordManualJournal, { params, body: ENTRY });

        expect(dispatchJournalRetry).toHaveBeenCalledWith({
            transactionRef: "TXN-1",
            type: "manualJournal",
            journalKey: "transaction",
            lineItems: LINES,
            journalDate: "2026-09-10",
            journalData: { vendorPayable: 95 },
            journalAccountIds: undefined,
            actor: { id: 7, name: "Ibrahim" },
            reason: "Worker never ran",
            sourceMs: "others-manual-operations",
        });
        expect(useCases.recordAdjustment).toHaveBeenCalledWith({
            corporateTxnId: "TXN-1",
            journalKey: "transaction",
            result: { success: true, action: "recorded", providerJournalId: "Z-1", reason: null },
            before: { split: { vendorPayable: 90 }, lineItems: null },
            after: { split: { vendorPayable: 95 }, lineItems: LINES },
            journalDate: "2026-09-10",
            reason: "Worker never ran",
            actor: { id: 7, name: "Ibrahim" },
        });
        expect(dropAccountingCaches).toHaveBeenCalled();
        expect(payload).toMatchObject({
            status: true,
            message: "Journal posted to the books",
            data: { success: true, action: "recorded", providerJournalId: "Z-1", history: { id: 9, serialized: true } },
        });
    });

    it("keeps a refused attempt in the history and leaves the caches alone", async () => {
        dispatchJournalRetry.mockResolvedValue({ success: false, action: "recorded", reason: "Account inactive" });

        const { payload } = await run(recordManualJournal, { params, body: ENTRY });

        expect(useCases.recordAdjustment).toHaveBeenCalledWith(expect.objectContaining({ result: expect.objectContaining({ success: false }) }));
        expect(dropAccountingCaches).not.toHaveBeenCalled();
        expect(payload).toMatchObject({ message: "Account inactive", data: { success: false, reason: "Account inactive" } });
    });

    it("writes no history when the worker refused before reaching the books", async () => {
        dispatchJournalRetry.mockResolvedValue({ success: false, alreadyRecorded: true, reason: "already" });

        const { payload } = await run(recordManualJournal, { params, body: ENTRY });

        expect(useCases.recordAdjustment).not.toHaveBeenCalled();
        expect(payload.data).toMatchObject({ success: false, history: null });
    });

    it("answers pending when the worker did not come back in time", async () => {
        dispatchJournalRetry.mockRejectedValue(new Error("timeout"));

        const { payload } = await run(recordManualJournal, { params, body: ENTRY });

        expect(payload.data).toEqual({ success: false, pending: true, reason: "Still posting — refresh in a moment to see the outcome" });
        expect(useCases.recordAdjustment).not.toHaveBeenCalled();
    });

    it("refuses what the records do not allow, a paused platform and a bad date", async () => {
        useCases.buildLookup.mockResolvedValue(
            lookup({ events: [EVENT({ eligibility: { canRecord: false, reasons: ["This order is still pending; nothing final to record"] } })] })
        );
        let { next } = await run(recordManualJournal, { params, body: ENTRY });
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400, message: "This order is still pending; nothing final to record" }));

        useCases.buildLookup.mockResolvedValue(lookup({ recordingPaused: true }));
        ({ next } = await run(recordManualJournal, { params, body: ENTRY }));
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }));

        useCases.buildLookup.mockResolvedValue(lookup());
        ({ next } = await run(recordManualJournal, { params, body: { ...ENTRY, journalDate: "2026-08-01" } }));
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400, message: "The journal date cannot be before the accounting go-live date" }));
        expect(dispatchJournalRetry).not.toHaveBeenCalled();
    });
});


describe("working the split figures out from the set-up", () => {
    const { splitTemplateFor } = require("../../../models/use-cases/manualJournalSetup");
    const SETUP = { paymentThrough: "GATEWAY", orderAmount: 1104.84, pgAmount: 1365.58 };
    const params = { corporateTxnId: "TXN-1", journalKey: "transaction" };

    it("answers the template for an order with no figures, from the set-up sent and the order's own facts", async () => {
        useCases.buildLookup.mockResolvedValue(
            lookup({ order: { corporateTxnId: "TXN-1", customer: { state: "Goa" }, partnerId: 55 }, split: {}, setup: { paymentThrough: "GATEWAY" } })
        );
        orders.findOne.mockResolvedValue({ corporateTxnId: "TXN-1", serviceOperatorId: 3, journalData: null });
        splitTemplateFor.mockResolvedValue({ split: { paymentThroughGateway: 1365.58 }, enabledKeys: ["paymentThroughGateway"], facts: { commissionMode: "PRINCIPAL_MARKUP" }, journalAccountIds: null });

        const { payload } = await run(generateManualJournalSplit, { params, body: SETUP });

        expect(splitTemplateFor).toHaveBeenCalledWith({
            order: { corporateTxnId: "TXN-1", serviceOperatorId: 3, journalData: null },
            customerState: "Goa",
            partnerId: 55,
            setup: SETUP,
        });
        expect(payload).toMatchObject({ status: true, data: { split: { paymentThroughGateway: 1365.58 }, enabledKeys: ["paymentThroughGateway"] } });
    });

    it("refuses an event other than the sale, an unknown order and an order that already carries a split", async () => {
        const other = await run(generateManualJournalSplit, { params: { corporateTxnId: "TXN-1", journalKey: "refund" }, body: SETUP });
        expect(other.next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }));

        useCases.buildLookup.mockResolvedValue(null);
        const missing = await run(generateManualJournalSplit, { params, body: SETUP });
        expect(missing.next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }));

        useCases.buildLookup.mockResolvedValue(lookup({ setup: null }));
        const carried = await run(generateManualJournalSplit, { params, body: SETUP });
        expect(carried.next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409, message: "This order already carries a split" }));
        expect(splitTemplateFor).not.toHaveBeenCalled();
    });
});
