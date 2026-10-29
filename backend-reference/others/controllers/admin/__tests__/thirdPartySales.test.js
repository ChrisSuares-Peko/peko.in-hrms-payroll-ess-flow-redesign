jest.mock("../../../models/use-cases/thirdPartySales", () => {
    const actual = jest.requireActual("../../../models/use-cases/thirdPartySales");
    const mockList = jest.fn();
    const mockSerialize = jest.fn(row => ({ id: row.id }));
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
jest.mock("../../../models/use-cases/internalAccounts", () => ({
    resolveAccountIds: jest.fn(async scope => (scope === "internal" ? [12, 15] : null)),
    accountScopeLabel: jest.fn(accountIds => (accountIds ? "Accounts: Internal purchase accounts" : null)),
}));
const { listThirdPartySales } = require("../thirdPartySales");

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const run = async (query, kind = "payment-links") => {
    const res = mockRes();
    const next = jest.fn();
    await listThirdPartySales({ query, params: { kind }, user: { id: 42, name: "Ibrahim" } }, res, next);
    return { res, next };
};

const TOTALS = { links: 2, collected: 2998, pending: 500, failed: 0, expired: 250 };

const baseQuery = extra => ({
    page: 2,
    itemsPerPage: 10,
    searchText: "",
    sort: "DESC",
    sortField: "eventDate",
    ...extra,
});

const dataOf = res => res.json.mock.calls[0][0].data;

beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({ rows: [{ id: 301 }], count: 2, totals: TOTALS });
});

describe("third-party sales controller", () => {
    it("pages the listing and returns the totals and the kind beside it", async () => {
        const { res } = await run(baseQuery());

        expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 10, range: null }));
        expect(mockSerialize).toHaveBeenCalledWith({ id: 301 });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toMatchObject({ status: true, responseCode: "000" });
        expect(dataOf(res)).toEqual({
            entries: [{ id: 301 }],
            recordsTotal: 2,
            totals: TOTALS,
            page: 2,
            itemsPerPage: 10,
            kind: "payment-links",
        });
    });

    it("passes the status, the search and the sort straight through", async () => {
        await run(baseQuery({ status: "paid", searchText: "acme", sort: "ASC", sortField: "amount" }));

        expect(mockList).toHaveBeenCalledWith(
            expect.objectContaining({ status: "paid", searchText: "acme", sort: "ASC", sortField: "amount" })
        );
    });

    it("covers the whole of the to day rather than cutting it off at midnight", async () => {
        await run(baseQuery({ from: "2026-09-19", to: "2026-10-12" }));

        expect(mockList.mock.calls[0][0].range).toEqual({
            from: "2026-09-19 00:00:00",
            to: "2026-10-12 23:59:59",
        });
    });

    it("asks for every period when no range was given", async () => {
        await run(baseQuery({ from: "2026-09-19" }));

        expect(mockList.mock.calls[0][0].range).toBeNull();
    });

    it("refuses a kind of sale it does not know", async () => {
        const { res, next } = await run(baseQuery(), "qr-codes");

        expect(mockList).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
    });
});

describe("third-party sales for the internal purchase accounts", () => {
    beforeEach(() => {
        mockList.mockResolvedValue({ rows: [], count: 0, totals: {} });
    });

    it("limits the listing to the internal accounts when asked, and to every account otherwise", async () => {
        await run({ page: 1, itemsPerPage: 10, accounts: "internal" });
        expect(mockList).toHaveBeenLastCalledWith(expect.objectContaining({ accountIds: [12, 15] }));

        await run({ page: 1, itemsPerPage: 10 });
        expect(mockList).toHaveBeenLastCalledWith(expect.objectContaining({ accountIds: null }));
    });
});
