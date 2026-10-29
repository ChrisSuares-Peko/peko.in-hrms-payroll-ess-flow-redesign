jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    openingBeforeGoLive: jest.fn(async () => null),
}));
jest.mock("../../../models/use-cases/paymentGatewayLedger", () => ({
    listGateways: jest.fn(),
    findGatewayById: jest.fn(),
    listGatewayOrders: jest.fn(),
    serializeTransaction: jest.fn(row => row),
    getPaymentGatewayLedgerSummary: jest.fn(),
    getPaymentGatewayLedgerSnapshot: jest.fn(),
    serializeGateway: jest.fn(),
    buildPaymentGatewayKpis: jest.fn(),
}));
jest.mock("../../../models/use-cases/paymentGatewaySettlements", () => ({
    ENTRY_KINDS: { receipt: "RECEIPT", fee: "FEE", opening: "OPENING" },
    RECEIVED_TABLE_KINDS: ["RECEIPT", "OPENING"],
    SETTLEMENT_MODES: ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"],
    serializeSettlement: jest.fn(row => row),
    listByGateway: jest.fn(),
    createReceipt: jest.fn(),
    createFee: jest.fn(),
    createOpeningBalance: jest.fn(),
    findOpeningBalance: jest.fn(),
    reverseSettlement: jest.fn(),
}));
jest.mock("../../../models/use-cases/paymentGatewayStatement", () => ({
    PAYMENT_GATEWAY_STATEMENT_CONVENTION: "convention",
    buildPaymentGatewayStatement: jest.fn(),
    statementExcelRows: jest.fn(),
}));
jest.mock("../../../utils/s3", () => ({ uploadFileEncryptedToS3: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));
jest.mock("../../../utils/puppeteerPool", () => ({ renderPdf: jest.fn() }));
jest.mock("../../../utils/generateExcelBufferAndType", () => ({ generateExcelBufferAndType: jest.fn() }));
jest.mock("../../../utils/ledgerStatementTemplate", () => ({ ledgerStatementTemplate: jest.fn() }));

const useCases = require("../../../models/use-cases/paymentGatewayLedger");
const settlements = require("../../../models/use-cases/paymentGatewaySettlements");
const tableExport = require("../../../utils/tableExport");
const {
    listPaymentGatewayTransactions,
    listPaymentGatewaySettlements,
    exportPaymentGatewayTransactions,
    exportPaymentGatewayReceipts,
    exportPaymentGatewayFees,
} = require("../paymentGatewayLedger");

const { EXPORT_MAX_ROWS } = tableExport;
const buildTableExport = jest.spyOn(tableExport, "buildTableExport");
const sendTableExport = jest.spyOn(tableExport, "sendTableExport").mockImplementation(() => undefined);

const GATEWAY = { gatewayAccountId: "4003352000000058004", gatewayName: "Cashfree" };
const FILE = { buffer: Buffer.from("x"), contentType: "application/pdf", extension: "pdf" };
const SUMMARY = {
    collected: 413879.23,
    received: 0,
    fees: 100,
    outstanding: 761110.01,
    lastReceiptDate: null,
    openingBalanceSet: true,
};
const PERIOD = { from: "2026-09-06", to: "2026-10-06" };
const FILTERS = { ...PERIOD, searchText: "hike" };
const FILTERED_NOTE = "The rows follow the filters chosen, but the figures above always cover the whole period.";

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const exportWith = async (handler, query, format = "excel") => {
    const res = mockRes();
    const next = jest.fn();
    await handler({ params: { gatewayId: GATEWAY.gatewayAccountId, format }, query }, res, next);
    return { res, next };
};

const subtitleOf = () => buildTableExport.mock.calls.at(-1)[0].subtitle;

const tableReq = extra => ({
    params: { gatewayId: GATEWAY.gatewayAccountId },
    query: { ...FILTERS, page: 3, itemsPerPage: 10, ...extra },
});

// What each table is filtered by when exported, and the names its list takes the same filters
// under: the two tables share one call, so the fee table's own are prefixed.
const TRANSACTION_FILTERS = { ...FILTERS, status: "refunded" };
const RECEIVED_FILTERS = { ...FILTERS, status: "reversal", mode: "UPI" };
const FEE_FILTERS = { ...FILTERS, status: "charged" };

const TABS = {
    transactions: {
        exportHandler: exportPaymentGatewayTransactions,
        label: "Transactions",
        list: () => useCases.listGatewayOrders,
        // The table the file has to match, and how to read what it asked the list for.
        tableArgs: async () => {
            await listPaymentGatewayTransactions(tableReq(TRANSACTION_FILTERS), mockRes(), jest.fn());
            return useCases.listGatewayOrders.mock.calls.at(-1)[0];
        },
        filters: TRANSACTION_FILTERS,
        subtitle: 'Period: 2026-09-06 to 2026-10-06  ·  Status: Refunded  ·  Search: "hike"',
    },
    received: {
        exportHandler: exportPaymentGatewayReceipts,
        label: "Received",
        list: () => settlements.listByGateway,
        tableArgs: async () => {
            await listPaymentGatewaySettlements(tableReq({ ...RECEIVED_FILTERS, feePage: 1 }), mockRes(), jest.fn());
            return settlements.listByGateway.mock.calls.find(([args]) => args.entryKind !== "FEE")[0];
        },
        filters: RECEIVED_FILTERS,
        subtitle: 'Period: 2026-09-06 to 2026-10-06  ·  Status: Reversal  ·  Mode: UPI  ·  Search: "hike"',
    },
    fees: {
        exportHandler: exportPaymentGatewayFees,
        label: "Fees Charged",
        list: () => settlements.listByGateway,
        tableArgs: async () => {
            await listPaymentGatewaySettlements(
                tableReq({ feeSearchText: "hike", feeStatus: "charged", feePage: 1 }),
                mockRes(),
                jest.fn()
            );
            return settlements.listByGateway.mock.calls.find(([args]) => args.entryKind === "FEE")[0];
        },
        filters: FEE_FILTERS,
        subtitle: 'Period: 2026-09-06 to 2026-10-06  ·  Status: Charged  ·  Search: "hike"',
    },
};

beforeEach(() => {
    jest.clearAllMocks();
    useCases.findGatewayById.mockResolvedValue(GATEWAY);
    useCases.listGatewayOrders.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    useCases.getPaymentGatewayLedgerSummary.mockResolvedValue(SUMMARY);
    settlements.listByGateway.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    settlements.findOpeningBalance.mockResolvedValue(null);
    buildTableExport.mockResolvedValue(FILE);
});

describe.each(Object.entries(TABS))(
    "payment gateway %s export — the table's Excel and PDF download",
    (_tab, { exportHandler, label, list, tableArgs, filters, subtitle }) => {
        it("applies exactly the filters the table does, so the file matches the screen", async () => {
            const { limit, offset, ...forTable } = await tableArgs();
            list().mockClear();

            await exportWith(exportHandler, filters);
            const { limit: exportLimit, offset: exportOffset, ...forExport } = list().mock.calls.at(-1)[0];

            expect(forExport).toEqual(forTable);
            expect(forExport).toMatchObject({ searchText: "hike", status: filters.status });
            expect(forExport.gatewayAccountId).toBe(GATEWAY.gatewayAccountId);
            expect(forExport.range).not.toBeNull();
            expect(limit).toBeGreaterThan(0);
            expect(offset).toBeGreaterThanOrEqual(0);
            expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
        });

        it("says so when the gateway does not exist", async () => {
            useCases.findGatewayById.mockResolvedValue(null);

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

        it("names the gateway and the period in the file", async () => {
            const { res } = await exportWith(exportHandler, PERIOD, "pdf");

            const request = buildTableExport.mock.calls[0][0];
            expect(request.format).toBe("pdf");
            expect(request.title).toBe(`Cashfree ${label}`);
            expect(request.subtitle).toBe("Period: 2026-09-06 to 2026-10-06");
            expect(sendTableExport).toHaveBeenCalledWith(
                res,
                FILE,
                `Cashfree ${label} 2026-09-06 to 2026-10-06`
            );
        });

        it("names every filter the table applies, and only those", async () => {
            await exportWith(exportHandler, filters);

            expect(subtitleOf()).toBe(subtitle);
        });

        it("names the search alone when it is the only filter", async () => {
            await exportWith(exportHandler, FILTERS);

            expect(subtitleOf()).toBe('Period: 2026-09-06 to 2026-10-06  ·  Search: "hike"');
        });

        it("says All dates when no range was asked for", async () => {
            await exportWith(exportHandler, { searchText: "" });

            expect(subtitleOf()).toBe("Period: All dates");
        });
    }
);

describe("payment gateway transactions export", () => {
    it("marks the orders that fall inside the opening figure, as the table does", async () => {
        settlements.findOpeningBalance.mockResolvedValue({ entryDate: "2026-09-01" });

        await exportWith(exportPaymentGatewayTransactions, FILTERS);

        expect(useCases.serializeTransaction).toHaveBeenCalledWith({ id: 1 }, "2026-09-01");
    });

    it("has no opening to compare against when none is set", async () => {
        await exportWith(exportPaymentGatewayTransactions, FILTERS);

        expect(useCases.serializeTransaction).toHaveBeenCalledWith({ id: 1 }, null);
    });
});

describe("payment gateway transactions export — the summary above the table", () => {
    it("puts the screen's five figures and what they cover in the PDF", async () => {
        await exportWith(exportPaymentGatewayTransactions, FILTERS, "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(useCases.getPaymentGatewayLedgerSummary).toHaveBeenCalledWith(
            GATEWAY.gatewayAccountId,
            expect.objectContaining({ from: expect.anything(), to: expect.anything() })
        );
        expect(request.summary.map(tile => tile.label)).toEqual([
            "Collected",
            "Received",
            "Charges",
            "Yet To Receive",
            "Last Receipt",
        ]);
        expect(request.note).toContain("Collected, Received and Charges cover 06 Sep 2026 to 06 Oct 2026.");
        expect(request.note).not.toContain("No opening balance");
    });

    it("says the figures cover the whole period when the rows are filtered, and not otherwise", async () => {
        await exportWith(exportPaymentGatewayTransactions, TRANSACTION_FILTERS, "pdf");
        expect(buildTableExport.mock.calls[0][0].note.endsWith(FILTERED_NOTE)).toBe(true);

        buildTableExport.mockClear();
        await exportWith(exportPaymentGatewayTransactions, PERIOD, "pdf");
        expect(buildTableExport.mock.calls[0][0].note).not.toContain(FILTERED_NOTE);
    });

    it("counts a status alone as filtering the rows, but not a status the table does not have", async () => {
        await exportWith(exportPaymentGatewayTransactions, { ...PERIOD, status: "failed" }, "pdf");
        expect(buildTableExport.mock.calls[0][0].note).toContain(FILTERED_NOTE);

        buildTableExport.mockClear();
        await exportWith(exportPaymentGatewayTransactions, { ...PERIOD, status: "charged" }, "pdf");
        expect(buildTableExport.mock.calls[0][0].note).not.toContain(FILTERED_NOTE);
    });

    it("warns in the PDF when the gateway has no opening balance", async () => {
        useCases.getPaymentGatewayLedgerSummary.mockResolvedValue({ ...SUMMARY, openingBalanceSet: false });

        await exportWith(exportPaymentGatewayTransactions, FILTERS, "pdf");

        expect(buildTableExport.mock.calls[0][0].note).toMatch(/^No opening balance is set for this gateway/);
    });

    it("does not work the summary out for Excel, which has no place for it", async () => {
        await exportWith(exportPaymentGatewayTransactions, FILTERS, "excel");

        expect(useCases.getPaymentGatewayLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].summary).toBeUndefined();
    });

    it("has no summary to show when no range was asked for", async () => {
        await exportWith(exportPaymentGatewayTransactions, { searchText: "" }, "pdf");

        expect(useCases.getPaymentGatewayLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].note).toBeUndefined();
    });
});

describe("payment gateway received and fees exports", () => {
    it.each([
        ["received", exportPaymentGatewayReceipts, ["RECEIPT", "OPENING"]],
        ["fees", exportPaymentGatewayFees, "FEE"],
    ])("ask the %s table's own rows, and carry no summary because its screen shows none", async (_name, handler, kind) => {
        await exportWith(handler, FILTERS, "pdf");

        expect(settlements.listByGateway.mock.calls[0][0].entryKind).toEqual(kind);
        expect(useCases.getPaymentGatewayLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].summary).toBeUndefined();
    });
});

describe("payment gateway tables — search and filters", () => {
    const listQuery = {
        ...PERIOD,
        searchText: "utr",
        status: "received",
        mode: "NEFT",
        feeSearchText: "bill",
        feeStatus: "reversed",
        page: 1,
        feePage: 2,
    };

    const run = async () => {
        await listPaymentGatewaySettlements(
            { params: { gatewayId: GATEWAY.gatewayAccountId }, query: listQuery },
            mockRes(),
            jest.fn()
        );
        const calls = settlements.listByGateway.mock.calls.map(([args]) => args);
        return {
            received: calls.find(args => args.entryKind !== "FEE"),
            fees: calls.find(args => args.entryKind === "FEE"),
        };
    };

    it("gives the received table the plain search, status and mode, and the fee table its own", async () => {
        const { received, fees } = await run();

        expect(received).toMatchObject({ searchText: "utr", status: "received", mode: "NEFT" });
        expect(fees).toMatchObject({ searchText: "bill", status: "reversed" });
        expect(fees.mode).toBeUndefined();
    });

    it("pages the fee table on its own page whatever either table is filtered by", async () => {
        const { received, fees } = await run();

        expect([received.limit, received.offset]).toEqual([5, 0]);
        expect([fees.limit, fees.offset]).toEqual([5, 5]);
    });

    it("sends no filter to either table when none was chosen", async () => {
        await listPaymentGatewaySettlements(
            { params: { gatewayId: GATEWAY.gatewayAccountId }, query: { ...PERIOD, page: 1, feePage: 1 } },
            mockRes(),
            jest.fn()
        );

        settlements.listByGateway.mock.calls.forEach(([args]) => {
            expect([args.searchText, args.status, args.mode]).toEqual([undefined, undefined, undefined]);
        });
    });

    it("says nothing of a status or mode the table does not have", async () => {
        await exportWith(exportPaymentGatewayReceipts, { ...PERIOD, status: "charged", mode: "CASH" });
        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06");

        await exportWith(exportPaymentGatewayFees, { ...PERIOD, status: "opening", mode: "UPI" });
        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06");

        await exportWith(exportPaymentGatewayTransactions, { ...PERIOD, status: "received" });
        expect(subtitleOf()).toBe("Period: 2026-09-06 to 2026-10-06");
    });
});
