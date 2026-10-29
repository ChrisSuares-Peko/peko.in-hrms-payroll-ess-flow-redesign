const orders = require("../../entities/order");
const transactions = require("../../entities/transaction");
const chartOfAccounts = require("../../entities/chartOfAccount");
const journalAdjustments = require("../../entities/journalAdjustment");
const corporateUser = require("../../entities/corporateUser");
const systemUser = require("../../entities/systemUser");
const { findOneCredential } = require("../credential");
const { getASetting } = require("../setting");
const { loadAccountingFloor } = require("../accountingPeriod");
const { settleConfigurationGaps } = require("../journalContext");
const {
    MANUAL_KEYS,
    splitOf,
    defaultsOf,
    eligibilityOf,
    warningsOf,
    journalDateProblem,
    buildLookup,
    listPostableAccounts,
    recordAdjustment,
    serializeAdjustment,
} = require("../manualJournal");

jest.mock("../credential", () => ({ findOneCredential: jest.fn() }));
jest.mock("../setting", () => ({ getASetting: jest.fn() }));
jest.mock("../accountingPeriod", () => ({
    ...jest.requireActual("../accountingPeriod"),
    loadAccountingFloor: jest.fn(),
}));
jest.mock("../journalContext", () => ({
    ...jest.requireActual("../journalContext"),
    settleConfigurationGaps: jest.fn(),
}));
jest.mock("../journalAccountNames", () => ({
    withAccountNames: jest.fn(async lines => lines.map(line => ({ ...line, accountName: `Name of ${line.accountId}` }))),
}));
jest.mock("../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn(), deleteKey: jest.fn() }));

const LINES = [
    { accountId: "A1", direction: "credit", amount: 100 },
    { accountId: "A2", direction: "debit", amount: 100 },
];

const order = (overrides = {}) => ({
    id: 7,
    corporateTxnId: "TXN-1",
    transactionDate: "2026-09-10T10:00:00.000Z",
    status: "SUCCESS",
    amountInINR: "1180.0000",
    paymentMode: "PAYMENT GATEWAY",
    credentialId: 900,
    serviceOperatorId: 3,
    orderResponse: null,
    journalData: { vendorPayable: 90, commissionIncludingGST: 10, journalAccountIds: { paymentGateway: "PG1" } },
    journalRecordStatus: {},
    serviceOperator: { id: 3, serviceProvider: "Electricity Bill", vendorId: 1 },
    credential: { id: 900, name: "Al Rams", username: "100000900", registeredBy: "55" },
    ...overrides,
});

const context = (overrides = {}) => ({
    order: order(),
    key: "transaction",
    verdicts: {},
    journalData: {},
    walletRows: [],
    beforeGoLive: false,
    ...overrides,
});

const DATE_FIXED = new Date("2026-10-02T09:00:00.000Z");

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: DATE_FIXED, doNotFake: ["nextTick", "setImmediate", "setTimeout", "setInterval"] });
    loadAccountingFloor.mockResolvedValue("2026-08-31");
    getASetting.mockResolvedValue({ enabled: true });
    findOneCredential.mockResolvedValue({ id: 55, name: "Gulf Reach" });
    transactions.findAll.mockResolvedValue([]);
    journalAdjustments.findAll.mockResolvedValue([]);
    settleConfigurationGaps.mockImplementation(async (_order, journalData) => ({ held: null, journalData }));
});

afterEach(() => jest.useRealTimers());

describe("the split figures", () => {
    it("keeps every root figure and drops the event payloads and account ids", () => {
        expect(
            splitOf({
                vendorPayable: 90,
                couponTotalDiscount: 5,
                transaction: { lineItems: [] },
                refund: { skipped: true },
                walletTransfer: {},
                journalAccountIds: { paymentGateway: "PG1" },
            })
        ).toEqual({ vendorPayable: 90, couponTotalDiscount: 5 });
    });
});

describe("what can be recorded", () => {
    it("lets a paid order's sale be recorded, and refuses a pending or failed one", () => {
        expect(eligibilityOf(context())).toEqual({ canRecord: true, reasons: ["Not in the books yet; record it first"] });
        expect(eligibilityOf(context({ order: order({ status: "PENDING" }) })).reasons[0]).toContain("still pending");
        expect(eligibilityOf(context({ order: order({ status: "FAILURE" }) })).canRecord).toBe(false);
        expect(eligibilityOf(context({ order: order({ status: "FAILURE" }), verdicts: { refund: true } })).canRecord).toBe(true);
    });

    it("needs the records to show a refund, an admin refund or a cashback before those can be recorded", () => {
        expect(eligibilityOf(context({ key: "refund" })).reasons).toEqual(["The records show no refund on this order"]);
        expect(eligibilityOf(context({ key: "refund", order: order({ status: "REFUNDED" }) })).canRecord).toBe(true);
        expect(eligibilityOf(context({ key: "refund", journalData: { refund: { skipped: true, reason: "paused" } } })).canRecord).toBe(true);

        expect(eligibilityOf(context({ key: "adminRefund" })).reasons).toEqual(["The records show no admin refund on this order"]);
        expect(
            eligibilityOf(context({ key: "adminRefund", journalData: { adminRefund: { refundAmount: 50, totalOrderAmount: 100 } } })).canRecord
        ).toBe(true);

        expect(eligibilityOf(context({ key: "cashback" })).reasons).toEqual(["The records show no cashback credited for this order"]);
        expect(eligibilityOf(context({ key: "cashback", walletRows: [{ creditAmount: "12.0000" }] })).canRecord).toBe(true);
        expect(eligibilityOf(context({ key: "cashbackReversal", walletRows: [{ creditAmount: "12.0000" }] })).canRecord).toBe(false);
        expect(eligibilityOf(context({ key: "cashbackReversal", walletRows: [{ creditAmount: "-12.0000" }] })).canRecord).toBe(true);
    });

    it("holds every sale and refund event, never a wallet one, while the commission or platform fee is under review", () => {
        const held = 'Commission for "Electricity Bill" is still not marked as configured. Mark the commission of the service as configured, then retry.';
        expect(eligibilityOf(context({ held }))).toEqual({ canRecord: false, reasons: [held] });
        expect(eligibilityOf(context({ held, key: "refund", order: order({ status: "REFUNDED" }) })).canRecord).toBe(false);
        expect(eligibilityOf(context({ held, verdicts: { transaction: true } })).canRecord).toBe(false);
        expect(eligibilityOf(context({ held, key: "cashback", walletRows: [{ creditAmount: "12.0000" }] })).canRecord).toBe(true);
    });

    it("refuses to record an event that is already in the books", () => {
        expect(eligibilityOf(context({ verdicts: { transaction: true } }))).toEqual({
            canRecord: false,
            reasons: ["Already in the books"],
        });
    });

    it("allows nothing on an order dated before go live", () => {
        expect(eligibilityOf(context({ beforeGoLive: true }))).toEqual({
            canRecord: false,
            reasons: ["This order is dated before the accounting go-live date"],
        });
    });
});

describe("warnings", () => {
    it("flags the pause, a posted refund behind a sale edit, and a missing sale behind an admin refund", () => {
        expect(warningsOf({ key: "transaction", verdicts: {}, recordingPaused: true })).toEqual(["Journal recording is currently paused"]);
        expect(warningsOf({ key: "transaction", verdicts: { refund: true }, recordingPaused: false })[0]).toContain("refund entry for this order is already in the books");
        expect(warningsOf({ key: "adminRefund", verdicts: {}, recordingPaused: false })).toEqual(["The sale entry is not in the books yet"]);
        expect(warningsOf({ key: "cashback", verdicts: {}, recordingPaused: false })).toEqual([]);
    });
});

describe("default dates and amounts", () => {
    const rows = [
        { transactionDate: "2026-09-10T10:00:00.000Z", creditAmount: "12.0000", debitAmount: "674.0000" },
        { transactionDate: "2026-09-12T10:00:00.000Z", creditAmount: "-12.0000", debitAmount: "-674.0000" },
    ];

    it("dates a sale on the order and a refund or cashback on its wallet movement", () => {
        expect(defaultsOf({ order: order(), key: "transaction", stored: null, walletRows: rows })).toEqual({ journalDate: "2026-09-10" });
        expect(defaultsOf({ order: order(), key: "refund", stored: null, walletRows: rows })).toEqual({ journalDate: "2026-09-12" });
        expect(defaultsOf({ order: order(), key: "cashback", stored: null, walletRows: rows })).toEqual({ journalDate: "2026-09-10", amount: 12 });
        expect(defaultsOf({ order: order(), key: "cashbackReversal", stored: null, walletRows: rows })).toEqual({ journalDate: "2026-09-12", amount: 12 });
    });

    it("prefers the date and amounts the pipeline already stored", () => {
        expect(defaultsOf({ order: order(), key: "refund", stored: { journalDate: "2026-09-15" }, walletRows: rows })).toEqual({ journalDate: "2026-09-15" });
        expect(
            defaultsOf({ order: order(), key: "adminRefund", stored: { journalDate: "2026-09-16", refundAmount: 50, totalOrderAmount: 100 }, walletRows: [] })
        ).toEqual({ journalDate: "2026-09-16", refundAmount: 50, totalOrderAmount: 100 });
        expect(defaultsOf({ order: order(), key: "cashback", stored: { amount: 7 }, walletRows: [] })).toEqual({ journalDate: "2026-09-10", amount: 7 });
    });
});

describe("the journal date", () => {
    it("must be a real day, not in the future and after go live", () => {
        expect(journalDateProblem("2026-09-10", "2026-08-31")).toBeNull();
        expect(journalDateProblem("2026-10-02", "2026-08-31")).toBeNull();
        expect(journalDateProblem("2026-10-03", "2026-08-31")).toBe("The journal date cannot be in the future");
        expect(journalDateProblem("2026-08-31", "2026-08-31")).toBe("The journal date cannot be before the accounting go-live date");
        expect(journalDateProblem("yesterday", "2026-08-31")).toBe("The journal date must be a date");
    });
});

describe("buildLookup", () => {
    it("answers null for an unknown order", async () => {
        orders.findOne.mockResolvedValue(null);
        expect(await buildLookup("NOPE")).toBeNull();
    });

    it("describes the order, its split, every event with its status, defaults and eligibility, and the history", async () => {
        orders.findOne.mockResolvedValue(
            order({
                journalRecordStatus: { transaction: true, refund: false },
                journalData: {
                    vendorPayable: 90,
                    transaction: { journalDate: "2026-09-10", notes: "Journal entry for corporate transaction TXN-1", lineItems: LINES, providerJournalId: "Z-1", provider: "zoho" },
                    refund: { skipped: true, reason: "Journal recording is currently paused", lineItems: LINES },
                    journalAccountIds: { paymentGateway: "PG1" },
                },
            })
        );
        transactions.findAll.mockResolvedValue([{ transactionDate: "2026-09-10T10:00:00.000Z", creditAmount: "12.0000", debitAmount: "674.0000" }]);
        getASetting.mockResolvedValue({ enabled: false });
        journalAdjustments.findAll.mockResolvedValue([
            { id: 1, corporateTxnId: "TXN-1", journalKey: "refund", action: "RECORDED", result: "FAILED", reason: "x", createdAt: "2026-10-01" },
        ]);

        const lookup = await buildLookup("TXN-1");

        expect(orders.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { corporateTxnId: "TXN-1" }, raw: true, nest: true }));
        expect(lookup.order).toEqual({
            id: 7,
            corporateTxnId: "TXN-1",
            transactionDate: "2026-09-10T10:00:00.000Z",
            status: "SUCCESS",
            service: "Electricity Bill",
            customer: { username: "100000900", name: "Al Rams", gstNumber: null, state: null },
            partnerId: 55,
            partnerName: "Gulf Reach",
            paymentGateway: null,
            amountInINR: 1180,
            paymentMode: "PAYMENT GATEWAY",
        });
        expect(lookup.split).toEqual({ vendorPayable: 90 });
        expect(lookup.recordingPaused).toBe(true);
        expect(lookup.beforeGoLive).toBe(false);
        expect(lookup.accountingFloor).toBe("2026-08-31");
        expect(lookup.events.map(event => event.key)).toEqual(MANUAL_KEYS);

        const [sale, refund, , cashback] = lookup.events;
        expect(sale).toMatchObject({
            label: "Sale",
            verdict: true,
            posting: { state: "posted" },
            journal: { journalDate: "2026-09-10", providerJournalId: "Z-1", lineItems: [expect.objectContaining({ accountName: "Name of A1" }), expect.anything()] },
            eligibility: { canRecord: false, reasons: ["Already in the books"] },
            warnings: ["Journal recording is currently paused"],
        });
        expect(refund).toMatchObject({
            verdict: false,
            posting: { state: "notPosted", note: "Recording paused" },
            journal: { skipped: true, reason: "Journal recording is currently paused" },
            eligibility: { canRecord: true },
        });
        expect(cashback).toMatchObject({
            verdict: null,
            posting: { state: "notApplicable" },
            journal: null,
            defaults: { journalDate: "2026-09-10", amount: 12 },
            eligibility: { canRecord: true },
        });
        expect(lookup.history).toEqual([expect.objectContaining({ id: 1, event: "Refund", action: "RECORDED", result: "FAILED" })]);
    });

    it("re-checks a held order against the live flags, keeping the markers out of the split and holding every sale and refund event", async () => {
        const held = "Platform fee for \"Electricity Bill\" is still not marked as configured for this customer's package. Mark it as configured on the service's Platform Fee tab, then retry.";
        const stored = { vendorPayable: 90, surchargeNotConfiguredFor: "Electricity Bill", surchargeNotConfiguredPackageId: 4 };
        orders.findOne.mockResolvedValue(order({ journalData: stored }));
        settleConfigurationGaps.mockResolvedValue({ held, journalData: stored });

        const lookup = await buildLookup("TXN-1");

        expect(settleConfigurationGaps).toHaveBeenCalledWith(expect.objectContaining({ corporateTxnId: "TXN-1", journalData: stored }), stored);
        expect(lookup.split).toEqual({ vendorPayable: 90 });
        expect(lookup.events.find(event => event.key === "transaction").eligibility).toEqual({ canRecord: false, reasons: [held] });
        expect(lookup.events.find(event => event.key === "refund").eligibility.reasons).toEqual([held]);
        expect(lookup.events.find(event => event.key === "cashback").eligibility.reasons).toEqual(["The records show no cashback credited for this order"]);

        settleConfigurationGaps.mockResolvedValue({ held: null, journalData: { vendorPayable: 90 } });
        const settled = await buildLookup("TXN-1");
        expect(settled.events.find(event => event.key === "transaction").eligibility.canRecord).toBe(true);
    });

    it("carries the customer's GST and state and the gateway for the entry, and never a vendor or a commission set-up", async () => {
        orders.findOne.mockResolvedValue(
            order({
                serviceOperator: { id: 3, serviceProvider: "Electricity Bill" },
                paymentModeResponse: '{"paymentGatewayName":"Cashfree","pgAmount":"1180.00"}',
            })
        );
        corporateUser.findOne.mockResolvedValue({ gstNumber: "07BBBBB0000B1Z5", state: "Delhi" });

        const lookup = await buildLookup("TXN-1");

        expect(corporateUser.findOne).toHaveBeenCalledWith({ where: { credentialId: 900 }, attributes: ["gstNumber", "state"], raw: true });
        expect(lookup.order).toMatchObject({
            customer: { gstNumber: "07BBBBB0000B1Z5", state: "Delhi" },
            paymentGateway: "Cashfree",
        });
        expect(lookup.order).not.toHaveProperty("vendor");
        expect(lookup.order).not.toHaveProperty("commission");
    });

    it("names a subscription order from its response and reads a journal stored as text", async () => {
        orders.findOne.mockResolvedValue(
            order({
                serviceOperator: { id: null },
                orderResponse: JSON.stringify({ serviceName: "Peko+" }),
                credential: { id: 900, name: "Al Rams", username: "100000900", registeredBy: null },
                journalData: JSON.stringify({ netSubscriptionIncome: 200 }),
                journalRecordStatus: "{}",
            })
        );

        const lookup = await buildLookup("TXN-1");

        expect(lookup.order.service).toBe("Peko+");
        expect(lookup.order.partnerName).toBeNull();
        expect(lookup.split).toEqual({ netSubscriptionIncome: 200 });
    });
    it("offers the set-up, prefilled from the order and its service, only when the order carries no figures", async () => {
        orders.findOne.mockResolvedValue(
            order({
                journalData: {},
                surcharge: "59.0000",
                paymentModeResponse: '{"paymentGatewayName":"Cashfree","pgAmount":"1180.00"}',
                serviceOperator: {
                    id: 3,
                    serviceProvider: "Electricity Bill",
                    vendorId: 1,
                    commissionMode: "PRINCIPAL_MARKUP",
                    commissionType: "FLAT",
                    providerCommission: "50.0000",
                    fixedCommissionPerTransaction: null,
                    isCommissionInclGST: 1,
                },
            })
        );
        systemUser.findOne.mockResolvedValue({ state: "Goa", sharePercentage: "10.0000" });

        const lookup = await buildLookup("TXN-1");

        expect(lookup.split).toEqual({});
        expect(lookup.setup).toEqual({
            paymentThrough: "GATEWAY",
            orderAmount: 1121,
            pgAmount: 1180,
            gateway: { name: "Cashfree", accountId: null },
            subscription: { is: false, billingType: null },
            vendor: { present: true },
            commission: { present: true, type: "FLAT", mode: "PRINCIPAL_MARKUP", value: 50, fixed: null, inclusiveOfGst: true },
            mixed: { principalAmount: null, marginAmount: null },
            platformFee: { type: "FLAT", value: 50 },
            partner: { present: true, sharePercentage: 10, gatewayCharge: null },
            coupon: { used: false, totalDiscount: null },
            gstRatePct: 18,
        });
    });

    it("offers no set-up once the order carries its figures", async () => {
        orders.findOne.mockResolvedValue(order());

        const lookup = await buildLookup("TXN-1");

        expect(lookup.setup).toBeNull();
    });
});

describe("the account picker", () => {
    it("lists only synced accounts with a provider id, flagging the shared ones", async () => {
        chartOfAccounts.findAll.mockResolvedValue([
            { provider_account_id: "A1", account_name: "Commission", account_type: "income", vendorId: null, partnerId: null, corporateUserId: null },
            { provider_account_id: "A2", account_name: "Deposit - Acme", account_type: "other_current_liability", vendorId: 1, partnerId: null, corporateUserId: null },
        ]);

        const accounts = await listPostableAccounts();

        const [options] = chartOfAccounts.findAll.mock.calls[0];
        expect(options.order).toEqual([["account_name", "ASC"]]);
        expect(accounts).toEqual([
            { id: "A1", name: "Commission", type: "income", shared: true },
            { id: "A2", name: "Deposit - Acme", type: "other_current_liability", shared: false },
        ]);
    });
});

describe("the audit row", () => {
    it("writes one row per action with the before and after state and the outcome", async () => {
        journalAdjustments.create.mockImplementation(async row => ({ id: 9, createdAt: "2026-10-02", ...row }));

        const row = await recordAdjustment({
            corporateTxnId: "TXN-1",
            journalKey: "transaction",
            result: { success: true, action: "recorded", providerJournalId: "Z-NEW" },
            before: { split: { vendorPayable: 90 }, lineItems: LINES },
            after: { split: { vendorPayable: 95 }, lineItems: LINES },
            journalDate: "2026-09-10",
            reason: "Wrong split",
            actor: { id: 7, name: "Ibrahim" },
        });

        expect(journalAdjustments.create).toHaveBeenCalledWith({
            corporateTxnId: "TXN-1",
            journalKey: "transaction",
            action: "RECORDED",
            journalDate: "2026-09-10",
            reason: "Wrong split",
            splitBefore: { vendorPayable: 90 },
            splitAfter: { vendorPayable: 95 },
            lineItemsBefore: LINES,
            lineItemsAfter: LINES,
            providerJournalId: "Z-NEW",
            result: "POSTED",
            failureReason: null,
            recordedById: 7,
            recordedByName: "Ibrahim",
        });
        expect(serializeAdjustment(row)).toMatchObject({ id: 9, event: "Sale", action: "RECORDED", result: "POSTED", recordedByName: "Ibrahim" });
    });

    it("keeps the refusal reason on a failed attempt", async () => {
        journalAdjustments.create.mockImplementation(async row => row);

        await recordAdjustment({
            corporateTxnId: "TXN-1",
            journalKey: "refund",
            result: { success: false, action: "recorded", reason: "Account inactive" },
            before: { split: {}, lineItems: null },
            after: { split: {}, lineItems: LINES },
            journalDate: "2026-09-12",
            reason: "Missing",
            actor: { id: 7, name: "Ibrahim" },
        });

        expect(journalAdjustments.create).toHaveBeenCalledWith(
            expect.objectContaining({ action: "RECORDED", result: "FAILED", failureReason: "Account inactive", lineItemsBefore: null })
        );
    });
});
