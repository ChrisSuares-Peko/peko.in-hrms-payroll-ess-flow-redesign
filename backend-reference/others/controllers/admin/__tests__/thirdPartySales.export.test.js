jest.mock("../../../models/use-cases/thirdPartySales", () => {
    const actual = jest.requireActual("../../../models/use-cases/thirdPartySales");
    const mockList = jest.fn();
    const mockSerialize = jest.fn();
    return {
        ...actual,
        mockList,
        mockSerialize,
        handlerFor: jest.fn(kind =>
            kind === "payment-links"
                ? { ...actual.handlerFor("payment-links"), list: mockList, serialize: mockSerialize }
                : null
        ),
    };
});

const { mockList, mockSerialize } = require("../../../models/use-cases/thirdPartySales");
const tableExport = require("../../../utils/tableExport");

const { EXPORT_MAX_ROWS } = tableExport;
const buildTableExport = jest.spyOn(tableExport, "buildTableExport");
const sendTableExport = jest.spyOn(tableExport, "sendTableExport").mockImplementation(() => undefined);
const { listThirdPartySales, exportThirdPartySales } = require("../thirdPartySales");

const ROW = { id: 301 };
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
    sortField: "eventDate",
    from: "2026-09-01",
    to: "2026-09-16",
    ...extra,
});

const exportWith = async (query, format = "excel", kind = "payment-links") => {
    const res = mockRes();
    const next = jest.fn();
    await exportThirdPartySales({ query, params: { format, kind } }, res, next);
    return { res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({ rows: [ROW], count: 1, totals: {} });
    mockSerialize.mockReturnValue({ linkId: "PYT_TXN0301", outcome: "paid" });
    buildTableExport.mockResolvedValue(FILE);
});

describe("exportThirdPartySales — the Payment Links table's Excel and PDF download", () => {
    it("applies exactly the filters the table does, so the file matches the screen", async () => {
        const filters = { searchText: "acme", status: "paid", sort: "ASC", sortField: "amount" };
        await listThirdPartySales(
            { query: baseQuery(filters), params: { kind: "payment-links" } },
            mockRes(),
            jest.fn()
        );
        const { limit, offset, ...forTable } = mockList.mock.calls.at(-1)[0];

        await exportWith(baseQuery(filters));
        const { limit: exportLimit, offset: exportOffset, ...forExport } = mockList.mock.calls.at(-1)[0];

        expect(forExport).toEqual(forTable);
        expect(forExport).toMatchObject({ status: "paid", searchText: "acme", sort: "ASC", sortField: "amount" });
        expect([limit, offset]).toEqual([10, 20]);
        expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("tells the user when nothing matches, instead of sending an empty file", async () => {
        mockList.mockResolvedValue({ rows: [], count: 0, totals: {} });

        const { next } = await exportWith(baseQuery());

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("refuses an export bigger than the limit rather than silently cutting it short", async () => {
        mockList.mockResolvedValue({ rows: [ROW], count: EXPORT_MAX_ROWS + 1, totals: {} });

        const { next } = await exportWith(baseQuery());

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 422 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("builds the file with the table's columns, and names every filter in it", async () => {
        const { res } = await exportWith(baseQuery({ status: "paid", searchText: "acme" }), "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(request.format).toBe("pdf");
        expect(request.title).toBe("Third-Party Sales (Payment Links)");
        expect(request.subtitle).toBe('Period: 2026-09-01 to 2026-09-16  ·  Status: Paid  ·  Search: "acme"');
        expect(request.columns.map(column => column.header)).toEqual(
            expect.arrayContaining(["Link ID", "Raised by", "Paid on", "UTR"])
        );
        expect(request.rows).toEqual([{ linkId: "PYT_TXN0301", outcome: "paid" }]);
        expect(sendTableExport).toHaveBeenCalledWith(
            res,
            FILE,
            "Third-Party Sales (Payment Links) 2026-09-01 to 2026-09-16"
        );
    });

    it("shows nothing for filters that aren't set", async () => {
        await exportWith(baseQuery());

        expect(buildTableExport.mock.calls[0][0].subtitle).toBe("Period: 2026-09-01 to 2026-09-16");
    });

    it("says All dates when the table has no date range", async () => {
        await exportWith(baseQuery({ from: undefined, to: undefined }));

        expect(buildTableExport.mock.calls[0][0].subtitle).toBe("Period: All dates");
        expect(sendTableExport.mock.calls[0][2]).toBe("Third-Party Sales (Payment Links) All dates");
    });

    it("puts the totals the table shows, and what they mean, into the PDF", async () => {
        mockList.mockResolvedValue({
            rows: [ROW],
            count: 2,
            totals: { links: 2, collected: 2998, pending: 500, failed: 0, expired: 250 },
        });

        await exportWith(baseQuery(), "pdf");

        const request = buildTableExport.mock.calls[0][0];
        expect(request.summary).toEqual([
            { label: "Links", value: 2 },
            { label: "Collected", value: 2998, money: true },
            { label: "Pending", value: 500, money: true },
            { label: "Failed", value: 0, money: true },
            { label: "Expired", value: 250, money: true },
        ]);
        expect(request.note).toMatch(/Collected adds up the links that were paid/);
    });

    it("refuses a kind of sale it does not know", async () => {
        const { next } = await exportWith(baseQuery(), "excel", "qr-codes");

        expect(mockList).not.toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
    });
});
