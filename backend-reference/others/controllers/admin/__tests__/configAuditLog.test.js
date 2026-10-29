jest.mock("../../../models/use-cases/configAuditLog", () => ({
    listAuditLogs: jest.fn(),
    serializeAuditLog: jest.fn(row => ({ id: row.id })),
}));

const { listAuditLogs } = require("../../../models/use-cases/configAuditLog");
const { listConfigAuditLogs } = require("../configAuditLog");

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const run = async query => {
    const res = mockRes();
    const next = jest.fn();
    await listConfigAuditLogs({ query }, res, next);
    return { res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
    listAuditLogs.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }], count: 12 });
});

describe("listConfigAuditLogs", () => {
    it("returns the page of entries with the total", async () => {
        const { res } = await run({ page: 2, itemsPerPage: 5 });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: true,
            data: { entries: [{ id: 1 }, { id: 2 }], recordsTotal: 12, page: 2, itemsPerPage: 5 },
            message: "Audit trail fetched successfully",
            responseCode: "000",
        });
    });

    it("turns the page into a limit and an offset, and hands the filters on", async () => {
        await run({ page: 3, itemsPerPage: 10, configType: "CASHBACK", source: "ADMIN_PANEL", searchText: "asha" });

        expect(listAuditLogs).toHaveBeenCalledWith({
            configType: "CASHBACK",
            source: "ADMIN_PANEL",
            searchText: "asha",
            range: null,
            limit: 10,
            offset: 20,
        });
    });

    it("reads the dates as whole days", async () => {
        await run({ page: 1, itemsPerPage: 10, from: new Date("2026-10-01"), to: new Date("2026-10-07") });

        expect(listAuditLogs.mock.calls[0][0].range).toEqual({
            from: "2026-10-01 00:00:00",
            to: "2026-10-07 23:59:59",
        });
    });
});
