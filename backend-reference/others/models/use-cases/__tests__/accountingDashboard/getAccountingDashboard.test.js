const sequelizeConfig = require("../../../../configs/database/index");
const { getValue, setValue } = require("../../../../utils/cacheDataMethods");
const serviceOperator = require("../../../entities/serviceOperator");
const systemUser = require("../../../entities/systemUser");
const chartOfAccount = require("../../../entities/chartOfAccount");
const { getServicesTypeConfig } = require("../../accountingServices");
const { countEntriesNotInBooks, listEntriesNotInBooks } = require("../../ledgerBooks");
const {
    getAccountingDashboard,
    booksAlertOf,
    CACHE_KEY,
    CACHE_TTL_SECONDS,
    REQUIRED_ACCOUNT_NAMES,
} = require("../../accountingDashboard");
const { getInternalAccounts } = require("../../setting");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/serviceOperator", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/systemUser", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/roleAndPermissions", () => ({}));
jest.mock("../../../entities/credential", () => ({ findAll: jest.fn().mockResolvedValue([]) }));
jest.mock("../../../entities/chartOfAccount", () => ({ findAll: jest.fn(), count: jest.fn() }));
jest.mock("../../../entities/vendor", () => ({}));
jest.mock("../../setting", () => ({
    getASetting: jest.fn(),
    upsertSetting: jest.fn(),
    getInternalAccounts: jest.fn().mockResolvedValue([]),
}));
jest.mock("../../../../utils/sortHandle", () => ({ handleSortFields: jest.fn() }));
jest.mock("../../ledgerBooks", () => ({ countEntriesNotInBooks: jest.fn(), listEntriesNotInBooks: jest.fn() }));
jest.mock("../../dashboardAlertFinders", () => {
    const finder = () => jest.fn().mockResolvedValue(null);
    return {
        findJournalRecordingOff: finder(),
        findChartOfAccountsPending: finder(),
        findDriftedApprovals: finder(),
        findVendorsWithoutGstDetails: finder(),
        findPekoPackagesWithoutPricing: finder(),
        findVendorBalanceIssues: finder(),
        findPartnersOverdue: finder(),
        findGatewayShortfalls: finder(),
        findOpeningBalancesMissing: finder(),
    };
});
jest.mock("../../accountingServices", () => {
    const actual = jest.requireActual("../../accountingServices");
    return {
        getServicesTypeConfig: jest.fn(),
        isCommissionConfigured: actual.isCommissionConfigured,
    };
});

const CACHED = {
    generatedAt: "2026-09-16T08:00:00.000Z",
    sections: { today: {}, monthly: {} },
    alerts: [],
};

describe("getAccountingDashboard", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getValue.mockResolvedValue(null);
        setValue.mockResolvedValue(undefined);
        getServicesTypeConfig.mockResolvedValue({ service_with_plans: [], service_without_plans: [] });
        serviceOperator.findAll.mockResolvedValue([]);
        systemUser.findAll.mockResolvedValue([]);
        chartOfAccount.findAll.mockImplementation(query =>
            Promise.resolve(
                query.where.account_name ? REQUIRED_ACCOUNT_NAMES.map(account_name => ({ account_name })) : []
            )
        );
        chartOfAccount.count.mockResolvedValue(0);
        getInternalAccounts.mockResolvedValue([]);
        sequelizeConfig.query.mockImplementation(sql => {
            if (sql.includes("GROUP BY catalogue") || sql.includes("ORDER BY amount DESC")) return Promise.resolve([]);
            if (sql.includes(":accountScopeIds")) return Promise.resolve([{ transactionsCount: "2", totalCount: "1" }]);
            if (sql.includes("1 = 0")) return Promise.resolve([{ transactionsCount: "0", totalCount: "0" }]);
            return Promise.resolve([{ transactionsCount: "5" }]);
        });
    });

    it("lists the same figures for the internal purchase accounts beside each section", async () => {
        getInternalAccounts.mockResolvedValue([12, "15"]);

        const result = await getAccountingDashboard();

        expect(result.sections.today.transactionsCount).toBe(5);
        expect(result.sections.today.internal.transactionsCount).toBe(2);
        expect(result.sections.monthly.internal.transactionsCount).toBe(2);
        expect(result.sections.today.internal).toMatchObject({ otherSalesCount: 1, thirdPartySalesCount: 1 });
        const scoped = sequelizeConfig.query.mock.calls.filter(([sql]) => sql.includes(":accountScopeIds"));
        expect(scoped.length).toBeGreaterThanOrEqual(6);
        scoped.forEach(([, options]) => expect(options.replacements.accountScopeIds).toEqual([12, 15]));
    });

    it("shows zero for the internal purchase accounts until some are configured", async () => {
        const result = await getAccountingDashboard();

        expect(result.sections.today.internal.transactionsCount).toBe(0);
        expect(result.sections.today.internal.otherSales).toBe(0);
        expect(sequelizeConfig.query.mock.calls.some(([sql]) => sql.includes(":accountScopeIds"))).toBe(false);
    });

    it("still builds the dashboard when the internal accounts cannot be read", async () => {
        getInternalAccounts.mockRejectedValue(new Error("settings down"));

        const result = await getAccountingDashboard();

        expect(result.sections.today.transactionsCount).toBe(5);
        expect(result.sections.today.internal.transactionsCount).toBe(0);
    });

    it("serves the cached payload without touching the database", async () => {
        getValue.mockResolvedValue(JSON.stringify(CACHED));

        const result = await getAccountingDashboard({});

        expect(result).toEqual({ ...CACHED, cached: true });
        expect(getValue).toHaveBeenCalledWith(CACHE_KEY);
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
        expect(setValue).not.toHaveBeenCalled();
    });

    it("computes and caches for five minutes when the cache is empty", async () => {
        const result = await getAccountingDashboard();

        expect(result.cached).toBe(false);
        expect(result.sections.today.transactionsCount).toBe(5);
        expect(setValue).toHaveBeenCalledWith(CACHE_KEY, CACHE_TTL_SECONDS, expect.any(String));
        expect(CACHE_TTL_SECONDS).toBe(300);
        expect(JSON.parse(setValue.mock.calls[0][2])).toEqual({
            generatedAt: result.generatedAt,
            goLiveDate: null,
            goLiveConfigured: false,
            sections: result.sections,
            alerts: result.alerts,
            rankings: result.rankings,
        });
        expect(result.rankings).toEqual({ services: [], vendors: [], partners: [] });
    });

    it("bypasses the cache and rewrites it when a refresh is requested", async () => {
        getValue.mockResolvedValue(JSON.stringify(CACHED));

        const result = await getAccountingDashboard({ refresh: true });

        expect(getValue).not.toHaveBeenCalled();
        expect(result.cached).toBe(false);
        expect(result.generatedAt).not.toBe(CACHED.generatedAt);
        expect(sequelizeConfig.query).toHaveBeenCalled();
        expect(setValue).toHaveBeenCalledWith(CACHE_KEY, CACHE_TTL_SECONDS, expect.any(String));
    });

    it("falls back to a fresh computation when redis is unavailable", async () => {
        getValue.mockRejectedValue(new Error("redis down"));
        setValue.mockRejectedValue(new Error("redis down"));

        const result = await getAccountingDashboard();

        expect(result.cached).toBe(false);
        expect(sequelizeConfig.query).toHaveBeenCalled();
    });

    it("ignores a corrupt cache entry", async () => {
        getValue.mockResolvedValue("{not json");

        const result = await getAccountingDashboard();

        expect(result.cached).toBe(false);
        expect(sequelizeConfig.query).toHaveBeenCalled();
    });
});

describe("entries recorded by hand that are not in the books yet", () => {
    const BOOKS = { vendors: 2, partners: 1, gateways: 0, deleted: 1, total: 3 };

    const ENTRIES = [
        { id: 5, ledger: "vendors", entryKind: "deposit", profileId: 3, profileName: "Paytm", amount: 1000, date: "2026-10-01", deleted: false },
        { id: 2, ledger: "partners", entryKind: "payout", profileId: 100002226, profileName: null, amount: 250, date: "2026-09-30", deleted: true },
        { id: 9, ledger: "gateways", entryKind: "fee", profileId: "4521", profileName: "Razorpay", amount: 12, date: null, deleted: false },
    ];

    const ALERT = {
        type: "ledger_entries_not_in_books",
        severity: "warning",
        count: 3,
        items: [
            { label: "Deposit · Paytm", ...ENTRIES[0] },
            { label: "Payout · 100002226", ...ENTRIES[1] },
            { label: "Fee · Razorpay", ...ENTRIES[2] },
        ],
        meta: { vendors: 2, partners: 1, gateways: 0, deleted: 1 },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        setValue.mockResolvedValue(undefined);
        listEntriesNotInBooks.mockResolvedValue(ENTRIES);
    });

    it("adds the alert to a cached payload, counted and listed afresh on every read", async () => {
        getValue.mockResolvedValue(JSON.stringify(CACHED));
        countEntriesNotInBooks.mockResolvedValue(BOOKS);

        const result = await getAccountingDashboard({});

        expect(result.alerts).toEqual([ALERT]);
        expect(result.cached).toBe(true);
        expect(setValue).not.toHaveBeenCalled();
        expect(listEntriesNotInBooks).toHaveBeenCalledWith(50);
    });

    it("drops the alert once every entry is marked, and leaves the payload alone when there never was one", async () => {
        getValue.mockResolvedValue(JSON.stringify({ ...CACHED, alerts: [ALERT, { type: "approval_gate_off" }] }));
        countEntriesNotInBooks.mockResolvedValue({ ...BOOKS, vendors: 0, partners: 0, deleted: 0, total: 0 });

        expect((await getAccountingDashboard({})).alerts).toEqual([{ type: "approval_gate_off" }]);
        expect(listEntriesNotInBooks).not.toHaveBeenCalled();

        getValue.mockResolvedValue(JSON.stringify(CACHED));
        expect(await getAccountingDashboard({})).toEqual({ ...CACHED, cached: true });
    });

    it("raises nothing when the count cannot be read, and the bare count when the list cannot", async () => {
        getValue.mockResolvedValue(JSON.stringify(CACHED));
        countEntriesNotInBooks.mockRejectedValue(new Error("db"));

        expect((await getAccountingDashboard({})).alerts).toEqual([]);
        expect(booksAlertOf(null)).toBeNull();

        countEntriesNotInBooks.mockResolvedValue(BOOKS);
        listEntriesNotInBooks.mockRejectedValue(new Error("db"));
        expect((await getAccountingDashboard({})).alerts).toEqual([{ ...ALERT, items: [] }]);
    });
});
