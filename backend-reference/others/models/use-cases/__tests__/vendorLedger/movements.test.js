const sequelizeConfig = require("../../../../configs/database/index");
const {
    findByAccountName,
    findGenericAccountByName,
    findAccountIdsByName,
    findLegacyVendorDepositAccounts,
} = require("../../chartOfAccount");
const {
    JOURNAL_KEYS,
    VENDOR_DEPOSITS_ACCOUNT,
    getVendorDepositAccounts,
    accountIdsForVendor,
    ledgerAccountIdsForVendor,
    allAccountIds,
    allLedgerAccountIds,
    vendorLedgerOrderClause,
    vendorCommissionOrderClause,
    earnsVendorCommission,
    notPrincipalMarkup,
    soldAsPrincipal,
    buildVendorMovementQuery,
    sumVendorMovements,
    buildVendorSplitQuery,
    buildVendorReversalQuery,
    buildVendorCommissionQuery,
    COMMISSION_STATUS_FILTERS,
    sumVendorSplitTotals,
    vendorAmountsFromJournal,
    orderCommission,
    isRefunded,
    refundedAmount,
    refundRatio,
    serializeTransaction,
    serializeCommission,
    listCommissionReversals,
} = require("../../vendorLedger");
const { SALE_REACHED_BOOKS } = require("../../journalPosting");

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
}));
jest.mock("../../vendorLedgerEntries", () => ({
    ENTRY_KINDS: { creditNote: "CREDIT_NOTE", commission: "COMMISSION", costOfSales: "COST_OF_SALES", debitNote: "DEBIT_NOTE" },
    sumManualEntries: jest.fn(),
    sumManualEntriesByVendor: jest.fn(),
    sumManualEntriesInRange: jest.fn(),
    countOpenEntries: jest.fn(),
}));

const SHARED_ACCOUNT = "4567000000000123";
const LEGACY_ONE = "legacy-vendor-1";
const LEGACY_TWO = "legacy-vendor-2";
const COMMISSION_ACCOUNT = "4567000000000777";

const lines = items => ({ lineItems: items });

const line = (accountId, direction, amount) => ({ accountId, direction, amount, description: "x" });

beforeEach(() => {
    jest.clearAllMocks();
    findAccountIdsByName.mockResolvedValue([COMMISSION_ACCOUNT]);
});

describe("getVendorDepositAccounts", () => {
    it("pairs the shared account with each vendor's old individual account", async () => {
        findGenericAccountByName.mockResolvedValue({ provider_account_id: SHARED_ACCOUNT });
        findLegacyVendorDepositAccounts.mockResolvedValue([
            { vendorId: 1, provider_account_id: LEGACY_ONE },
            { vendorId: 2, provider_account_id: LEGACY_TWO },
            { vendorId: 2, provider_account_id: null },
        ]);

        const accounts = await getVendorDepositAccounts();

        expect(accounts).toEqual({
            sharedAccountId: SHARED_ACCOUNT,
            legacyByVendorId: { 1: [LEGACY_ONE], 2: [LEGACY_TWO] },
            commissionAccountIds: [COMMISSION_ACCOUNT],
        });
        expect(findGenericAccountByName).toHaveBeenCalledWith("Vendor Deposits", [
            "provider_account_id",
        ]);
        expect(VENDOR_DEPOSITS_ACCOUNT).toBe("Vendor Deposits");
        expect(findByAccountName).not.toHaveBeenCalled();
    });

    it("falls back to a shared row matched on name alone", async () => {
        findGenericAccountByName.mockResolvedValue(null);
        findByAccountName.mockResolvedValue({ provider_account_id: SHARED_ACCOUNT });
        findLegacyVendorDepositAccounts.mockResolvedValue([]);

        expect((await getVendorDepositAccounts()).sharedAccountId).toBe(SHARED_ACCOUNT);
    });

    it("works when only the old individual accounts exist", async () => {
        findGenericAccountByName.mockResolvedValue(null);
        findByAccountName.mockResolvedValue(null);
        findLegacyVendorDepositAccounts.mockResolvedValue([
            { vendorId: 1, provider_account_id: LEGACY_ONE },
        ]);

        const accounts = await getVendorDepositAccounts();

        expect(accounts.sharedAccountId).toBeNull();
        expect(accountIdsForVendor(accounts, 1)).toEqual([LEGACY_ONE]);
        expect(allAccountIds(accounts)).toEqual([LEGACY_ONE]);
    });

    it("resolves the commission account by name, the way the journal resolves it", async () => {
        findGenericAccountByName.mockResolvedValue({ provider_account_id: SHARED_ACCOUNT });
        findLegacyVendorDepositAccounts.mockResolvedValue([
            { vendorId: 1, provider_account_id: LEGACY_ONE },
        ]);

        const accounts = await getVendorDepositAccounts();

        expect(findAccountIdsByName).toHaveBeenCalledWith("Commission");
        expect(ledgerAccountIdsForVendor(accounts, 1)).toEqual([
            SHARED_ACCOUNT,
            LEGACY_ONE,
            COMMISSION_ACCOUNT,
        ]);
        expect(allLedgerAccountIds(accounts)).toEqual([
            SHARED_ACCOUNT,
            LEGACY_ONE,
            COMMISSION_ACCOUNT,
        ]);
    });

    it("keeps the deposit accounts deposits only, so the balance is untouched", async () => {
        findGenericAccountByName.mockResolvedValue({ provider_account_id: SHARED_ACCOUNT });
        findLegacyVendorDepositAccounts.mockResolvedValue([]);

        const accounts = await getVendorDepositAccounts();

        expect(accountIdsForVendor(accounts, 1)).toEqual([SHARED_ACCOUNT]);
        expect(allAccountIds(accounts)).toEqual([SHARED_ACCOUNT]);
    });
});

describe("which orders are the vendor's business", () => {
    const clause = vendorLedgerOrderClause(":ledgerAccountIds");

    it("asks whether the transaction journal touched one of the ledger accounts", () => {
        expect(clause).toContain("$.transaction.lineItems");
        expect(clause).toContain("ledgerAccountLines.accountId IN (:ledgerAccountIds)");
    });

    it("admits an order sold as principal, in whole or in part, by the mode it was sold under", () => {
        expect(clause).toContain("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionMode')), CASE WHEN");
        expect(clause).toContain(
            "THEN 'MIXED' END, CONVERT(serviceOperators.commissionMode USING utf8mb4), 'MARGIN') IN ('PRINCIPAL_MARKUP', 'MIXED')"
        );
        expect(clause).not.toContain("<> 'PRINCIPAL_MARKUP'");
    });

    it("keeps an order whose journal left no lines, whatever it was sold as", () => {
        expect(clause).toContain("OR JSON_LENGTH(COALESCE(JSON_EXTRACT(orders.journalData, '$.transaction.lineItems'), JSON_ARRAY())) = 0 OR");
    });

    it("names the operator by whichever alias the query joined it under", () => {
        expect(vendorLedgerOrderClause(":ledgerAccountIds", "serviceOperator")).toContain(
            "CONVERT(serviceOperator.commissionMode USING utf8mb4)"
        );
        expect(soldAsPrincipal("so").startsWith("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionMode')), CASE WHEN")).toBe(true);
        expect(soldAsPrincipal("so").endsWith("CONVERT(so.commissionMode USING utf8mb4), 'MARGIN') IN ('PRINCIPAL_MARKUP', 'MIXED')")).toBe(true);
        expect(notPrincipalMarkup("so").endsWith("CONVERT(so.commissionMode USING utf8mb4), 'MARGIN') <> 'PRINCIPAL_MARKUP'")).toBe(true);
    });

    it("drops the account test entirely when nothing is mapped, leaving out only Peko's own sales", () => {
        const degraded = vendorLedgerOrderClause(null);

        expect(degraded).not.toContain("JSON_TABLE");
        expect(degraded).toContain("'MARGIN'");
        expect(degraded).toContain("<> 'OWN_REVENUE'");
        expect(degraded).not.toContain("<> 'PRINCIPAL_MARKUP'");
    });

    it("keeps an order sold wholly as principal off the commissions tab, where it earns nothing", () => {
        const commissions = vendorCommissionOrderClause(":ledgerAccountIds");

        expect(commissions).toContain("ledgerAccountLines.accountId IN (:ledgerAccountIds)");
        expect(commissions).toContain("= 0 AND ");
        expect(commissions).toContain("<> 'PRINCIPAL_MARKUP'");
        expect(commissions).not.toContain("IN ('PRINCIPAL_MARKUP', 'MIXED')");
        expect(vendorCommissionOrderClause(null)).toBe(notPrincipalMarkup("serviceOperators"));
        expect(buildVendorCommissionQuery({ hasLedgerAccounts: true })).toContain("<> 'PRINCIPAL_MARKUP'");
        expect(buildVendorSplitQuery({ vendorId: 1, hasLedgerAccounts: true })).toContain("IN ('PRINCIPAL_MARKUP', 'MIXED')");
    });

    it("names the table by the alias sequelize generates for the orders model", () => {
        expect(clause).toContain("orders.journalData");
    });

    // A journal the provider rejected still derived its split, and one that never ran still
    // belongs to the vendor; the tab lists both and says on the row which it is.
    it("lists every vendor order on the commissions tab whatever its journal did", () => {
        const tab = buildVendorCommissionQuery({ hasLedgerAccounts: true });

        expect(tab).not.toContain("orders.journalData IS NOT NULL");
        expect(tab).not.toContain("journalRecordStatus, '$.transaction')) = 'true'");
        expect(tab).toContain(
            "JSON_UNQUOTE(JSON_EXTRACT(orders.journalRecordStatus, '$.transaction')) AS transactionVerdict"
        );
        expect(tab).toContain("JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.transaction.reason')) AS transactionReason");
        expect(tab).toContain("CONVERT(orders.status USING utf8mb4) AS orderStatus");
        expect(tab).toContain("CONVERT(NULL USING utf8mb4) AS orderStatus");
        expect(tab).toContain("CONVERT(NULL USING utf8mb4) AS transactionVerdict");
        expect(tab).toContain("CONVERT(NULL USING utf8mb4) AS transactionReason");
    });

    it("lists every commission row until a status is picked", () => {
        const tab = buildVendorCommissionQuery({ hasLedgerAccounts: true });
        const count = buildVendorCommissionQuery({ hasLedgerAccounts: true, countOnly: true });

        expect(tab).not.toContain(") AS commissions WHERE");
        expect(count).not.toContain(") AS commissions WHERE");
    });

    it("narrows the rows and the count to the status picked, on the merged rows", () => {
        Object.entries(COMMISSION_STATUS_FILTERS).forEach(([status, filter]) => {
            const tab = buildVendorCommissionQuery({ hasLedgerAccounts: true, status });
            const count = buildVendorCommissionQuery({ hasLedgerAccounts: true, status, countOnly: true });

            expect(tab).toContain(`) AS commissions WHERE ${filter} ORDER BY entryDate DESC`);
            expect(count.endsWith(`) AS commissions WHERE ${filter}`)).toBe(true);
        });
    });

    it("ignores a status it does not know, so nothing it names ever reaches the SQL", () => {
        ["bogus", "constructor", "'; DROP TABLE orders; --"].forEach(status => {
            expect(buildVendorCommissionQuery({ hasLedgerAccounts: true, status })).not.toContain(
                ") AS commissions WHERE"
            );
        });
    });

    it("reads each status the way the Status pill does", () => {
        const { earned, refunded, active, reversal, reversed, deleted } = COMMISSION_STATUS_FILTERS;

        // An order is Earned or Refunded, never both, and a refund is a share of the commission.
        expect(earned).toContain("source = 'ORDER' AND NOT ");
        expect(earned).toContain(refunded);
        expect(refunded).toContain("source = 'ORDER'");
        expect(refunded).toContain("ROUND(refunded, 2) / ROUND(vendorPayable, 2)");
        expect(refunded).toContain("ROUND(COALESCE(commissionIncludingGST, 0), 2)");
        // A manual entry is a Reversal first, then Reversed if voided, else Active.
        expect(reversal).toBe("(source = 'MANUAL' AND entryType = 'REVERSAL' AND deletedAt IS NULL)");
        expect(reversed).toBe(
            "(source = 'MANUAL' AND entryType <> 'REVERSAL' AND status = 'VOIDED' AND deletedAt IS NULL)"
        );
        expect(active).toBe(
            "(source = 'MANUAL' AND entryType <> 'REVERSAL' AND status <> 'VOIDED' AND deletedAt IS NULL)"
        );
        expect(deleted).toBe("(source = 'MANUAL' AND deletedAt IS NOT NULL)");
    });

    it("keeps the search and the status together", () => {
        const tab = buildVendorCommissionQuery({ hasLedgerAccounts: true, searchText: "xoxo", status: "earned" });

        expect(tab).toContain("orders.corporateTxnId LIKE :searchText");
        expect(tab).toContain("vendorLedgerEntries.reference LIKE :searchText");
        expect(tab).toContain(") AS commissions WHERE (source = 'ORDER' AND NOT ");
    });

    it("guards the commission aggregate and the commissions tab, but not the manual entries", () => {
        const split = buildVendorSplitQuery({ vendorId: 1, hasLedgerAccounts: true });
        const tab = buildVendorCommissionQuery({ hasLedgerAccounts: true });

        const needle = "ledgerAccountLines.accountId IN (:ledgerAccountIds)";

        expect(split).toContain(needle);
        // Once, on the orders arm. The manual entries are rows, not journal lines.
        expect(tab.split(needle)).toHaveLength(2);
        expect(tab.slice(tab.indexOf("vendorLedgerEntries.kind"))).not.toContain(needle);
    });

    it("leaves the balance and the statement reading deposit accounts only", () => {
        expect(buildVendorMovementQuery({ vendorId: 1 })).not.toContain("ledgerAccountIds");
        expect(buildVendorReversalQuery({ vendorId: 1 })).not.toContain("ledgerAccountIds");
    });

    it("reads the commission rule off a journal already in hand", () => {
        const ids = [SHARED_ACCOUNT, COMMISSION_ACCOUNT];
        const markup = {
            commissionMode: "PRINCIPAL_MARKUP",
            transaction: { lineItems: [line("sales-account", "credit", 982)] },
        };
        const feeOnly = {
            commissionMode: "MARGIN",
            transaction: { lineItems: [line(COMMISSION_ACCOUNT, "credit", 85)] },
        };
        const normal = {
            commissionMode: "MARGIN",
            transaction: { lineItems: [line(SHARED_ACCOUNT, "credit", 941)] },
        };

        expect(earnsVendorCommission(markup, ids)).toBe(false);
        expect(earnsVendorCommission(feeOnly, ids)).toBe(true);
        expect(earnsVendorCommission(normal, ids)).toBe(true);
    });

    it("falls back to the mode in js too, including when no account is mapped", () => {
        const ids = [SHARED_ACCOUNT, COMMISSION_ACCOUNT];

        expect(earnsVendorCommission({ commissionMode: "PRINCIPAL_MARKUP" }, ids)).toBe(false);
        expect(earnsVendorCommission({ commissionMode: "MARGIN" }, ids)).toBe(true);
        expect(earnsVendorCommission({}, ids)).toBe(true);
        expect(earnsVendorCommission({}, ids, "PRINCIPAL_MARKUP")).toBe(false);
        expect(earnsVendorCommission(null, ids, "MARGIN")).toBe(true);
        expect(earnsVendorCommission({ commissionMode: "MARGIN" }, ids, "PRINCIPAL_MARKUP")).toBe(true);
        expect(earnsVendorCommission(null, ids)).toBe(true);
        expect(earnsVendorCommission({ principalSalesPayable: 900 }, ids, "MARGIN")).toBe(false);
        expect(earnsVendorCommission({ vendorPayable: 900 }, ids, "PRINCIPAL_MARKUP")).toBe(true);
        expect(
            earnsVendorCommission(
                { commissionMode: "PRINCIPAL_MARKUP", transaction: { lineItems: [line(SHARED_ACCOUNT, "credit", 1)] } },
                []
            )
        ).toBe(false);
    });
});

describe("accountIdsForVendor and allAccountIds", () => {
    const accounts = {
        sharedAccountId: SHARED_ACCOUNT,
        legacyByVendorId: { 1: [LEGACY_ONE], 2: [LEGACY_TWO] },
    };

    it("gives a vendor the shared account plus only its own legacy account", () => {
        expect(accountIdsForVendor(accounts, 1)).toEqual([SHARED_ACCOUNT, LEGACY_ONE]);
        expect(accountIdsForVendor(accounts, 2)).toEqual([SHARED_ACCOUNT, LEGACY_TWO]);
        expect(accountIdsForVendor(accounts, 3)).toEqual([SHARED_ACCOUNT]);
    });

    it("collects every account for the snapshot query", () => {
        expect(allAccountIds(accounts)).toEqual([SHARED_ACCOUNT, LEGACY_ONE, LEGACY_TWO]);
        expect(allAccountIds({ sharedAccountId: null, legacyByVendorId: {} })).toEqual([]);
    });
});

describe("buildVendorMovementQuery", () => {
    it("attributes every journal event to the vendor behind the order", () => {
        const sql = buildVendorMovementQuery({});

        expect(JOURNAL_KEYS).toEqual([
            "transaction",
            "refund",
            "adminRefund",
            "cashback",
            "cashbackReversal",
        ]);
        JOURNAL_KEYS.forEach(key => {
            expect(sql).toContain(`'$.${key}.lineItems'`);
        });
        expect(sql.match(/UNION ALL/g)).toHaveLength(JOURNAL_KEYS.length - 1);
        expect(sql).toContain(
            "INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId"
        );
        expect(sql).toContain("CROSS JOIN JSON_TABLE(");
        expect(sql).toContain("journalLines.accountId IN (:accountIds)");
        expect(sql).toContain("GROUP BY vendorId");
        expect(sql).toContain("SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END)");
    });

    it("ignores orders that carry no vendor", () => {
        expect(buildVendorMovementQuery({})).toContain("serviceOperators.vendorId IS NOT NULL");
    });

    it("adds the range and the single vendor filter only when asked", () => {
        expect(buildVendorMovementQuery({})).not.toContain("transactionDate BETWEEN");
        expect(buildVendorMovementQuery({})).not.toContain("serviceOperators.vendorId = :vendorId");

        const scoped = buildVendorMovementQuery({ range: { from: "a", to: "b" }, vendorId: 1 });
        expect(scoped.match(/orders.transactionDate BETWEEN :from AND :to/g)).toHaveLength(
            JOURNAL_KEYS.length
        );
        expect(scoped.match(/serviceOperators.vendorId = :vendorId/g)).toHaveLength(
            JOURNAL_KEYS.length
        );
    });

    it("leaves every sale on a markup basis out of the advance and reads only the lines that reached the deposit accounts", () => {
        const sql = buildVendorMovementQuery({});

        expect(sql).not.toContain("principalSalesPayable')) AS DECIMAL(16, 4)), 0) > 0");
        expect(sql).not.toContain("'$.journalAccountIds.sales'");
        expect(sql.match(/journalLines\.accountId IN \(:accountIds\)/g)).toHaveLength(JOURNAL_KEYS.length);
        expect(sql.match(/NOT IN \('AGENT_MARKUP', 'PRINCIPAL_MARKUP'\)/g)).toHaveLength(JOURNAL_KEYS.length);
        expect(sql).toContain("= 'AGENT_MARKUP' THEN 'AGENT_MARKUP' ELSE COALESCE(");
    });
});

describe("sumVendorMovements", () => {
    it("returns a net movement per vendor", async () => {
        sequelizeConfig.query.mockResolvedValue([
            { vendorId: 1, netAmount: "1250.5000" },
            { vendorId: 2, netAmount: "-40.0000" },
        ]);

        expect(await sumVendorMovements({ accountIds: [SHARED_ACCOUNT, LEGACY_ONE] })).toEqual({
            1: 1250.5,
            2: -40,
        });
        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({
            accountIds: [SHARED_ACCOUNT, LEGACY_ONE],
        });
    });

    it("passes the range and vendor as replacements", async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        await sumVendorMovements({
            accountIds: [SHARED_ACCOUNT],
            range: { from: "2026-09-01 00:00:00", to: "2026-09-18 23:59:59" },
            vendorId: 7,
        });

        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({
            accountIds: [SHARED_ACCOUNT],
            from: "2026-09-01 00:00:00",
            to: "2026-09-18 23:59:59",
            vendorId: 7,
        });
    });

    it("skips the query when there is no deposit account at all", async () => {
        expect(await sumVendorMovements({ accountIds: [] })).toEqual({});
        expect(await sumVendorMovements({ accountIds: null })).toEqual({});
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });
});

describe("buildVendorSplitQuery", () => {
    it("sums the vendor side of the split from the top level fields", () => {
        const sql = buildVendorSplitQuery({});

        expect(sql).toContain("'$.commissionIncludingGST'");
        expect(sql).toContain(
            "INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId"
        );
        expect(sql).toContain("GROUP BY serviceOperators.vendorId");
    });

    // A refunded order still earned its commission on the day it was placed; the reversal
    // is counted by its own query, on the day the refund posted. A journal the provider
    // rejected still derived its split, so it counts the same as one that posted; a skipped
    // or never recorded one moves nothing.
    it("counts every order whose sale entry reached the books, refunded or not", () => {
        const sql = buildVendorSplitQuery({});

        expect(sql).toContain(SALE_REACHED_BOOKS);
        expect(sql).not.toContain("'$.refund'");
    });

    it("adds the range and the single vendor filter only when asked", () => {
        expect(buildVendorSplitQuery({})).not.toContain("transactionDate BETWEEN");
        expect(buildVendorSplitQuery({})).not.toContain("serviceOperators.vendorId = :vendorId");

        const scoped = buildVendorSplitQuery({ range: { from: "a", to: "b" }, vendorId: 4 });
        expect(scoped).toContain("orders.transactionDate BETWEEN :from AND :to");
        expect(scoped).toContain("serviceOperators.vendorId = :vendorId");
    });
});

describe("buildVendorReversalQuery", () => {
    it("shares out the commission by how much of the receivable came back", () => {
        const sql = buildVendorReversalQuery({});

        expect(sql).toContain("journalLines.amount / CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.vendorPayable')) AS DECIMAL(16, 4)) AS ratio");
        expect(sql).toContain("SUM(commission * ratio)");
        expect(sql).toContain("journalLines.direction = 'debit'");
        expect(sql).toContain("journalLines.accountId IN (:accountIds)");
    });

    it("reads both kinds of refund and nothing else", () => {
        const sql = buildVendorReversalQuery({});

        expect(sql).toContain("'$.refund.lineItems'");
        expect(sql).toContain("'$.adminRefund.lineItems'");
        expect(sql).not.toContain("'$.transaction.lineItems'");
        expect(sql).not.toContain("'$.cashback.lineItems'");
        expect(sql.match(/UNION ALL/g)).toHaveLength(1);
    });

    it("dates a reversal by the refund's own journal date, or the order's when it has none", () => {
        const sql = buildVendorReversalQuery({ range: { from: "a", to: "b" } });

        expect(sql).toContain(
            "COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.refund.journalDate')) AS DATE), DATE(orders.transactionDate)) BETWEEN :from AND :to"
        );
        expect(sql).not.toContain("orders.transactionDate BETWEEN");
    });

    it("skips an order nothing ever reached, so the share cannot divide by zero", () => {
        expect(buildVendorReversalQuery({})).toContain(
            "CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.vendorPayable')) AS DECIMAL(16, 4)) > 0"
        );
    });
});

describe("sumVendorSplitTotals", () => {
    const splitRows = [
        { vendorId: 1, commission: "10.8000" },
        { vendorId: 2, commission: "4.0000" },
    ];

    it("returns the commission per vendor", async () => {
        sequelizeConfig.query.mockResolvedValue(splitRows);

        expect(await sumVendorSplitTotals({})).toEqual({
            1: { commission: 10.8 },
            2: { commission: 4 },
        });
    });

    it("runs no reversal query without a deposit account to read", async () => {
        sequelizeConfig.query.mockResolvedValue(splitRows);

        await sumVendorSplitTotals({});
        await sumVendorSplitTotals({ accountIds: [] });

        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
    });

    it("nets the reversed share off the commission it was earned on", async () => {
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("commission * ratio")
                    ? [{ vendorId: 1, commission: "5.4000" }]
                    : splitRows
            )
        );

        expect(await sumVendorSplitTotals({ accountIds: [SHARED_ACCOUNT] })).toEqual({
            1: { commission: 5.4 },
            2: { commission: 4 },
        });
    });

    it("still reports a vendor whose only movement in the period was a reversal", async () => {
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("commission * ratio")
                    ? [{ vendorId: 9, commission: "10.0000" }]
                    : []
            )
        );

        expect(await sumVendorSplitTotals({ accountIds: [SHARED_ACCOUNT] })).toEqual({
            9: { commission: -10 },
        });
    });

    it("passes the range and vendor as replacements", async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        await sumVendorSplitTotals({
            range: { from: "2026-09-01 00:00:00", to: "2026-09-18 23:59:59" },
            vendorId: 7,
        });

        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({
            accountingFloor: null,
            from: "2026-09-01 00:00:00",
            to: "2026-09-18 23:59:59",
            vendorId: 7,
        });
    });

    it("floors every vendor by the later of its own opening and the go-live date", async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        await sumVendorSplitTotals({ accountingFloor: "2026-09-30" });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("openingFloor");
        expect(sql).toContain("GREATEST(COALESCE(openingFloor.floorDate, :accountingFloor)");
        expect(options.replacements.accountingFloor).toBe("2026-09-30");
    });
});

describe("refund helpers", () => {
    const refunded = {
        vendorPayable: 941,
        commissionIncludingGST: 59,
        transaction: lines([line(SHARED_ACCOUNT, "credit", 941)]),
        adminRefund: lines([line(SHARED_ACCOUNT, "debit", 470.5)]),
    };

    it("spots a refund only when the event actually posted lines", () => {
        expect(isRefunded(refunded)).toBe(true);
        expect(isRefunded({ refund: lines([line(SHARED_ACCOUNT, "debit", 10)]) })).toBe(true);
        expect(isRefunded({ refund: { skipped: true, reason: "disabled" } })).toBe(false);
        expect(isRefunded({ refund: lines([]) })).toBe(false);
        expect(isRefunded({ transaction: lines([line(SHARED_ACCOUNT, "credit", 10)]) })).toBe(false);
        expect(isRefunded(null)).toBe(false);
    });

    it("counts only debits against this vendor's own deposit accounts", () => {
        expect(refundedAmount(refunded, [SHARED_ACCOUNT])).toBe(470.5);
        expect(refundedAmount(refunded, [LEGACY_ONE])).toBe(0);
        expect(refundedAmount(refunded, [])).toBe(0);
    });

    it("turns the refunded amount into the share of the order that came back", () => {
        expect(refundRatio(refunded, [SHARED_ACCOUNT])).toBeCloseTo(0.5, 6);
        expect(refundRatio({ ...refunded, vendorPayable: 0 }, [SHARED_ACCOUNT])).toBe(0);
        expect(refundRatio({ vendorPayable: 941 }, [SHARED_ACCOUNT])).toBe(0);
    });
});

describe("vendorAmountsFromJournal", () => {
    it("builds the vendor amount the vendor is concerned with", () => {
        expect(
            vendorAmountsFromJournal({
                vendorPayable: "351.00",
                commissionIncludingGST: "10.80",
            })
        ).toEqual({
            vendorAmount: 361.8,
            commission: 10.8,
            markup: null,
            receivable: 351,
        });
    });

    it("adds the vendor's price on the principal items of a mixed order, and shows Peko's markup on them", () => {
        expect(
            vendorAmountsFromJournal({
                totalTransactionAmount: 1059,
                platformFeeIncludingGST: 59,
                principalSalesPayable: 452,
                principalCommissionExcludingGST: 100,
                outputGSTonPrincipalCommission: 18,
                vendorPayable: 300,
                commissionIncludingGST: 59,
            })
        ).toEqual({ vendorAmount: 811, commission: 59, markup: 100, receivable: 300 });
    });

    it("lists an order sold wholly as principal at the vendor's price, with the markup beside it and the margin columns blank", () => {
        expect(
            vendorAmountsFromJournal({
                totalTransactionAmount: 1059,
                platformFeeIncludingGST: 59,
                principalSalesPayable: 882,
                principalCommissionExcludingGST: 100,
                outputGSTonPrincipalCommission: 18,
                vendorPayable: 0,
                commissionIncludingGST: 0,
            })
        ).toEqual({ vendorAmount: 882, commission: null, markup: 100, receivable: null });
    });

    it("reads an older principal sale that kept its markup as commission before GST, and draws no payable on the advance", () => {
        expect(
            vendorAmountsFromJournal({
                commissionMode: "PRINCIPAL_MARKUP",
                vendorPayable: 882,
                commissionExcludingGST: 100,
                commissionIncludingGST: 118,
            })
        ).toEqual({ vendorAmount: 882, commission: null, markup: 100, receivable: null });
    });

    it("reads a margin-shaped order of a service set to agent markup as an agent markup: vendor price, markup before GST, no payable", () => {
        const journal = { vendorPayable: 900, commissionExcludingGST: 100, commissionIncludingGST: 118 };

        expect(vendorAmountsFromJournal(journal, "AGENT_MARKUP")).toEqual({
            vendorAmount: 900,
            commission: null,
            markup: 100,
            receivable: null,
        });
        expect(vendorAmountsFromJournal(journal, "MARGIN")).toEqual({
            vendorAmount: 1018,
            commission: 118,
            markup: null,
            receivable: 900,
        });
    });

    it("reads the mode off the order's own breakdown before the service's setting, as the SQL does", () => {
        const margin = { vendorPayable: 882, commissionIncludingGST: 118 };
        expect(vendorAmountsFromJournal(margin, "PRINCIPAL_MARKUP")).toMatchObject({
            vendorAmount: 1000,
            markup: null,
            receivable: 882,
        });

        const principal = { principalSalesPayable: 882, principalCommissionExcludingGST: 100, outputGSTonPrincipalCommission: 18 };
        expect(vendorAmountsFromJournal(principal, "MARGIN")).toMatchObject({
            vendorAmount: 882,
            markup: 100,
            receivable: null,
        });
    });

    it("reports the split even when nothing reached the deposit account", () => {
        expect(
            vendorAmountsFromJournal({
                vendorPayable: 900,
                commissionIncludingGST: 0,
                transaction: lines([line("sales", "credit", 900)]),
            })
        ).toMatchObject({ vendorAmount: 900, receivable: 900, commission: 0 });
    });

    it("has nothing to show for a subscription order or a missing journal", () => {
        expect(vendorAmountsFromJournal({ netSubscriptionIncome: 499 })).toEqual({
            vendorAmount: null,
            commission: null,
            markup: null,
            receivable: null,
        });
        expect(vendorAmountsFromJournal(null)).toMatchObject({ vendorAmount: null, markup: null });
    });

    it("ignores the posted line items entirely", () => {
        const journalData = {
            vendorPayable: 351,
            commissionIncludingGST: 10.8,
            transaction: lines([line(SHARED_ACCOUNT, "credit", 351)]),
            refund: lines([line(SHARED_ACCOUNT, "debit", 351)]),
        };

        expect(vendorAmountsFromJournal(journalData)).toMatchObject({
            vendorAmount: 361.8,
            receivable: 351,
        });
    });
});

describe("commission helpers", () => {
    it("reads both commission figures and defaults to zero", () => {
        expect(orderCommission({ commissionExcludingGST: "84.75", commissionIncludingGST: 100 })).toEqual({
            excludingGST: 84.75,
            includingGST: 100,
        });
        expect(orderCommission(null)).toEqual({ excludingGST: 0, includingGST: 0 });
    });
});

describe("row serialisers", () => {
    const row = {
        id: 7,
        corporateTxnId: "1789647165639",
        transactionDate: "2026-09-17T12:13:00.000Z",
        amountInINR: "399.0000",
        status: "SUCCESS",
        paymentMode: "PAYMENT GATEWAY",
        journalData: {
            vendorPayable: "351.00",
            commissionExcludingGST: "9.15",
            commissionIncludingGST: "10.80",
            transaction: lines([line(SHARED_ACCOUNT, "credit", 351)]),
        },
        journalRecordStatus: { transaction: true },
        serviceOperator: { serviceProvider: "FASTag Recharge" },
        credential: { username: "100001266" },
    };

    const commissionRow = {
        source: "ORDER",
        id: 7,
        reference: "1789647165639",
        entryDate: "2026-09-17",
        service: "FASTag Recharge",
        reason: null,
        status: null,
        entryType: null,
        recordedByName: null,
        vendorPayable: "351.0000",
        commissionExcludingGST: "9.1500",
        commissionIncludingGST: "10.8000",
        refunded: "0.0000",
        orderStatus: "SUCCESS",
        transactionVerdict: "true",
    };

    it("breaks the order into the parts the vendor is concerned with", () => {
        expect(serializeTransaction(row)).toEqual({
            id: 7,
            corporateTxnId: "1789647165639",
            transactionDate: "2026-09-17T12:13:00.000Z",
            service: "FASTag Recharge",
            customer: "100001266",
            vendorAmount: 361.8,
            commission: 10.8,
            markup: null,
            receivable: 351,
            commissionMode: "MARGIN",
            status: "SUCCESS",
            refunded: false,
            paymentMode: "PAYMENT GATEWAY",
            posting: { state: "posted", note: null, detail: null },
        });
    });

    it("tags an order by how it was sold, reading agent markup off the service when the journal is margin-shaped", () => {
        const agent = { ...row, serviceOperator: { serviceProvider: "Hotels", commissionMode: "AGENT_MARKUP" } };
        expect(serializeTransaction(agent)).toMatchObject({
            commissionMode: "AGENT_MARKUP",
            vendorAmount: 351,
            commission: null,
            markup: 9.15,
            receivable: null,
        });
        expect(serializeTransaction({ ...row, journalRecordStatus: null, serviceOperator: agent.serviceOperator })).toMatchObject({
            commissionMode: "AGENT_MARKUP",
            vendorAmount: null,
        });
    });

    it("lists an order sold wholly as principal with the vendor's price and the markup, by the order's own breakdown", () => {
        const principal = {
            ...row,
            journalData: {
                principalSalesPayable: 882,
                principalCommissionExcludingGST: 100,
                outputGSTonPrincipalCommission: 18,
                vendorPayable: 0,
                commissionIncludingGST: 0,
                transaction: lines([line("sales-account", "credit", 982)]),
            },
        };
        expect(serializeTransaction(principal)).toMatchObject({
            commissionMode: "PRINCIPAL_MARKUP",
            vendorAmount: 882,
            commission: null,
            markup: 100,
            receivable: null,
        });

        const declared = {
            ...row,
            journalData: { ...row.journalData, commissionMode: "PRINCIPAL_MARKUP", commissionExcludingGST: 9.15 },
            serviceOperator: { serviceProvider: "Gift Cards", commissionMode: "PRINCIPAL_MARKUP" },
        };
        expect(serializeTransaction(declared)).toMatchObject({
            commissionMode: "PRINCIPAL_MARKUP",
            vendorAmount: 351,
            markup: 9.15,
            commission: null,
            receivable: null,
        });
    });

    it("dashes every amount when the sale entry was skipped or never recorded, and keeps them when the books refused it", () => {
        const dashed = { vendorAmount: null, commission: null, markup: null, receivable: null };
        expect(serializeTransaction({ ...row, journalRecordStatus: null })).toMatchObject({
            ...dashed,
            posting: { state: "notPosted", note: "Not recorded yet", detail: null },
        });
        expect(
            serializeTransaction({
                ...row,
                journalRecordStatus: { transaction: false },
                journalData: { ...row.journalData, transaction: { skipped: true, reason: "disabled" } },
            })
        ).toMatchObject(dashed);
        expect(serializeTransaction({ ...row, journalRecordStatus: { transaction: false } })).toMatchObject({
            vendorAmount: 361.8,
            commission: 10.8,
            receivable: 351,
        });
    });

    it("says an order is posted only once its sale and its refund both reached the books", () => {
        const posted = { ...row, journalRecordStatus: { transaction: true } };
        expect(serializeTransaction(posted).posting).toEqual({ state: "posted", note: null, detail: null });

        const refundRefused = {
            ...row,
            status: "REFUNDED",
            journalRecordStatus: { transaction: true, refund: false },
            journalData: { ...row.journalData, refund: { reason: "Account not found" } },
        };
        expect(serializeTransaction(refundRefused).posting).toEqual({
            state: "notPosted",
            note: "Refund: Books refused it",
            detail: "Account not found",
        });
    });

    it("reads Refunded off the journal rather than the status the provider left", () => {
        const reversed = {
            ...row,
            status: "FAILED",
            journalData: { ...row.journalData, refund: lines([line(SHARED_ACCOUNT, "debit", 351)]) },
        };

        expect(serializeTransaction(reversed)).toMatchObject({ status: "FAILED", refunded: true });
    });

    it("never exposes what the customer paid", () => {
        expect(Object.values(serializeTransaction(row))).not.toContain(399);
        expect(serializeCommission(commissionRow).orderAmount).toBe(361.8);
    });

    it("counts the vendor's price on the principal items into a mixed order's value on the commissions tab", () => {
        expect(serializeCommission({ ...commissionRow, principalSalesPayable: "452.0000" }).orderAmount).toBe(813.8);
    });

    it("shows the markup of the principal items beside the commission of the margin items on a mixed order", () => {
        const mixed = serializeCommission({
            ...commissionRow,
            principalSalesPayable: "452.0000",
            principalCommissionExcludingGST: "40.0000",
            outputGSTonPrincipalCommission: "7.2000",
        });

        expect(mixed).toMatchObject({ commissionIncludingGST: 10.8, principalMarkup: 40, orderAmount: 813.8 });
        expect(serializeCommission(commissionRow).principalMarkup).toBeNull();
        expect(serializeCommission({ source: "MANUAL", reference: "R1", commissionIncludingGST: 50 }).principalMarkup).toBeNull();
        expect(serializeCommission({ source: "MANUAL", reference: "R1", entryNumber: "COM-000002" }).entryNumber).toBe("COM-000002");
        expect(serializeCommission({ ...commissionRow, entryNumber: "COM-000002" }).entryNumber).toBeNull();
        expect(serializeCommission({ source: "MANUAL", reference: "R1", commissionIncludingGST: 50 }).commissionGST).toBeNull();
        expect(
            serializeCommission({ source: "MANUAL", reference: "R2", commissionIncludingGST: 118, commissionExcludingGST: 100, gstAmount: "18.0000" })
                .commissionGST
        ).toBe(18);
    });

    it("reports both commission figures with nothing reversed", () => {
        expect(serializeCommission(commissionRow)).toEqual({
            id: 7,
            source: "ORDER",
            entryNumber: null,
            corporateTxnId: "1789647165639",
            reference: null,
            transactionDate: "2026-09-17",
            service: "FASTag Recharge",
            reason: null,
            againstCorporateTxnId: null,
            orderAmount: 361.8,
            commissionExcludingGST: 9.15,
            commissionIncludingGST: 10.8,
            commissionGST: 1.65,
            principalMarkup: null,
            commissionReversed: 0,
            commissionNet: 10.8,
            refunded: false,
            posting: { state: "posted", note: null, detail: null },
            status: null,
            entryType: null,
            recordedByName: null,
            ipAddress: null,
            hasDocument: false,
        });
    });

    it("dashes every commission figure on an order the journal never derived a split for", () => {
        const bare = serializeCommission({
            ...commissionRow,
            vendorPayable: null,
            commissionExcludingGST: null,
            commissionIncludingGST: null,
            transactionVerdict: "false",
        });

        expect(bare).toMatchObject({
            orderAmount: null,
            commissionExcludingGST: null,
            commissionIncludingGST: null,
            commissionReversed: null,
            commissionNet: null,
            refunded: false,
            posting: { state: "notPosted", note: "Books refused it", detail: null },
        });
    });

    it("dashes every commission figure when the sale entry was skipped or never recorded", () => {
        const dashed = { orderAmount: null, commissionExcludingGST: null, commissionIncludingGST: null, commissionReversed: null, commissionNet: null };
        expect(serializeCommission({ ...commissionRow, transactionVerdict: "false", transactionSkipped: "true" })).toMatchObject(dashed);
        expect(serializeCommission({ ...commissionRow, transactionVerdict: null })).toMatchObject(dashed);
        expect(serializeCommission({ ...commissionRow, transactionVerdict: "false" }).commissionIncludingGST).toBe(10.8);
    });

    it("gives each commission row its sale entry's posting, and none to a failed order or a manual entry", () => {
        expect(
            serializeCommission({ ...commissionRow, orderStatus: "FAILED", transactionVerdict: null }).posting
        ).toEqual({ state: "notApplicable", note: null, detail: null });
        expect(
            serializeCommission({
                ...commissionRow,
                transactionVerdict: "false",
                transactionSkipped: "true",
                transactionReason: "Journal recording is currently paused",
            }).posting
        ).toEqual({
            state: "notPosted",
            note: "Recording paused",
            detail: "Journal recording is currently paused",
        });
        expect(
            serializeCommission({ ...commissionRow, source: "MANUAL", transactionVerdict: null }).posting
        ).toEqual({ state: "notApplicable", note: null, detail: null });
    });

    it("offers a tax invoice only when the gateway actually raised one", () => {
        expect(serializeCommission({ ...commissionRow, hasDocument: 1 }).hasDocument).toBe(true);
        expect(serializeCommission({ ...commissionRow, hasDocument: 0 }).hasDocument).toBe(false);
        expect(serializeCommission(commissionRow).hasDocument).toBe(false);
    });

    it("reverses the commission in proportion to what came back", () => {
        expect(
            serializeCommission({ ...commissionRow, refunded: "175.5000" })
        ).toMatchObject({ commissionReversed: 5.4, commissionNet: 5.4, refunded: true });

        expect(
            serializeCommission({ ...commissionRow, refunded: "351.0000" })
        ).toMatchObject({ commissionReversed: 10.8, commissionNet: 0 });
    });

    it("shapes a manually recorded commission as its own row", () => {
        expect(
            serializeCommission({
                source: "MANUAL",
                id: 12,
                reference: "CM-14",
                entryDate: "2026-09-19",
                service: null,
                reason: "Annual rebate",
                againstOrder: "1789647165639",
                status: "OPEN",
                entryType: "ENTRY",
                recordedByName: "Ibrahim",
                vendorPayable: 0,
                commissionExcludingGST: "236.0000",
                commissionIncludingGST: "236.0000",
                refunded: 0,
            })
        ).toMatchObject({
            source: "MANUAL",
            corporateTxnId: null,
            reference: "CM-14",
            orderAmount: null,
            commissionIncludingGST: 236,
            commissionReversed: 0,
            commissionNet: 236,
            reason: "Annual rebate",
            againstCorporateTxnId: "1789647165639",
            recordedByName: "Ibrahim",
        });
    });
});

describe("commission taken back on a refund", () => {
    it("carries the refund entry's own posting status", async () => {
        sequelizeConfig.query.mockResolvedValueOnce([
            {
                eventKey: "adminRefund",
                reference: "TXN-9",
                issueDate: "2026-09-20",
                service: "Flights",
                ratio: "1",
                commission: "59.0000",
                eventVerdict: "false",
                eventSkipped: "true",
                eventReason: "Transaction journal has not been recorded successfully yet",
                hasDocument: 0,
            },
        ]);

        const [reversal] = await listCommissionReversals({ vendorId: 1, accountIds: ["shared-account"], range: null });

        expect(sequelizeConfig.query.mock.calls[0][0]).toContain(
            "JSON_UNQUOTE(JSON_EXTRACT(orders.journalRecordStatus, '$.adminRefund')) AS eventVerdict"
        );
        expect(reversal).toMatchObject({
            reference: "TXN-9",
            amount: 59,
            posting: {
                state: "notPosted",
                note: "Waiting for the sale entry",
                detail: "Transaction journal has not been recorded successfully yet",
            },
        });
    });
});

describe("entries that never reached the books", () => {
    it("counts no line of a skipped or never recorded entry", () => {
        [
            [buildVendorMovementQuery({}), ["transaction", "refund"]],
            [buildVendorReversalQuery({}), ["refund", "adminRefund"]],
        ].forEach(([sql, keys]) => {
            keys.forEach(key => {
                expect(sql).toContain(`JSON_EXTRACT(orders.journalRecordStatus, '$.${key}')) = 'true'`);
                expect(sql).toContain(`JSON_EXTRACT(orders.journalData, '$.${key}.skipped')), 'false') <> 'true'`);
            });
        });
    });
});

describe("refunds on the commission tab that never reached the books", () => {
    it("counts no line of a skipped or never recorded entry", () => {
        [buildVendorCommissionQuery({ hasLedgerAccounts: true })].forEach(sql => {
            ["refund","adminRefund"].forEach(key => {
                expect(sql).toContain(`JSON_EXTRACT(orders.journalRecordStatus, '$.${key}')) = 'true'`);
                expect(sql).toContain(`JSON_EXTRACT(orders.journalData, '$.${key}.skipped')), 'false') <> 'true'`);
            });
        });
    });
});

describe("a hand-recorded commission's GST split on the Commissions tab", () => {
    const { buildVendorCommissionQuery } = require("../../vendorLedger");

    it("reads the taxable value as the figure before GST, falling back to the amount on an older entry", () => {
        const sql = buildVendorCommissionQuery({ hasLedgerAccounts: true });

        expect(sql).toContain(
            "COALESCE(vendorLedgerEntries.taxableAmount, vendorLedgerEntries.amount) AS commissionExcludingGST"
        );
        expect(sql).toContain("vendorLedgerEntries.gstAmount AS gstAmount");
        expect(sql).toContain("NULL AS gstAmount");
    });

    it("hands the split to the screen on a manual row", () => {
        expect(
            serializeCommission({
                source: "MANUAL",
                id: 12,
                reference: "CM-14",
                entryDate: "2026-09-19",
                status: "OPEN",
                entryType: "ENTRY",
                vendorPayable: 0,
                commissionExcludingGST: "200.0000",
                commissionIncludingGST: "236.0000",
                refunded: 0,
                gstInclusive: 0,
                gstRate: "18.00",
                taxableAmount: "200.0000",
                gstAmount: "36.0000",
            })
        ).toMatchObject({
            commissionExcludingGST: 200,
            commissionIncludingGST: 236,
            gstInclusive: false,
            gstRate: 18,
            taxableAmount: 200,
            gstAmount: 36,
        });
    });
});
