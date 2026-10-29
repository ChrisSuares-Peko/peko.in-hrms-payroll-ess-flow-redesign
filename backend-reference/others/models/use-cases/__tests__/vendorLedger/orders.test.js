const { Op } = require("sequelize");
const sequelizeConfig = require("../../../../configs/database/index");
const order = require("../../../entities/order");
const { findOpeningBalance } = require("../../vendorDeposits");
const { listVendorOrders, ORDER_STATUS_FILTERS } = require("../../vendorLedger");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/vendor", () => ({ findAll: jest.fn(), findOne: jest.fn() }));
jest.mock("../../../entities/serviceOperator", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/order", () => ({ findAndCountAll: jest.fn() }));
jest.mock("../../../entities/credential", () => ({}));
jest.mock("../../../entities/vendorDeposit", () => ({}));
jest.mock("../../../entities/vendorLedgerEntry", () => ({}));
jest.mock("../../accountingPeriod", () => ({
    loadAccountingFloor: jest.fn().mockResolvedValue("2026-01-01"),
    flooredAfter: jest.fn(),
}));
jest.mock("../../chartOfAccount", () => ({
    findByAccountName: jest.fn(),
    findGenericAccountByName: jest.fn(),
    findAccountIdsByName: jest.fn(),
    findLegacyVendorDepositAccounts: jest.fn(),
}));
jest.mock("../../setting", () => ({ getASetting: jest.fn() }));
jest.mock("../../vendorDeposits", () => ({
    findOpeningBalance: jest.fn(),
    sumActiveDeposits: jest.fn(),
    sumActiveDepositsByVendor: jest.fn(),
    sumDepositsInRange: jest.fn(),
}));
jest.mock("../../vendorLedgerEntries", () => ({
    ENTRY_KINDS: { creditNote: "CREDIT_NOTE", commission: "COMMISSION", costOfSales: "COST_OF_SALES", debitNote: "DEBIT_NOTE" },
    sumManualEntries: jest.fn(),
    sumManualEntriesByVendor: jest.fn(),
    sumManualEntriesInRange: jest.fn(),
    countOpenEntries: jest.fn(),
}));

const list = async filters => {
    await listVendorOrders({ vendorId: 5001, ledgerAccountIds: ["acc-1"], limit: 10, offset: 0, ...filters });
    return order.findAndCountAll.mock.calls[0][0].where;
};

// Each literal is a piece of SQL the query is held to; the plain conditions are not literals.
const sqlOf = where => where[Op.and].map(condition => condition.val);

// The shared jest setup stubs the database config without an escape function.
sequelizeConfig.escape = value => `'${value}'`;

beforeEach(() => {
    jest.clearAllMocks();
    order.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    findOpeningBalance.mockResolvedValue(null);
});

describe("listVendorOrders — the Transactions table's rows", () => {
    it("holds the orders to the vendor and the accounting floor, only services classified as vendor services, and to no status when none is picked", async () => {
        const where = await list({});

        expect(where["$serviceOperator.vendorId$"]).toBe(5001);
        expect(sqlOf(where)).toHaveLength(3);
        expect(sqlOf(where)[1]).toContain("'$.service_with_plans'");
        expect(sqlOf(where)[1]).toContain("'$.service_without_plans'");
        expect(sqlOf(where)[1]).toContain("serviceOperator.accessKey");
        Object.values(ORDER_STATUS_FILTERS).forEach(filter =>
            expect(sqlOf(where)).not.toContain(filter)
        );
    });

    it("searches the reference, the service and the customer, and the status text", async () => {
        const where = await list({ searchText: "xoxo" });

        expect(where[Op.or]).toEqual([
            { corporateTxnId: { [Op.like]: "%xoxo%" } },
            { status: { [Op.like]: "%xoxo%" } },
            { "$serviceOperator.serviceProvider$": { [Op.like]: "%xoxo%" } },
            { "$credential.username$": { [Op.like]: "%xoxo%" } },
        ]);
    });

    it("does not search when there is nothing to search for", async () => {
        const where = await list({ searchText: "" });

        expect(where[Op.or]).toBeUndefined();
    });
});

describe("listVendorOrders — the Status filter", () => {
    it("narrows to the orders the Status pill calls Success: not refunded, and the provider says success", async () => {
        const [, , , status] = sqlOf(await list({ status: "success" }));

        expect(status).toBe(ORDER_STATUS_FILTERS.success);
        expect(status).toContain("NOT (");
        expect(status).toContain("orders.status IN ('SUCCESS', 'ORDERED')");
    });

    it("narrows to the orders the pill calls Refunded: a refund on the journal, or the provider says refunded", async () => {
        const [, , , status] = sqlOf(await list({ status: "refunded" }));

        expect(status).toBe(ORDER_STATUS_FILTERS.refunded);
        expect(status).toContain("$.refund.lineItems");
        expect(status).toContain("$.adminRefund.lineItems");
        expect(status).toContain("orders.status IN ('REFUND', 'REFUNDED')");
    });

    it("narrows to the orders the pill calls Failed, and never one that came back as a refund", async () => {
        const [, , , status] = sqlOf(await list({ status: "failed" }));

        expect(status).toBe(ORDER_STATUS_FILTERS.failed);
        expect(status).toContain("NOT (");
        expect(status).toContain("orders.status IN ('FAILED', 'FAILURE')");
    });

    it("tests a refund the way the pill does, by lines on the refund event and not just a key", () => {
        expect(ORDER_STATUS_FILTERS.refunded).toContain("JSON_TYPE(JSON_EXTRACT(orders.journalData, '$.refund.lineItems')) = 'ARRAY'");
        expect(ORDER_STATUS_FILTERS.refunded).toContain("JSON_LENGTH(JSON_EXTRACT(orders.journalData, '$.refund.lineItems')) > 0");
    });

    it("ignores a status it does not know, so nothing it names ever reaches the SQL", async () => {
        for (const status of ["bogus", "constructor", "toString", "'; DROP TABLE orders; --"]) {
            order.findAndCountAll.mockClear();
            expect(sqlOf(await list({ status }))).toHaveLength(3);
        }
    });

    it("keeps the status and the search together", async () => {
        const where = await list({ status: "failed", searchText: "xoxo" });

        expect(sqlOf(where)).toHaveLength(4);
        expect(where[Op.or]).toHaveLength(4);
    });
});
