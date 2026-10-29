jest.mock("../../../models/use-cases/otherSales", () => ({
    ...jest.requireActual("../../../models/use-cases/otherSales"),
    listOtherSales: jest.fn(),
    serializeOtherSale: jest.fn(),
}));

const { listOtherSales, serializeOtherSale } = require("../../../models/use-cases/otherSales");
const tableExport = require("../../../utils/tableExport");

const { EXPORT_MAX_ROWS } = tableExport;
const buildTableExport = jest.spyOn(tableExport, "buildTableExport");
const sendTableExport = jest.spyOn(tableExport, "sendTableExport").mockImplementation(() => undefined);
const { listOtherSales: listController, exportOtherSales } = require("../otherSales");

const ROW = { id: 1 };
const FILE = { buffer: Buffer.from("x"), contentType: "application/pdf", extension: "pdf" };

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const baseQuery = extra => ({
    page: 3,
    itemsPerPage: 10,
    searchText: "",
    sort: "DESC",
    sortField: "transactionDate",
    from: "2026-09-01",
    to: "2026-09-16",
    ...extra,
});

const exportWith = async (query, format = "excel") => {
    const res = mockRes();
    const next = jest.fn();
    await exportOtherSales({ query, params: { format } }, res, next);
    return { res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
    listOtherSales.mockResolvedValue({ rows: [ROW], count: 1, totals: {} });
    serializeOtherSale.mockReturnValue({ vendorName: "Acme Vendor", partnerName: "Gulf Reach" });
    buildTableExport.mockResolvedValue(FILE);
});

describe("exportOtherSales — the Other Sales table's Excel and PDF download", () => {
    it("applies exactly the filters the table does, so the file matches the screen", async () => {
        const filters = { searchText: "acme", vendorId: 9, partnerId: 55, sort: "ASC", sortField: "service" };
        await listController({ query: baseQuery(filters) }, mockRes(), jest.fn());
        const { limit, offset, ...forTable } = listOtherSales.mock.calls.at(-1)[0];

        await exportWith(baseQuery(filters));
        const { limit: exportLimit, offset: exportOffset, ...forExport } = listOtherSales.mock.calls.at(-1)[0];

        expect(forExport).toEqual(forTable);
        expect(forExport).toMatchObject({ vendorId: 9, partnerId: 55, searchText: "acme", sort: "ASC" });
        expect([limit, offset]).toEqual([10, 20]);
        expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("tells the user when nothing matches, instead of sending an empty file", async () => {
        listOtherSales.mockResolvedValue({ rows: [], count: 0, totals: {} });

        const { next } = await exportWith(baseQuery());

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("refuses an export bigger than the limit rather than silently cutting it short", async () => {
        listOtherSales.mockResolvedValue({ rows: [ROW], count: EXPORT_MAX_ROWS + 1, totals: {} });

        const { next } = await exportWith(baseQuery());

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 422 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("builds the file with the table's columns, and names every filter in it", async () => {
        const { res } = await exportWith(baseQuery({ vendorId: 9, partnerId: 55, searchText: "acme" }), "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(request.format).toBe("pdf");
        expect(request.title).toBe("Other Sales");
        expect(request.subtitle).toBe(
            'Period: 2026-09-01 to 2026-09-16  ·  Vendor: Acme Vendor  ·  Partner: Gulf Reach  ·  Search: "acme"'
        );
        expect(request.columns.map(column => column.header)).toContain("Markup");
        expect(sendTableExport).toHaveBeenCalledWith(res, FILE, "Other Sales 2026-09-01 to 2026-09-16");
    });

    it("says Peko (Default) when the sales Peko made to its own customers were picked", async () => {
        await exportWith(baseQuery({ partnerId: "default" }));

        expect(buildTableExport.mock.calls[0][0].subtitle).toBe(
            "Period: 2026-09-01 to 2026-09-16  ·  Partner: Peko (Default)"
        );
    });

    it("shows nothing for filters that aren't set", async () => {
        await exportWith(baseQuery());

        expect(buildTableExport.mock.calls[0][0].subtitle).toBe("Period: 2026-09-01 to 2026-09-16");
    });

    it("says All dates when the table has no date range", async () => {
        await exportWith(baseQuery({ from: undefined, to: undefined }));

        expect(buildTableExport.mock.calls[0][0].subtitle).toBe("Period: All dates");
        expect(sendTableExport.mock.calls[0][2]).toBe("Other Sales All dates");
    });

    it("puts the totals the table shows, and what they mean, into the PDF", async () => {
        listOtherSales.mockResolvedValue({
            rows: [ROW],
            count: 2,
            totals: { totalAmount: 1316, platformFee: 80, markup: 154, couponDiscount: 100 },
        });

        await exportWith(baseQuery(), "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(request.summary).toEqual([
            { label: "Full Amount", value: 1316, money: true },
            { label: "Platform Fee", value: 80, money: true },
            { label: "Markup", value: 154, money: true },
            { label: "Coupon", value: 100, money: true },
        ]);
        expect(request.note).toMatch(/Full Amount is what the sale was worth in total/);
    });
});
