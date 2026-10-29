jest.mock("../../../models/use-cases/subscriberLedger", () => ({
    listSubscribers: jest.fn(),
    findSubscriberByCredentialId: jest.fn(),
    getSubscriberLedgerSummary: jest.fn(),
    getSubscriberLedgerSnapshot: jest.fn(),
    subscriberDisplayName: jest.fn(row => row.name),
    serializeSubscriber: jest.fn(),
    listSubscriberOrders: jest.fn(),
    listSubscriberBills: jest.fn(),
    findSubscriberOrderDocument: jest.fn(),
    SUBSCRIBER_ORDER_DOCUMENTS: {},
    serializeTransaction: jest.fn(row => row),
    serializeBill: jest.fn(row => row),
}));
jest.mock("../../../models/use-cases/subscriberWallet", () => ({
    listWalletMovements: jest.fn(),
    serializeWalletMovement: jest.fn(row => row),
}));
jest.mock("../../../utils/pekoRecieptHelper", () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));

const useCases = require("../../../models/use-cases/subscriberLedger");
const walletUse = require("../../../models/use-cases/subscriberWallet");
const tableExport = require("../../../utils/tableExport");

const { EXPORT_MAX_ROWS } = tableExport;
const buildTableExport = jest.spyOn(tableExport, "buildTableExport");
const sendTableExport = jest.spyOn(tableExport, "sendTableExport").mockImplementation(() => undefined);
const {
    listSubscriberTransactions,
    listSubscriberWallet,
    listSubscriberBills,
    exportSubscriberTransactions,
    exportSubscriberWallet,
    exportSubscriberBills,
} = require("../subscriberLedger");

const SUBSCRIBER = { credentialId: 100000838, name: "Faris Rahamn" };
const FILE = { buffer: Buffer.from("x"), contentType: "application/pdf", extension: "pdf" };
const SUMMARY = {
    topUps: 1000,
    withdrawals: 10000,
    spent: 0,
    paidViaGateway: 69803.78,
    platformFee: 236.57,
    cashback: 0,
    walletBalance: 36000,
};
const PERIOD = { from: "2026-09-06", to: "2026-10-06" };
const FILTERS = { ...PERIOD, searchText: "hike", status: "success", type: "refund", side: "debit" };
const FILTERED_NOTE = "The rows follow the filters chosen, but the figures above always cover the whole period.";

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const exportWith = async (handler, query, format = "excel", credentialId = "100000838") => {
    const res = mockRes();
    const next = jest.fn();
    await handler({ params: { credentialId, format }, query }, res, next);
    return { res, next };
};

const subtitleOf = () => buildTableExport.mock.calls.at(-1)[0].subtitle;

const TABS = {
    transactions: {
        exportHandler: exportSubscriberTransactions,
        listHandler: listSubscriberTransactions,
        list: () => useCases.listSubscriberOrders,
        label: "Transactions",
        subtitle: 'Period: 2026-09-06 to 2026-10-06  ·  Status: Success  ·  Search: "hike"',
    },
    wallet: {
        exportHandler: exportSubscriberWallet,
        listHandler: listSubscriberWallet,
        list: () => walletUse.listWalletMovements,
        label: "Cashbacks & Rewards",
        subtitle: 'Period: 2026-09-06 to 2026-10-06  ·  Type: Refund  ·  Debit only  ·  Search: "hike"',
    },
    bills: {
        exportHandler: exportSubscriberBills,
        listHandler: listSubscriberBills,
        list: () => useCases.listSubscriberBills,
        label: "Bills",
        subtitle: 'Period: 2026-09-06 to 2026-10-06  ·  Search: "hike"',
    },
};

beforeEach(() => {
    jest.clearAllMocks();
    useCases.findSubscriberByCredentialId.mockResolvedValue(SUBSCRIBER);
    useCases.listSubscriberOrders.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    useCases.listSubscriberBills.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    walletUse.listWalletMovements.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    useCases.getSubscriberLedgerSummary.mockResolvedValue(SUMMARY);
    buildTableExport.mockResolvedValue(FILE);
});

describe.each(Object.entries(TABS))(
    "subscriber %s export — the table's Excel and PDF download",
    (_tab, { exportHandler, listHandler, list, label, subtitle }) => {
        it("applies exactly the filters the table does, so the file matches the screen", async () => {
            await listHandler(
                { params: { credentialId: "100000838" }, query: { ...FILTERS, page: 3, itemsPerPage: 10 } },
                mockRes(),
                jest.fn()
            );
            const { limit, offset, ...forTable } = list().mock.calls.at(-1)[0];

            await exportWith(exportHandler, FILTERS);
            const { limit: exportLimit, offset: exportOffset, ...forExport } = list().mock.calls.at(-1)[0];

            expect(forExport).toEqual(forTable);
            expect(forExport).toMatchObject({ searchText: "hike", status: "success", type: "refund", side: "debit" });
            expect(forExport.credentialId).toBe(100000838);
            expect(forExport.range).not.toBeNull();
            expect([limit, offset]).toEqual([10, 20]);
            expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
        });

        it("says so when the subscriber does not exist", async () => {
            useCases.findSubscriberByCredentialId.mockResolvedValue(null);

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

        it("names the subscriber and the period in the file", async () => {
            const { res } = await exportWith(exportHandler, PERIOD, "pdf");

            const request = buildTableExport.mock.calls[0][0];
            expect(request.format).toBe("pdf");
            expect(request.title).toBe(`Faris Rahamn ${label}`);
            expect(request.subtitle).toBe("Period: 2026-09-06 to 2026-10-06");
            expect(sendTableExport).toHaveBeenCalledWith(
                res,
                FILE,
                `Faris Rahamn ${label} 2026-09-06 to 2026-10-06`
            );
        });

        it("names every filter the table applies, and only those", async () => {
            await exportWith(exportHandler, FILTERS);

            expect(subtitleOf()).toBe(subtitle);
        });

        it("names the search alone when it is the only filter", async () => {
            await exportWith(exportHandler, { ...PERIOD, searchText: "hike" });

            expect(subtitleOf()).toBe('Period: 2026-09-06 to 2026-10-06  ·  Search: "hike"');
        });

        it("says All dates when no range was asked for", async () => {
            await exportWith(exportHandler, { searchText: "" });

            expect(subtitleOf()).toBe("Period: All dates");
        });
    }
);

describe("subscriber transactions export — the summary above the table", () => {
    it("puts the screen's six figures and what they cover in the PDF", async () => {
        await exportWith(exportSubscriberTransactions, FILTERS, "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(useCases.getSubscriberLedgerSummary).toHaveBeenCalledWith(
            SUBSCRIBER,
            expect.objectContaining({ from: expect.anything(), to: expect.anything() })
        );
        expect(request.summary.map(tile => tile.label)).toEqual([
            "Top-ups",
            "Spent from Wallet",
            "Paid via Gateway",
            "Platform Fee",
            "Cashback",
            "Wallet Balance",
        ]);
        expect(request.note).toContain("cover 06 Sep 2026 to 06 Oct 2026.");
        expect(request.note).toContain("Admin withdrawals of ₹ 10,000.00 in this period");
    });

    it("says the figures cover the whole period when the rows are filtered", async () => {
        await exportWith(exportSubscriberTransactions, FILTERS, "pdf");

        expect(buildTableExport.mock.calls[0][0].note.endsWith(FILTERED_NOTE)).toBe(true);
    });

    it.each([
        ["a search", { ...PERIOD, searchText: "hike" }],
        ["a status", { ...PERIOD, status: "failed" }],
    ])("counts %s alone as filtering the rows", async (_name, query) => {
        await exportWith(exportSubscriberTransactions, query, "pdf");

        expect(buildTableExport.mock.calls[0][0].note).toContain(FILTERED_NOTE);
    });

    it.each([
        ["nothing is filtered", PERIOD],
        ["the only choice is one the tab does not have", { ...PERIOD, status: "earned", type: "refund", side: "debit" }],
    ])("says nothing of filters when %s", async (_name, query) => {
        await exportWith(exportSubscriberTransactions, query, "pdf");

        expect(buildTableExport.mock.calls[0][0].note).not.toContain(FILTERED_NOTE);
    });

    it("does not work the summary out for Excel, which has no place for it", async () => {
        await exportWith(exportSubscriberTransactions, FILTERS, "excel");

        expect(useCases.getSubscriberLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].summary).toBeUndefined();
    });

    it("has no summary to show when no range was asked for", async () => {
        await exportWith(exportSubscriberTransactions, { searchText: "" }, "pdf");

        expect(useCases.getSubscriberLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].note).toBeUndefined();
    });
});

describe("subscriber wallet and bills exports", () => {
    it.each([
        ["wallet", exportSubscriberWallet],
        ["bills", exportSubscriberBills],
    ])("have no summary on the %s tab, because its screen shows none", async (_name, handler) => {
        await exportWith(handler, FILTERS, "pdf");

        expect(useCases.getSubscriberLedgerSummary).not.toHaveBeenCalled();
        expect(buildTableExport.mock.calls[0][0].summary).toBeUndefined();
    });
});
