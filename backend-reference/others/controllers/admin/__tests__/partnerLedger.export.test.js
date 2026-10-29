jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    openingBeforeGoLive: jest.fn(async () => null),
}));
jest.mock("../../../models/use-cases/partnerLedger", () => ({
    listPartners: jest.fn(),
    findPartnerById: jest.fn(),
    listPartnerOrders: jest.fn(),
    serializeTransaction: jest.fn(row => row),
    serializeSubscription: jest.fn(row => row),
    getPartnerLedgerSummary: jest.fn(),
    getPartnerLedgerSnapshot: jest.fn(),
    serializePartner: jest.fn(),
    buildPartnerKpis: jest.fn(),
}));
jest.mock("../../../models/use-cases/partnerPayouts", () => ({
    PAYOUT_MODES: ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"],
    serializePayout: jest.fn(row => row),
    listByPartner: jest.fn(),
    createPayout: jest.fn(),
    createOpeningBalance: jest.fn(),
    findOpeningBalance: jest.fn(),
    reversePayout: jest.fn(),
}));
jest.mock("../../../models/use-cases/partnerLedgerEntries", () => ({
    ENTRY_KINDS: { debitNote: "DEBIT_NOTE" },
    serializeEntry: jest.fn(row => row),
    listByPartner: jest.fn(),
    createEntry: jest.fn(),
    reverseEntry: jest.fn(),
}));
jest.mock("../../../models/use-cases/partnerStatement", () => ({
    PARTNER_STATEMENT_CONVENTION: "convention",
    buildPartnerStatement: jest.fn(),
    statementExcelRows: jest.fn(),
}));
jest.mock("../../../utils/s3", () => ({ uploadFileEncryptedToS3: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));
jest.mock("../../../utils/puppeteerPool", () => ({ renderPdf: jest.fn() }));
jest.mock("../../../utils/generateExcelBufferAndType", () => ({ generateExcelBufferAndType: jest.fn() }));
jest.mock("../../../utils/ledgerStatementTemplate", () => ({ ledgerStatementTemplate: jest.fn() }));

const useCases = require("../../../models/use-cases/partnerLedger");
const payouts = require("../../../models/use-cases/partnerPayouts");
const entries = require("../../../models/use-cases/partnerLedgerEntries");
const tableExport = require("../../../utils/tableExport");

const { EXPORT_MAX_ROWS } = tableExport;
const buildTableExport = jest.spyOn(tableExport, "buildTableExport");
const sendTableExport = jest.spyOn(tableExport, "sendTableExport").mockImplementation(() => undefined);
const {
    listPartnerTransactions,
    listPartnerSubscriptions,
    listPartnerPayouts,
    exportPartnerTransactions,
    exportPartnerSubscriptions,
    exportPartnerPayouts,
    listPartnerDebitNotes,
    exportPartnerDebitNotes,
} = require("../partnerLedger");

const PARTNER = { credentialId: 3126, partnerName: "Cent Saarthi" };
const FILE = { buffer: Buffer.from("x"), contentType: "application/pdf", extension: "pdf" };
const SUMMARY = {
    earned: 2678.18,
    paid: 0,
    gmv: 275795.24,
    owed: 2678.18,
    lastPayoutDate: null,
    openingBalanceSet: true,
};
const PERIOD = { from: "2026-09-06", to: "2026-10-06" };
const FILTERS = { ...PERIOD, searchText: "imtd" };
const ORDER_FILTERS = { ...FILTERS, status: "refunded" };
const PAYOUT_FILTERS = { ...FILTERS, status: "reversal", mode: "UPI" };
const DEBIT_NOTE_FILTERS = { ...FILTERS, status: "reversed" };
const FILTERED_NOTE = "The rows follow the filters chosen, but the figures above always cover the whole period.";
const PAYMENTS_FILTERED_NOTE = "The rows follow the filters chosen, but the figures above always cover everything to date.";

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const exportWith = async (handler, query, format = "excel", partnerId = "3126") => {
    const res = mockRes();
    const next = jest.fn();
    await handler({ params: { partnerId, format }, query }, res, next);
    return { res, next };
};

const subtitleOf = () => buildTableExport.mock.calls.at(-1)[0].subtitle;

const TABS = {
    transactions: {
        exportHandler: exportPartnerTransactions,
        listHandler: listPartnerTransactions,
        list: () => useCases.listPartnerOrders,
        label: "Transactions",
        filters: ORDER_FILTERS,
        subtitle: 'Period: 2026-09-06 to 2026-10-06  ·  Status: Refunded  ·  Search: "imtd"',
    },
    "own subscriptions": {
        exportHandler: exportPartnerSubscriptions,
        listHandler: listPartnerSubscriptions,
        list: () => useCases.listPartnerOrders,
        label: "Own Subscriptions",
        filters: ORDER_FILTERS,
        subtitle: 'Period: 2026-09-06 to 2026-10-06  ·  Status: Refunded  ·  Search: "imtd"',
    },
    payments: {
        exportHandler: exportPartnerPayouts,
        listHandler: listPartnerPayouts,
        list: () => payouts.listByPartner,
        label: "Payments",
        filters: PAYOUT_FILTERS,
        subtitle: 'Period: 2026-09-06 to 2026-10-06  ·  Status: Reversal  ·  Mode: UPI  ·  Search: "imtd"',
    },
    "debit notes": {
        exportHandler: exportPartnerDebitNotes,
        listHandler: listPartnerDebitNotes,
        list: () => entries.listByPartner,
        label: "Debit Notes",
        filters: DEBIT_NOTE_FILTERS,
        subtitle: 'Period: 2026-09-06 to 2026-10-06  ·  Status: Reversed  ·  Search: "imtd"',
    },
};

beforeEach(() => {
    jest.clearAllMocks();
    useCases.findPartnerById.mockResolvedValue(PARTNER);
    useCases.listPartnerOrders.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    payouts.listByPartner.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    entries.listByPartner.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    useCases.getPartnerLedgerSummary.mockResolvedValue(SUMMARY);
    buildTableExport.mockResolvedValue(FILE);
});

describe.each(Object.entries(TABS))(
    "partner %s export — the table's Excel and PDF download",
    (_tab, { exportHandler, listHandler, list, label, filters, subtitle }) => {
        it("applies exactly the filters the table does, so the file matches the screen", async () => {
            await listHandler(
                { params: { partnerId: "3126" }, query: { ...filters, page: 3, itemsPerPage: 10 } },
                mockRes(),
                jest.fn()
            );
            const { limit, offset, ...forTable } = list().mock.calls.at(-1)[0];

            await exportWith(exportHandler, filters);
            const { limit: exportLimit, offset: exportOffset, ...forExport } = list().mock.calls.at(-1)[0];

            expect(forExport).toEqual(forTable);
            expect(forExport).toMatchObject({ searchText: "imtd", status: filters.status });
            expect(forExport.range).not.toBeNull();
            expect([limit, offset]).toEqual([10, 20]);
            expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
        });

        it("says so when the partner does not exist", async () => {
            useCases.findPartnerById.mockResolvedValue(null);

            const { next } = await exportWith(exportHandler, FILTERS);

            expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
            expect(buildTableExport).not.toHaveBeenCalled();
        });

        it("tells the user when nothing matches, instead of sending an empty file", async () => {
            list().mockResolvedValue({ rows: [], count: 0 });

            const { next } = await exportWith(exportHandler, FILTERS);

            expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
            expect(buildTableExport).not.toHaveBeenCalled();
        });

        it("refuses an export bigger than the limit rather than silently cutting it short", async () => {
            list().mockResolvedValue({ rows: [{ id: 1 }], count: EXPORT_MAX_ROWS + 1 });

            const { next } = await exportWith(exportHandler, FILTERS);

            expect(next.mock.calls[0][0]).toMatchObject({ status_code: 422 });
            expect(buildTableExport).not.toHaveBeenCalled();
        });

        it("names the partner and the period in the file", async () => {
            const { res } = await exportWith(exportHandler, PERIOD, "pdf");

            const request = buildTableExport.mock.calls[0][0];
            expect(request.format).toBe("pdf");
            expect(request.title).toBe(`Cent Saarthi ${label}`);
            expect(request.subtitle).toBe("Period: 2026-09-06 to 2026-10-06");
            expect(sendTableExport).toHaveBeenCalledWith(
                res,
                FILE,
                `Cent Saarthi ${label} 2026-09-06 to 2026-10-06`
            );
        });

        it("names every filter the table applies, and only those", async () => {
            await exportWith(exportHandler, filters);

            expect(subtitleOf()).toBe(subtitle);
        });

        it("names the search alone when it is the only filter", async () => {
            await exportWith(exportHandler, FILTERS);

            expect(subtitleOf()).toBe('Period: 2026-09-06 to 2026-10-06  ·  Search: "imtd"');
        });

        it("says All dates when no range was asked for", async () => {
            await exportWith(exportHandler, { searchText: "" });

            expect(subtitleOf()).toBe("Period: All dates");
        });
    }
);

describe("partner transactions export — the summary above the table", () => {
    it("puts the screen's six figures and what they cover in the PDF", async () => {
        await exportWith(exportPartnerTransactions, FILTERS, "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(useCases.getPartnerLedgerSummary).toHaveBeenCalledWith(
            3126,
            expect.objectContaining({ from: expect.anything(), to: expect.anything() })
        );
        expect(request.summary.map(tile => tile.label)).toEqual([
            "Earned",
            "Paid",
            "Debit Notes",
            "GMV",
            "Left To Pay",
            "Last Payment",
        ]);
        expect(request.summary[5].value).toBe("None yet");
        expect(request.note).toContain(
            "GMV, Earned, Paid and Debit Notes cover 06 Sep 2026 to 06 Oct 2026."
        );
        expect(request.note).not.toContain("No opening balance");
    });

    it("says the figures cover the whole period when the rows are filtered, and not otherwise", async () => {
        await exportWith(exportPartnerTransactions, ORDER_FILTERS, "pdf");
        expect(buildTableExport.mock.calls[0][0].note.endsWith(FILTERED_NOTE)).toBe(true);

        buildTableExport.mockClear();
        await exportWith(exportPartnerTransactions, PERIOD, "pdf");
        expect(buildTableExport.mock.calls[0][0].note).not.toContain(FILTERED_NOTE);
    });

    it("counts a status alone as filtering the rows, but not a status the tab does not have", async () => {
        await exportWith(exportPartnerTransactions, { ...PERIOD, status: "failed" }, "pdf");
        expect(buildTableExport.mock.calls[0][0].note).toContain(FILTERED_NOTE);

        buildTableExport.mockClear();
        await exportWith(exportPartnerTransactions, { ...PERIOD, status: "paid", mode: "UPI" }, "pdf");
        expect(buildTableExport.mock.calls[0][0].note).not.toContain(FILTERED_NOTE);
    });

    it("warns in the PDF when the partner has no opening balance", async () => {
        useCases.getPartnerLedgerSummary.mockResolvedValue({ ...SUMMARY, openingBalanceSet: false });

        await exportWith(exportPartnerTransactions, FILTERS, "pdf");

        expect(buildTableExport.mock.calls[0][0].note).toMatch(/^No opening balance is set for this partner/);
    });

    it("does not work the summary out for Excel, which has no place for it", async () => {
        await exportWith(exportPartnerTransactions, FILTERS, "excel");

        expect(useCases.getPartnerLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].summary).toBeUndefined();
    });

    it("has no summary to show when no range was asked for", async () => {
        await exportWith(exportPartnerTransactions, { searchText: "" }, "pdf");

        expect(useCases.getPartnerLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].summary).toBeUndefined();
        expect(buildTableExport.mock.calls[0][0].note).toBeUndefined();
    });
});

describe("partner payments export — the summary above the table", () => {
    it("puts what is left to pay and the last payment in the PDF, whatever dates were chosen", async () => {
        useCases.getPartnerLedgerSummary.mockResolvedValue({ ...SUMMARY, lastPayoutDate: "2026-09-20" });

        await exportWith(exportPartnerPayouts, FILTERS, "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(useCases.getPartnerLedgerSummary).toHaveBeenCalledWith(3126, null);
        expect(request.summary).toEqual([
            { label: "Left to pay", value: 2678.18, money: true },
            { label: "Last payment", value: "20 Sep 2026" },
        ]);
        expect(request.note).toContain("Left to pay is everything Cent Saarthi has earned to date");
    });

    it("says the figures cover everything to date when the rows are filtered, and not otherwise", async () => {
        await exportWith(exportPartnerPayouts, PAYOUT_FILTERS, "pdf");
        expect(buildTableExport.mock.calls[0][0].note.endsWith(PAYMENTS_FILTERED_NOTE)).toBe(true);

        buildTableExport.mockClear();
        await exportWith(exportPartnerPayouts, PERIOD, "pdf");
        expect(buildTableExport.mock.calls[0][0].note).not.toContain(PAYMENTS_FILTERED_NOTE);
    });

    it("counts a mode alone as filtering the rows", async () => {
        await exportWith(exportPartnerPayouts, { ...PERIOD, mode: "CHEQUE" }, "pdf");

        expect(buildTableExport.mock.calls[0][0].note).toContain(PAYMENTS_FILTERED_NOTE);
        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06  ·  Mode: CHEQUE");
    });

    it("says nothing of a status or mode the Payments tab does not have", async () => {
        await exportWith(exportPartnerPayouts, { ...PERIOD, status: "success", mode: "CASH" }, "pdf");

        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06");
        expect(buildTableExport.mock.calls[0][0].note).not.toContain(PAYMENTS_FILTERED_NOTE);
    });

    it("does not work the summary out for Excel", async () => {
        await exportWith(exportPartnerPayouts, FILTERS, "excel");

        expect(useCases.getPartnerLedgerSummary).not.toHaveBeenCalled();
    });
});

describe("partner own subscriptions export", () => {
    it("asks for the subscription orders, and has no summary because its screen shows none", async () => {
        await exportWith(exportPartnerSubscriptions, FILTERS, "pdf");

        expect(useCases.listPartnerOrders.mock.calls[0][0]).toMatchObject({ subscriptions: true });
        expect(useCases.getPartnerLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].summary).toBeUndefined();
    });

    it("asks for the ordinary orders on the Transactions tab", async () => {
        await exportWith(exportPartnerTransactions, FILTERS, "excel");

        expect(useCases.listPartnerOrders.mock.calls[0][0]).toMatchObject({ subscriptions: false });
    });
});
