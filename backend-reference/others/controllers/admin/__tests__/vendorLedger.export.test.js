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
    serializeTransaction: jest.fn(row => row),
    serializeCommission: jest.fn(row => row),
    getVendorLedgerSummary: jest.fn(),
    getVendorLedgerSnapshot: jest.fn(),
    serializeVendor: jest.fn(row => ({ id: row.id })),
    buildVendorKpis: jest.fn(),
}));
jest.mock("../../../models/use-cases/vendorDeposits", () => ({
    DEPOSIT_MODES: ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"],
    serializeDeposit: jest.fn(row => row),
    listByVendor: jest.fn(),
    findOpeningBalance: jest.fn(),
    createDeposit: jest.fn(),
    createOpeningBalance: jest.fn(),
    reverseDeposit: jest.fn(),
}));
jest.mock("../../../models/use-cases/vendorLedgerEntries", () => ({
    ENTRY_KINDS: { creditNote: "CREDIT_NOTE", commission: "COMMISSION" },
    serializeEntry: jest.fn(row => row),
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
jest.mock("../../../models/use-cases/accountingPeriod", () => ({ openingBeforeGoLive: jest.fn() }));
jest.mock("../../../utils/s3", () => ({ uploadFileEncryptedToS3: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));
jest.mock("../../../utils/puppeteerPool", () => ({ renderPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));
jest.mock("../../../utils/invoiceTemplate", () => ({ taxInvoiceTemplate: jest.fn() }));

const useCases = require("../../../models/use-cases/vendorLedger");
const deposits = require("../../../models/use-cases/vendorDeposits");
const entries = require("../../../models/use-cases/vendorLedgerEntries");
const tableExport = require("../../../utils/tableExport");

const { EXPORT_MAX_ROWS } = tableExport;
const buildTableExport = jest.spyOn(tableExport, "buildTableExport");
const sendTableExport = jest.spyOn(tableExport, "sendTableExport").mockImplementation(() => undefined);
const {
    listVendorTransactions,
    listVendorCommissions,
    listVendorDeposits,
    listVendorCreditNotes,
    exportVendorTransactions,
    exportVendorCommissions,
    exportVendorDeposits,
    exportVendorCreditNotes,
} = require("../vendorLedger");

const VENDOR_ROW = { id: 5001, vendorName: "xoxoday" };
const FILE = { buffer: Buffer.from("x"), contentType: "application/pdf", extension: "pdf" };
const SUMMARY = {
    openingBalance: -4000,
    deposited: 0,
    totalTransaction: 25235,
    commission: 770.76,
    available: -28464.24,
    openingBalanceSet: true,
};

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const exportWith = async (handler, query, format = "excel") => {
    const res = mockRes();
    const next = jest.fn();
    await handler({ params: { vendorId: "5001", format }, query }, res, next);
    return { res, next };
};

const subtitleOf = () => buildTableExport.mock.calls.at(-1)[0].subtitle;

const FILTERS = { from: "2026-09-06", to: "2026-10-06", searchText: "acme" };

beforeEach(() => {
    jest.clearAllMocks();
    useCases.findVendorById.mockResolvedValue(VENDOR_ROW);
    useCases.getVendorDepositAccounts.mockResolvedValue({ sharedAccountId: "acc-1" });
    useCases.accountIdsForVendor.mockReturnValue(["acc-1"]);
    useCases.ledgerAccountIdsForVendor.mockReturnValue(["acc-1", "commission-1"]);
    useCases.listVendorOrders.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    useCases.listVendorCommissions.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    useCases.getVendorLedgerSummary.mockResolvedValue(SUMMARY);
    useCases.listCommissionReversals.mockResolvedValue([]);
    deposits.listByVendor.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    entries.listAllByVendor.mockResolvedValue([{ id: 1, issueDate: "2026-09-21" }]);
    buildTableExport.mockResolvedValue(FILE);
});

describe.each([
    ["transactions", exportVendorTransactions, listVendorTransactions, "listVendorOrders", "Transactions"],
    ["commissions", exportVendorCommissions, listVendorCommissions, "listVendorCommissions", "Commissions"],
])("vendor %s export — the table's Excel and PDF download", (_tab, exportHandler, listHandler, listName, label) => {
    it("applies exactly the filters the table does, so the file matches the screen", async () => {
        await listHandler(
            { params: { vendorId: "5001" }, query: { ...FILTERS, page: 3, itemsPerPage: 10 } },
            mockRes(),
            jest.fn()
        );
        const { limit, offset, ...forTable } = useCases[listName].mock.calls.at(-1)[0];

        await exportWith(exportHandler, FILTERS);
        const { limit: exportLimit, offset: exportOffset, ...forExport } = useCases[listName].mock.calls.at(-1)[0];

        expect(forExport).toEqual(forTable);
        expect(forExport).toMatchObject({ vendorId: 5001, searchText: "acme" });
        expect(forExport.range).not.toBeNull();
        expect([limit, offset]).toEqual([10, 20]);
        expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("says so when the vendor does not exist", async () => {
        useCases.findVendorById.mockResolvedValue(null);

        const { next } = await exportWith(exportHandler, FILTERS);

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("tells the user when nothing matches, instead of sending an empty file", async () => {
        useCases[listName].mockResolvedValue({ rows: [], count: 0 });

        const { next } = await exportWith(exportHandler, FILTERS);

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("refuses an export bigger than the limit rather than silently cutting it short", async () => {
        useCases[listName].mockResolvedValue({ rows: [{ id: 1 }], count: EXPORT_MAX_ROWS + 1 });

        const { next } = await exportWith(exportHandler, FILTERS);

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 422 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("names the vendor and the period in the file, and the search when there is one", async () => {
        const { res } = await exportWith(exportHandler, FILTERS, "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(request.format).toBe("pdf");
        expect(request.title).toBe(`xoxoday ${label}`);
        expect(request.subtitle).toBe('Period: 2026-09-06 to 2026-10-06  ·  Search: "acme"');
        expect(sendTableExport).toHaveBeenCalledWith(res, FILE, `xoxoday ${label} 2026-09-06 to 2026-10-06`);

        await exportWith(exportHandler, { from: "2026-09-06", to: "2026-10-06", searchText: "" });
        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06");
    });

    it("says All dates when no range was asked for", async () => {
        await exportWith(exportHandler, { searchText: "" });

        expect(subtitleOf()).toBe("Period: All dates");
    });
});

describe("vendor transactions export — the summary above the table", () => {
    it("puts the screen's six figures and what they cover in the PDF", async () => {
        await exportWith(exportVendorTransactions, FILTERS, "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(useCases.getVendorLedgerSummary).toHaveBeenCalledWith(
            VENDOR_ROW,
            ["acc-1"],
            expect.objectContaining({ from: expect.anything(), to: expect.anything() }),
            ["acc-1", "commission-1"]
        );
        expect(request.summary.map(tile => tile.label)).toEqual([
            "Opening Balance",
            "Deposit",
            "Total Transaction",
            "Commission earned",
            "Available",
        ]);
        expect(request.note).toContain("cover 06 Sep 2026 to 06 Oct 2026.");
        expect(request.note).not.toContain("No opening balance");
    });

    it("warns in the PDF when the vendor has no opening balance", async () => {
        useCases.getVendorLedgerSummary.mockResolvedValue({ ...SUMMARY, openingBalanceSet: false });

        await exportWith(exportVendorTransactions, FILTERS, "pdf");

        expect(buildTableExport.mock.calls[0][0].note).toMatch(/^No opening balance is set/);
    });

    it("does not work the summary out for Excel, which has no place for it", async () => {
        await exportWith(exportVendorTransactions, FILTERS, "excel");

        expect(useCases.getVendorLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].summary).toBeUndefined();
    });

    it("has no summary to show when no range was asked for", async () => {
        await exportWith(exportVendorTransactions, { searchText: "" }, "pdf");

        expect(useCases.getVendorLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].note).toBeUndefined();
    });
});

describe("vendor commissions export", () => {
    it("has no summary, because the Commissions screen shows none", async () => {
        await exportWith(exportVendorCommissions, FILTERS, "pdf");

        expect(useCases.getVendorLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].summary).toBeUndefined();
    });
});

describe("vendor transactions export — the search and the Status filter", () => {
    const withStatus = { ...FILTERS, status: "failed" };

    it("applies the status and the search the table does, so the file matches the screen", async () => {
        await listVendorTransactions(
            { params: { vendorId: "5001" }, query: { ...withStatus, page: 3, itemsPerPage: 10 } },
            mockRes(),
            jest.fn()
        );
        const { limit, offset, ...forTable } = useCases.listVendorOrders.mock.calls.at(-1)[0];

        await exportWith(exportVendorTransactions, withStatus);
        const { limit: exportLimit, offset: exportOffset, ...forExport } = useCases.listVendorOrders.mock.calls.at(-1)[0];

        expect(forExport).toEqual(forTable);
        expect(forExport).toMatchObject({ status: "failed", searchText: "acme" });
        expect([limit, offset]).toEqual([10, 20]);
        expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("names the status in the file, before the search", async () => {
        await exportWith(exportVendorTransactions, withStatus);
        expect(subtitleOf()).toBe('Period: 2026-09-06 to 2026-10-06  ·  Status: Failed  ·  Search: "acme"');

        await exportWith(exportVendorTransactions, { ...withStatus, searchText: "" });
        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06  ·  Status: Failed");

        await exportWith(exportVendorTransactions, { ...FILTERS, status: "refunded", searchText: "" });
        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06  ·  Status: Refunded");
    });

    it("says in the PDF that the figures above the table are not narrowed by the filters", async () => {
        await exportWith(exportVendorTransactions, withStatus, "pdf");
        expect(buildTableExport.mock.calls[0][0].note).toContain(
            "The rows follow the filters chosen, but the figures above always cover the whole period."
        );

        await exportWith(exportVendorTransactions, { ...FILTERS, searchText: "" }, "pdf");
        expect(buildTableExport.mock.calls[1][0].note).not.toContain("follow the filters chosen");
    });

    it("lists every status when none is picked", async () => {
        await exportWith(exportVendorTransactions, { ...FILTERS, searchText: "" });

        expect(useCases.listVendorOrders.mock.calls[0][0].status).toBeUndefined();
    });
});

describe("vendor commissions export — the search and the Status filter", () => {
    const withStatus = { ...FILTERS, status: "refunded" };

    it("applies the status and the search the table does, so the file matches the screen", async () => {
        await listVendorCommissions(
            { params: { vendorId: "5001" }, query: { ...withStatus, page: 3, itemsPerPage: 10 } },
            mockRes(),
            jest.fn()
        );
        const { limit, offset, ...forTable } = useCases.listVendorCommissions.mock.calls.at(-1)[0];

        await exportWith(exportVendorCommissions, withStatus);
        const { limit: exportLimit, offset: exportOffset, ...forExport } = useCases.listVendorCommissions.mock.calls.at(-1)[0];

        expect(forExport).toEqual(forTable);
        expect(forExport).toMatchObject({ status: "refunded", searchText: "acme" });
        expect([limit, offset]).toEqual([10, 20]);
        expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("names the status in the file, before the search", async () => {
        await exportWith(exportVendorCommissions, withStatus);
        expect(subtitleOf()).toBe('Period: 2026-09-06 to 2026-10-06  ·  Status: Refunded  ·  Search: "acme"');

        await exportWith(exportVendorCommissions, { ...FILTERS, status: "reversal", searchText: "" });
        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06  ·  Status: Reversal");

        for (const [status, label] of [["earned", "Earned"], ["active", "Active"], ["reversed", "Reversed"]]) {
            await exportWith(exportVendorCommissions, { ...FILTERS, status, searchText: "" });
            expect(subtitleOf()).toBe(`Period: 2026-09-06 to 2026-10-06  ·  Status: ${label}`);
        }
    });

    it("names no status for one the Commissions tab does not know", async () => {
        await exportWith(exportVendorCommissions, { ...FILTERS, status: "success", searchText: "" });

        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06");
    });

    it("says nothing about the filters in the PDF note, which a Commissions PDF does not have", async () => {
        await exportWith(exportVendorCommissions, withStatus, "pdf");

        expect(buildTableExport.mock.calls[0][0].note).toBeUndefined();
    });
});

describe("vendor deposits export — the Deposits table's Excel and PDF download", () => {
    it("applies exactly the filters the table does, so the file matches the screen", async () => {
        await listVendorDeposits(
            { params: { vendorId: "5001" }, query: { ...FILTERS, page: 3, itemsPerPage: 10 } },
            mockRes(),
            jest.fn()
        );
        const { limit, offset, ...forTable } = deposits.listByVendor.mock.calls.at(-1)[0];

        await exportWith(exportVendorDeposits, FILTERS);
        const { limit: exportLimit, offset: exportOffset, ...forExport } = deposits.listByVendor.mock.calls.at(-1)[0];

        expect(forExport).toEqual(forTable);
        expect(forExport.vendorId).toBe(5001);
        expect(forExport.range).not.toBeNull();
        expect([limit, offset]).toEqual([10, 20]);
        expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("says so when the vendor does not exist", async () => {
        useCases.findVendorById.mockResolvedValue(null);

        const { next } = await exportWith(exportVendorDeposits, FILTERS);

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
    });

    it("tells the user when nothing matches, and refuses more than the limit", async () => {
        deposits.listByVendor.mockResolvedValue({ rows: [], count: 0 });
        expect((await exportWith(exportVendorDeposits, FILTERS)).next.mock.calls[0][0]).toMatchObject({
            status_code: 404,
        });

        deposits.listByVendor.mockResolvedValue({ rows: [{ id: 1 }], count: EXPORT_MAX_ROWS + 1 });
        expect((await exportWith(exportVendorDeposits, FILTERS)).next.mock.calls[0][0]).toMatchObject({
            status_code: 422,
        });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("names the vendor and the period in the file, and the search when there is one", async () => {
        const { res } = await exportWith(exportVendorDeposits, FILTERS, "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(request.title).toBe("xoxoday Deposits");
        expect(request.subtitle).toBe('Period: 2026-09-06 to 2026-10-06  ·  Search: "acme"');
        expect(request.summary).toBeUndefined();
        expect(sendTableExport).toHaveBeenCalledWith(res, FILE, "xoxoday Deposits 2026-09-06 to 2026-10-06");
    });
});

describe("vendor deposits export — the search, the Status and the Mode filters", () => {
    const withFilters = { ...FILTERS, status: "reversal", mode: "NEFT" };

    it("applies the status, the mode and the search the table does, so the file matches the screen", async () => {
        await listVendorDeposits(
            { params: { vendorId: "5001" }, query: { ...withFilters, page: 3, itemsPerPage: 10 } },
            mockRes(),
            jest.fn()
        );
        const { limit, offset, ...forTable } = deposits.listByVendor.mock.calls.at(-1)[0];

        await exportWith(exportVendorDeposits, withFilters);
        const { limit: exportLimit, offset: exportOffset, ...forExport } = deposits.listByVendor.mock.calls.at(-1)[0];

        expect(forExport).toEqual(forTable);
        expect(forExport).toMatchObject({ status: "reversal", mode: "NEFT", searchText: "acme" });
        expect([limit, offset]).toEqual([10, 20]);
        expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("names the status, the mode and the search in the file, in that order", async () => {
        await exportWith(exportVendorDeposits, withFilters);
        expect(subtitleOf()).toBe(
            'Period: 2026-09-06 to 2026-10-06  ·  Status: Reversal  ·  Mode: NEFT  ·  Search: "acme"'
        );

        await exportWith(exportVendorDeposits, { ...FILTERS, mode: "UPI", searchText: "" });
        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06  ·  Mode: UPI");

        for (const [status, label] of [["active", "Active"], ["opening", "Opening"], ["reversed", "Reversed"]]) {
            await exportWith(exportVendorDeposits, { ...FILTERS, status, searchText: "" });
            expect(subtitleOf()).toBe(`Period: 2026-09-06 to 2026-10-06  ·  Status: ${label}`);
        }
    });

    it("names no status or mode that the Deposits tab does not know", async () => {
        await exportWith(exportVendorDeposits, { ...FILTERS, status: "success", mode: "CASH", searchText: "" });

        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06");
    });
});

describe("vendor credit notes export — the search and the Status filter", () => {
    const MANUAL = { id: 4, source: "MANUAL", reference: "CN-7", againstCorporateTxnId: "1790330538190", reason: "Duplicate booking", entryType: "ENTRY", status: "OPEN", issueDate: "2026-09-21" };
    const VOIDED = { id: 5, source: "MANUAL", reference: "CN-3", againstCorporateTxnId: null, reason: "Raised in error", entryType: "ENTRY", status: "VOIDED", issueDate: "2026-09-19" };
    const REFUND = { id: null, source: "AUTO", reference: "1790330538191", againstCorporateTxnId: "1790330538191", reason: "Commission reversed on Xoxoday", entryType: "REVERSAL", status: "OPEN", issueDate: "2026-09-25" };
    const PERIOD = { from: FILTERS.from, to: FILTERS.to, searchText: "" };

    beforeEach(() => {
        entries.listAllByVendor.mockResolvedValue([MANUAL, VOIDED]);
        useCases.listCommissionReversals.mockResolvedValue([REFUND]);
    });

    const shownOnScreen = async query => {
        const res = mockRes();
        await listVendorCreditNotes(
            { params: { vendorId: "5001" }, query: { page: 1, itemsPerPage: 10, ...query } },
            res,
            jest.fn()
        );
        return res.json.mock.calls[0][0].data;
    };

    it("lists every note until something is typed or picked", async () => {
        const data = await shownOnScreen(PERIOD);

        expect(data.entries.map(row => row.reference)).toEqual(["1790330538191", "CN-7", "CN-3"]);
        expect(data.recordsTotal).toBe(3);
    });

    it("narrows to the status picked, counting only those", async () => {
        const reversal = await shownOnScreen({ ...PERIOD, status: "reversal" });
        expect(reversal.entries.map(row => row.reference)).toEqual(["1790330538191"]);
        expect(reversal.recordsTotal).toBe(1);

        expect((await shownOnScreen({ ...PERIOD, status: "active" })).entries.map(row => row.reference)).toEqual(["CN-7"]);
        expect((await shownOnScreen({ ...PERIOD, status: "reversed" })).entries.map(row => row.reference)).toEqual(["CN-3"]);
    });

    it("searches the credit note, the order it is against and the reason", async () => {
        expect((await shownOnScreen({ ...PERIOD, searchText: "cn-7" })).entries).toHaveLength(1);
        expect((await shownOnScreen({ ...PERIOD, searchText: "1790330538191" })).entries[0].source).toBe("AUTO");
        expect((await shownOnScreen({ ...PERIOD, searchText: "in error" })).entries[0].reference).toBe("CN-3");
    });

    it("pages the notes that match, not all of them", async () => {
        const data = await shownOnScreen({ ...PERIOD, searchText: "commission", page: 1, itemsPerPage: 1 });

        expect(data.entries).toHaveLength(1);
        expect(data.recordsTotal).toBe(1);
    });

    it("exports exactly the notes the table shows for the same search and status", async () => {
        const query = { ...PERIOD, searchText: "1790330538", status: "reversal" };
        const screen = await shownOnScreen(query);

        await exportWith(exportVendorCreditNotes, query);

        expect(buildTableExport.mock.calls[0][0].rows).toEqual(screen.entries);
        expect(screen.entries.map(row => row.reference)).toEqual(["1790330538191"]);
    });

    it("names the status and the search in the file, status first", async () => {
        await exportWith(exportVendorCreditNotes, { ...PERIOD, status: "reversed", searchText: "cn" });
        expect(subtitleOf()).toBe('Period: 2026-09-06 to 2026-10-06  ·  Status: Reversed  ·  Search: "cn"');

        await exportWith(exportVendorCreditNotes, { ...PERIOD, status: "reversal" });
        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06  ·  Status: Reversal");

        await exportWith(exportVendorCreditNotes, { ...PERIOD, status: "active" });
        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06  ·  Status: Active");
    });

    it("names no status that the Credit Notes tab does not know", async () => {
        await exportWith(exportVendorCreditNotes, { ...PERIOD, status: "success" });

        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06");
    });

    it("tells the user when the filters match no note, instead of sending an empty file", async () => {
        const { next } = await exportWith(exportVendorCreditNotes, { ...PERIOD, searchText: "nothing like this" });

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });
});

describe("vendor credit notes export — the Credit Notes table's Excel and PDF download", () => {
    // The sample notes do not mention "acme", so these tests ask for the whole period.
    const PERIOD = { from: FILTERS.from, to: FILTERS.to, searchText: "" };
    const REVERSAL = { id: null, source: "AUTO", reference: "1790330538190", issueDate: "2026-09-25" };

    it("merges the manual notes with the commission that came back on refunds, as the table does", async () => {
        entries.listAllByVendor.mockResolvedValue([{ id: 4, source: "MANUAL", reference: "CN-7", issueDate: "2026-09-21" }]);
        useCases.listCommissionReversals.mockResolvedValue([REVERSAL]);

        const table = mockRes();
        await listVendorCreditNotes(
            { params: { vendorId: "5001" }, query: { ...PERIOD, page: 1, itemsPerPage: 10 } },
            table,
            jest.fn()
        );
        const shownOnScreen = table.json.mock.calls[0][0].data.entries;

        await exportWith(exportVendorCreditNotes, PERIOD);

        expect(buildTableExport.mock.calls[0][0].rows).toEqual(shownOnScreen);
        expect(shownOnScreen.map(row => row.reference)).toEqual(["1790330538190", "CN-7"]);
    });

    it("reads the notes and reversals for the same vendor and dates as the table", async () => {
        await listVendorCreditNotes(
            { params: { vendorId: "5001" }, query: { ...PERIOD, page: 1, itemsPerPage: 10 } },
            mockRes(),
            jest.fn()
        );
        const manualForTable = entries.listAllByVendor.mock.calls.at(-1)[0];
        const reversalsForTable = useCases.listCommissionReversals.mock.calls.at(-1)[0];

        await exportWith(exportVendorCreditNotes, PERIOD);

        expect(entries.listAllByVendor.mock.calls.at(-1)[0]).toEqual(manualForTable);
        expect(useCases.listCommissionReversals.mock.calls.at(-1)[0]).toEqual(reversalsForTable);
    });

    it("tells the user when nothing matches, and refuses more than the limit", async () => {
        entries.listAllByVendor.mockResolvedValue([]);
        expect((await exportWith(exportVendorCreditNotes, PERIOD)).next.mock.calls[0][0]).toMatchObject({
            status_code: 404,
        });

        entries.listAllByVendor.mockResolvedValue(
            Array.from({ length: EXPORT_MAX_ROWS + 1 }, (_, index) => ({ id: index, issueDate: "2026-09-21" }))
        );
        expect((await exportWith(exportVendorCreditNotes, PERIOD)).next.mock.calls[0][0]).toMatchObject({
            status_code: 422,
        });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("names the vendor and the period in the file", async () => {
        const { res } = await exportWith(exportVendorCreditNotes, PERIOD, "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(request.title).toBe("xoxoday Credit Notes");
        expect(request.subtitle).toBe("Period: 2026-09-06 to 2026-10-06");
        expect(sendTableExport).toHaveBeenCalledWith(res, FILE, "xoxoday Credit Notes 2026-09-06 to 2026-10-06");
    });
});
