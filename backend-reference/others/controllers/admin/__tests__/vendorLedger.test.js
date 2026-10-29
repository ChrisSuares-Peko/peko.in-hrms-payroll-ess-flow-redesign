const { uploadFileEncryptedToS3 } = require("../../../utils/s3");
const useCases = require("../../../models/use-cases/vendorLedger");
const deposits = require("../../../models/use-cases/vendorDeposits");
const entries = require("../../../models/use-cases/vendorLedgerEntries");
const {
    listVendorLedger,
    getVendorLedger,
    listVendorTransactions,
    listVendorCommissions,
    listVendorDeposits,
    createVendorDeposit,
    createVendorOpeningBalance,
    reverseVendorDeposit,
    listVendorCreditNotes,
    createVendorCreditNote,
    reverseVendorCreditNote,
    createVendorCommission,
    reverseVendorCommission,
    downloadVendorCommissionInvoice,
    downloadVendorCreditNote,
    updateVendorDeposit,
    deleteVendorDeposit,
    updateVendorOpeningBalance,
    deleteVendorOpeningBalance,
    updateVendorCreditNote,
    deleteVendorCreditNote,
    updateVendorCommission,
    deleteVendorCommission,
    tagVendorDepositBooks,
    tagVendorCreditNoteBooks,
    tagVendorCommissionBooks,
    listVendorCostOfSales,
    createVendorCostOfSales,
    reverseVendorCostOfSales,
    updateVendorCostOfSales,
    deleteVendorCostOfSales,
    tagVendorCostOfSalesBooks,
    listVendorDebitNotes,
    createVendorDebitNote,
    reverseVendorDebitNote,
    updateVendorDebitNote,
    deleteVendorDebitNote,
    tagVendorDebitNoteBooks,
} = require("../vendorLedger");
const taxDocuments = require("../../../models/use-cases/vendorTaxDocuments");
const { openingBeforeGoLive } = require("../../../models/use-cases/accountingPeriod");
const { renderPdf } = require("../../../utils/puppeteerPool");
const { isPdfBuffer } = require("../../../utils/pdfHelper");

jest.mock("../../../models/use-cases/vendorLedger", () => ({
    getLowBalanceThreshold: jest.fn(),
    listVendorsWithServices: jest.fn(),
    findVendorById: jest.fn(),
    getVendorDepositAccounts: jest.fn(),
    accountIdsForVendor: jest.fn(),
    ledgerAccountIdsForVendor: jest.fn(),
    listVendorOrders: jest.fn(),
    listVendorCommissions: jest.fn(),
    listCommissionReversals: jest.fn(),
    serializeTransaction: jest.fn(row => ({ id: row.id })),
    serializeCommission: jest.fn(row => ({ id: row.id })),
    getVendorLedgerSummary: jest.fn(),
    getVendorLedgerSnapshot: jest.fn(),
    serializeVendor: jest.fn(row => ({ id: row.id })),
    buildVendorKpis: jest.fn(() => ({ totalVendors: 1 })),
}));

jest.mock("../../../models/use-cases/vendorDeposits", () => ({
    DEPOSIT_MODES: ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"],
    ENTRY_TYPES: { deposit: "DEPOSIT", opening: "OPENING", reversal: "REVERSAL" },
    updateDeposit: jest.fn(),
    deleteDeposit: jest.fn(),
    tagDepositBooks: jest.fn(),
    findFirstEntryDate: jest.fn(),
    serializeDeposit: jest.fn(row => row),
    listByVendor: jest.fn(),
    findOpeningBalance: jest.fn(),
    createDeposit: jest.fn(),
    createOpeningBalance: jest.fn(),
    reverseDeposit: jest.fn(),
}));

jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    openingBeforeGoLive: jest.fn(async () => null),
}));
jest.mock("../../../utils/s3", () => ({ uploadFileEncryptedToS3: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

jest.mock("../../../models/use-cases/vendorLedgerEntries", () => ({
    ENTRY_KINDS: { creditNote: "CREDIT_NOTE", commission: "COMMISSION", costOfSales: "COST_OF_SALES", debitNote: "DEBIT_NOTE" },
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    tagEntryBooks: jest.fn(),
    findFirstEntryDate: jest.fn(),
    serializeEntry: jest.fn(row => row),
    listAllByVendor: jest.fn(),
    createEntry: jest.fn(),
    reverseEntry: jest.fn(),
    findEntry: jest.fn(),
}));

jest.mock("../../../models/use-cases/vendorTaxDocuments", () => ({
    orderInvoiceDocument: jest.fn(),
    orderCreditNoteDocument: jest.fn(),
    manualEntryDocument: jest.fn(),
    documentFileName: jest.fn(() => "Cleartrip Tax Invoice INV-1.pdf"),
}));

jest.mock("../../../utils/puppeteerPool", () => ({ renderPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn(() => true) }));
jest.mock("../../../utils/invoiceTemplate", () => ({
    taxInvoiceTemplate: jest.fn(payload => `<html>${payload.documentTitle}</html>`),
}));

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const run = async (handler, req) => {
    const res = mockRes();
    const next = jest.fn();
    await handler(req, res, next);
    return { res, next };
};

const USER = { id: 42, name: "Ibrahim" };

const VENDOR_ROW = { id: 1, vendorName: "Cleartrip Private Limited", services: ["Flights"] };

const tabReq = extra => ({
    params: { vendorId: "1" },
    query: { page: 2, itemsPerPage: 10, searchText: "", ...extra },
    user: USER,
});

const dataOf = res => res.json.mock.calls[0][0].data;

describe("vendor ledger controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useCases.getLowBalanceThreshold.mockResolvedValue(25000);
        useCases.findVendorById.mockResolvedValue(VENDOR_ROW);
        useCases.getVendorDepositAccounts.mockResolvedValue({ sharedAccountId: "acc-1", legacyByVendorId: { 1: ["legacy-1"] } });
        useCases.accountIdsForVendor.mockReturnValue(["acc-1", "legacy-1"]);
        useCases.ledgerAccountIdsForVendor.mockReturnValue(["acc-1", "legacy-1", "commission-1"]);
        useCases.listVendorOrders.mockResolvedValue({ rows: [{ id: 7 }], count: 31 });
        useCases.listVendorCommissions.mockResolvedValue({ rows: [{ id: 7 }], count: 31 });
        useCases.listCommissionReversals.mockResolvedValue([]);
        deposits.listByVendor.mockResolvedValue({ rows: [{ id: 3 }], count: 1 });
        deposits.findOpeningBalance.mockResolvedValue(null);
        openingBeforeGoLive.mockResolvedValue(null);
        entries.listAllByVendor.mockResolvedValue([{ id: 4, issueDate: "2026-09-18" }]);
    });

    it("lists vendors with their balances and kpis", async () => {
        useCases.getVendorLedgerSnapshot.mockResolvedValue({
            balances: { 1: { available: 10 } },
            vendorDepositsAccountConfigured: true,
            generatedAt: "2026-09-18T08:30:00.000Z",
            cached: true,
        });
        useCases.listVendorsWithServices.mockResolvedValue({ rows: [{ id: 1 }], count: 12 });

        const { res } = await run(listVendorLedger, {
            query: { page: 2, itemsPerPage: 10, searchText: "air", sort: "ASC", sortField: "vendorName", refresh: false },
            user: USER,
        });

        expect(useCases.listVendorsWithServices).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 10, offset: 10, searchText: "air" })
        );
        expect(useCases.getVendorLedgerSnapshot).toHaveBeenCalledWith({ refresh: false });
        expect(dataOf(res)).toEqual({
            vendors: [{ id: 1 }],
            recordsTotal: 12,
            page: 2,
            itemsPerPage: 10,
            kpis: { totalVendors: 1 },
            vendorDepositsAccountConfigured: true,
            generatedAt: "2026-09-18T08:30:00.000Z",
            cached: true,
        });
    });

    it("returns one vendor with its standing position", async () => {
        useCases.getVendorLedgerSummary.mockResolvedValue({ available: 121500 });

        const { res } = await run(getVendorLedger, { params: { vendorId: "1" }, query: {}, user: USER });

        expect(useCases.getVendorLedgerSummary).toHaveBeenCalledWith(
            VENDOR_ROW,
            ["acc-1", "legacy-1"],
            null,
            ["acc-1", "legacy-1", "commission-1"]
        );
        expect(dataOf(res).summary).toEqual({ available: 121500 });
    });

    it("passes the selected date range to the summary", async () => {
        useCases.getVendorLedgerSummary.mockResolvedValue({ available: 121500 });

        await run(getVendorLedger, {
            params: { vendorId: "1" },
            query: { from: "2026-08-19", to: "2026-09-19" },
            user: USER,
        });

        expect(useCases.getVendorLedgerSummary).toHaveBeenCalledWith(
            VENDOR_ROW,
            ["acc-1", "legacy-1"],
            { from: "2026-08-19 00:00:00", to: "2026-09-19 23:59:59" },
            ["acc-1", "legacy-1", "commission-1"]
        );
    });

    it("covers the whole of the to day rather than cutting it off at midnight", async () => {
        useCases.getVendorLedgerSummary.mockResolvedValue({ available: 0 });

        await run(getVendorLedger, {
            params: { vendorId: "1" },
            query: { from: new Date("2026-08-19T00:00:00.000Z"), to: new Date("2026-09-19T00:00:00.000Z") },
            user: USER,
        });

        expect(useCases.getVendorLedgerSummary.mock.calls[0][2]).toEqual({
            from: "2026-08-19 00:00:00",
            to: "2026-09-19 23:59:59",
        });
    });

    it("404s every vendor scoped route when the vendor is missing", async () => {
        useCases.findVendorById.mockResolvedValue(null);

        const handlers = [
            getVendorLedger,
            listVendorTransactions,
            listVendorCommissions,
            listVendorDeposits,
            createVendorDeposit,
            createVendorOpeningBalance,
            listVendorCreditNotes,
            createVendorCreditNote,
        ];

        await Promise.all(
            handlers.map(async handler => {
                const { res, next } = await run(handler, { ...tabReq(), body: {} });
                expect(next.mock.calls[0][0].status_code).toBe(404);
                expect(res.json).not.toHaveBeenCalled();
            })
        );
    });

    it("pages the transactions and passes the date range through", async () => {
        const { res } = await run(
            listVendorTransactions,
            tabReq({ from: "2026-08-18", to: "2026-09-18" })
        );

        expect(useCases.listVendorOrders).toHaveBeenCalledWith({
            vendorId: 1,
            ledgerAccountIds: ["acc-1", "legacy-1", "commission-1"],
            range: { from: "2026-08-18 00:00:00", to: "2026-09-18 23:59:59" },
            searchText: "",
            limit: 10,
            offset: 10,
        });
        expect(useCases.serializeTransaction).toHaveBeenCalledWith({ id: 7 }, 0, [{ id: 7 }]);
        expect(dataOf(res)).toEqual({
            entries: [{ id: 7 }],
            recordsTotal: 31,
            page: 2,
            itemsPerPage: 10,
        });
    });

    it("passes the search and the status picked on to the transactions list", async () => {
        await run(listVendorTransactions, tabReq({ searchText: "xoxo", status: "refunded" }));

        expect(useCases.listVendorOrders).toHaveBeenCalledWith(
            expect.objectContaining({ searchText: "xoxo", status: "refunded" })
        );
    });

    it("passes the search and the status picked on to the commissions list", async () => {
        await run(listVendorCommissions, tabReq({ searchText: "xoxo", status: "earned" }));

        expect(useCases.listVendorCommissions).toHaveBeenCalledWith(
            expect.objectContaining({ searchText: "xoxo", status: "earned" })
        );
    });

    it("passes the search, the status and the mode picked on to the deposits list", async () => {
        await run(listVendorDeposits, tabReq({ searchText: "utr", status: "active", mode: "UPI" }));

        expect(deposits.listByVendor).toHaveBeenCalledWith(
            expect.objectContaining({ searchText: "utr", status: "active", mode: "UPI" })
        );
    });

    it("sends no range when the query has none", async () => {
        await run(listVendorCommissions, tabReq());

        expect(useCases.listVendorCommissions.mock.calls[0][0]).toMatchObject({
            vendorId: 1,
            accountIds: ["acc-1", "legacy-1"],
            range: null,
        });
        expect(useCases.serializeCommission).toHaveBeenCalled();
    });

    it("records a deposit as 201 and stamps the acting admin", async () => {
        deposits.createDeposit.mockResolvedValue({ id: 3, amount: 25000 });

        const { res } = await run(createVendorDeposit, {
            params: { vendorId: "1" },
            query: {},
            body: { amount: 25000, depositDate: "2026-09-18", reference: "UTR-1", mode: "NEFT", note: "" },
            user: USER,
        });

        expect(deposits.createDeposit).toHaveBeenCalledWith(
            expect.objectContaining({ vendorId: 1, amount: 25000, actor: { id: 42, name: "Ibrahim" } })
        );
        expect(deposits.createDeposit.mock.calls[0][0].slip).toBeNull();
        expect(uploadFileEncryptedToS3).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("encrypts the slip to s3 and stores only its key", async () => {
        deposits.createDeposit.mockResolvedValue({ id: 3 });
        uploadFileEncryptedToS3.mockResolvedValue("staging/system_user/ibrahim/vendor-ledger-slips/1/uuid");

        await run(createVendorDeposit, {
            params: { vendorId: "1" },
            query: {},
            body: {
                amount: 25000,
                depositDate: "2026-09-18",
                reference: "UTR-1",
                mode: "NEFT",
                note: "",
                slipBase64: "JVBERi0xLjQK",
                slipName: "receipt.pdf",
                slipFormat: "pdf",
            },
            user: { ...USER, username: "ibrahim", role: "SYSTEM_USER" },
        });

        const [base64, folder, format] = uploadFileEncryptedToS3.mock.calls[0];
        expect(base64).toBe("JVBERi0xLjQK");
        expect(folder).toContain("/system_user/ibrahim/vendor-ledger-slips/1");
        expect(format).toBe("pdf");
        expect(deposits.createDeposit.mock.calls[0][0].slip).toEqual({
            key: "staging/system_user/ibrahim/vendor-ledger-slips/1/uuid",
            name: "receipt.pdf",
            format: "pdf",
        });
    });

    it("strips a data uri prefix before encrypting", async () => {
        deposits.createDeposit.mockResolvedValue({ id: 3 });
        uploadFileEncryptedToS3.mockResolvedValue("key");

        await run(createVendorDeposit, {
            params: { vendorId: "1" },
            query: {},
            body: {
                amount: 1,
                depositDate: "2026-09-18",
                reference: "UTR-1",
                mode: "NEFT",
                note: "",
                slipBase64: "data:application/pdf;base64,JVBERi0xLjQK",
                slipName: "receipt.pdf",
                slipFormat: "pdf",
            },
            user: { ...USER, username: "ibrahim" },
        });

        expect(uploadFileEncryptedToS3.mock.calls[0][0]).toBe("JVBERi0xLjQK");
    });

    it("refuses a slip whose file type could not be read", async () => {
        const { next } = await run(createVendorDeposit, {
            params: { vendorId: "1" },
            query: {},
            body: {
                amount: 1,
                depositDate: "2026-09-18",
                reference: "UTR-1",
                mode: "NEFT",
                note: "",
                slipBase64: "JVBERi0xLjQK",
                slipName: "receipt.pdf",
            },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(uploadFileEncryptedToS3).not.toHaveBeenCalled();
        expect(deposits.createDeposit).not.toHaveBeenCalled();
    });

    it("turns a duplicate reference into a 409 rather than a 500", async () => {
        const conflict = new Error("Validation error");
        conflict.name = "SequelizeUniqueConstraintError";
        deposits.createDeposit.mockRejectedValue(conflict);

        const { next, res } = await run(createVendorDeposit, {
            params: { vendorId: "1" },
            query: {},
            body: { amount: 1, depositDate: "2026-09-18", reference: "UTR-1", mode: "NEFT", note: "" },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(409);
        expect(next.mock.calls[0][0].message).toContain("UTR-1");
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("lets any other database failure through untouched", async () => {
        deposits.createDeposit.mockRejectedValue(new Error("connection lost"));

        const { next } = await run(createVendorDeposit, {
            params: { vendorId: "1" },
            query: {},
            body: { amount: 1, depositDate: "2026-09-18", reference: "UTR-1", mode: "NEFT", note: "" },
            user: USER,
        });

        expect(next.mock.calls[0][0].message).toBe("connection lost");
        expect(next.mock.calls[0][0].status_code).toBeUndefined();
    });

    it("reports a duplicate credit note number the same way", async () => {
        const conflict = new Error("Validation error");
        conflict.name = "SequelizeUniqueConstraintError";
        entries.createEntry.mockRejectedValue(conflict);

        const { next } = await run(createVendorCreditNote, {
            params: { vendorId: "1" },
            query: {},
            body: { reference: "CN-1", amount: 1500, issueDate: "2026-09-18" },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(409);
        expect(next.mock.calls[0][0].message).toBe("Credit note is already recorded for this vendor");
    });

    it("attaches a document to a credit note too", async () => {
        entries.createEntry.mockResolvedValue({ id: 4 });
        uploadFileEncryptedToS3.mockResolvedValue("cn-key");

        await run(createVendorCreditNote, {
            params: { vendorId: "1" },
            query: {},
            body: {
                reference: "CN-1",
                amount: 1500,
                issueDate: "2026-09-18",
                slipBase64: "aW1n",
                slipName: "note.png",
                slipFormat: "png",
            },
            user: { ...USER, username: "ibrahim" },
        });

        expect(entries.createEntry.mock.calls[0][0]).toMatchObject({
            kind: "CREDIT_NOTE",
            slip: { key: "cn-key", name: "note.png", format: "png" },
        });
    });

    it("records and reverses a manual commission under its own kind", async () => {
        entries.createEntry.mockResolvedValue({ id: 9, kind: "COMMISSION" });

        const created = await run(createVendorCommission, {
            params: { vendorId: "1" },
            query: {},
            body: { reference: "CM-14", amount: 236, issueDate: "2026-09-19" },
            user: USER,
        });

        expect(entries.createEntry.mock.calls[0][0]).toMatchObject({
            vendorId: 1,
            kind: "COMMISSION",
            reference: "CM-14",
            amount: 236,
            gstInclusive: true,
            gstRate: 18,
            taxableAmount: 200,
            gstAmount: 36,
        });
        expect(created.res.status).toHaveBeenCalledWith(201);
        expect(created.res.json.mock.calls[0][0].message).toBe("Commission recorded successfully");

        entries.reverseEntry.mockResolvedValue({ id: 10, entryType: "REVERSAL" });
        const reversed = await run(reverseVendorCommission, {
            params: { vendorId: "1", id: "9" },
            body: { reason: "entered twice" },
            user: USER,
        });

        expect(entries.reverseEntry).toHaveBeenCalledWith({
            id: "9",
            vendorId: "1",
            kind: "COMMISSION",
            reason: "entered twice",
            actor: { id: 42, name: "Ibrahim" },
        });
        expect(dataOf(reversed.res).entryType).toBe("REVERSAL");

        entries.reverseEntry.mockResolvedValue(null);
        const missing = await run(reverseVendorCommission, {
            params: { vendorId: "1", id: "9" },
            body: { reason: "again" },
            user: USER,
        });
        expect(missing.next.mock.calls[0][0].status_code).toBe(404);
        expect(missing.next.mock.calls[0][0].message).toContain("Commission");
    });

    it("refuses a manual commission dated on or before the opening balance", async () => {
        deposits.findOpeningBalance.mockResolvedValue({ id: 11, depositDate: "2026-08-19" });

        const { next } = await run(createVendorCommission, {
            params: { vendorId: "1" },
            query: {},
            body: { reference: "CM-1", amount: 100, issueDate: "2026-08-19" },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(entries.createEntry).not.toHaveBeenCalled();
    });

    it("lists cost of sales as the hand-recorded entries alone, with nothing read off the journal", async () => {
        entries.listAllByVendor.mockResolvedValue([
            { id: 3, kind: "COST_OF_SALES", reference: "CS-1", issueDate: "2026-09-19", amount: 118, entryType: "ENTRY", status: "OPEN" },
        ]);

        const { res } = await run(listVendorCostOfSales, tabReq({ page: 1 }));

        expect(entries.listAllByVendor).toHaveBeenCalledWith(expect.objectContaining({ vendorId: 1, kind: "COST_OF_SALES" }));
        expect(useCases.listCommissionReversals).not.toHaveBeenCalled();
        expect(dataOf(res).entries.map(row => row.reference)).toEqual(["CS-1"]);
        expect(res.json.mock.calls[0][0].message).toBe("Vendor cost of sales fetched successfully");
    });

    it("records and reverses a cost of sales through the same path as a manual commission, under its own kind and name", async () => {
        entries.createEntry.mockResolvedValue({ id: 12, kind: "COST_OF_SALES" });

        const created = await run(createVendorCostOfSales, {
            params: { vendorId: "1" },
            query: {},
            body: { reference: "CS-3", amount: 118, issueDate: "2026-09-19" },
            user: USER,
        });

        expect(entries.createEntry.mock.calls[0][0]).toMatchObject({
            vendorId: 1,
            kind: "COST_OF_SALES",
            reference: "CS-3",
            amount: 118,
            gstInclusive: true,
            gstRate: 18,
            taxableAmount: 100,
            gstAmount: 18,
        });
        expect(created.res.status).toHaveBeenCalledWith(201);
        expect(created.res.json.mock.calls[0][0].message).toBe("Cost of sales recorded successfully");

        entries.reverseEntry.mockResolvedValue({ id: 13, entryType: "REVERSAL" });
        await run(reverseVendorCostOfSales, {
            params: { vendorId: "1", id: "12" },
            body: { reason: "entered twice" },
            user: USER,
        });
        expect(entries.reverseEntry).toHaveBeenCalledWith(
            expect.objectContaining({ id: "12", vendorId: "1", kind: "COST_OF_SALES", reason: "entered twice" })
        );

        entries.reverseEntry.mockResolvedValue(null);
        const missing = await run(reverseVendorCostOfSales, {
            params: { vendorId: "1", id: "12" },
            body: { reason: "again" },
            user: USER,
        });
        expect(missing.next.mock.calls[0][0].status_code).toBe(404);
        expect(missing.next.mock.calls[0][0].message).toContain("Cost of sales");
    });

    it("lists, records and reverses a debit note raised on the vendor under its own kind and name", async () => {
        entries.listAllByVendor.mockResolvedValue([
            { id: 4, kind: "DEBIT_NOTE", reference: "DN-1", issueDate: "2026-10-20", amount: 118, entryType: "ENTRY", status: "OPEN" },
        ]);
        const listed = await run(listVendorDebitNotes, tabReq({ page: 1 }));
        expect(entries.listAllByVendor).toHaveBeenCalledWith(expect.objectContaining({ vendorId: 1, kind: "DEBIT_NOTE" }));
        expect(dataOf(listed.res).entries.map(row => row.reference)).toEqual(["DN-1"]);
        expect(listed.res.json.mock.calls[0][0].message).toBe("Vendor debit notes fetched successfully");

        entries.createEntry.mockResolvedValue({ id: 14, kind: "DEBIT_NOTE" });
        const created = await run(createVendorDebitNote, {
            params: { vendorId: "1" },
            query: {},
            body: { reference: "DN-4", amount: 118, issueDate: "2026-10-20" },
            user: USER,
        });
        expect(entries.createEntry.mock.calls[0][0]).toMatchObject({ vendorId: 1, kind: "DEBIT_NOTE", reference: "DN-4", amount: 118 });
        expect(created.res.status).toHaveBeenCalledWith(201);
        expect(created.res.json.mock.calls[0][0].message).toBe("Debit note recorded successfully");

        entries.reverseEntry.mockResolvedValue({ id: 15, entryType: "REVERSAL" });
        await run(reverseVendorDebitNote, { params: { vendorId: "1", id: "14" }, body: { reason: "wrong vendor" }, user: USER });
        expect(entries.reverseEntry).toHaveBeenCalledWith(
            expect.objectContaining({ id: "14", vendorId: "1", kind: "DEBIT_NOTE", reason: "wrong vendor" })
        );
    });

    it("reverses a deposit and 404s when it is gone or already reversed", async () => {
        deposits.reverseDeposit.mockResolvedValue({ id: 9, entryType: "REVERSAL", reversesId: 3 });

        const { res } = await run(reverseVendorDeposit, {
            params: { vendorId: "1", id: "3" },
            body: { reason: "wrong vendor" },
            user: USER,
        });
        expect(deposits.reverseDeposit).toHaveBeenCalledWith({
            id: "3",
            vendorId: "1",
            reason: "wrong vendor",
            actor: { id: 42, name: "Ibrahim" },
        });
        expect(dataOf(res)).toEqual({ id: 9, entryType: "REVERSAL", reversesId: 3 });

        deposits.reverseDeposit.mockResolvedValue(null);
        const { next } = await run(reverseVendorDeposit, {
            params: { vendorId: "1", id: "3" },
            body: { reason: "again" },
            user: USER,
        });
        expect(next.mock.calls[0][0].status_code).toBe(404);
    });

    it("records and reverses a credit note", async () => {
        entries.createEntry.mockResolvedValue({ id: 4, status: "OPEN" });
        entries.reverseEntry.mockResolvedValue({ id: 5, entryType: "REVERSAL" });

        const created = await run(createVendorCreditNote, {
            params: { vendorId: "1" },
            query: {},
            body: { reference: "CN-1", amount: 1500, issueDate: "2026-09-18" },
            user: USER,
        });
        expect(created.res.status).toHaveBeenCalledWith(201);
        expect(entries.createEntry.mock.calls[0][0].kind).toBe("CREDIT_NOTE");

        const reversed = await run(reverseVendorCreditNote, {
            params: { vendorId: "1", id: "4" },
            body: { reason: "duplicate" },
            user: USER,
        });
        expect(dataOf(reversed.res).entryType).toBe("REVERSAL");
        expect(entries.reverseEntry.mock.calls[0][0].kind).toBe("CREDIT_NOTE");

        entries.reverseEntry.mockResolvedValue(null);
        const missing = await run(reverseVendorCreditNote, {
            params: { vendorId: "1", id: "4" },
            body: { reason: "again" },
            user: USER,
        });
        expect(missing.next.mock.calls[0][0].status_code).toBe(404);
    });

    it("records an opening balance and refuses a second one", async () => {
        deposits.createOpeningBalance.mockResolvedValue({ id: 11, entryType: "OPENING" });

        const { res } = await run(createVendorOpeningBalance, {
            params: { vendorId: "1" },
            query: {},
            body: { amount: 75000, asOfDate: "2026-08-19", note: "carried in" },
            user: USER,
        });

        expect(deposits.createOpeningBalance).toHaveBeenCalledWith(
            expect.objectContaining({ vendorId: 1, amount: 75000, asOfDate: "2026-08-19" })
        );
        expect(res.status).toHaveBeenCalledWith(201);

        const conflict = new Error("Validation error");
        conflict.name = "SequelizeUniqueConstraintError";
        deposits.createOpeningBalance.mockRejectedValue(conflict);

        const { next } = await run(createVendorOpeningBalance, {
            params: { vendorId: "1" },
            query: {},
            body: { amount: 1, asOfDate: "2026-08-19", note: "" },
            user: USER,
        });
        expect(next.mock.calls[0][0].status_code).toBe(409);
        expect(next.mock.calls[0][0].message).toContain("Reverse it");
    });

    it("refuses an opening balance that sits below the accounting go live date", async () => {
        openingBeforeGoLive.mockResolvedValue("An opening balance must be dated 2026-09-30 or later");

        const { next } = await run(createVendorOpeningBalance, {
            params: { vendorId: "1" },
            query: {},
            body: { amount: 75000, asOfDate: "2026-08-19", note: "" },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(deposits.createOpeningBalance).not.toHaveBeenCalled();
    });

    it("refuses an entry dated on or before the opening balance", async () => {
        deposits.findOpeningBalance.mockResolvedValue({ id: 11, depositDate: "2026-08-19" });

        const { next } = await run(createVendorDeposit, {
            params: { vendorId: "1" },
            query: {},
            body: {
                amount: 100,
                depositDate: "2026-08-19",
                reference: "UTR-9",
                mode: "NEFT",
                note: "",
            },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(next.mock.calls[0][0].message).toContain("2026-08-19");
        expect(deposits.createDeposit).not.toHaveBeenCalled();
    });

    it("accepts an entry dated after the opening balance", async () => {
        deposits.findOpeningBalance.mockResolvedValue({ id: 11, depositDate: "2026-08-19" });
        deposits.createDeposit.mockResolvedValue({ id: 12 });

        const { res } = await run(createVendorDeposit, {
            params: { vendorId: "1" },
            query: {},
            body: {
                amount: 100,
                depositDate: "2026-08-20",
                reference: "UTR-9",
                mode: "NEFT",
                note: "",
            },
            user: USER,
        });

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("lists deposits for the vendor", async () => {
        const depositsRes = await run(listVendorDeposits, tabReq());
        expect(dataOf(depositsRes.res)).toMatchObject({ entries: [{ id: 3 }], recordsTotal: 1 });
    });

    it("merges the manual credit notes with the reversals read off the journal", async () => {
        useCases.listCommissionReversals.mockResolvedValue([
            { id: null, issueDate: "2026-09-20", source: "AUTO", amount: 29.5 },
            { id: null, issueDate: "2026-09-01", source: "AUTO", amount: 10 },
        ]);

        const { res } = await run(listVendorCreditNotes, {
            params: { vendorId: "1" },
            query: { page: 1, itemsPerPage: 10, searchText: "" },
            user: USER,
        });

        expect(entries.listAllByVendor).toHaveBeenCalledWith({
            vendorId: 1,
            kind: "CREDIT_NOTE",
            range: null,
        });
        expect(useCases.listCommissionReversals).toHaveBeenCalledWith({
            vendorId: 1,
            accountIds: ["acc-1", "legacy-1"],
            range: null,
        });

        const data = dataOf(res);
        expect(data.recordsTotal).toBe(3);
        expect(data.entries.map(entry => entry.issueDate)).toEqual([
            "2026-09-20",
            "2026-09-18",
            "2026-09-01",
        ]);
    });

    it("cuts the merged page after both sources are in", async () => {
        entries.listAllByVendor.mockResolvedValue([]);
        useCases.listCommissionReversals.mockResolvedValue(
            Array.from({ length: 12 }, (_, index) => ({
                id: null,
                issueDate: `2026-09-${String(index + 1).padStart(2, "0")}`,
                source: "AUTO",
            }))
        );

        const { res } = await run(listVendorCreditNotes, {
            params: { vendorId: "1" },
            query: { page: 2, itemsPerPage: 10, searchText: "" },
            user: USER,
        });

        expect(dataOf(res).recordsTotal).toBe(12);
        expect(dataOf(res).entries).toHaveLength(2);
        expect(dataOf(res).entries[0].issueDate).toBe("2026-09-02");
    });
});

describe("tax invoice and tax credit note downloads", () => {
    const fileRes = () => {
        const res = {};
        res.status = jest.fn(() => res);
        res.send = jest.fn(() => res);
        res.setHeader = jest.fn();
        return res;
    };

    const download = async (handler, params) => {
        const res = fileRes();
        const next = jest.fn();
        await handler({ params, query: {}, user: USER }, res, next);
        return { res, next };
    };

    const headers = res =>
        Object.fromEntries(res.setHeader.mock.calls.map(([name, value]) => [name, value]));

    const INVOICE = { number: "INV-1", payload: { documentTitle: "Tax Invoice", invoiceNumber: "INV-1" } };
    const CREDIT_NOTE = { number: "CRN-1", payload: { documentTitle: "Tax Credit Note", invoiceNumber: "CRN-1" } };

    beforeEach(() => {
        jest.clearAllMocks();
        useCases.findVendorById.mockResolvedValue(VENDOR_ROW);
        useCases.getVendorDepositAccounts.mockResolvedValue({
            sharedAccountId: "acc-1",
            legacyByVendorId: { 1: ["legacy-1"] },
        });
        useCases.accountIdsForVendor.mockReturnValue(["acc-1", "legacy-1"]);
        renderPdf.mockResolvedValue(Buffer.from("%PDF-1.4"));
        isPdfBuffer.mockReturnValue(true);
        taxDocuments.documentFileName.mockReturnValue("Cleartrip Tax Invoice INV-1.pdf");
    });

    it("streams the invoice stored on an order", async () => {
        taxDocuments.orderInvoiceDocument.mockResolvedValue(INVOICE);

        const { res, next } = await download(downloadVendorCommissionInvoice, {
            vendorId: "1",
            source: "order",
            id: "TXN-1",
        });

        expect(taxDocuments.orderInvoiceDocument).toHaveBeenCalledWith({
            vendorId: 1,
            corporateTxnId: "TXN-1",
            ledgerAccountIds: ["acc-1", "legacy-1", "commission-1"],
        });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(headers(res)).toEqual({
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="Cleartrip Tax Invoice INV-1.pdf"',
        });
    });

    it("streams a manual commission's invoice from the entry itself", async () => {
        taxDocuments.manualEntryDocument.mockResolvedValue(INVOICE);

        const { next } = await download(downloadVendorCommissionInvoice, {
            vendorId: "1",
            source: "manual",
            id: "12",
        });

        expect(taxDocuments.manualEntryDocument).toHaveBeenCalledWith({
            vendorId: 1,
            id: "12",
            kind: "COMMISSION",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("streams a refund's credit note against the vendor's own deposit accounts", async () => {
        taxDocuments.orderCreditNoteDocument.mockResolvedValue(CREDIT_NOTE);

        const { next } = await download(downloadVendorCreditNote, {
            vendorId: "1",
            source: "auto",
            id: "TXN-1",
        });

        expect(taxDocuments.orderCreditNoteDocument).toHaveBeenCalledWith({
            vendorId: 1,
            corporateTxnId: "TXN-1",
            accountIds: ["acc-1", "legacy-1"],
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("streams a manual credit note from the entry itself", async () => {
        taxDocuments.manualEntryDocument.mockResolvedValue(CREDIT_NOTE);

        await download(downloadVendorCreditNote, { vendorId: "1", source: "manual", id: "13" });

        expect(taxDocuments.manualEntryDocument).toHaveBeenCalledWith({
            vendorId: 1,
            id: "13",
            kind: "CREDIT_NOTE",
        });
    });

    it("refuses a source that does not belong to the tab", async () => {
        const invoice = await download(downloadVendorCommissionInvoice, {
            vendorId: "1",
            source: "auto",
            id: "TXN-1",
        });
        const note = await download(downloadVendorCreditNote, {
            vendorId: "1",
            source: "order",
            id: "TXN-1",
        });

        [invoice, note].forEach(({ next }) => {
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Invalid document source" })
            );
        });
        expect(taxDocuments.orderInvoiceDocument).not.toHaveBeenCalled();
        expect(taxDocuments.orderCreditNoteDocument).not.toHaveBeenCalled();
    });

    it("answers 404 for a vendor that does not exist", async () => {
        useCases.findVendorById.mockResolvedValue(null);

        const { next } = await download(downloadVendorCommissionInvoice, {
            vendorId: "99",
            source: "order",
            id: "TXN-1",
        });

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Vendor not found", status_code: 404 })
        );
    });

    it("answers 404 when the document belongs to another vendor or was never raised", async () => {
        taxDocuments.orderInvoiceDocument.mockResolvedValue(null);

        const { next, res } = await download(downloadVendorCommissionInvoice, {
            vendorId: "1",
            source: "order",
            id: "TXN-OTHER",
        });

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Document not available for this entry",
                status_code: 404,
            })
        );
        expect(res.send).not.toHaveBeenCalled();
    });

    it("refuses to hand back anything that is not a pdf", async () => {
        taxDocuments.orderInvoiceDocument.mockResolvedValue(INVOICE);
        isPdfBuffer.mockReturnValue(false);

        const { next, res } = await download(downloadVendorCommissionInvoice, {
            vendorId: "1",
            source: "order",
            id: "TXN-1",
        });

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Could not render the document", status_code: 503 })
        );
        expect(res.send).not.toHaveBeenCalled();
    });
});

describe("correcting a vendor entry recorded by hand", () => {
    const changeReq = (id, body) => ({ params: { vendorId: "1", id }, query: {}, body, user: USER });

    const DEPOSIT_EDIT = {
        amount: 25500,
        depositDate: "2026-09-20",
        reference: "UTR-2",
        mode: "NEFT",
        note: "",
        changeReason: "Typed the wrong amount",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useCases.findVendorById.mockResolvedValue(VENDOR_ROW);
        useCases.getVendorDepositAccounts.mockResolvedValue({ sharedAccountId: "acc-1" });
        useCases.accountIdsForVendor.mockReturnValue(["acc-1"]);
        useCases.ledgerAccountIdsForVendor.mockReturnValue(["acc-1"]);
        deposits.findOpeningBalance.mockResolvedValue(null);
        openingBeforeGoLive.mockResolvedValue(null);
    });

    it("edits a deposit with who did it, why, and an audit label that names the vendor", async () => {
        deposits.updateDeposit.mockResolvedValue({ outcome: "UPDATED", row: { id: 3, amount: 25500 } });

        const { res } = await run(updateVendorDeposit, changeReq("3", DEPOSIT_EDIT));

        const [args] = deposits.updateDeposit.mock.calls[0];
        expect(args).toMatchObject({
            id: "3",
            vendorId: 1,
            entryType: "DEPOSIT",
            values: { amount: 25500, depositDate: "2026-09-20", reference: "UTR-2", mode: "NEFT", note: "" },
            slip: null,
            actor: USER,
            changeReason: "Typed the wrong amount",
        });
        expect(args.values).not.toHaveProperty("changeReason");
        expect(args.audit.configType).toBe("VENDOR_LEDGER");
        expect(args.audit.labelOf({ reference: "UTR-2" })).toBe("Cleartrip Private Limited › Deposit UTR-2");
        expect(args.audit.labelOf({ entryNumber: "DEP-000002", reference: "UTR-2" })).toBe(
            "Cleartrip Private Limited › Deposit DEP-000002"
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toMatchObject({ data: { id: 3, amount: 25500 }, message: "Deposit updated successfully" });
    });

    it("answers each refusal with its own status", async () => {
        const outcomes = [
            [{ outcome: "MISSING" }, 404, "Deposit not found"],
            [{ outcome: "REVERSED" }, 409, "This deposit was reversed, so it can no longer be changed or deleted"],
            [{ outcome: "UNCHANGED" }, 400, "Nothing was changed on this entry"],
            [{ outcome: "REFUSED", reason: "Held" }, 409, "Held"],
        ];
        for (const [result, status, message] of outcomes) {
            deposits.updateDeposit.mockResolvedValueOnce(result);
            const { next } = await run(updateVendorDeposit, changeReq("3", DEPOSIT_EDIT));
            expect([next.mock.calls[0][0].status_code, next.mock.calls[0][0].message]).toEqual([status, message]);
        }

        useCases.findVendorById.mockResolvedValue(null);
        const { next } = await run(updateVendorDeposit, changeReq("3", DEPOSIT_EDIT));
        expect(next.mock.calls[0][0].status_code).toBe(404);
    });

    it("refuses to move a deposit on or before the opening and turns a taken reference into a 409", async () => {
        deposits.findOpeningBalance.mockResolvedValue({ id: 11, depositDate: "2026-09-20" });
        const before = await run(updateVendorDeposit, changeReq("3", DEPOSIT_EDIT));
        expect(before.next.mock.calls[0][0].status_code).toBe(400);
        expect(deposits.updateDeposit).not.toHaveBeenCalled();

        deposits.findOpeningBalance.mockResolvedValue(null);
        const conflict = new Error("Validation error");
        conflict.name = "SequelizeUniqueConstraintError";
        deposits.updateDeposit.mockRejectedValue(conflict);
        const taken = await run(updateVendorDeposit, changeReq("3", DEPOSIT_EDIT));
        expect(taken.next.mock.calls[0][0].status_code).toBe(409);
        expect(taken.next.mock.calls[0][0].message).toContain("UTR-2");
    });

    it("uploads a replacement document and keeps the file out of the values", async () => {
        uploadFileEncryptedToS3.mockResolvedValue("key-1");
        deposits.updateDeposit.mockResolvedValue({ outcome: "UPDATED", row: { id: 3 } });

        await run(updateVendorDeposit, changeReq("3", { ...DEPOSIT_EDIT, slipBase64: "JVBERi0=", slipName: "new.pdf", slipFormat: "pdf" }));

        const [args] = deposits.updateDeposit.mock.calls[0];
        expect(args.slip).toEqual({ key: "key-1", name: "new.pdf", format: "pdf" });
        expect(args.values).not.toHaveProperty("slipBase64");
    });

    it("deletes a deposit with the reason given", async () => {
        deposits.deleteDeposit.mockResolvedValue({ outcome: "DELETED", row: { id: 3 } });

        const { res } = await run(deleteVendorDeposit, changeReq("3", { reason: "Recorded twice" }));

        expect(deposits.deleteDeposit).toHaveBeenCalledWith(
            expect.objectContaining({ id: "3", vendorId: 1, entryType: "DEPOSIT", actor: USER, changeReason: "Recorded twice" })
        );
        expect(res.json.mock.calls[0][0].message).toBe("Deposit deleted. Mark it removed from the books to take it off the portal");
    });
});

describe("correcting a vendor opening balance and manual entries", () => {
    const changeReq = (id, body) => ({ params: { vendorId: "1", id }, query: {}, body, user: USER });

    const OPENING_EDIT = { amount: 80000, asOfDate: "2026-08-25", note: "statement", changeReason: "Per the statement" };

    beforeEach(() => {
        jest.clearAllMocks();
        useCases.findVendorById.mockResolvedValue(VENDOR_ROW);
        useCases.getVendorDepositAccounts.mockResolvedValue({ sharedAccountId: "acc-1" });
        useCases.accountIdsForVendor.mockReturnValue(["acc-1"]);
        useCases.ledgerAccountIdsForVendor.mockReturnValue(["acc-1"]);
        deposits.findOpeningBalance.mockResolvedValue({ id: 11, depositDate: "2026-08-19" });
        deposits.findFirstEntryDate.mockResolvedValue("2026-09-01");
        entries.findFirstEntryDate.mockResolvedValue("2026-09-10");
        openingBeforeGoLive.mockResolvedValue(null);
        deposits.updateDeposit.mockResolvedValue({ outcome: "UPDATED", row: { id: 11 } });
    });

    it("edits the opening under its own key, carrying the as of date into the deposit date", async () => {
        const { res } = await run(updateVendorOpeningBalance, changeReq("11", OPENING_EDIT));

        const [args] = deposits.updateDeposit.mock.calls[0];
        expect(args).toMatchObject({
            id: "11",
            entryType: "OPENING",
            values: { amount: 80000, depositDate: "2026-08-25", note: "statement" },
            changeReason: "Per the statement",
        });
        expect(args.audit.labelOf({})).toBe("Cleartrip Private Limited › Opening balance");
        expect(res.json.mock.calls[0][0].message).toBe("Opening balance updated successfully");
    });

    it("refuses to move the opening onto the first entry, or below go live", async () => {
        const onEntry = await run(updateVendorOpeningBalance, changeReq("11", { ...OPENING_EDIT, asOfDate: "2026-09-01" }));
        expect(onEntry.next.mock.calls[0][0].status_code).toBe(400);
        expect(onEntry.next.mock.calls[0][0].message).toContain("before the first entry on this ledger, 2026-09-01");

        openingBeforeGoLive.mockResolvedValue("An opening balance must be dated 2026-08-31 or later");
        const early = await run(updateVendorOpeningBalance, changeReq("11", OPENING_EDIT));
        expect(early.next.mock.calls[0][0].status_code).toBe(400);
        expect(deposits.updateDeposit).not.toHaveBeenCalled();
    });

    it("does not look at the entries when the opening keeps or moves back its date", async () => {
        await run(updateVendorOpeningBalance, changeReq("11", { ...OPENING_EDIT, asOfDate: "2026-08-10" }));

        expect(deposits.findFirstEntryDate).not.toHaveBeenCalled();
        expect(deposits.updateDeposit).toHaveBeenCalled();
    });

    it("deletes the opening under its own key", async () => {
        deposits.deleteDeposit.mockResolvedValue({ outcome: "DELETED", row: { id: 11 } });

        const { res } = await run(deleteVendorOpeningBalance, changeReq("11", { reason: "Wrong vendor" }));

        expect(deposits.deleteDeposit).toHaveBeenCalledWith(expect.objectContaining({ id: "11", entryType: "OPENING" }));
        expect(res.json.mock.calls[0][0].message).toBe("Opening balance deleted. Mark it removed from the books to take it off the portal");
    });

    it("edits and deletes a credit note and a commission by their kind", async () => {
        entries.updateEntry.mockResolvedValue({ outcome: "UPDATED", row: { id: 4 } });
        entries.deleteEntry.mockResolvedValue({ outcome: "DELETED", row: { id: 5 } });
        const body = { reference: "CN-2", amount: 1500, issueDate: "2026-09-20", reason: "", againstCorporateTxnId: "", changeReason: "Typo" };

        const edited = await run(updateVendorCreditNote, changeReq("4", body));
        await run(updateVendorCommission, changeReq("6", { ...body, reference: "CM-2" }));
        await run(updateVendorCostOfSales, changeReq("7", { ...body, reference: "CS-2" }));
        await run(updateVendorDebitNote, changeReq("9", { ...body, reference: "DN-2" }));
        await run(deleteVendorCreditNote, changeReq("4", { reason: "Duplicate" }));
        const deleted = await run(deleteVendorCommission, changeReq("5", { reason: "Duplicate" }));
        await run(deleteVendorCostOfSales, changeReq("8", { reason: "Duplicate" }));
        await run(deleteVendorDebitNote, changeReq("10", { reason: "Duplicate" }));

        expect(entries.updateEntry.mock.calls.map(([args]) => args.kind)).toEqual(["CREDIT_NOTE", "COMMISSION", "COST_OF_SALES", "DEBIT_NOTE"]);
        expect(entries.updateEntry.mock.calls[3][0].audit.labelOf({ reference: "DN-2" })).toBe(
            "Cleartrip Private Limited › Debit note DN-2"
        );
        expect(entries.updateEntry.mock.calls[2][0].audit.labelOf({ reference: "CS-2" })).toBe(
            "Cleartrip Private Limited › Cost of sales CS-2"
        );
        expect(entries.updateEntry.mock.calls[0][0].values).toMatchObject({
            amount: 1500,
            gstInclusive: true,
            gstRate: 18,
            taxableAmount: 1271.19,
            gstAmount: 228.81,
        });
        expect(entries.updateEntry.mock.calls[0][0].audit.labelOf({ reference: "CN-2" })).toBe(
            "Cleartrip Private Limited › Credit note CN-2"
        );
        expect(entries.updateEntry.mock.calls[0][0].audit.labelOf({ entryNumber: "VCN-000002", reference: "CN-2" })).toBe(
            "Cleartrip Private Limited › Credit note VCN-000002"
        );
        expect(entries.deleteEntry.mock.calls.map(([args]) => args.kind)).toEqual(["CREDIT_NOTE", "COMMISSION", "COST_OF_SALES", "DEBIT_NOTE"]);
        expect(edited.res.json.mock.calls[0][0].message).toBe("Credit note updated successfully");
        expect(deleted.res.json.mock.calls[0][0].message).toBe("Commission deleted. Mark it removed from the books to take it off the portal");
    });

    it("keeps the rate an entry was recorded under when it is edited, and adds GST on top of an exclusive figure", async () => {
        entries.updateEntry.mockResolvedValue({ outcome: "UPDATED", row: { id: 4 } });
        entries.findEntry.mockResolvedValue({ id: 4, gstRate: 12 });
        const body = { reference: "CN-2", amount: 1000, gstInclusive: false, issueDate: "2026-09-20", reason: "", againstCorporateTxnId: "", changeReason: "Typo" };

        await run(updateVendorCreditNote, changeReq("4", body));

        expect(entries.findEntry).toHaveBeenCalledWith({ id: "4", vendorId: 1, kind: "CREDIT_NOTE" });
        expect(entries.updateEntry.mock.calls[0][0].values).toMatchObject({
            amount: 1120,
            gstInclusive: false,
            gstRate: 12,
            taxableAmount: 1000,
            gstAmount: 120,
        });
    });

    it("refuses a manual entry moved on or before the opening", async () => {
        const body = { reference: "CN-2", amount: 1500, issueDate: "2026-08-19", reason: "", againstCorporateTxnId: "", changeReason: "Typo" };

        const { next } = await run(updateVendorCreditNote, changeReq("4", body));

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(entries.updateEntry).not.toHaveBeenCalled();
    });
});

describe("marking a vendor entry as in the books", () => {
    const tagReq = (id, synced) => ({ params: { vendorId: "1", id }, query: {}, body: { synced }, user: USER });

    beforeEach(() => {
        jest.clearAllMocks();
        useCases.findVendorById.mockResolvedValue(VENDOR_ROW);
        useCases.getVendorDepositAccounts.mockResolvedValue({ sharedAccountId: "acc-1" });
        useCases.accountIdsForVendor.mockReturnValue(["acc-1"]);
        useCases.ledgerAccountIdsForVendor.mockReturnValue(["acc-1"]);
    });

    it("marks a deposit with who did it, naming a reversal and the opening by what they are", async () => {
        deposits.tagDepositBooks.mockResolvedValue({ outcome: "UPDATED", row: { id: 3, booksSynced: true } });

        const { res } = await run(tagVendorDepositBooks, tagReq("3", true));

        const [args] = deposits.tagDepositBooks.mock.calls[0];
        expect(args).toMatchObject({ id: "3", vendorId: 1, synced: true, actor: USER });
        expect(args.audit.labelOf({ entryType: "REVERSAL", reference: "UTR-1" })).toBe(
            "Cleartrip Private Limited › Deposit UTR-1 reversal"
        );
        expect(args.audit.labelOf({ entryType: "OPENING" })).toBe("Cleartrip Private Limited › Opening balance");
        expect(res.json.mock.calls[0][0]).toMatchObject({
            data: { id: 3, booksSynced: true, removed: false },
            message: "Entry marked as in the books",
        });
    });

    it("says when a deleted entry is gone from the portal, and when there was nothing to mark", async () => {
        deposits.tagDepositBooks.mockResolvedValueOnce({ outcome: "REMOVED", row: { id: 3 } });
        const removed = await run(tagVendorDepositBooks, tagReq("3", true));
        expect(removed.res.json.mock.calls[0][0]).toMatchObject({
            data: { id: 3, removed: true },
            message: "Entry removed from the portal",
        });

        deposits.tagDepositBooks.mockResolvedValueOnce({ outcome: "MISSING" });
        const missing = await run(tagVendorDepositBooks, tagReq("9", true));
        expect(missing.next.mock.calls[0][0].status_code).toBe(404);
    });

    it("marks credit notes, commissions and cost of sales by their kind", async () => {
        entries.tagEntryBooks.mockResolvedValue({ outcome: "UPDATED", row: { id: 4, booksSynced: false } });

        const { res } = await run(tagVendorCreditNoteBooks, tagReq("4", false));
        await run(tagVendorCommissionBooks, tagReq("5", true));
        const costOfSales = await run(tagVendorCostOfSalesBooks, tagReq("6", true));
        const debitNote = await run(tagVendorDebitNoteBooks, tagReq("7", true));

        expect(entries.tagEntryBooks.mock.calls.map(([args]) => args.kind)).toEqual(["CREDIT_NOTE", "COMMISSION", "COST_OF_SALES", "DEBIT_NOTE"]);
        expect(debitNote.res.json.mock.calls[0][0].message).toBe("Debit note marked as not in the books");
        expect(costOfSales.res.json.mock.calls[0][0].message).toBe("Cost of sales marked as not in the books");
        expect(res.json.mock.calls[0][0].message).toBe("Credit note marked as not in the books");
    });
});
