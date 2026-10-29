const useCases = require("../../../models/use-cases/otherSales");
const { listOtherSales } = require("../otherSales");

jest.mock("../../../models/use-cases/otherSales", () => ({
    buildOtherSalesQuery: jest.fn(),
    listOtherSales: jest.fn(),
    serializeOtherSale: jest.fn(row => ({ id: row.id })),
}));
jest.mock("../../../models/use-cases/internalAccounts", () => ({
    resolveAccountIds: jest.fn(async scope => (scope === "internal" ? [12, 15] : null)),
    accountScopeLabel: jest.fn(accountIds => (accountIds ? "Accounts: Internal purchase accounts" : null)),
}));

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const run = async query => {
    const res = mockRes();
    const next = jest.fn();
    await listOtherSales({ query, user: { id: 42, name: "Ibrahim" } }, res, next);
    return { res, next };
};

const TOTALS = {
    totalAmount: 1316,
    platformFee: 80,
    markup: 154,
    couponDiscount: 100,
};

const baseQuery = extra => ({
    page: 2,
    itemsPerPage: 10,
    searchText: "",
    sort: "DESC",
    sortField: "transactionDate",
    ...extra,
});

const dataOf = res => res.json.mock.calls[0][0].data;

beforeEach(() => {
    jest.clearAllMocks();
    useCases.listOtherSales.mockResolvedValue({ rows: [{ id: 41 }], count: 2, totals: TOTALS });
});

describe("other sales controller", () => {
    it("pages the listing and returns the totals beside it", async () => {
        const { res } = await run(baseQuery());

        expect(useCases.listOtherSales).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 10, offset: 10, range: null })
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toMatchObject({ status: true, responseCode: "000" });
        expect(dataOf(res)).toEqual({
            entries: [{ id: 41 }],
            recordsTotal: 2,
            totals: TOTALS,
            page: 2,
            itemsPerPage: 10,
        });
    });

    it("passes the vendor, the partner and the search straight through", async () => {
        await run(baseQuery({ vendorId: 9, partnerId: 55, searchText: "data" }));

        expect(useCases.listOtherSales).toHaveBeenCalledWith(
            expect.objectContaining({ vendorId: 9, partnerId: 55, searchText: "data" })
        );
    });

    it("covers the whole of the to day rather than cutting it off at midnight", async () => {
        await run(baseQuery({ from: "2026-08-19", to: "2026-09-19" }));

        expect(useCases.listOtherSales.mock.calls[0][0].range).toEqual({
            from: "2026-08-19 00:00:00",
            to: "2026-09-19 23:59:59",
        });
    });

    it("asks for every period when no range was given", async () => {
        await run(baseQuery({ from: "2026-08-19" }));

        expect(useCases.listOtherSales.mock.calls[0][0].range).toBeNull();
    });
});

describe("other sales for the internal purchase accounts", () => {
    beforeEach(() => {
        useCases.listOtherSales.mockResolvedValue({ rows: [], count: 0, totals: TOTALS });
    });

    it("limits the listing to the internal accounts when asked, and to every account otherwise", async () => {
        await run(baseQuery({ accounts: "internal" }));
        expect(useCases.listOtherSales).toHaveBeenLastCalledWith(expect.objectContaining({ accountIds: [12, 15] }));

        await run(baseQuery());
        expect(useCases.listOtherSales).toHaveBeenLastCalledWith(expect.objectContaining({ accountIds: null }));
    });
});
