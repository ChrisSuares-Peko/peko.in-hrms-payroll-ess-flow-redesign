jest.mock("../../providers", () => ({ getAccountingProvider: jest.fn() }));
jest.mock("../lineItemBuilder", () => ({
    buildTransactionLineItems: jest.fn(),
    buildRefundLineItems: jest.fn(),
    buildCashbackLineItems: jest.fn(),
    buildCashbackReversalLineItems: jest.fn(),
    buildAdminRefundLineItems: jest.fn(),
    applyRoundingAdjustment: jest.fn(),
    ACCOUNTS: {
        outputCGST: "Output CGST",
        outputSGST: "Output SGST",
        outputIGST: "Output IGST",
        inputCGST: "Input CGST",
        inputSGST: "Input SGST",
        inputIGST: "Input IGST",
        couponDiscountExpense: "Coupon Discount Expense",
        platformFees: "Platform Fees",
        commission: "Commission",
        sales: "Sales",
        subscriptionFees: "Subscription Fees",
        deferredRevenue: "Deferred Revenue",
        partnershipFees: "Partnership Fees",
        partnershipFeePayable: "Partnership Fee Payable",
        roundingOff: "Rounding Off Account",
        subscribersWallet: "Subscribers Wallet",
        vendorDeposits: "Vendor Deposits",
        cashbackExpense: "Cashback Expense",
    },
}));
jest.mock("../../../models/use-cases/order", () => ({
    persistJournalRecord: jest.fn(),
    findByCorporateTxnId: jest.fn(),
}));
jest.mock("../../../models/use-cases/chartOfAccount", () => ({ findAllByProviderAccountIds: jest.fn() }));
jest.mock("../../../models/use-cases/setting", () => ({ isJournalRecordingEnabled: jest.fn(), getGstRatePct: jest.fn() }));
jest.mock("../journalLock", () => ({ acquireJournalLock: jest.fn(), releaseJournalLock: jest.fn() }));

const { getAccountingProvider } = require("../../providers");
const builders = require("../lineItemBuilder");
const { persistJournalRecord, findByCorporateTxnId } = require("../../../models/use-cases/order");
const { findAllByProviderAccountIds } = require("../../../models/use-cases/chartOfAccount");
const { isJournalRecordingEnabled, getGstRatePct } = require("../../../models/use-cases/setting");
const { acquireJournalLock, releaseJournalLock } = require("../journalLock");
const {
    MANUAL_KEYS,
    JOURNAL_LABELS,
    ALREADY_RECORDED_REASON,
    PAUSED_REASON,
    buildJournalPreview,
    recordManualJournal,
} = require("../manualJournal");

const LINES = [
    { accountId: "A-SALES", direction: "credit", amount: 100 },
    { accountId: "A-BANK", direction: "debit", amount: 100 },
];

const ACTOR = { id: 7, name: "Ibrahim" };

let journalMock;

const provider = () => ({ journal: journalMock });

const balancedRounding = (lineItems) => {
    const debit = lineItems.filter(i => i.direction === "debit").reduce((s, i) => s + i.amount, 0);
    const credit = lineItems.filter(i => i.direction === "credit").reduce((s, i) => s + i.amount, 0);
    return Math.abs(debit - credit) < 0.005
        ? { balanced: true }
        : { balanced: false, reason: `Debit/credit difference (${Math.abs(debit - credit)}) exceeds rounding threshold` };
};

const storedOrder = ({ status = {}, journal = {} } = {}) => ({
    journalRecordStatus: status,
    journalData: { vendorPayable: 90, ...journal },
});

const manual = (overrides = {}, key = "transaction") =>
    recordManualJournal(
        {
            corporateTxnId: "TXN-1",
            lineItems: LINES,
            journalDate: "2026-09-10",
            actor: ACTOR,
            reason: "Worker never ran",
            ...overrides,
        },
        key
    );

beforeEach(() => {
    jest.clearAllMocks();
    acquireJournalLock.mockResolvedValue(true);
    isJournalRecordingEnabled.mockResolvedValue(true);
    getGstRatePct.mockResolvedValue(18);
    builders.applyRoundingAdjustment.mockImplementation(async lineItems => balancedRounding(lineItems));
    findAllByProviderAccountIds.mockImplementation(async ids =>
        ids.map(id => ({ provider_account_id: id, syncStatus: "CREATE_SUCCESS" }))
    );
    findByCorporateTxnId.mockResolvedValue(storedOrder());
    journalMock = {
        recordJournal: jest.fn().mockResolvedValue({ success: true, providerJournalId: "Z-NEW" }),
    };
    getAccountingProvider.mockReturnValue({ name: "zoho", journal: journalMock });
});

describe("the keys and labels manual recording covers", () => {
    it("covers the five order events with the pipeline's own notes labels", () => {
        expect(MANUAL_KEYS).toEqual(["transaction", "refund", "adminRefund", "cashback", "cashbackReversal"]);
        expect(JOURNAL_LABELS.refund).toBe("Refund journal entry");
    });
});

describe("buildJournalPreview", () => {
    it("runs the key's builder with the same inputs as the pipeline and balances the lines, posting nothing", async () => {
        builders.buildRefundLineItems.mockResolvedValue({ ok: true, lineItems: LINES, journalAccountIds: { a: 1 } });

        const preview = await buildJournalPreview(
            {
                reportData: { journalData: { vendorPayable: 90 } },
                corporateTxnId: "TXN-1",
                vendor: { vendorName: "Acme" },
                paymentGatewayName: "Cashfree",
                credentialId: 9,
                registeredBy: "55",
            },
            "refund"
        );

        expect(builders.buildRefundLineItems).toHaveBeenCalledWith(
            expect.objectContaining({
                journalData: { vendorPayable: 90 },
                corporateTxnId: "TXN-1",
                vendor: { vendorName: "Acme" },
                paymentGatewayName: "Cashfree",
                credentialId: 9,
                registeredBy: "55",
            })
        );
        expect(preview).toEqual({
            ok: true,
            lineItems: LINES,
            journalAccountIds: { a: 1 },
            balanced: true,
            reason: null,
        });
        expect(getAccountingProvider).not.toHaveBeenCalled();
        expect(persistJournalRecord).not.toHaveBeenCalled();
    });

    it("passes the builder's own refusal back", async () => {
        builders.buildAdminRefundLineItems.mockResolvedValue({ ok: false, reason: "No stored journal account IDs found" });

        expect(await buildJournalPreview({ corporateTxnId: "TXN-1" }, "adminRefund")).toEqual({
            ok: false,
            reason: "No stored journal account IDs found",
        });
        expect(await buildJournalPreview({ corporateTxnId: "TXN-1" }, "walletTransfer")).toEqual({
            ok: false,
            reason: "Unknown journal key 'walletTransfer'",
        });
    });

    it("turns a builder exception into a reason", async () => {
        builders.buildTransactionLineItems.mockRejectedValue(new Error("boom"));

        expect(await buildJournalPreview({ corporateTxnId: "TXN-1" }, "transaction")).toEqual({
            ok: false,
            reason: "boom",
        });
    });
});

describe("recording a journal by hand", () => {
    it("posts the lines with a manual note and stores the id, the stamp and the edited split", async () => {
        const result = await manual({ journalData: { vendorPayable: 95 }, journalAccountIds: { paymentGateway: "PG1" } });

        expect(result).toEqual({
            success: true,
            action: "recorded",
            providerJournalId: "Z-NEW",
            reason: null,
        });
        expect(provider().journal.recordJournal).toHaveBeenCalledWith(
            expect.objectContaining({
                journalDate: "2026-09-10",
                referenceNumber: "TXN-1",
                notes: "Journal entry for corporate transaction TXN-1 — recorded manually by Ibrahim",
                lineItems: [
                    { accountId: "A-SALES", direction: "credit", amount: 100, description: "TXN-1" },
                    { accountId: "A-BANK", direction: "debit", amount: 100, description: "TXN-1" },
                ],
            })
        );
        expect(persistJournalRecord).toHaveBeenCalledWith("TXN-1", "transaction", {
            payload: expect.objectContaining({
                provider: "zoho",
                providerJournalId: "Z-NEW",
                manual: expect.objectContaining({ action: "recorded", byId: 7, byName: "Ibrahim", reason: "Worker never ran" }),
            }),
            recorded: true,
            journalAccountIds: { paymentGateway: "PG1" },
            reason: undefined,
            flatFields: expect.objectContaining({ vendorPayable: 95, paymentThroughGateway: 100, totalTransactionAmount: 100 }),
        });
        expect(releaseJournalLock).toHaveBeenCalledWith("TXN-1", "transaction");
    });

    it("carries the refund amounts the pipeline stored so a later retry still has them", async () => {
        findByCorporateTxnId.mockResolvedValue(
            storedOrder({ journal: { adminRefund: { skipped: true, refundAmount: 50, totalOrderAmount: 100 } } })
        );

        await manual({}, "adminRefund");

        expect(provider().journal.recordJournal).toHaveBeenCalledWith(
            expect.objectContaining({ refundAmount: 50, totalOrderAmount: 100 })
        );
    });

    it("keeps the refused attempt on the order, without the split edits", async () => {
        provider().journal.recordJournal.mockResolvedValue({ success: false, error: "Account not found" });

        const result = await manual({ journalData: { vendorPayable: 95 } });

        expect(result).toMatchObject({ success: false, action: "recorded", reason: "Account not found" });
        expect(persistJournalRecord).toHaveBeenCalledWith(
            "TXN-1",
            "transaction",
            expect.objectContaining({ recorded: false, reason: "Account not found", flatFields: undefined })
        );
    });

    it("refuses to record over a journal that is already in the books", async () => {
        findByCorporateTxnId.mockResolvedValue(storedOrder({ status: { transaction: true } }));

        expect(await manual()).toEqual({ success: false, alreadyRecorded: true, reason: ALREADY_RECORDED_REASON });
        expect(provider().journal.recordJournal).not.toHaveBeenCalled();
        expect(persistJournalRecord).not.toHaveBeenCalled();
    });

    it("honours the platform-wide pause and changes nothing", async () => {
        isJournalRecordingEnabled.mockResolvedValue(false);

        expect(await manual()).toEqual({ success: false, paused: true, reason: PAUSED_REASON });
        expect(persistJournalRecord).not.toHaveBeenCalled();
    });

    it("refuses accounts that are missing from the chart of accounts or not synced", async () => {
        findAllByProviderAccountIds.mockResolvedValue([
            { provider_account_id: "A-SALES", syncStatus: "CREATE_SUCCESS" },
            { provider_account_id: "A-BANK", syncStatus: "UPDATE_PENDING" },
        ]);

        expect((await manual()).reason).toBe("These accounts are not in the chart of accounts or not synced yet: A-BANK");
        expect(provider().journal.recordJournal).not.toHaveBeenCalled();
    });

    it("refuses unbalanced lines, a missing side or a zero amount", async () => {
        expect(
            (await manual({ lineItems: [LINES[0], { ...LINES[1], amount: 90 }] })).reason
        ).toContain("exceeds rounding threshold");
        expect((await manual({ lineItems: [LINES[0], { ...LINES[1], amount: 0 }] })).reason).toBe(
            "Every line needs an account, a debit or credit side and an amount above zero"
        );
        expect((await manual({ lineItems: [LINES[0]] })).reason).toBe(
            "corporateTxnId, journalDate and at least two line items are required"
        );
        expect((await manual({}, "walletTransfer")).reason).toBe("Unknown journal key 'walletTransfer'");
    });

    it("waits its turn when another attempt holds the lock", async () => {
        acquireJournalLock.mockResolvedValue(false);

        expect(await manual()).toMatchObject({ success: false, locked: true });
        expect(releaseJournalLock).not.toHaveBeenCalled();
    });
});


describe("the split the profiles read, when the record carries none", () => {
    const NAMES = { "A-PG": "Cashfree", "A-COMM": "Commission", "A-CGST": "Output CGST", "A-SGST": "Output SGST", "A-IGST": "Output IGST", "A-DEP": "Vendor Deposits", "A-FEE": "Platform Fees", "A-COUPON": "Coupon Discount Expense", "A-SALES": "Sales", "A-SUBS": "Subscription Fees", "A-DEF": "Deferred Revenue" };
    const LINES_BY_ACCOUNT = [
        { accountId: "A-PG", direction: "debit", amount: 1180 },
        { accountId: "A-COMM", direction: "credit", amount: 100 },
        { accountId: "A-DEP", direction: "credit", amount: 1006 },
        { accountId: "A-FEE", direction: "credit", amount: 50 },
        { accountId: "A-CGST", direction: "credit", amount: 13.5 },
        { accountId: "A-SGST", direction: "credit", amount: 13.5 },
        { accountId: "A-COUPON", direction: "debit", amount: 3 },
    ];

    beforeEach(() => {
        findAllByProviderAccountIds.mockImplementation(async ids =>
            ids.map(id => ({ provider_account_id: id, account_name: NAMES[id], syncStatus: "CREATE_SUCCESS" }))
        );
    });

    it("reads every figure off the lines by account, splits the output GST by the two bases and names the gateway by its account", async () => {
        findByCorporateTxnId.mockResolvedValue({ journalRecordStatus: {}, journalData: null });

        await manual({ lineItems: LINES_BY_ACCOUNT, journalData: undefined, journalAccountIds: undefined });

        expect(persistJournalRecord).toHaveBeenCalledWith("TXN-1", "transaction", expect.objectContaining({
            journalAccountIds: { paymentGateway: "A-PG" },
            flatFields: {
                totalTransactionAmount: 1180,
                paymentThroughGateway: 1180,
                paymentThroughWallet: 0,
                commissionExcludingGST: 100,
                outputGSTonCommission: 18,
                commissionIncludingGST: 118,
                vendorPayable: 1006,
                platformFeeExcludingGST: 50,
                outputGSTonPlatformFee: 9,
                platformFeeIncludingGST: 59,
                couponTotalDiscount: 3,
                paymentGatewayName: "Cashfree",
                commissionMode: "MARGIN",
            },
        }));
    });

    it("reads a sale on Peko's own account off a Sales credit, working the commission back from its GST at the rate", async () => {
        findByCorporateTxnId.mockResolvedValue({ journalRecordStatus: {}, journalData: null });

        await manual({
            lineItems: [
                { accountId: "A-PG", direction: "debit", amount: 9900.18 },
                { accountId: "A-SALES", direction: "credit", amount: 9800 },
                { accountId: "A-FEE", direction: "credit", amount: 1 },
                { accountId: "A-IGST", direction: "credit", amount: 99.18 },
            ],
            journalData: undefined,
            journalAccountIds: undefined,
            commissionMode: "MARGIN",
        });

        expect(persistJournalRecord.mock.calls[0][2].flatFields).toEqual({
            totalTransactionAmount: 9900.18,
            paymentThroughGateway: 9900.18,
            paymentThroughWallet: 0,
            platformFeeExcludingGST: 1,
            commissionExcludingGST: 0,
            outputGSTonCommission: 0,
            commissionIncludingGST: 0,
            vendorPayable: 0,
            principalSalesPayable: 9250,
            principalCommissionExcludingGST: 550,
            outputGSTonPrincipalCommission: 99,
            outputGSTonPlatformFee: 0.18,
            platformFeeIncludingGST: 1.18,
            paymentGatewayName: "Cashfree",
            commissionMode: "PRINCIPAL_MARKUP",
        });
        expect(getGstRatePct).toHaveBeenCalled();
    });

    it("reads a sale on Peko's own account off a revenue credit: GST on the revenue, no commission, no vendor payable, no platform fee", async () => {
        findByCorporateTxnId.mockResolvedValue({ journalRecordStatus: {}, journalData: null });

        await manual({
            lineItems: [
                { accountId: "A-PG", direction: "debit", amount: 290 },
                { accountId: "A-SUBS", direction: "credit", amount: 100 },
                { accountId: "A-DEF", direction: "credit", amount: 145.76 },
                { accountId: "A-CGST", direction: "credit", amount: 22.12 },
                { accountId: "A-SGST", direction: "credit", amount: 22.12 },
            ],
            journalData: undefined,
            journalAccountIds: undefined,
        });

        expect(persistJournalRecord.mock.calls[0][2].flatFields).toEqual({
            totalTransactionAmount: 290,
            paymentThroughGateway: 290,
            paymentThroughWallet: 0,
            netSubscriptionIncome: 245.76,
            outputGSTonRevenue: 44.24,
            paymentGatewayName: "Cashfree",
            commissionMode: "OWN_REVENUE",
        });
    });

    it("stores no mode, and no figure it cannot read, when the lines say nothing and none was stated", async () => {
        findByCorporateTxnId.mockResolvedValue({ journalRecordStatus: {}, journalData: null });
        const silent = [
            { accountId: "A-PG", direction: "debit", amount: 100 },
            { accountId: "A-OTHER", direction: "credit", amount: 100 },
        ];

        await manual({ lineItems: silent, journalData: undefined, journalAccountIds: undefined });
        expect(persistJournalRecord.mock.calls[0][2].flatFields).toEqual({
            totalTransactionAmount: 100,
            paymentThroughGateway: 100,
            paymentThroughWallet: 0,
            paymentGatewayName: "Cashfree",
        });
    });

    it("keeps the mode and the facts the set-up stated over what the lines suggest", async () => {
        findByCorporateTxnId.mockResolvedValue({ journalRecordStatus: {}, journalData: null });

        await manual({
            lineItems: LINES_BY_ACCOUNT,
            journalData: { commissionMode: "OWN_REVENUE", paymentGatewayName: "Cashfree", isInterState: true, vendorPayable: 1006 },
            journalAccountIds: undefined,
        });

        expect(persistJournalRecord.mock.calls[0][2].flatFields).toMatchObject({
            commissionMode: "OWN_REVENUE",
            paymentGatewayName: "Cashfree",
            isInterState: true,
            vendorPayable: 1006,
        });
    });

    it("reads a mixed order off lines that carry both a Sales credit and a commission, splitting the GST three ways at the rate", async () => {
        findByCorporateTxnId.mockResolvedValue({ journalRecordStatus: {}, journalData: null });

        await manual({
            lineItems: [
                { accountId: "A-PG", direction: "debit", amount: 1200 },
                { accountId: "A-SALES", direction: "credit", amount: 590 },
                { accountId: "A-COMM", direction: "credit", amount: 100 },
                { accountId: "A-DEP", direction: "credit", amount: 400 },
                { accountId: "A-FEE", direction: "credit", amount: 50 },
                { accountId: "A-IGST", direction: "credit", amount: 60 },
            ],
            journalData: undefined,
            journalAccountIds: undefined,
        });

        expect(persistJournalRecord.mock.calls[0][2].flatFields).toMatchObject({
            commissionMode: "MIXED",
            commissionExcludingGST: 100,
            outputGSTonCommission: 18,
            commissionIncludingGST: 118,
            vendorPayable: 400,
            principalSalesPayable: 406.67,
            principalCommissionExcludingGST: 183.33,
            outputGSTonPrincipalCommission: 33,
            outputGSTonPlatformFee: 9,
            platformFeeIncludingGST: 59,
        });
    });

    it("never overwrites a figure the order already carries, and lets the typed split win over the lines", async () => {
        findByCorporateTxnId.mockResolvedValue(storedOrder());

        await manual({ lineItems: LINES_BY_ACCOUNT, journalData: { platformFeeExcludingGST: 40 }, journalAccountIds: undefined });

        const { flatFields } = persistJournalRecord.mock.calls[0][2];
        expect(flatFields.vendorPayable).toBeUndefined();
        expect(flatFields.platformFeeExcludingGST).toBe(40);
        expect(flatFields.commissionExcludingGST).toBe(100);
        expect(flatFields.commissionMode).toBe("MARGIN");
    });

    it("derives nothing for a refund or a cashback", async () => {
        findByCorporateTxnId.mockResolvedValue(storedOrder({ status: { transaction: true }, journal: { refund: { skipped: true } } }));
        await manual({ lineItems: LINES_BY_ACCOUNT, journalData: undefined, journalAccountIds: undefined }, "refund");
        expect(persistJournalRecord.mock.calls[0][2].flatFields).toBeUndefined();
    });
});
