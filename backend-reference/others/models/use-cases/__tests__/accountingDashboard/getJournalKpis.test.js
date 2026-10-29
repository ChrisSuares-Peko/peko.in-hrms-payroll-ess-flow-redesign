const sequelizeConfig = require("../../../../configs/database/index");
const {
    buildJournalKpisQuery,
    getJournalKpis,
    JOURNAL_KEYS,
    METRIC_KEYS,
    failed,
    notSkipped,
} = require("../../accountingDashboard");
const { gmvOfOrder, netGmvOfOrder, discountOfOrder } = require("../../journalPosting");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/serviceOperator", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/systemUser", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/roleAndPermissions", () => ({}));
jest.mock("../../../entities/credential", () => ({}));
jest.mock("../../../entities/chartOfAccount", () => ({ findAll: jest.fn(), count: jest.fn() }));
jest.mock("../../../entities/vendor", () => ({}));
jest.mock("../../setting", () => ({ getASetting: jest.fn(), upsertSetting: jest.fn() }));
jest.mock("../../../../utils/sortHandle", () => ({ handleSortFields: jest.fn() }));

const RANGE = { from: "2026-09-16 00:00:00", to: "2026-09-16 23:59:59" };

describe("buildJournalKpisQuery", () => {
    it("never scans the whole orders table, even with no range given", () => {
        const sql = buildJournalKpisQuery(null);

        expect(sql).toContain("FROM orders WHERE");
        expect(sql).toContain(":accountingFloor");
    });

    it("filters by transactionDate when a range is given, on top of the floor", () => {
        const sql = buildJournalKpisQuery(RANGE);

        expect(sql).toContain(":accountingFloor");
        expect(sql).toContain("transactionDate BETWEEN :from AND :to");
    });

    it("counts recorded, failed and skipped entries for every journal key", () => {
        const sql = buildJournalKpisQuery(null);

        expect(JOURNAL_KEYS).toEqual([
            "transaction",
            "refund",
            "cashback",
            "cashbackReversal",
            "adminRefund",
        ]);
        JOURNAL_KEYS.forEach(key => {
            expect(sql).toContain(`JSON_EXTRACT(journalRecordStatus, '$.${key}') = true`);
            expect(sql).toContain(`JSON_EXTRACT(journalRecordStatus, '$.${key}') = false`);
            expect(sql).toContain(`JSON_EXTRACT(journalData, '$.${key}.skipped') = true`);
        });
        expect(sql).toContain("AS transactionEntries");
        expect(sql).toContain("AS adminRefundEntries");
        expect(sql).toContain("AS failedEntries");
        expect(sql).toContain("AS skippedEntries");
    });

    // A journal the worker skipped leaves a marker and no verdict; one that never ran leaves
    // neither. The two are counted apart so the screen and the KPI agree on each.
    it("counts a successful order with neither a verdict nor a skip marker as not recorded", () => {
        const sql = buildJournalKpisQuery(null);

        expect(sql).toContain(
            "status = 'SUCCESS' AND JSON_EXTRACT(journalRecordStatus, '$.transaction') IS NULL " +
                "AND COALESCE(JSON_EXTRACT(journalData, '$.transaction.skipped') = true, false) = false"
        );
        expect(sql).toContain("AS notRecordedEntries");
    });

    it("counts an entry held back before it was sent under skipped only, never as failed", () => {
        const sql = buildJournalKpisQuery(null);

        JOURNAL_KEYS.forEach(key => {
            expect(sql).toContain(
                `COALESCE(JSON_EXTRACT(journalData, '$.${key}.skipped') = true, false) = false ` +
                    `AND JSON_EXTRACT(journalRecordStatus, '$.${key}') = false`
            );
        });
        expect(failed("refund")).toBe(
            `${notSkipped("refund")} AND JSON_EXTRACT(journalRecordStatus, '$.refund') = false`
        );
    });

    it("counts and sums only successful orders for the money metrics", () => {
        const sql = buildJournalKpisQuery(null);

        expect(sql).toContain("CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END), 0) AS transactionsCount");
        expect(sql).toContain(`CASE WHEN status = 'SUCCESS' THEN ${gmvOfOrder()} ELSE 0 END), 0) AS gmv`);
        expect(sql).toContain(`CASE WHEN status = 'SUCCESS' THEN ${discountOfOrder()} ELSE 0 END), 0) AS discounts`);
        expect(sql).toContain(`CASE WHEN status = 'SUCCESS' THEN ${netGmvOfOrder()} ELSE 0 END), 0) AS netGmv`);
        expect(sql).toContain(
            "CAST(JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.commissionExcludingGST')) AS DECIMAL(14, 4)) ELSE 0 END), 0) AS commission"
        );
        expect(sql).toContain("JSON_EXTRACT(journalData, '$.platformFeeExcludingGST')");
        expect(sql).toContain("JSON_EXTRACT(journalData, '$.netSubscriptionIncome')");
        expect(sql).not.toContain("commissionIncludingGST");
    });
});

describe("getJournalKpis", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("passes the range as named replacements", async () => {
        sequelizeConfig.query.mockResolvedValue([{}]);

        await getJournalKpis(RANGE);

        expect(sequelizeConfig.query).toHaveBeenCalledWith(
            expect.stringContaining("BETWEEN :from AND :to"),
            { replacements: { ...RANGE, oneTimeItemKeys: ["corporate_cards"] }, type: "SELECT" }
        );
    });

    it("still binds the floor when no range is given", async () => {
        sequelizeConfig.query.mockResolvedValue([{}]);

        await getJournalKpis(null, "2026-09-30");

        expect(sequelizeConfig.query.mock.calls[0][1]).toEqual({
            type: "SELECT",
            replacements: { accountingFloor: "2026-09-30", oneTimeItemKeys: ["corporate_cards"] },
        });
    });

    it("counts nothing when no go-live date has been set", async () => {
        sequelizeConfig.query.mockResolvedValue([{}]);

        // The floor resolves to the end of time, so every row falls before it.
        await getJournalKpis(null, "9999-12-31");

        expect(sequelizeConfig.query.mock.calls[0][1].replacements.accountingFloor).toBe(
            "9999-12-31"
        );
    });

    it("casts decimal strings to numbers and derives the journal entries total", async () => {
        sequelizeConfig.query.mockResolvedValue([
            {
                transactionEntries: "49",
                refundEntries: "3",
                cashbackEntries: "4",
                cashbackReversalEntries: "0",
                adminRefundEntries: "0",
                failedEntries: "2",
                skippedEntries: "1",
                notRecordedEntries: "3",
                transactionsCount: "49",
                gmv: "31246.0900",
                discounts: "1200.0000",
                netGmv: "30046.0900",
                commission: "1820.4000",
                platformFee: "640.0000",
                subscriptions: "1490.0000",
                subscriptionsMonthly: "990.0000",
                subscriptionsAnnually: "500.0000",
            },
        ]);

        expect(await getJournalKpis(RANGE)).toEqual({
            journalEntries: 56,
            transactionEntries: 49,
            refundEntries: 3,
            cashbackEntries: 4,
            cashbackReversalEntries: 0,
            adminRefundEntries: 0,
            failedEntries: 2,
            skippedEntries: 1,
            notRecordedEntries: 3,
            transactionsCount: 49,
            gmv: 31246.09,
            discounts: 1200,
            netGmv: 30046.09,
            commission: 1820.4,
            platformFee: 640,
            subscriptions: 1490,
            subscriptionsMonthly: 990,
            subscriptionsAnnually: 500,
        });
    });

    it("splits the subscriptions total by billing type, without touching non-subscription orders", () => {
        const sql = buildJournalKpisQuery(RANGE);

        expect(sql).toContain(
            "CASE WHEN status = 'SUCCESS' AND JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.billingType')) = 'MONTHLY' AND transactionDate BETWEEN :from AND :to THEN CASE WHEN COALESCE(orders.serviceOperatorId IN (SELECT id FROM serviceOperators WHERE accessKey IN (:oneTimeItemKeys)), false) THEN 0 ELSE CAST(JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.netSubscriptionIncome')) AS DECIMAL(14, 4)) END ELSE 0 END), 0) AS subscriptionsMonthly"
        );
        expect(sql).toContain(
            "CASE WHEN status = 'SUCCESS' AND JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.billingType')) = 'ANNUALLY' AND transactionDate BETWEEN :from AND :to THEN CASE WHEN COALESCE(orders.serviceOperatorId IN (SELECT id FROM serviceOperators WHERE accessKey IN (:oneTimeItemKeys)), false) THEN 0 ELSE CAST(JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.netSubscriptionIncome')) AS DECIMAL(14, 4)) END ELSE 0 END), 0) AS subscriptionsAnnually"
        );
    });

    it("leaves one-time item purchases out of the subscription figures and out of nothing else", () => {
        const sql = buildJournalKpisQuery(RANGE);

        expect(sql.split("COALESCE(orders.serviceOperatorId IN (SELECT id FROM serviceOperators WHERE accessKey IN (:oneTimeItemKeys)), false)").length - 1).toBe(3);
        expect(sql).toContain(`THEN ${gmvOfOrder()} ELSE 0 END), 0) AS gmv`);
        expect(sql).toContain(
            "THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.commissionExcludingGST')) AS DECIMAL(14, 4)) ELSE 0 END), 0) AS commission"
        );
        expect(sql).toContain(
            "THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.platformFeeExcludingGST')) AS DECIMAL(14, 4)) ELSE 0 END), 0) AS platformFee"
        );
    });

    it("returns zero for every metric when no row comes back", async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        const metrics = await getJournalKpis(null);

        expect(Object.keys(metrics).sort()).toEqual([...METRIC_KEYS].sort());
        METRIC_KEYS.forEach(key => expect(metrics[key]).toBe(0));
    });
});

describe("buildJournalKpisQuery — bucketing refund/cashback/reversal/adminRefund by their own event date", () => {
    it("gates recorded/failed counts for non-transaction keys on that key's own journalDate, not transactionDate", () => {
        const sql = buildJournalKpisQuery(RANGE);

        ["refund", "cashback", "cashbackReversal", "adminRefund"].forEach(key => {
            expect(sql).toContain(
                `JSON_EXTRACT(journalRecordStatus, '$.${key}') = true AND CAST(JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.${key}.journalDate')) AS DATE) BETWEEN :from AND :to`
            );
            expect(sql).toContain(
                `JSON_EXTRACT(journalRecordStatus, '$.${key}') = false AND CAST(JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.${key}.journalDate')) AS DATE) BETWEEN :from AND :to`
            );
        });
    });

    it("compares the stored journal day as a date, so an entry posted on the first or last day of the range is counted", () => {
        const sql = buildJournalKpisQuery(RANGE);

        expect(sql).not.toContain("journalDate')) BETWEEN");
        expect(sql).toContain("journalDate')) AS DATE) BETWEEN :from AND :to");
    });

    it("still gates the transaction key's recorded/failed counts on transactionDate", () => {
        const sql = buildJournalKpisQuery(RANGE);

        expect(sql).toContain(
            "JSON_EXTRACT(journalRecordStatus, '$.transaction') = true AND transactionDate BETWEEN :from AND :to"
        );
    });

    it("still gates skipped counts on transactionDate for every key — a skip never reached the provider, so it has no journalDate", () => {
        const sql = buildJournalKpisQuery(RANGE);

        ["transaction", "refund", "cashback", "cashbackReversal", "adminRefund"].forEach(key => {
            expect(sql).toContain(
                `JSON_EXTRACT(journalData, '$.${key}.skipped') = true AND transactionDate BETWEEN :from AND :to`
            );
        });
    });

    it("does not date-restrict the money metrics beyond transactionDate + status = SUCCESS", () => {
        const sql = buildJournalKpisQuery(RANGE);

        expect(sql).toContain(
            `CASE WHEN status = 'SUCCESS' AND transactionDate BETWEEN :from AND :to THEN ${gmvOfOrder()} ELSE 0 END), 0) AS gmv`
        );
    });

    it("widens the outer WHERE so a row is kept when a non-transaction key's own event date is in range, even if transactionDate isn't", () => {
        const sql = buildJournalKpisQuery(RANGE);

        ["refund", "cashback", "cashbackReversal", "adminRefund"].forEach(key => {
            expect(sql).toContain(
                `CAST(JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.${key}.journalDate')) AS DATE) BETWEEN :from AND :to`
            );
        });
        // The floor still applies unconditionally alongside the widened range.
        expect(sql).toMatch(/WHERE DATE\(transactionDate\) > :accountingFloor AND \(/);
    });

    it("does not widen or restrict anything when no range is given", () => {
        const sql = buildJournalKpisQuery(null);

        expect(sql).not.toContain("BETWEEN :from AND :to");
        JOURNAL_KEYS.forEach(key => {
            // No range, so no date condition at all is appended after the status check.
            expect(sql).toContain(`JSON_EXTRACT(journalRecordStatus, '$.${key}') = true THEN 1`);
        });
        expect(sql.endsWith(" WHERE DATE(transactionDate) > :accountingFloor")).toBe(true);
    });
});

describe("the internal purchase account scope on the KPIs", () => {
    beforeEach(() => jest.clearAllMocks());

    it("narrows every figure to the accounts given, on top of the floor and the range", () => {
        const sql = buildJournalKpisQuery(RANGE, [12, 15]);

        expect(sql).toContain("credentialId IN (:accountScopeIds)");
        expect(sql).toContain(":accountingFloor");
        expect(sql).toContain("transactionDate BETWEEN :from AND :to");
        expect(buildJournalKpisQuery(RANGE)).not.toContain("credentialId");
    });

    it("counts nothing when the scope has no accounts configured", () => {
        expect(buildJournalKpisQuery(RANGE, [])).toContain("AND 1 = 0");
    });

    it("binds the account ids beside the range", async () => {
        sequelizeConfig.query.mockResolvedValue([{ transactionsCount: "2" }]);

        const metrics = await getJournalKpis(RANGE, "2026-09-01", [12, 15]);

        expect(metrics.transactionsCount).toBe(2);
        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({
            ...RANGE,
            accountingFloor: "2026-09-01",
            oneTimeItemKeys: ["corporate_cards"],
            accountScopeIds: [12, 15],
        });

        await getJournalKpis(RANGE, "2026-09-01", []);
        expect(sequelizeConfig.query.mock.calls[1][1].replacements).not.toHaveProperty("accountScopeIds");
    });
});
