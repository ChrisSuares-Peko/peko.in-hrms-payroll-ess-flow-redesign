const { validateConfigAuditLogsQuery } = require("../queryValidation");

const run = query => {
    const req = { query };
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    validateConfigAuditLogsQuery(req, res, next);
    return { req, res, next };
};

describe("validateConfigAuditLogsQuery", () => {
    it("fills the defaults for an empty query", () => {
        const { req, next } = run({});

        expect(next).toHaveBeenCalledWith();
        expect(req.query).toEqual({ page: 1, itemsPerPage: 10, searchText: "", sort: "DESC", sortField: "createdAt" });
    });

    it("accepts every filter and reads the numbers and dates", () => {
        const { req, next } = run({
            page: "2",
            itemsPerPage: "25",
            searchText: "peko",
            configType: "PLATFORM_FEE",
            source: "ACCOUNTING_PORTAL",
            partnerName: "Cent Saarthi",
            sort: "ASC",
            sortField: "actorName",
            from: "2026-10-01",
            to: "2026-10-07",
        });

        expect(next).toHaveBeenCalledWith();
        expect(req.query).toMatchObject({
            page: 2,
            itemsPerPage: 25,
            configType: "PLATFORM_FEE",
            source: "ACCOUNTING_PORTAL",
            partnerName: "Cent Saarthi",
            sort: "ASC",
            sortField: "actorName",
        });
        expect(req.query.from).toBeInstanceOf(Date);
    });

    it("treats an empty filter as no filter", () => {
        const { req } = run({ configType: "", source: "", partnerName: "" });

        expect(req.query).toEqual({ page: 1, itemsPerPage: 10, searchText: "", sort: "DESC", sortField: "createdAt" });
    });

    it.each([
        ["a configuration type that does not exist", { configType: "NOPE" }],
        ["a source that is neither portal", { source: "MOBILE" }],
        ["a column that cannot be sorted", { sortField: "password" }],
        ["a sort direction that does not exist", { sort: "UP" }],
        ["a page size over 100", { itemsPerPage: 500 }],
        ["only one end of a date range", { from: "2026-10-01" }],
        ["a range that ends before it starts", { from: "2026-10-07", to: "2026-10-01" }],
    ])("rejects %s", (name, query) => {
        const { res, next } = run(query);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0]).toMatchObject({ status: false, responseCode: "001" });
    });

    it("drops keys it does not know instead of passing them on", () => {
        const { req } = run({ role: "ADMIN", where: "1=1" });

        expect(req.query).toEqual({ page: 1, itemsPerPage: 10, searchText: "", sort: "DESC", sortField: "createdAt" });
    });
});
