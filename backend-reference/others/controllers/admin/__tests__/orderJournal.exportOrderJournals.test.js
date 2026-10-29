jest.mock("../../../models/entities/order", () => ({}));
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
jest.mock("../../../models/use-cases/feeDetails", () => ({ listFeeDetails: jest.fn(), serializeFeeDetail: jest.fn() }));
jest.mock("../../../models/use-cases/subscriptionDetails", () => ({
    listSubscriptionDetails: jest.fn(),
    serializeSubscriptionDetail: jest.fn(),
}));
jest.mock("../../../models/use-cases/orderJournals", () => ({
    ...jest.requireActual("../../../models/use-cases/orderJournals"),
    listOrderJournals: jest.fn(),
}));
jest.mock("../../../utils/bull/queue/accountingQueues", () => ({ dispatchJournalRetry: jest.fn() }));
jest.mock("../../../utils/pekoRecieptHelper", () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

const { listOrderJournals } = require("../../../models/use-cases/orderJournals");
const { findOneCredential } = require("../../../models/use-cases/credential");
const { goLiveWindowStart } = require("../../../models/use-cases/accountingPeriod");
const tableExport = require("../../../utils/tableExport");

const { EXPORT_MAX_ROWS } = tableExport;
const buildTableExport = jest.spyOn(tableExport, "buildTableExport");
const sendTableExport = jest.spyOn(tableExport, "sendTableExport").mockImplementation(() => undefined);
const { getOrderJournals, exportOrderJournals } = require("../orderJournal");

const ROW = { id: 1 };
const FILE = { buffer: Buffer.from("x"), contentType: "application/pdf", extension: "pdf" };

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const exportWith = async (query, format = "excel", user) => {
    const res = mockRes();
    const next = jest.fn();
    await exportOrderJournals({ query, params: { format }, user }, res, next);
    return { res, next };
};

const subtitleOf = () => buildTableExport.mock.calls.at(-1)[0].subtitle;

beforeEach(() => {
    jest.clearAllMocks();
    listOrderJournals.mockResolvedValue({ rows: [ROW], count: 1 });
    findOneCredential.mockResolvedValue({ id: 55, name: "Gulf Reach" });
    buildTableExport.mockResolvedValue(FILE);
});

describe("exportOrderJournals — the Order Journals table's Excel and PDF download", () => {
    it("applies exactly the filters the table does, so the file matches the screen", async () => {
        const filters = {
            from: "2026-09-01",
            to: "2026-09-16",
            searchText: "acme",
            journalKey: "refund",
            journalStatus: "failed",
            partnerId: "55",
            sort: "ASC",
            sortField: "corporateTxnId",
        };
        await getOrderJournals({ query: { ...filters, page: "3", itemsPerPage: "10" } }, mockRes(), jest.fn());
        const { limit, offset, ...forTable } = listOrderJournals.mock.calls.at(-1)[0];

        await exportWith(filters);
        const { limit: exportLimit, offset: exportOffset, ...forExport } = listOrderJournals.mock.calls.at(-1)[0];

        expect(forExport).toEqual(forTable);
        expect(forExport.order).toEqual([["corporateTxnId", "ASC"]]);
        expect([limit, offset]).toEqual([10, 20]);
        expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("tells the user when nothing matches, instead of sending an empty file", async () => {
        listOrderJournals.mockResolvedValue({ rows: [], count: 0 });

        const { next } = await exportWith({ from: "2026-09-01", to: "2026-09-16" });

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("refuses an export bigger than the limit rather than silently cutting it short", async () => {
        listOrderJournals.mockResolvedValue({ rows: [ROW], count: EXPORT_MAX_ROWS + 1 });

        const { next } = await exportWith({ from: "2026-09-01", to: "2026-09-16" });

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 422 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("builds the file with the table's columns, and names every filter in it", async () => {
        const { res } = await exportWith(
            {
                from: "2026-09-01",
                to: "2026-09-16",
                journalKey: "refund",
                journalStatus: "notRecorded",
                partnerId: "55",
                searchText: "acme",
            },
            "pdf"
        );

        const request = buildTableExport.mock.calls[0][0];
        expect(request.format).toBe("pdf");
        expect(request.title).toBe("Order Journals");
        expect(request.subtitle).toBe(
            'Period: 2026-09-01 to 2026-09-16  ·  Journal: Refund  ·  Status: Not recorded  ·  Partner: Gulf Reach  ·  Search: "acme"'
        );
        expect(request.columns.map(column => column.header)).toEqual([
            "Transaction Date",
            "Transaction ID",
            "Customer",
            "Service",
            "Amount",
            "Payment Mode",
            "Status",
            "Journal Status",
        ]);
        expect(sendTableExport).toHaveBeenCalledWith(res, FILE, "Order Journals 2026-09-01 to 2026-09-16");
    });

    it("hands the builder the same rows the table shows, subscription names included", async () => {
        listOrderJournals.mockResolvedValue({
            rows: [
                {
                    id: 9,
                    corporateTxnId: "1790230428010",
                    serviceOperator: { id: null },
                    orderResponse: JSON.stringify({ serviceName: "Peko+" }),
                },
            ],
            count: 1,
        });

        await exportWith({ from: "2026-09-01", to: "2026-09-16" });

        expect(buildTableExport.mock.calls[0][0].rows[0].serviceOperator).toEqual({
            id: null,
            serviceProvider: "Peko+",
            serviceCategory: "Subscription",
        });
    });

    it("says Peko (Default) for the Default partner, and shows nothing for filters that aren't set", async () => {
        await exportWith({ from: "2026-09-01", to: "2026-09-16", partnerId: "default" });
        expect(subtitleOf()).toBe("Period: 2026-09-01 to 2026-09-16  ·  Partner: Peko (Default)");
        expect(findOneCredential).not.toHaveBeenCalled();

        await exportWith({ from: "2026-09-01", to: "2026-09-16" });
        expect(subtitleOf()).toBe("Period: 2026-09-01 to 2026-09-16");
    });

    it("names the partner a partner user is locked to, though they never picked one", async () => {
        await exportWith({ from: "2026-09-01", to: "2026-09-16" }, "excel", { registeredBy: "55" });

        expect(findOneCredential).toHaveBeenCalledWith({ id: "55" }, ["id", "name"]);
        expect(subtitleOf()).toBe("Period: 2026-09-01 to 2026-09-16  ·  Partner: Gulf Reach");
    });

    it("describes the any-journal view, and ignores a journal type or status it doesn't know", async () => {
        await exportWith({ from: "2026-09-01", to: "2026-09-16", journalKey: "any", journalStatus: "skipped" });
        expect(subtitleOf()).toBe("Period: 2026-09-01 to 2026-09-16  ·  Journal: Any  ·  Status: Skipped");

        await exportWith({ from: "2026-09-01", to: "2026-09-16", journalKey: "bogus", journalStatus: "bogus" });
        expect(subtitleOf()).toBe("Period: 2026-09-01 to 2026-09-16");
    });

    it("starts the period where the table does, at the go-live floor when the request reaches before it", async () => {
        goLiveWindowStart.mockReturnValueOnce(new Date(2026, 8, 10));

        await exportWith({ from: "2026-09-01", to: "2026-09-16" });

        expect(subtitleOf()).toBe("Period: 2026-09-10 to 2026-09-16");
    });
});
