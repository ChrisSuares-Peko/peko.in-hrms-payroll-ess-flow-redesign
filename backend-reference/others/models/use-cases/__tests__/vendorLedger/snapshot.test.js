const sequelizeConfig = require("../../../../configs/database/index");
const { getValue, setValue } = require("../../../../utils/cacheDataMethods");
const {
    findByAccountName,
    findGenericAccountByName,
    findAccountIdsByName,
    findLegacyVendorDepositAccounts,
} = require("../../chartOfAccount");
const { getASetting } = require("../../setting");
const {
    sumActiveDeposits,
    sumActiveDepositsByVendor,
    sumDepositsInRange,
    listVendorsWithOpeningBalance,
    findOpeningBalance,
} = require("../../vendorDeposits");
const {
    ENTRY_KINDS,
    sumManualEntries,
    sumManualEntriesByVendor,
    sumManualEntriesInRange,
    countOpenEntries,
} = require("../../vendorLedgerEntries");
const {
    BALANCES_CACHE_KEY,
    BALANCES_CACHE_TTL_SECONDS,
    DEFAULT_LOW_BALANCE,
    getLowBalanceThreshold,
    getVendorLedgerSummary,
    buildVendorLedgerSnapshot,
    getVendorLedgerSnapshot,
    serializeVendor,
    buildVendorKpis,
} = require("../../vendorLedger");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/vendor", () => ({ findAll: jest.fn(), findOne: jest.fn() }));
jest.mock("../../../entities/serviceOperator", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/order", () => ({ findAndCountAll: jest.fn() }));
jest.mock("../../../entities/credential", () => ({}));
jest.mock("../../../entities/vendorDeposit", () => ({}));
jest.mock("../../../entities/vendorLedgerEntry", () => ({}));
jest.mock("../../chartOfAccount", () => ({
    findByAccountName: jest.fn(),
    findGenericAccountByName: jest.fn(),
    findAccountIdsByName: jest.fn(),
    findLegacyVendorDepositAccounts: jest.fn(),
}));
jest.mock("../../setting", () => ({ getASetting: jest.fn() }));
jest.mock("../../vendorDeposits", () => ({
    sumActiveDeposits: jest.fn(),
    sumActiveDepositsByVendor: jest.fn(),
    sumDepositsInRange: jest.fn(),
    listVendorsWithOpeningBalance: jest.fn(),
    findOpeningBalance: jest.fn(),
}));
jest.mock("../../vendorLedgerEntries", () => ({
    ENTRY_KINDS: { creditNote: "CREDIT_NOTE", commission: "COMMISSION", costOfSales: "COST_OF_SALES", debitNote: "DEBIT_NOTE" },
    sumManualEntries: jest.fn(),
    sumManualEntriesByVendor: jest.fn(),
    sumManualEntriesInRange: jest.fn(),
    countOpenEntries: jest.fn(),
}));

const SHARED_ACCOUNT = "vendor-deposits-account";
const NOW = new Date("2026-09-18T08:30:00.000Z");

const VENDORS = [
    { id: 1, vendorName: "Cleartrip Private Limited" },
    { id: 2, vendorName: "Titan Mail Technologies" },
    { id: 3, vendorName: "Never Transacted Vendor" },
];

const LEGACY_ACCOUNT = "legacy-vendor-1";

const COMMISSION_ACCOUNT = "4567000000000777";

const mockSnapshotQueries = ({
    accountConfigured = true,
    legacy = [],
    reversals = [],
    manualCommissions = {},
    manualCommissionMtd = 0,
    costOfSales = {},
    costOfSalesMtd = 0,
    debitNotes = {},
    debitNotesMtd = 0,
} = {}) => {
    findGenericAccountByName.mockResolvedValue(
        accountConfigured ? { provider_account_id: SHARED_ACCOUNT } : null
    );
    findByAccountName.mockResolvedValue(null);
    findAccountIdsByName.mockResolvedValue([COMMISSION_ACCOUNT]);
    findLegacyVendorDepositAccounts.mockResolvedValue(legacy);
    sequelizeConfig.query.mockImplementation(sql => {
        if (sql.includes("FROM vendors INNER JOIN serviceOperators")) return Promise.resolve(VENDORS);
        if (sql.includes("commission * ratio")) return Promise.resolve(reversals);
        if (sql.includes("AS commission")) {
            return sql.includes("transactionDate BETWEEN")
                ? Promise.resolve([
                      { vendorId: 1, commission: "1200.0000" },
                  ])
                : Promise.resolve([
                      { vendorId: 1, commission: "9000.0000" },
                      { vendorId: 2, commission: "250.0000" },
                  ]);
        }
        if (sql.includes("transactionDate BETWEEN")) {
            return Promise.resolve([{ vendorId: 1, netAmount: "12000.0000" }]);
        }
        return Promise.resolve([
            { vendorId: 1, netAmount: "80000.0000" },
            { vendorId: 2, netAmount: "5000.0000" },
        ]);
    });
    sumActiveDepositsByVendor.mockResolvedValue({ 1: 200000, 2: 10000 });
    sumManualEntriesByVendor.mockImplementation(async kind => {
        if (kind === ENTRY_KINDS.creditNote) return { 1: 1500 };
        if (kind === ENTRY_KINDS.costOfSales) return costOfSales;
        return kind === ENTRY_KINDS.debitNote ? debitNotes : manualCommissions;
    });
    sumDepositsInRange.mockResolvedValue(425000);
    sumManualEntriesInRange.mockImplementation(async kind => {
        if (kind === ENTRY_KINDS.costOfSales) return costOfSalesMtd;
        return kind === ENTRY_KINDS.debitNote ? debitNotesMtd : manualCommissionMtd;
    });
    countOpenEntries.mockResolvedValue(4);
    listVendorsWithOpeningBalance.mockResolvedValue([]);
    findOpeningBalance.mockResolvedValue(null);
};

beforeEach(() => jest.clearAllMocks());

describe("getLowBalanceThreshold", () => {
    it("reads the settings row", async () => {
        getASetting.mockResolvedValue({ amount: 50000 });
        expect(await getLowBalanceThreshold()).toBe(50000);
    });

    it("falls back when the setting is missing or invalid", async () => {
        getASetting.mockResolvedValue(false);
        expect(await getLowBalanceThreshold()).toBe(DEFAULT_LOW_BALANCE);

        getASetting.mockResolvedValue({ amount: 0 });
        expect(await getLowBalanceThreshold()).toBe(DEFAULT_LOW_BALANCE);
    });
});

describe("buildVendorLedgerSnapshot", () => {
    beforeEach(() => mockSnapshotQueries());

    it("computes deposits plus credit notes minus journal usage per vendor", async () => {
        const snapshot = await buildVendorLedgerSnapshot(NOW);

        expect(snapshot.balances[1]).toEqual({
            deposited: 200000,
            creditNotes: 1500,
            manualCommission: 0,
            costOfSales: 0,
            debitNotes: 0,
            used: 89000,
            commission: 9000,
            available: 118500,
            openingBalanceSet: false,
        });
        expect(snapshot.balances[2]).toEqual({
            deposited: 10000,
            creditNotes: 0,
            manualCommission: 0,
            costOfSales: 0,
            debitNotes: 0,
            used: 5250,
            commission: 250,
            available: 5000,
            openingBalanceSet: false,
        });
    });

    it("keeps the balance the sum of its own cards", async () => {
        const { deposited, creditNotes, manualCommission, used, commission, available } =
            (await buildVendorLedgerSnapshot(NOW)).balances[1];

        expect(deposited + manualCommission - creditNotes - used + commission).toBe(available);
    });

    it("gives a vendor with no journal movement a zero position", async () => {
        const snapshot = await buildVendorLedgerSnapshot(NOW);

        expect(snapshot.balances[3]).toEqual({
            deposited: 0,
            creditNotes: 0,
            manualCommission: 0,
            costOfSales: 0,
            debitNotes: 0,
            used: 0,
            commission: 0,
            available: 0,
            openingBalanceSet: false,
        });
    });

    it("nets a refund's share of the commission off what was earned", async () => {
        mockSnapshotQueries({
            reversals: [{ vendorId: 1, commission: "4000.0000" }],
        });

        const snapshot = await buildVendorLedgerSnapshot(NOW);

        expect(snapshot.balances[1]).toMatchObject({
            commission: 5000,
            available: 118500,
        });
    });

    it("counts a manually recorded commission as money held with the vendor", async () => {
        mockSnapshotQueries({ manualCommissions: { 1: 236 } });

        const snapshot = await buildVendorLedgerSnapshot(NOW);

        expect(snapshot.balances[1]).toMatchObject({
            manualCommission: 236,
            commission: 9236,
            available: 118736,
        });
    });

    it("takes a cost of sales recorded by hand out of the advance, the mirror of a manual commission", async () => {
        mockSnapshotQueries({ costOfSales: { 1: 400 }, costOfSalesMtd: 400 });

        const snapshot = await buildVendorLedgerSnapshot(NOW);

        expect(snapshot.balances[1]).toMatchObject({
            costOfSales: 400,
            manualCommission: 0,
            commission: 9000,
            available: 118100,
        });
        expect(snapshot.monthly).toMatchObject({ used: 12400, commission: 1200 });
    });

    it("puts a debit note raised on the vendor back into the advance, the mirror of a cost of sales", async () => {
        mockSnapshotQueries({ costOfSales: { 1: 400 }, costOfSalesMtd: 400, debitNotes: { 1: 150 }, debitNotesMtd: 150 });

        const snapshot = await buildVendorLedgerSnapshot(NOW);

        expect(snapshot.balances[1]).toMatchObject({
            costOfSales: 400,
            debitNotes: 150,
            commission: 9000,
            available: 118250,
        });
        expect(snapshot.monthly).toMatchObject({ used: 12250, commission: 1200 });
    });

    it("marks which vendors already carry an opening balance", async () => {
        listVendorsWithOpeningBalance.mockResolvedValue([2]);

        const snapshot = await buildVendorLedgerSnapshot(NOW);

        expect(snapshot.balances[2].openingBalanceSet).toBe(true);
        expect(snapshot.balances[1].openingBalanceSet).toBe(false);
    });

    it("reports whether the shared Vendor Deposits account exists", async () => {
        expect((await buildVendorLedgerSnapshot(NOW)).vendorDepositsAccountConfigured).toBe(true);

        mockSnapshotQueries({ accountConfigured: false });
        const snapshot = await buildVendorLedgerSnapshot(NOW);
        expect(snapshot.vendorDepositsAccountConfigured).toBe(false);
        expect(snapshot.balances[1].available).toBe(198500);
    });

    it("queries the shared account together with every legacy account", async () => {
        mockSnapshotQueries({
            legacy: [{ vendorId: 1, provider_account_id: LEGACY_ACCOUNT }],
        });

        await buildVendorLedgerSnapshot(NOW);

        const movementCall = sequelizeConfig.query.mock.calls.find(([sql]) =>
            sql.includes("journalLines.accountId IN (:accountIds)")
        );
        expect(movementCall[1].replacements.accountIds).toEqual([SHARED_ACCOUNT, LEGACY_ACCOUNT]);
    });

    it("still computes usage when only the old individual accounts exist", async () => {
        mockSnapshotQueries({
            accountConfigured: false,
            legacy: [{ vendorId: 1, provider_account_id: LEGACY_ACCOUNT }],
        });

        const snapshot = await buildVendorLedgerSnapshot(NOW);

        expect(snapshot.vendorDepositsAccountConfigured).toBe(false);
        expect(snapshot.balances[1].available).toBe(118500);
    });

    it("aggregates the month to date figures in IST", async () => {
        const snapshot = await buildVendorLedgerSnapshot(NOW);

        expect(snapshot.monthly).toEqual({
            deposited: 425000,
            used: 12000,
            commission: 1200,
        });
        expect(snapshot.openCreditNotes).toBe(4);
        expect(sumDepositsInRange).toHaveBeenCalledWith(
            { from: "2026-09-01", to: "2026-09-18" },
            "9999-12-31"
        );

        const commissionCall = sequelizeConfig.query.mock.calls.find(
            ([sql]) => sql.includes("AS commission") && sql.includes("transactionDate BETWEEN")
        );
        expect(commissionCall[1].replacements).toEqual({
            accountingFloor: "9999-12-31",
            from: "2026-09-01 00:00:00",
            to: "2026-09-18 23:59:59",
            ledgerAccountIds: [SHARED_ACCOUNT, COMMISSION_ACCOUNT],
        });
    });

    it("subtracts all month-to-date commissions from the transaction amount", async () => {
        mockSnapshotQueries({ manualCommissionMtd: 50 });

        const snapshot = await buildVendorLedgerSnapshot(NOW);

        expect(snapshot.monthly).toMatchObject({
            used: 11950,
            commission: 1250,
        });
    });

    it("weighs commission against the ledger accounts but movement against deposits only", async () => {
        mockSnapshotQueries();

        await buildVendorLedgerSnapshot(new Date("2026-09-18T10:00:00.000Z"));

        const commissionCall = sequelizeConfig.query.mock.calls.find(
            ([sql]) => sql.includes("AS commission") && !sql.includes("transactionDate BETWEEN")
        );
        const movementCall = sequelizeConfig.query.mock.calls.find(([sql]) =>
            sql.includes("FROM (SELECT serviceOperators.vendorId AS vendorId, journalLines.direction")
        );

        expect(commissionCall[1].replacements.ledgerAccountIds).toEqual([
            SHARED_ACCOUNT,
            COMMISSION_ACCOUNT,
        ]);
        expect(movementCall[1].replacements.accountIds).toEqual([SHARED_ACCOUNT]);
        expect(movementCall[1].replacements.ledgerAccountIds).toBeUndefined();
    });
});

describe("getVendorLedgerSnapshot", () => {
    beforeEach(() => {
        mockSnapshotQueries();
        getValue.mockResolvedValue(null);
        setValue.mockResolvedValue(undefined);
    });

    it("serves the cached snapshot without touching the database", async () => {
        getValue.mockResolvedValue(JSON.stringify({ generatedAt: "x", balances: {}, monthly: {} }));

        const result = await getVendorLedgerSnapshot({});

        expect(result.cached).toBe(true);
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
        expect(setValue).not.toHaveBeenCalled();
    });

    it("computes and caches for five minutes when empty", async () => {
        const result = await getVendorLedgerSnapshot();

        expect(result.cached).toBe(false);
        expect(setValue).toHaveBeenCalledWith(
            BALANCES_CACHE_KEY,
            BALANCES_CACHE_TTL_SECONDS,
            expect.any(String)
        );
        expect(BALANCES_CACHE_KEY).toBe("accounting:vendor-balances:v5");
        expect(BALANCES_CACHE_TTL_SECONDS).toBe(300);
    });

    it("bypasses the cache on refresh and survives a redis outage", async () => {
        getValue.mockRejectedValue(new Error("redis down"));
        setValue.mockRejectedValue(new Error("redis down"));

        expect((await getVendorLedgerSnapshot({ refresh: true })).cached).toBe(false);
        expect(getValue).not.toHaveBeenCalled();
        expect((await getVendorLedgerSnapshot({})).cached).toBe(false);
    });
});

describe("getVendorLedgerSummary", () => {
    beforeEach(() => {
        sumActiveDeposits.mockResolvedValue(200000);
        sumManualEntries.mockImplementation(async (vendorId, kind) =>
            kind === ENTRY_KINDS.creditNote ? 1500 : 0
        );
        findOpeningBalance.mockResolvedValue(null);
        sequelizeConfig.query.mockImplementation(sql => {
            if (sql.includes("commission * ratio")) return Promise.resolve([]);
            return sql.includes("AS commission")
                ? Promise.resolve([
                      { vendorId: 1, commission: "9000.0000" },
                  ])
                : Promise.resolve([{ vendorId: 1, netAmount: "80000" }]);
        });
    });

    it("returns the standing position for one vendor", async () => {
        expect(await getVendorLedgerSummary({ id: 1 }, [SHARED_ACCOUNT])).toEqual({
            deposited: 200000,
            creditNotes: 1500,
            manualCommission: 0,
            costOfSales: 0,
            debitNotes: 0,
            used: 89000,
            commission: 9000,
            openingBalance: 0,
            totalTransaction: 90500,
            available: 118500,
            openingBalanceSet: false,
            openingBalanceAsOf: null,
        });
        expect(sequelizeConfig.query.mock.calls[0][1].replacements.vendorId).toBe(1);
    });

    it("asks for each manual kind separately", async () => {
        await getVendorLedgerSummary({ id: 1 }, [SHARED_ACCOUNT]);

        expect(sumManualEntries).toHaveBeenCalledWith(1, "CREDIT_NOTE", null, "9999-12-31");
        expect(sumManualEntries).toHaveBeenCalledWith(1, "COMMISSION", null, "9999-12-31");
        expect(sumManualEntries).toHaveBeenCalledWith(1, "COST_OF_SALES", null, "9999-12-31");
        expect(sumManualEntries).toHaveBeenCalledWith(1, "DEBIT_NOTE", null, "9999-12-31");
    });

    it("takes a debit note raised on the vendor off Total Transaction and adds it to Available, the mirror of a cost of sales", async () => {
        sumManualEntries.mockImplementation(async (vendorId, kind) => {
            if (kind === ENTRY_KINDS.creditNote) return 1500;
            if (kind === ENTRY_KINDS.costOfSales) return 400;
            return kind === ENTRY_KINDS.debitNote ? 150 : 0;
        });

        expect(await getVendorLedgerSummary({ id: 1 }, [SHARED_ACCOUNT])).toMatchObject({
            costOfSales: 400,
            debitNotes: 150,
            commission: 9000,
            totalTransaction: 90750,
            available: 118250,
        });
    });

    it("adds a cost of sales recorded by hand to Total Transaction and takes it off Available, leaving Commission earned alone", async () => {
        sumManualEntries.mockImplementation(async (vendorId, kind) => {
            if (kind === ENTRY_KINDS.creditNote) return 1500;
            return kind === ENTRY_KINDS.costOfSales ? 400 : 0;
        });

        expect(await getVendorLedgerSummary({ id: 1 }, [SHARED_ACCOUNT])).toMatchObject({
            costOfSales: 400,
            commission: 9000,
            totalTransaction: 90900,
            available: 118100,
        });
    });

    it("reports the opening balance date when the vendor has one", async () => {
        findOpeningBalance.mockResolvedValue({ id: 9, depositDate: "2026-08-19" });

        const summary = await getVendorLedgerSummary({ id: 1 }, [SHARED_ACCOUNT]);

        expect(summary.openingBalanceSet).toBe(true);
        expect(summary.openingBalanceAsOf).toBe("2026-08-19");
    });

    it("reports zero usage when the vendor has no deposit account at all", async () => {
        const summary = await getVendorLedgerSummary({ id: 3 }, []);

        expect(summary).toMatchObject({ used: 0, available: 198500 });
        expect(
            sequelizeConfig.query.mock.calls.some(([sql]) =>
                sql.includes("journalLines.accountId IN (:accountIds)")
            )
        ).toBe(false);
    });

    it("scopes all summary cards to the range and reconciles the closing balance", async () => {
        const range = { from: "2026-08-19", to: "2026-09-19" };
        sumActiveDeposits.mockImplementation(async (vendorId, scope) => {
            if (!scope) return 200000;
            return scope.to === range.to ? 10000 : 50000;
        });
        sumManualEntries.mockImplementation(async (vendorId, kind, scope) => {
            if (kind === ENTRY_KINDS.costOfSales || kind === ENTRY_KINDS.debitNote) return 0;
            if (kind === ENTRY_KINDS.commission) {
                if (scope && scope.to === range.to) return 50;
                return scope ? 2000 : 0;
            }
            if (!scope) return 1500;
            return scope.to === range.to ? 100 : 1000;
        });
        sequelizeConfig.query.mockImplementation((sql, options) => {
            const end = options && options.replacements && options.replacements.to;
            if (sql.includes("commission * ratio")) return Promise.resolve([]);
            if (sql.includes("AS commission")) {
                const period = end === range.to;
                const prior = end === "2026-08-18";
                return Promise.resolve([
                    {
                        vendorId: 1,
                        commission: period ? "300.0000" : prior ? "4000.0000" : "9000.0000",
                    },
                ]);
            }
            const period = end === range.to;
            const prior = end === "2026-08-18";
            return Promise.resolve([
                { vendorId: 1, netAmount: period ? "2000" : prior ? "10000" : "80000" },
            ]);
        });

        expect(await getVendorLedgerSummary({ id: 1 }, [SHARED_ACCOUNT], range)).toEqual({
            deposited: 10000,
            creditNotes: 100,
            manualCommission: 50,
            costOfSales: 0,
            debitNotes: 0,
            used: 2350,
            commission: 350,
            openingBalance: 41000,
            totalTransaction: 2400,
            available: 48950,
            openingBalanceSet: false,
            openingBalanceAsOf: null,
        });
        expect(sumActiveDeposits).toHaveBeenCalledWith(1, range, "9999-12-31");
        expect(sumActiveDeposits).toHaveBeenCalledWith(
            1,
            { from: "1970-01-01", to: "2026-08-18" },
            "9999-12-31"
        );
        expect(sumManualEntries).toHaveBeenCalledWith(1, "CREDIT_NOTE", range, "9999-12-31");
    });
});

describe("serializeVendor and buildVendorKpis", () => {
    it("flags a vendor below the threshold", () => {
        const row = {
            id: 1,
            vendorName: "Cleartrip Private Limited",
            type: "Travel",
            isActive: true,
            services: "Flights||Hotels",
        };
        const balance = { deposited: 10, creditNotes: 0, used: 0, available: 10 };

        expect(serializeVendor(row, balance, 25000)).toMatchObject({
            vendorName: "Cleartrip Private Limited",
            services: ["Flights", "Hotels"],
            serviceCount: 2,
            available: 10,
            lowBalance: true,
        });
    });

    it("treats a vendor with no position as zero balance", () => {
        const row = { id: 3, vendorName: "Never Transacted Vendor", isActive: true, services: null };

        expect(serializeVendor(row, undefined, 25000)).toMatchObject({
            services: [],
            serviceCount: 0,
            available: 0,
            lowBalance: true,
        });
    });

    it("builds the list metrics from the snapshot", () => {
        const snapshot = {
            balances: {
                1: { available: 121500 },
                2: { available: 5000 },
                3: { available: 0 },
            },
            monthly: { deposited: 425000, used: 318640.4, commission: 41208.75 },
            openCreditNotes: 4,
        };

        expect(buildVendorKpis(snapshot, 25000)).toEqual({
            totalVendors: 3,
            depositsHeld: 126500,
            lowBalanceVendors: 2,
            depositedThisMonth: 425000,
            usedThisMonth: 318640.4,
            commissionThisMonth: 41208.75,
            openCreditNotes: 4,
            lowBalanceThreshold: 25000,
        });
    });
});
