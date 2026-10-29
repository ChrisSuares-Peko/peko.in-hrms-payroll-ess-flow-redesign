const { Op } = require("sequelize");

jest.mock("../../../models/entities/order", () => ({ findAndCountAll: jest.fn(), findOne: jest.fn() }));
jest.mock("../../../models/entities/serviceOperator", () => ({}));
jest.mock("../../../models/entities/credential", () => ({}));
jest.mock("../../../models/entities/vendor", () => ({}));
jest.mock("../../../models/use-cases/chartOfAccount", () => ({ findAllByProviderAccountIds: jest.fn() }));
jest.mock("../../../models/use-cases/credential", () => ({ findOneCredential: jest.fn() }));
jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    loadAccountingFloor: jest.fn().mockResolvedValue("2000-01-01"),
    goLiveWindowStart: jest.fn(() => new Date("2000-01-01T00:00:00.000Z")),
    isBeforeGoLive: jest.fn(),
}));
jest.mock("../../../models/use-cases/serviceOperator", () => ({ findServiceOperatorById: jest.fn() }));
jest.mock("../../../utils/bull/queue/accountingQueues", () => ({ dispatchJournalRetry: jest.fn() }));
jest.mock("../../../utils/pekoRecieptHelper", () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));
jest.mock("../../../models/use-cases/internalAccounts", () => ({
    resolveAccountIds: jest.fn(async scope => (scope === "internal" ? [12, 15] : null)),
    accountScopeLabel: jest.fn(accountIds => (accountIds ? "Accounts: Internal purchase accounts" : null)),
}));

const orders = require("../../../models/entities/order");
const { getTransactions } = require("../orderJournal");

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const run = async query => {
    orders.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    orders.findOne.mockResolvedValue({ totalAmount: 0 });
    const req = { query };
    const res = mockRes();
    await getTransactions(req, res, jest.fn());
    return orders.findAndCountAll.mock.calls[0][0];
};

describe("getTransactions — the lighter, payment-status-only sibling of Order Journals", () => {
    beforeEach(() => jest.clearAllMocks());

    it("filters by transactionDate with no payment-status condition when status is omitted", async () => {
        const { where } = await run({ from: "2026-09-01", to: "2026-09-16" });

        expect(where.transactionDate).toBeDefined();
        expect(where.status).toBeUndefined();
    });

    it("bounds the window on the IST calendar day, as the dashboard cards that link here do", async () => {
        const { where } = await run({ from: "2026-10-20", to: "2026-10-20" });

        expect(where.transactionDate[Op.between]).toEqual(["2026-10-20 00:00:00", "2026-10-20 23:59:59"]);
    });

    it("clamps the window to the go-live floor by day", async () => {
        const { where } = await run({ from: "1999-01-01", to: "2026-10-20" });

        expect(where.transactionDate[Op.between]).toEqual(["2000-01-01 00:00:00", "2026-10-20 23:59:59"]);
    });

    it("filters by the order's own payment status when a valid one is given", async () => {
        const { where } = await run({ from: "2026-09-01", to: "2026-09-16", status: "SUCCESS" });

        expect(where.status).toBe("SUCCESS");
    });

    it("ignores an invalid payment status rather than passing it through unvalidated", async () => {
        const { where } = await run({
            from: "2026-09-01",
            to: "2026-09-16",
            status: "'; DROP TABLE orders; --",
        });

        expect(where.status).toBeUndefined();
    });

    it("searches by transaction id, username, name and service — not just username", async () => {
        const { where } = await run({ from: "2026-09-01", to: "2026-09-16", searchText: "acme" });

        const orConditions = where[Op.or];
        expect(orConditions.some(c => c["$credential.name$"])).toBe(true);
        expect(orConditions.some(c => c["$credential.username$"])).toBe(true);
        expect(orConditions.some(c => c["$serviceOperator.serviceProvider$"])).toBe(true);
        expect(orConditions.some(c => c.corporateTxnId)).toBe(true);
    });

    it("selects only payment-level attributes — no journalRecordStatus/journalData columns", async () => {
        const { attributes } = await run({ from: "2026-09-01", to: "2026-09-16" });

        expect(attributes).not.toContain("journalRecordStatus");
        expect(attributes).not.toContain("journalData");
        expect(attributes).toEqual(
            expect.arrayContaining(["transactionDate", "corporateTxnId", "amountInINR", "paymentMode", "status"])
        );
    });

    it("shapes each row without any journal fields, keeping the document lookup", async () => {
        orders.findAndCountAll.mockResolvedValue({
            rows: [
                {
                    id: 1,
                    transactionDate: "2026-09-16",
                    corporateTxnId: "TXN1",
                    amountInINR: 500,
                    paymentMode: "PAYMENT GATEWAY",
                    paymentModeResponse: null,
                    status: "SUCCESS",
                    credentialId: 7,
                    serviceOperatorId: 3,
                    orderResponse: null,
                    pekoInvoiceDetails: null,
                    gmv: "500.0000",
                    discount: "40.0000",
                    netGmv: "460.0000",
                    transactionVerdict: "false",
                    transactionReason: "Account not found",
                    serviceOperator: { id: 3, serviceProvider: "Electricity Bill" },
                    credential: { id: 7, name: "Acme Corp", username: "100000919", email: "a@b.com" },
                },
            ],
            count: 1,
        });
        orders.findOne.mockResolvedValue({ totalAmount: 500 });

        const req = { query: { from: "2026-09-01", to: "2026-09-16" } };
        const res = mockRes();
        await getTransactions(req, res, jest.fn());

        const [row] = res.json.mock.calls[0][0].data.result;
        expect(row.order).toEqual({
            id: 1,
            corporateTxnId: "TXN1",
            amountInINR: 500,
            paymentMode: "PAYMENT GATEWAY",
            paymentModeResponse: null,
            status: "SUCCESS",
            gmv: 500,
            discount: 40,
            netGmv: 460,
        });
        expect(row.order.journalRecordStatus).toBeUndefined();
        expect(row.serviceOperator).toEqual({ id: 3, serviceProvider: "Electricity Bill" });
        expect(row.credential.name).toBe("Acme Corp");
        expect(row.documents).toBeDefined();
        expect(row.posting).toEqual({ state: "notPosted", note: "Books refused it", detail: "Account not found" });
    });

    it("reads each order's posting status on the page, never on the totals", async () => {
        const { attributes } = await run({ from: "2026-09-01", to: "2026-09-16" });

        const aliases = attributes.filter(Array.isArray).map(([, alias]) => alias);
        expect(aliases).toEqual(
            expect.arrayContaining(["transactionVerdict", "transactionSkipped", "transactionReason", "refundVerdict", "adminRefundReason"])
        );
        expect(orders.findOne.mock.calls[0][0].attributes).toHaveLength(3);
    });

    it("selects the three order-value figures the dashboard cards use, on the page and the totals", async () => {
        const { attributes } = await run({ from: "2026-09-01", to: "2026-09-16" });

        const aliases = attributes.filter(Array.isArray).map(([, alias]) => alias);
        expect(aliases).toEqual(expect.arrayContaining(["gmv", "discount", "netGmv"]));

        const totalAliases = orders.findOne.mock.calls[0][0].attributes.map(([, alias]) => alias);
        expect(totalAliases).toEqual(["totalAmount", "totalDiscount", "totalNetGmv"]);
    });

    it("returns totals across the whole filtered set, not just the page", async () => {
        orders.findAndCountAll.mockResolvedValue({ rows: [], count: 42 });
        orders.findOne.mockResolvedValue({
            totalAmount: "123456.78",
            totalDiscount: "1000.50",
            totalNetGmv: "122456.28",
        });

        const req = { query: { from: "2026-09-01", to: "2026-09-16" } };
        const res = mockRes();
        await getTransactions(req, res, jest.fn());

        const { totals, totalData } = res.json.mock.calls[0][0].data;
        expect(totalData).toBe(42);
        expect(totals).toEqual({
            count: 42,
            totalAmount: 123456.78,
            totalDiscount: 1000.5,
            totalNetGmv: 122456.28,
        });
    });

    it("defaults every total to 0 when there are no matching orders", async () => {
        orders.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        orders.findOne.mockResolvedValue({ totalAmount: null });

        const req = { query: { from: "2026-09-01", to: "2026-09-16" } };
        const res = mockRes();
        await getTransactions(req, res, jest.fn());

        expect(res.json.mock.calls[0][0].data.totals).toEqual({
            count: 0,
            totalAmount: 0,
            totalDiscount: 0,
            totalNetGmv: 0,
        });
    });
});

describe("getTransactions for the internal purchase accounts", () => {
    beforeEach(() => jest.clearAllMocks());

    it("limits the rows and the totals to the internal accounts when asked, and to every account otherwise", async () => {
        const { where } = await run({ from: "2026-09-01", to: "2026-09-16", accounts: "internal" });

        expect(where.credentialId).toEqual({ [Op.in]: [12, 15] });
        expect(orders.findOne.mock.calls[0][0].where.credentialId).toEqual({ [Op.in]: [12, 15] });

        jest.clearAllMocks();
        const open = await run({ from: "2026-09-01", to: "2026-09-16" });
        expect(open.where.credentialId).toBeUndefined();
    });
});
