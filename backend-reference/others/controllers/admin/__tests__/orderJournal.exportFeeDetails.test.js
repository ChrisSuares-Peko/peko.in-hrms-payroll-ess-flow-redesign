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
jest.mock("../../../models/use-cases/feeDetails", () => ({
    ...jest.requireActual("../../../models/use-cases/feeDetails"),
    listFeeDetails: jest.fn(),
    serializeFeeDetail: jest.fn(),
}));
jest.mock("../../../utils/bull/queue/accountingQueues", () => ({ dispatchJournalRetry: jest.fn() }));
jest.mock("../../../utils/pekoRecieptHelper", () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

const { listFeeDetails, serializeFeeDetail } = require("../../../models/use-cases/feeDetails");
const tableExport = require("../../../utils/tableExport");

const { EXPORT_MAX_ROWS } = tableExport;
const buildTableExport = jest.spyOn(tableExport, "buildTableExport");
const sendTableExport = jest.spyOn(tableExport, "sendTableExport").mockImplementation(() => undefined);
const { getFeeDetails, exportFeeDetails } = require("../orderJournal");

const ROW = { id: 1 };
const FILE = { buffer: Buffer.from("x"), contentType: "application/pdf", extension: "pdf" };

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const exportWith = async (query, format = "excel") => {
    const next = jest.fn();
    await exportFeeDetails({ query, params: { format } }, mockRes(), next);
    return next;
};

beforeEach(() => {
    jest.clearAllMocks();
    listFeeDetails.mockResolvedValue({ rows: [ROW], count: 1 });
    serializeFeeDetail.mockReturnValue({ vendorName: "Acme Vendor" });
    buildTableExport.mockResolvedValue(FILE);
});

describe("exportFeeDetails — the Fee Details table's Excel and PDF download", () => {
    it("applies exactly the filters the table does, so the file matches the screen", async () => {
        const filters = {
            from: "2026-09-01",
            to: "2026-09-16",
            feeType: "platformFee",
            searchText: "acme",
            vendorId: "9",
        };
        await getFeeDetails({ query: { ...filters, page: "3", itemsPerPage: "10" } }, mockRes(), jest.fn());
        const { limit, offset, ...forTable } = listFeeDetails.mock.calls.at(-1)[0];

        await exportWith(filters);
        const { limit: exportLimit, offset: exportOffset, ...forExport } = listFeeDetails.mock.calls.at(-1)[0];

        expect(forExport).toEqual(forTable);
        expect(forExport).toMatchObject({ feeType: "platformFee", searchText: "acme", vendorId: 9 });
        expect([limit, offset]).toEqual([10, 20]);
        expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("exports every matching row whatever page the table is on", async () => {
        await exportWith({ from: "2026-09-01", to: "2026-09-16", page: "4", itemsPerPage: "10" });

        const { limit, offset } = listFeeDetails.mock.calls[0][0];
        expect([limit, offset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("tells the user when nothing matches, instead of sending an empty file", async () => {
        listFeeDetails.mockResolvedValue({ rows: [], count: 0 });

        const next = await exportWith({ from: "2026-09-01", to: "2026-09-16" });

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("refuses an export bigger than the limit rather than silently cutting it short", async () => {
        listFeeDetails.mockResolvedValue({ rows: [ROW], count: EXPORT_MAX_ROWS + 1 });

        const next = await exportWith({ from: "2026-09-01", to: "2026-09-16" });

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 422 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("builds the file in the requested format with the table's columns, and names the filters in it", async () => {
        const res = mockRes();
        await exportFeeDetails(
            {
                query: { from: "2026-09-01", to: "2026-09-16", feeType: "commission", vendorId: "9", searchText: "acme" },
                params: { format: "pdf" },
            },
            res,
            jest.fn()
        );

        const request = buildTableExport.mock.calls[0][0];
        expect(request.format).toBe("pdf");
        expect(request.title).toBe("Commission Details");
        expect(request.subtitle).toBe("Period: 2026-09-01 to 2026-09-16  ·  Vendor: Acme Vendor  ·  Search: \"acme\"");
        expect(request.columns.map(column => column.header)).toContain("Commission (incl. GST)");
        expect(serializeFeeDetail).toHaveBeenCalledWith(ROW, "commission");

        expect(sendTableExport).toHaveBeenCalledWith(res, FILE, "Commission Details 2026-09-01 to 2026-09-16");
    });

    it("exports Platform Fee Details under its own title and columns", async () => {
        await exportWith({ from: "2026-09-01", to: "2026-09-16", feeType: "platformFee" }, "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(request.title).toBe("Platform Fee Details");
        expect(request.columns.map(column => column.header)).not.toContain("Reversed");
        expect(request.subtitle).toBe("Period: 2026-09-01 to 2026-09-16");
    });
});
