const useCases = require("../../../models/use-cases/subscriberLedger");
const walletUse = require("../../../models/use-cases/subscriberWallet");
const { generateInvoiceOrReceiptPdf } = require("../../../utils/pekoRecieptHelper");
const { isPdfBuffer } = require("../../../utils/pdfHelper");
const {
    listSubscriberLedger,
    getSubscriberLedger,
    listSubscriberTransactions,
    listSubscriberWallet,
    listSubscriberBills,
    downloadSubscriberReceipt,
    downloadSubscriberFullInvoice,
    downloadSubscriberPekoInvoice,
} = require("../subscriberLedger");

jest.mock("../../../models/use-cases/subscriberLedger", () => ({
    listSubscribers: jest.fn(),
    findSubscriberByCredentialId: jest.fn(),
    getSubscriberLedgerSummary: jest.fn(),
    getSubscriberLedgerSnapshot: jest.fn(),
    subscriberDisplayName: jest.fn(row => row.name || row.contactPersonName || row.username),
    serializeSubscriber: jest.fn((row, summary) => ({ id: row.credentialId, name: row.name, summary: Boolean(summary) })),
    listSubscriberOrders: jest.fn(),
    listSubscriberBills: jest.fn(),
    findSubscriberOrderDocument: jest.fn(),
    SUBSCRIBER_ORDER_DOCUMENTS: {
        receipt: { name: "receipt" },
        fullInvoice: { name: "invoice" },
        pekoInvoice: { name: "invoice" },
    },
    serializeTransaction: jest.fn(row => ({ id: row.id, kind: "transaction" })),
    serializeBill: jest.fn(row => ({ id: `${row.id}:${row.document}`, kind: "bill" })),
}));

jest.mock("../../../models/use-cases/subscriberWallet", () => ({
    listWalletMovements: jest.fn(),
    serializeWalletMovement: jest.fn(row => ({ id: row.id, kind: "movement" })),
}));

jest.mock("../../../utils/pekoRecieptHelper", () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    res.send = jest.fn(() => res);
    res.setHeader = jest.fn();
    return res;
};

const run = async (handler, req) => {
    const res = mockRes();
    const next = jest.fn();
    await handler(req, res, next);
    return { res, next };
};

const USER = { id: 42, name: "Ibrahim" };

const SUBSCRIBER = { credentialId: 99, corporateUserId: 12, name: "Al Rams Trading LLP" };

const tabReq = extra => ({
    params: { credentialId: "99" },
    query: { page: 2, itemsPerPage: 10, searchText: "", ...extra },
    user: USER,
});

const dataOf = res => res.json.mock.calls[0][0].data;

describe("subscriber ledger controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useCases.findSubscriberByCredentialId.mockResolvedValue(SUBSCRIBER);
        useCases.listSubscriberOrders.mockResolvedValue({ rows: [{ id: 7 }], count: 31 });
        useCases.listSubscriberBills.mockResolvedValue({ rows: [{ id: 8, document: "pekoInvoice" }], count: 5 });
        walletUse.listWalletMovements.mockResolvedValue({ rows: [{ id: "3-2" }], count: 4 });
    });

    it("passes the partner picked on to the list, and none when no partner was picked", async () => {
        useCases.getSubscriberLedgerSnapshot.mockResolvedValue({ kpis: {}, generatedAt: null, cached: false });
        useCases.listSubscribers.mockResolvedValue({ rows: [], count: 0 });
        const query = { page: 1, itemsPerPage: 10, searchText: "", sort: "ASC", sortField: "name", refresh: false };

        await run(listSubscriberLedger, { query: { ...query, partnerId: 55 }, user: USER });
        await run(listSubscriberLedger, { query: { ...query, partnerId: "default" }, user: USER });
        await run(listSubscriberLedger, { query, user: USER });

        expect(useCases.listSubscribers.mock.calls.map(([args]) => args.partnerId)).toEqual([55, "default", undefined]);
    });

    it("lists subscribers with the cached kpis", async () => {
        useCases.getSubscriberLedgerSnapshot.mockResolvedValue({
            kpis: { totalSubscribers: 3 },
            generatedAt: "2026-09-18T08:30:00.000Z",
            cached: true,
        });
        useCases.listSubscribers.mockResolvedValue({ rows: [{ credentialId: 99, name: "Al Rams" }], count: 12 });

        const { res } = await run(listSubscriberLedger, {
            query: { page: 2, itemsPerPage: 10, searchText: "rams", sort: "ASC", sortField: "name", refresh: false },
            user: USER,
        });

        expect(useCases.listSubscribers).toHaveBeenCalledWith({
            limit: 10,
            offset: 10,
            searchText: "rams",
            sort: "ASC",
            sortField: "name",
        });
        expect(useCases.getSubscriberLedgerSnapshot).toHaveBeenCalledWith({ refresh: false });
        expect(dataOf(res)).toEqual({
            subscribers: [{ id: 99, name: "Al Rams", summary: false }],
            recordsTotal: 12,
            page: 2,
            itemsPerPage: 10,
            kpis: { totalSubscribers: 3 },
            generatedAt: "2026-09-18T08:30:00.000Z",
            cached: true,
        });
    });

    it("returns one subscriber with its summary and passes the bounded range", async () => {
        useCases.getSubscriberLedgerSummary.mockResolvedValue({ walletBalance: 25000 });

        const { res } = await run(getSubscriberLedger, {
            params: { credentialId: "99" },
            query: { from: "2026-08-19", to: "2026-09-19" },
            user: USER,
        });

        expect(useCases.findSubscriberByCredentialId).toHaveBeenCalledWith(99);
        expect(useCases.getSubscriberLedgerSummary).toHaveBeenCalledWith(SUBSCRIBER, {
            from: "2026-08-19 00:00:00",
            to: "2026-09-19 23:59:59",
        });
        expect(dataOf(res)).toEqual({
            subscriber: { id: 99, name: "Al Rams Trading LLP", summary: true },
            summary: { walletBalance: 25000 },
        });
    });

    it("sends no range when the query has none", async () => {
        useCases.getSubscriberLedgerSummary.mockResolvedValue({});

        await run(getSubscriberLedger, { params: { credentialId: "99" }, query: {}, user: USER });

        expect(useCases.getSubscriberLedgerSummary).toHaveBeenCalledWith(SUBSCRIBER, null);
    });

    it("404s every subscriber scoped route when the subscriber is missing or the id is not numeric", async () => {
        const handlers = [
            getSubscriberLedger,
            listSubscriberTransactions,
            listSubscriberWallet,
            listSubscriberBills,
            downloadSubscriberReceipt,
            downloadSubscriberFullInvoice,
            downloadSubscriberPekoInvoice,
        ];

        useCases.findSubscriberByCredentialId.mockResolvedValue(null);
        for (const handler of handlers) {
            const { res, next } = await run(handler, tabReq());
            expect(next.mock.calls[0][0].status_code).toBe(404);
            expect(res.json).not.toHaveBeenCalled();
        }

        useCases.findSubscriberByCredentialId.mockClear();
        const { next } = await run(getSubscriberLedger, { ...tabReq(), params: { credentialId: "ghost" } });
        expect(next.mock.calls[0][0].status_code).toBe(404);
        expect(useCases.findSubscriberByCredentialId).not.toHaveBeenCalled();
    });

    it("pages each tab and passes the date range through", async () => {
        const range = { from: "2026-08-18 00:00:00", to: "2026-09-18 23:59:59" };
        const expected = { credentialId: 99, range, searchText: "", limit: 10, offset: 10 };
        const query = { from: "2026-08-18", to: "2026-09-18" };

        const transactions = await run(listSubscriberTransactions, tabReq(query));
        expect(useCases.listSubscriberOrders).toHaveBeenCalledWith(expected);
        expect(dataOf(transactions.res)).toEqual({
            entries: [{ id: 7, kind: "transaction" }],
            recordsTotal: 31,
            page: 2,
            itemsPerPage: 10,
        });

        const wallet = await run(listSubscriberWallet, tabReq(query));
        expect(walletUse.listWalletMovements).toHaveBeenCalledWith(expected);
        expect(dataOf(wallet.res)).toMatchObject({ entries: [{ id: "3-2", kind: "movement" }], recordsTotal: 4 });

        const bills = await run(listSubscriberBills, tabReq(query));
        expect(useCases.listSubscriberBills).toHaveBeenCalledWith(expected);
        expect(dataOf(bills.res)).toMatchObject({ entries: [{ id: "8:pekoInvoice", kind: "bill" }], recordsTotal: 5 });
    });

    it("passes the search and the filters on to each tab's list", async () => {
        const query = { searchText: "hike", status: "failed", type: "refund", side: "credit" };

        await run(listSubscriberTransactions, tabReq(query));
        await run(listSubscriberWallet, tabReq(query));
        await run(listSubscriberBills, tabReq(query));

        [useCases.listSubscriberOrders, walletUse.listWalletMovements, useCases.listSubscriberBills].forEach(list =>
            expect(list).toHaveBeenCalledWith(expect.objectContaining(query))
        );
    });

    it("sends no filter to a list when none was chosen", async () => {
        await run(listSubscriberWallet, tabReq());

        const args = walletUse.listWalletMovements.mock.calls[0][0];
        expect([args.status, args.type, args.side]).toEqual([undefined, undefined, undefined]);
        expect(args.searchText).toBe("");
    });
});

describe("subscriber order documents", () => {
    const PDF = Buffer.from("%PDF-1.4 receipt");
    const documentReq = orderId => ({ params: { credentialId: "99", orderId }, query: {}, user: USER });

    beforeEach(() => {
        jest.clearAllMocks();
        useCases.findSubscriberByCredentialId.mockResolvedValue(SUBSCRIBER);
        useCases.findSubscriberOrderDocument.mockResolvedValue({
            corporateTxnId: "1787561688848",
            data: { invoiceNumber: "VI-9" },
            type: "Invoice",
            label: "Invoice",
        });
        generateInvoiceOrReceiptPdf.mockResolvedValue({ filename: "Invoice-1.pdf", content: PDF });
        isPdfBuffer.mockReturnValue(true);
    });

    it("streams the payment receipt from the transactions tab, named after the order", async () => {
        useCases.findSubscriberOrderDocument.mockResolvedValue({
            corporateTxnId: "1787561688848",
            data: { receiptNo: "PR-1" },
            type: "Receipt",
            label: "Receipt",
        });

        const { res, next } = await run(downloadSubscriberReceipt, documentReq("7"));

        expect(useCases.findSubscriberOrderDocument).toHaveBeenCalledWith({ credentialId: 99, orderId: "7", kind: "receipt" });
        expect(generateInvoiceOrReceiptPdf).toHaveBeenCalledWith({ receiptNo: "PR-1" }, "Receipt", "Receipt");
        expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", 'attachment; filename="Receipt-1787561688848.pdf"');
        expect(next).not.toHaveBeenCalled();
    });

    it("streams the invoice stored on the subscriber's own order, named after the order", async () => {
        const { res, next } = await run(downloadSubscriberFullInvoice, documentReq("7"));

        expect(useCases.findSubscriberOrderDocument).toHaveBeenCalledWith({
            credentialId: 99,
            orderId: "7",
            kind: "fullInvoice",
        });
        expect(generateInvoiceOrReceiptPdf).toHaveBeenCalledWith({ invoiceNumber: "VI-9" }, "Invoice", "Invoice");
        expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
        expect(res.setHeader).toHaveBeenCalledWith(
            "Content-Disposition",
            'attachment; filename="Invoice-1787561688848.pdf"'
        );
        expect(res.send).toHaveBeenCalledWith(PDF);
        expect(next).not.toHaveBeenCalled();
    });

    it("streams Peko's own invoice on the bills route, named as the document reads", async () => {
        useCases.findSubscriberOrderDocument.mockResolvedValue({
            corporateTxnId: "1787561688848",
            data: { invoiceNumber: "PI-1" },
            type: "Invoice",
            label: "Platform-Fee-Invoice",
        });

        const { res } = await run(downloadSubscriberPekoInvoice, documentReq("8"));

        expect(useCases.findSubscriberOrderDocument).toHaveBeenCalledWith({
            credentialId: 99,
            orderId: "8",
            kind: "pekoInvoice",
        });
        expect(generateInvoiceOrReceiptPdf).toHaveBeenCalledWith({ invoiceNumber: "PI-1" }, "Invoice", "Platform-Fee-Invoice");
        expect(res.setHeader).toHaveBeenCalledWith(
            "Content-Disposition",
            'attachment; filename="Platform-Fee-Invoice-1787561688848.pdf"'
        );
    });

    it("streams the full amount invoice issued on behalf of the vendor on the bills invoice route", async () => {
        useCases.findSubscriberOrderDocument.mockResolvedValue({
            corporateTxnId: "1787561688848",
            data: { invoiceNumber: "VI-9" },
            type: "Invoice",
            label: "Invoice",
        });

        const { res } = await run(downloadSubscriberFullInvoice, documentReq("7"));

        expect(useCases.findSubscriberOrderDocument).toHaveBeenCalledWith({
            credentialId: 99,
            orderId: "7",
            kind: "fullInvoice",
        });
        expect(generateInvoiceOrReceiptPdf).toHaveBeenCalledWith({ invoiceNumber: "VI-9" }, "Invoice", "Invoice");
        expect(res.setHeader).toHaveBeenCalledWith(
            "Content-Disposition",
            'attachment; filename="Invoice-1787561688848.pdf"'
        );

        useCases.findSubscriberOrderDocument.mockResolvedValue(null);
        const { next } = await run(downloadSubscriberFullInvoice, documentReq("7"));
        expect(next.mock.calls[0][0].message).toBe("No invoice was issued for this order");
    });

    it("404s an order with no stored document, or one that belongs to someone else", async () => {
        useCases.findSubscriberOrderDocument.mockResolvedValue(null);

        const { res, next } = await run(downloadSubscriberFullInvoice, documentReq("7"));

        expect(next.mock.calls[0][0].status_code).toBe(404);
        expect(next.mock.calls[0][0].message).toBe("No invoice was issued for this order");
        expect(generateInvoiceOrReceiptPdf).not.toHaveBeenCalled();
        expect(res.send).not.toHaveBeenCalled();
    });

    it("reports a document that did not render as a PDF as unavailable", async () => {
        isPdfBuffer.mockReturnValue(false);

        const { res, next } = await run(downloadSubscriberPekoInvoice, documentReq("8"));

        expect(next.mock.calls[0][0].status_code).toBe(503);
        expect(res.send).not.toHaveBeenCalled();
    });
});
