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
    ...jest.requireActual("../../../models/use-cases/subscriptionDetails"),
    listSubscriptionDetails: jest.fn(),
    serializeSubscriptionDetail: jest.fn(),
}));
jest.mock("../../../utils/bull/queue/accountingQueues", () => ({ dispatchJournalRetry: jest.fn() }));
jest.mock("../../../utils/pekoRecieptHelper", () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

const {
    listSubscriptionDetails,
    serializeSubscriptionDetail,
} = require("../../../models/use-cases/subscriptionDetails");
const tableExport = require("../../../utils/tableExport");

const { EXPORT_MAX_ROWS } = tableExport;
const buildTableExport = jest.spyOn(tableExport, "buildTableExport");
const sendTableExport = jest.spyOn(tableExport, "sendTableExport").mockImplementation(() => undefined);
const { getSubscriptionDetails, exportSubscriptionDetails } = require("../orderJournal");

const ROW = { id: 1 };
const FILE = { buffer: Buffer.from("x"), contentType: "application/pdf", extension: "pdf" };

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const exportWith = async (query, format = "excel") => {
    const res = mockRes();
    const next = jest.fn();
    await exportSubscriptionDetails({ query, params: { format } }, res, next);
    return { res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
    listSubscriptionDetails.mockResolvedValue({ rows: [ROW], count: 1 });
    serializeSubscriptionDetail.mockReturnValue({ partnerName: "Gulf Reach" });
    buildTableExport.mockResolvedValue(FILE);
});

describe("exportSubscriptionDetails — the Subscription Details table's Excel and PDF download", () => {
    it("applies exactly the filters the table does, so the file matches the screen", async () => {
        const filters = {
            from: "2026-09-01",
            to: "2026-09-16",
            searchText: "acme",
            partnerId: "55",
            billingType: "MONTHLY",
        };
        await getSubscriptionDetails({ query: { ...filters, page: "3", itemsPerPage: "10" } }, mockRes(), jest.fn());
        const { limit, offset, ...forTable } = listSubscriptionDetails.mock.calls.at(-1)[0];

        await exportWith(filters);
        const { limit: exportLimit, offset: exportOffset, ...forExport } = listSubscriptionDetails.mock.calls.at(-1)[0];

        expect(forExport).toEqual(forTable);
        expect(forExport).toMatchObject({ searchText: "acme", partnerId: 55, billingType: "MONTHLY" });
        expect([limit, offset]).toEqual([10, 20]);
        expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("keeps the Default partner and ignores a billing type it doesn't know, as the table does", async () => {
        await exportWith({ from: "2026-09-01", to: "2026-09-16", partnerId: "default", billingType: "WEEKLY" });

        expect(listSubscriptionDetails.mock.calls[0][0]).toMatchObject({ partnerId: "default", billingType: null });
    });

    it("tells the user when nothing matches, instead of sending an empty file", async () => {
        listSubscriptionDetails.mockResolvedValue({ rows: [], count: 0 });

        const { next } = await exportWith({ from: "2026-09-01", to: "2026-09-16" });

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("refuses an export bigger than the limit rather than silently cutting it short", async () => {
        listSubscriptionDetails.mockResolvedValue({ rows: [ROW], count: EXPORT_MAX_ROWS + 1 });

        const { next } = await exportWith({ from: "2026-09-01", to: "2026-09-16" });

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 422 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("builds the file with the table's columns, and names every filter in it", async () => {
        const { res } = await exportWith(
            { from: "2026-09-01", to: "2026-09-16", partnerId: "55", billingType: "ANNUALLY", searchText: "acme" },
            "pdf"
        );

        const request = buildTableExport.mock.calls[0][0];
        expect(request.format).toBe("pdf");
        expect(request.title).toBe("Subscription Details");
        expect(request.subtitle).toBe(
            'Period: 2026-09-01 to 2026-09-16  ·  Partner: Gulf Reach  ·  Billing: Annually  ·  Search: "acme"'
        );
        expect(request.columns.map(column => column.header)).toContain("Net Revenue (excl. GST)");
        expect(sendTableExport).toHaveBeenCalledWith(res, FILE, "Subscription Details 2026-09-01 to 2026-09-16");
    });

    it("says Peko (Default) for the Default partner, and shows nothing for filters that aren't set", async () => {
        await exportWith({ from: "2026-09-01", to: "2026-09-16", partnerId: "default" });
        expect(buildTableExport.mock.calls[0][0].subtitle).toBe("Period: 2026-09-01 to 2026-09-16  ·  Partner: Peko (Default)");

        await exportWith({ from: "2026-09-01", to: "2026-09-16" });
        expect(buildTableExport.mock.calls[1][0].subtitle).toBe("Period: 2026-09-01 to 2026-09-16");
    });
});
