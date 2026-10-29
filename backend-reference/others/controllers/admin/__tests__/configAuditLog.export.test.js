jest.mock("../../../models/use-cases/configAuditLog", () => ({
    listAuditLogs: jest.fn(),
    serializeAuditLog: jest.fn(),
}));

const { listAuditLogs, serializeAuditLog } = require("../../../models/use-cases/configAuditLog");
const tableExport = require("../../../utils/tableExport");

const { EXPORT_MAX_ROWS } = tableExport;
const buildTableExport = jest.spyOn(tableExport, "buildTableExport");
const sendTableExport = jest.spyOn(tableExport, "sendTableExport").mockImplementation(() => undefined);
const { listConfigAuditLogs, exportConfigAuditLogs } = require("../configAuditLog");

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
    sortField: "createdAt",
    from: "2026-09-08",
    to: "2026-10-08",
    ...extra,
});

const exportWith = async (query, format = "excel") => {
    const res = mockRes();
    const next = jest.fn();
    await exportConfigAuditLogs({ query, params: { format } }, res, next);
    return { res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
    listAuditLogs.mockResolvedValue({ rows: [ROW], count: 1 });
    serializeAuditLog.mockReturnValue({ actorName: "Asha" });
    buildTableExport.mockResolvedValue(FILE);
});

describe("exportConfigAuditLogs — the Audit Trail's Excel and PDF download", () => {
    it("applies exactly the filters and sort the table does, so the file matches the screen", async () => {
        const filters = {
            searchText: "asha",
            configType: "PLATFORM_FEE",
            source: "ACCOUNTING_PORTAL",
            partnerName: "Cent Saarthi",
            sort: "ASC",
            sortField: "actorName",
        };
        await listConfigAuditLogs({ query: baseQuery(filters) }, mockRes(), jest.fn());
        const { limit, offset, ...forTable } = listAuditLogs.mock.calls.at(-1)[0];

        await exportWith(baseQuery(filters));
        const { limit: exportLimit, offset: exportOffset, ...forExport } = listAuditLogs.mock.calls.at(-1)[0];

        expect(forExport).toEqual(forTable);
        expect(forExport).toMatchObject({ partnerName: "Cent Saarthi", sortField: "actorName", sort: "ASC" });
        expect([limit, offset]).toEqual([10, 20]);
        expect([exportLimit, exportOffset]).toEqual([EXPORT_MAX_ROWS, 0]);
    });

    it("tells the user when nothing matches, instead of sending an empty file", async () => {
        listAuditLogs.mockResolvedValue({ rows: [], count: 0 });

        const { next } = await exportWith(baseQuery());

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("refuses an export bigger than the limit rather than silently cutting it short", async () => {
        listAuditLogs.mockResolvedValue({ rows: [ROW], count: EXPORT_MAX_ROWS + 1 });

        const { next } = await exportWith(baseQuery());

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 422 });
        expect(buildTableExport).not.toHaveBeenCalled();
    });

    it("builds the file with the table's columns, and names every filter in it", async () => {
        const { res } = await exportWith(
            baseQuery({
                configType: "PLATFORM_FEE",
                partnerName: "Cent Saarthi",
                source: "ACCOUNTING_PORTAL",
                searchText: "asha",
            }),
            "pdf"
        );

        const request = buildTableExport.mock.calls[0][0];
        expect(request.format).toBe("pdf");
        expect(request.title).toBe("Audit Trail");
        expect(request.subtitle).toBe(
            'Period: 2026-09-08 to 2026-10-08  ·  Configuration: Platform fee  ·  Partner: Cent Saarthi  ·  Changed from: Accounting Portal  ·  Search: "asha"'
        );
        expect(request.columns.map(column => column.header)).toContain("What changed");
        expect(sendTableExport).toHaveBeenCalledWith(res, FILE, "Audit Trail 2026-09-08 to 2026-10-08");
    });

    it("shows nothing for filters that aren't set", async () => {
        await exportWith(baseQuery());

        expect(buildTableExport.mock.calls[0][0].subtitle).toBe("Period: 2026-09-08 to 2026-10-08");
    });

    it("says All dates when the table has no date range", async () => {
        await exportWith(baseQuery({ from: undefined, to: undefined }));

        expect(buildTableExport.mock.calls[0][0].subtitle).toBe("Period: All dates");
        expect(sendTableExport.mock.calls[0][2]).toBe("Audit Trail All dates");
    });
});
