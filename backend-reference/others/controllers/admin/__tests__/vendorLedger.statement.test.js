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
    serializeTransaction: jest.fn(),
    serializeCommission: jest.fn(),
    getVendorLedgerSummary: jest.fn(),
    getVendorLedgerSnapshot: jest.fn(),
    serializeVendor: jest.fn(),
    buildVendorKpis: jest.fn(),
}));
jest.mock("../../../models/use-cases/vendorDeposits", () => ({
    DEPOSIT_MODES: ["NEFT"],
    serializeDeposit: jest.fn(),
    listByVendor: jest.fn(),
    findOpeningBalance: jest.fn(),
    createDeposit: jest.fn(),
    createOpeningBalance: jest.fn(),
    reverseDeposit: jest.fn(),
}));
jest.mock("../../../models/use-cases/vendorLedgerEntries", () => ({
    ENTRY_KINDS: { creditNote: "CREDIT_NOTE", commission: "COMMISSION", costOfSales: "COST_OF_SALES", debitNote: "DEBIT_NOTE" },
    serializeEntry: jest.fn(),
    listAllByVendor: jest.fn(),
    createEntry: jest.fn(),
    reverseEntry: jest.fn(),
}));
jest.mock("../../../models/use-cases/vendorTaxDocuments", () => ({
    orderInvoiceDocument: jest.fn(),
    orderCreditNoteDocument: jest.fn(),
    manualEntryDocument: jest.fn(),
    documentFileName: jest.fn(),
}));
jest.mock("../../../models/use-cases/vendorStatement", () => ({
    buildVendorStatement: jest.fn(),
    statementExcelRows: jest.requireActual("../../../models/use-cases/ledgerStatement").statementExcelRows,
}));
jest.mock("../../../models/use-cases/accountingPeriod", () => ({ openingBeforeGoLive: jest.fn() }));
jest.mock("../../../utils/s3", () => ({ uploadFileEncryptedToS3: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));
jest.mock("../../../utils/puppeteerPool", () => ({ renderPdf: jest.fn() }));
jest.mock("../../../utils/generateExcelBufferAndType", () => ({ generateExcelBufferAndType: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));
jest.mock("../../../utils/invoiceTemplate", () => ({ taxInvoiceTemplate: jest.fn() }));

const useCases = require("../../../models/use-cases/vendorLedger");
const deposits = require("../../../models/use-cases/vendorDeposits");
const statementUse = require("../../../models/use-cases/vendorStatement");
const { renderPdf } = require("../../../utils/puppeteerPool");
const { generateExcelBufferAndType } = require("../../../utils/generateExcelBufferAndType");
const { getVendorStatement, exportVendorStatement, exportVendorStatementPdf } = require("../vendorLedger");

const POSTED = { state: "posted", note: null, detail: null };
const NOT_APPLICABLE = { state: "notApplicable", note: null, detail: null };

const STATEMENT = {
    openingBalance: -9000,
    totalDebit: 29982.02,
    totalCredit: 53446.26,
    closingBalance: -32464.24,
    truncated: false,
    rows: [
        { date: "2026-09-07", particulars: "Order value — Xoxoday", reference: "1788761320899", type: "Order", debit: null, credit: 5000, balance: -14000, posting: POSTED },
        { date: "2026-09-07", particulars: "Commission", reference: "1788761320899", type: "Commission", debit: 225, credit: null, balance: -13775, posting: POSTED },
        { date: "2026-09-10", particulars: "Deposit — NEFT", reference: "UTR-1", type: "Deposit", debit: 3000, credit: null, balance: -10775, posting: NOT_APPLICABLE },
        { date: "2026-09-12", particulars: "Credit note", reference: "CN-7", type: "Credit note", debit: null, credit: 250, balance: -11025, posting: NOT_APPLICABLE },
    ],
};

const RANGE_QUERY = { from: "2026-09-07", to: "2026-10-07" };

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    res.send = jest.fn(() => res);
    res.setHeader = jest.fn();
    return res;
};

const run = async (handler, query) => {
    const res = mockRes();
    const next = jest.fn();
    await handler({ params: { vendorId: "5001" }, query: { page: 1, itemsPerPage: 10, ...RANGE_QUERY, ...query } }, res, next);
    return { res, next };
};

const dataOf = res => res.json.mock.calls[0][0].data;
const rowsOfExcel = () => generateExcelBufferAndType.mock.calls[0][0];

beforeEach(() => {
    jest.clearAllMocks();
    useCases.findVendorById.mockResolvedValue({ id: 5001, vendorName: "xoxoday" });
    useCases.getVendorDepositAccounts.mockResolvedValue({ sharedAccountId: "acc-1" });
    useCases.accountIdsForVendor.mockReturnValue(["acc-1"]);
    useCases.ledgerAccountIdsForVendor.mockReturnValue(["acc-1"]);
    deposits.findOpeningBalance.mockResolvedValue(null);
    statementUse.buildVendorStatement.mockResolvedValue(STATEMENT);
    generateExcelBufferAndType.mockResolvedValue({ buffer: Buffer.from("x"), fileType: "application/xlsx" });
    renderPdf.mockResolvedValue(Buffer.from("%PDF"));
});

describe("getVendorStatement — the lines the table lists", () => {
    it("lists every line, with the period's figures, until something is asked for", async () => {
        const { res } = await run(getVendorStatement, {});

        expect(dataOf(res).entries).toEqual(STATEMENT.rows);
        expect(dataOf(res).recordsTotal).toBe(4);
        expect(dataOf(res)).toMatchObject({
            openingBalance: -9000,
            totalDebit: 29982.02,
            totalCredit: 53446.26,
            closingBalance: -32464.24,
        });
    });

    it("narrows to the debit lines, or the credit lines, and counts only those", async () => {
        const debit = dataOf((await run(getVendorStatement, { side: "debit" })).res);
        expect(debit.entries.map(row => row.type)).toEqual(["Commission", "Deposit"]);
        expect(debit.recordsTotal).toBe(2);

        statementUse.buildVendorStatement.mockResolvedValue(STATEMENT);
        const credit = dataOf((await run(getVendorStatement, { side: "credit" })).res);
        expect(credit.entries.map(row => row.type)).toEqual(["Order", "Credit note"]);
        expect(credit.recordsTotal).toBe(2);
    });

    it("keeps the figures and the running balance of the whole period when it narrows the lines", async () => {
        const { res } = await run(getVendorStatement, { side: "debit" });

        expect(dataOf(res)).toMatchObject({ openingBalance: -9000, closingBalance: -32464.24, totalDebit: 29982.02 });
        expect(dataOf(res).entries.map(row => row.balance)).toEqual([-13775, -10775]);
    });

    it("searches the particulars, the reference and the type", async () => {
        expect(dataOf((await run(getVendorStatement, { searchText: "utr" })).res).entries).toHaveLength(1);
        expect(dataOf((await run(getVendorStatement, { searchText: "1788761320899" })).res).recordsTotal).toBe(2);
        expect(dataOf((await run(getVendorStatement, { searchText: "CREDIT NOTE" })).res).entries[0].reference).toBe("CN-7");
    });

    it("pages the lines that match, not the whole statement", async () => {
        const { res } = await run(getVendorStatement, { side: "debit", page: 2, itemsPerPage: 1 });

        expect(dataOf(res).entries.map(row => row.type)).toEqual(["Deposit"]);
        expect(dataOf(res).recordsTotal).toBe(2);
    });

    it("lists every line for a side it does not know", async () => {
        const { res } = await run(getVendorStatement, { side: "both" });

        expect(dataOf(res).recordsTotal).toBe(4);
    });
});

describe("exportVendorStatement — the Excel", () => {
    it("keeps the opening and closing lines when nothing is filtered", async () => {
        await run(exportVendorStatement, {});

        const rows = rowsOfExcel();
        expect(rows[0].Particulars).toBe("Opening balance");
        expect(rows.at(-1).Particulars).toBe("Closing balance");
        expect(rows).toHaveLength(STATEMENT.rows.length + 2);
    });

    it("lists only the matching lines when filtered, without the whole-period opening and closing lines", async () => {
        await run(exportVendorStatement, { side: "debit", searchText: "" });

        const rows = rowsOfExcel();
        expect(rows.map(row => row.Type)).toEqual(["Commission", "Deposit"]);
        expect(rows.map(row => row.Particulars)).not.toContain("Opening balance");
        expect(rows.map(row => row.Particulars)).not.toContain("Closing balance");
        expect(rows.map(row => row.Balance)).toEqual([-13775, -10775]);
    });

    it("narrows by the search the table has", async () => {
        await run(exportVendorStatement, { searchText: "utr" });

        expect(rowsOfExcel().map(row => row.Reference)).toEqual(["UTR-1"]);
    });

    it("tells the user when the filters match nothing, instead of sending an empty file", async () => {
        const { next } = await run(exportVendorStatement, { searchText: "nothing like this" });

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(generateExcelBufferAndType).not.toHaveBeenCalled();
    });

    it("sends the file under the vendor's name and the period", async () => {
        const { res } = await run(exportVendorStatement, { side: "credit" });

        expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/xlsx");
        expect(res.setHeader).toHaveBeenCalledWith(
            "Content-Disposition",
            expect.stringContaining("xoxoday statement 2026-09-07_to_2026-10-07.xlsx")
        );
    });
});

describe("exportVendorStatementPdf — the PDF", () => {
    const htmlOf = () => renderPdf.mock.calls[0][0];

    it("keeps the opening and closing lines, and says nothing of filters, when nothing is filtered", async () => {
        await run(exportVendorStatementPdf, {});

        expect(htmlOf()).toContain("Opening balance");
        expect(htmlOf()).toContain("Closing balance");
        expect(htmlOf()).not.toContain("Only the lines matching these filters are listed");
        expect(htmlOf()).not.toContain("Debit only");
    });

    it("lists only the matching lines when filtered, and says which filters were used", async () => {
        await run(exportVendorStatementPdf, { side: "debit", searchText: "" });

        const html = htmlOf();
        expect(html).toContain("Commission");
        expect(html).toContain("UTR-1");
        expect(html).not.toContain("Order value");
        expect(html).not.toContain("CN-7");
        expect(html).toContain("Debit only");
        expect(html).toContain("Only the lines matching these filters are listed.");
        expect(html).not.toContain('<tr class="marker">');
    });

    it("keeps the period's figures in the tiles whatever is filtered", async () => {
        await run(exportVendorStatementPdf, { side: "debit" });

        expect(htmlOf()).toContain("29,982.02");
        expect(htmlOf()).toContain("53,446.26");
    });

    it("names the search too, and escapes it", async () => {
        await run(exportVendorStatementPdf, { searchText: "utr" });
        expect(htmlOf()).toContain("Search: &quot;utr&quot;");
    });

    it("tells the user when the filters match nothing, instead of rendering an empty statement", async () => {
        const { next } = await run(exportVendorStatementPdf, { side: "credit", searchText: "utr" });

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(renderPdf).not.toHaveBeenCalled();
    });
});
