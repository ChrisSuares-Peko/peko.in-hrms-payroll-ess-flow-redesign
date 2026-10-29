const sequelizeConfig = require("../../../../configs/database/index");
const { findByAccountName, findGenericAccountByName } = require("../../chartOfAccount");
const { gmvOfOrder } = require("../../journalPosting");
const {
    sumPaidToPartner,
    sumOpeningForPartner,
    sumByPartnerAndKind,
    sumPaidByPartner,
    sumPaidInRange,
    findLastPayout,
    findOpeningBalance,
    listPartnersWithOpening,
} = require("../../partnerPayouts");
const { sumEntries, sumEntriesByPartner } = require("../../partnerLedgerEntries");
const {
    PARTNERSHIP_PAYABLE_ACCOUNT,
    BALANCES_CACHE_KEY,
    IS_PEKO_SUBSCRIPTION,
    getPartnershipPayableAccountId,
    buildEarnedQuery,
    sumEarned,
    buildPartnerGmvQuery,
    sumPartnerGmv,
    listPartnerOrders,
    serializeTransaction,
    serializeSubscription,
    buildPosition,
    getPartnerLedgerSummary,
    serializePartner,
    buildPartnerKpis,
} = require("../../partnerLedger");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/credential", () => ({}));
jest.mock("../../../entities/partnerPayout", () => ({}));
jest.mock("../../../entities/partnerLedgerEntry", () => ({}));
jest.mock("../../partnerLedgerEntries", () => ({
    ENTRY_KINDS: { debitNote: "DEBIT_NOTE" },
    sumEntries: jest.fn(),
    sumEntriesByPartner: jest.fn(),
}));
jest.mock("../../chartOfAccount", () => ({
    findByAccountName: jest.fn(),
    findGenericAccountByName: jest.fn(),
}));
jest.mock("../../partnerPayouts", () => ({
    sumPaidToPartner: jest.fn(),
    sumOpeningForPartner: jest.fn(),
    sumByPartnerAndKind: jest.fn(),
    sumPaidByPartner: jest.fn(),
    sumPaidInRange: jest.fn(),
    findLastPayout: jest.fn(),
    findOpeningBalance: jest.fn(),
    listPartnersWithOpening: jest.fn(),
}));

const PAYABLE = "4567000000000333";

beforeEach(() => {
    jest.clearAllMocks();
    findGenericAccountByName.mockResolvedValue({ provider_account_id: PAYABLE });
    sumPaidToPartner.mockResolvedValue(0);
    sumOpeningForPartner.mockResolvedValue(0);
    sumByPartnerAndKind.mockResolvedValue({});
    findOpeningBalance.mockResolvedValue(null);
    listPartnersWithOpening.mockResolvedValue({});
    sumPaidByPartner.mockResolvedValue({});
    sumPaidInRange.mockResolvedValue(0);
    findLastPayout.mockResolvedValue(null);
    sumEntries.mockResolvedValue(0);
    sumEntriesByPartner.mockResolvedValue({});
});

describe("the payable account", () => {
    it("prefers the one shared row and falls back to a match on name", async () => {
        await expect(getPartnershipPayableAccountId()).resolves.toBe(PAYABLE);
        expect(findGenericAccountByName).toHaveBeenCalledWith(PARTNERSHIP_PAYABLE_ACCOUNT, [
            "provider_account_id",
        ]);

        findGenericAccountByName.mockResolvedValue(null);
        findByAccountName.mockResolvedValue({ provider_account_id: PAYABLE });
        await expect(getPartnershipPayableAccountId()).resolves.toBe(PAYABLE);
    });

    it("reports nothing rather than guessing when the account is missing", async () => {
        findGenericAccountByName.mockResolvedValue(null);
        findByAccountName.mockResolvedValue(null);

        await expect(getPartnershipPayableAccountId()).resolves.toBeNull();
    });
});

describe("what the partner earned", () => {
    const sql = buildEarnedQuery({});

    it("reads the posted lines on the payable account across every journal event", () => {
        expect(sql).toContain("journalLines.accountId = :payableAccountId");
        expect(sql.split("UNION ALL")).toHaveLength(5);
        expect(sql).toContain("CASE WHEN direction = 'credit' THEN amount ELSE -amount END");
    });

    it("excludes a partner's own self-referential credential", () => {
        expect(sql).toContain("CAST(customer.registeredBy AS UNSIGNED) <> customer.id");
        expect(sql).toContain("customer.registeredBy REGEXP '^[0-9]+$'");
    });

    it("dates a refund by the event rather than by the order", () => {
        expect(buildEarnedQuery({ range: {} })).toContain("$.refund.journalDate");
    });

    it("returns nothing at all when no payable account is configured", async () => {
        await expect(sumEarned({ payableAccountId: null })).resolves.toEqual({});
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });
});

describe("partner GMV", () => {
    it("uses successful raw order amounts and the selected date range", () => {
        const sql = buildPartnerGmvQuery({
            partnerId: 55,
            range: { from: "2026-09-01", to: "2026-09-30" },
        });

        expect(sql).toContain("orders.status = 'SUCCESS'");
        expect(sql).toContain(`COALESCE(SUM(${gmvOfOrder("orders")}), 0) AS gmv`);
        expect(sql).toContain("orders.transactionDate BETWEEN :from AND :to");
        expect(sql).toContain("customer.registeredBy = :partnerId");
        expect(sql).toContain("customer.registeredBy REGEXP '^[0-9]+$'");
    });

    it("returns the successful-order amount independently of accounting postings", async () => {
        sequelizeConfig.query.mockResolvedValue([{ gmv: "31246.0900" }]);

        await expect(
            sumPartnerGmv({
                partnerId: 55,
                range: { from: "2026-09-01", to: "2026-09-30" },
            })
        ).resolves.toBe(31246.09);

        const [, options] = sequelizeConfig.query.mock.calls[0];
        expect(options.replacements).toMatchObject({
            partnerId: "55",
            from: "2026-09-01",
            to: "2026-09-30",
        });
    });

    it("adds each partner's successful orders for the overview total", async () => {
        sequelizeConfig.query.mockResolvedValue([
            { partnerCredentialId: 55, gmv: "100.2500" },
            { partnerCredentialId: 56, gmv: "200.5000" },
        ]);

        await expect(
            sumPartnerGmv({ range: { from: "2026-09-01", to: "2026-09-30" } })
        ).resolves.toBe(300.75);
    });
});

describe("splitting the two tabs", () => {
    beforeEach(() => {
        sequelizeConfig.query.mockResolvedValue([]);
    });

    it("treats an order with no tag as an ordinary transaction", async () => {
        await listPartnerOrders({ partnerId: 55, subscriptions: false, limit: 10, offset: 0 });

        const [sql] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("COALESCE(orders.optional, '')");
        expect(sql).toContain(`NOT ${IS_PEKO_SUBSCRIPTION}`);
    });

    // The partner is known from the customer record, not the journal, so an order whose
    // journal never ran still lists; its raw amount and surcharge stand in where they can.
    it("lists an order whose journal never ran, falling back to the order's own figures", async () => {
        await listPartnerOrders({ partnerId: 55, subscriptions: false, limit: 10, offset: 0 });

        const [sql] = sequelizeConfig.query.mock.calls[0];
        expect(sql).not.toContain("orders.journalData IS NOT NULL");
        expect(sql).toContain("orders.amountInINR) AS totalAmount");
        expect(sql).toContain("platformFeeExcludingGST");
        expect(sql).toContain("commissionExcludingGST");
        expect(sql).not.toContain("orders.surcharge");
    });

    it("keeps peko subscriptions and only those on the other tab", async () => {
        await listPartnerOrders({ partnerId: 55, subscriptions: true, limit: 10, offset: 0 });

        const [sql] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("'SUBSCRIPTION'");
        expect(sql).toContain("'SUBSCRIPTION-ADDONS'");
        expect(sql).not.toContain("NOT (COALESCE(orders.optional");
    });

    it("scopes to the partner and drops the orders the gateway never answered on", async () => {
        await listPartnerOrders({ partnerId: 55, subscriptions: false, limit: 10, offset: 0 });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("customer.registeredBy = :partnerId");
        expect(sql).toContain("orders.status <> 'PENDING'");
        expect(options.replacements.partnerId).toBe("55");
    });

    it("divides the share by the base that sale type is actually charged on", async () => {
        await listPartnerOrders({ partnerId: 55, subscriptions: false, limit: 10, offset: 0 });
        const [orderSql] = sequelizeConfig.query.mock.calls[0];

        expect(orderSql).toContain("AS sharePercentageApplied");
        expect(orderSql).toContain("commissionExcludingGST");
        expect(orderSql).toContain("'$.principalCommissionExcludingGST')) AS DECIMAL(16, 4)), 0) + CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.platformFeeExcludingGST'");
        expect(orderSql).toContain("'$.principalCommissionExcludingGST')) AS DECIMAL(16, 4)), 0) END AS netCommission");
        expect(orderSql).toContain(
            "- COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.gatewayCharge')) AS DECIMAL(16, 4)), 0), 0) AS shareBase"
        );
        expect(orderSql).toContain("'$.gatewayCharge')) AS DECIMAL(16, 4)) AS gatewayCharge");

        sequelizeConfig.query.mockClear();
        await listPartnerOrders({ partnerId: 55, subscriptions: true, limit: 10, offset: 0 });
        const [subscriptionSql] = sequelizeConfig.query.mock.calls[0];

        expect(subscriptionSql).toContain("AS sharePercentageApplied");
        expect(subscriptionSql).toContain("paymentThroughGateway");
        expect(subscriptionSql).toContain("couponTotalDiscount");
        expect(subscriptionSql).toContain(
            "- COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.gatewayCharge')) AS DECIMAL(16, 4)), 0), 0) AS shareBase"
        );
        expect(subscriptionSql).toContain("'$.gatewayCharge')) AS DECIMAL(16, 4)) AS gatewayCharge");
    });

    it("takes the gateway charge off the base, and keeps the base at nought when the charge is above the earnings", async () => {
        await listPartnerOrders({ partnerId: 55, subscriptions: false, limit: 10, offset: 0 });
        const [orderSql] = sequelizeConfig.query.mock.calls[0];

        expect(orderSql).toContain("GREATEST(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionExcludingGST'");

        sequelizeConfig.query.mockClear();
        await listPartnerOrders({ partnerId: 55, subscriptions: true, limit: 10, offset: 0 });
        const [subscriptionSql] = sequelizeConfig.query.mock.calls[0];

        expect(subscriptionSql).toContain("GREATEST(COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.netSubscriptionIncome'");
    });

    it("guards the rate against a zero base so the row reports nothing rather than dividing", async () => {
        await listPartnerOrders({ partnerId: 55, subscriptions: true, limit: 10, offset: 0 });

        const [sql] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("NULLIF(");
    });

    // The Status pill on both order tables reads the order's own status, so the filter does too.
    it.each([
        ["success", "orders.status IN ('SUCCESS', 'ORDERED')"],
        ["refunded", "orders.status IN ('REFUND', 'REFUNDED')"],
        ["failed", "orders.status IN ('FAILED', 'FAILURE')"],
    ])("narrows both tabs to the orders the Status pill calls %s, in the list and the count", async (status, clause) => {
        await listPartnerOrders({ partnerId: 55, subscriptions: false, status, limit: 10, offset: 0 });
        await listPartnerOrders({ partnerId: 55, subscriptions: true, status, limit: 10, offset: 0 });

        sequelizeConfig.query.mock.calls.forEach(([sql]) => expect(sql).toContain(`AND ${clause}`));
        expect(sequelizeConfig.query).toHaveBeenCalledTimes(4);
    });

    it.each([[undefined], [""], ["paid"], ["reversed"], ["orders.status = 1"]])(
        "lists every order for the status %p, which the Status pill does not have",
        async status => {
            await listPartnerOrders({ partnerId: 55, subscriptions: false, status, limit: 10, offset: 0 });

            expect(sequelizeConfig.query.mock.calls[0][0]).not.toContain("orders.status IN");
        }
    );

    it("keeps the status, the search and the date range together", async () => {
        await listPartnerOrders({
            partnerId: 55,
            subscriptions: false,
            status: "failed",
            searchText: "air",
            range: { from: "2026-09-01 00:00:00", to: "2026-09-19 23:59:59" },
            limit: 10,
            offset: 0,
        });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("orders.status IN ('FAILED', 'FAILURE')");
        expect(sql).toContain("orders.corporateTxnId LIKE :searchText");
        expect(sql).toContain("orders.transactionDate BETWEEN :from AND :to");
        expect(options.replacements.searchText).toBe("%air%");
    });

    it("searches the txn id, the service and the subscriber on Transactions", async () => {
        await listPartnerOrders({ partnerId: 55, subscriptions: false, searchText: "air", limit: 10, offset: 0 });

        const [sql] = sequelizeConfig.query.mock.calls[0];
        const [countSql] = sequelizeConfig.query.mock.calls[1];
        const clause =
            "(orders.corporateTxnId LIKE :searchText OR serviceOperators.serviceProvider LIKE :searchText " +
            "OR corporateUsers.name LIKE :searchText OR corporateUsers.contactPersonName LIKE :searchText " +
            "OR customer.username LIKE :searchText)";
        expect(sql).toContain(clause);
        expect(countSql).toContain(clause);
    });

    // A Peko plan has no service operator, so the plan is what the table names it by.
    it("searches the plan, not the service, on Own Subscriptions", async () => {
        await listPartnerOrders({ partnerId: 55, subscriptions: true, searchText: "turbo", limit: 10, offset: 0 });

        const [sql] = sequelizeConfig.query.mock.calls[0];
        const [countSql] = sequelizeConfig.query.mock.calls[1];
        [sql, countSql].forEach(text => {
            expect(text).toContain("OR packages.packageName LIKE :searchText OR corporateUsers.name LIKE :searchText");
            expect(text).not.toContain("serviceOperators.serviceProvider LIKE");
        });
    });

    it("reads the coupon total and Peko's share on both tabs, with no vendor share", async () => {
        await listPartnerOrders({ partnerId: 55, subscriptions: true, limit: 10, offset: 0 });
        const [subscriptionSql] = sequelizeConfig.query.mock.calls[0];

        expect(subscriptionSql).toContain("AS couponTotal");
    });
});

describe("shaping a row", () => {
    it("carries every figure the transactions tab asks for", () => {
        expect(
            serializeTransaction({
                id: 1,
                corporateTxnId: "P1",
                transactionDate: "2026-09-02",
                subscriberName: "Al Rams Trading",
                service: "Flights",
                totalAmount: "1080.0000",
                netPlatformFee: "67.8000",
                netCommission: "100.0000",
                couponTotal: "100.0000",
                gatewayCharge: "26.6300",
                shareBase: "200.0000",
                shareExcludingGST: "20.0000",
                shareGST: "3.6000",
                partnerShare: "23.6000",
                sharePercentageApplied: "10.101010",
                status: "SUCCESS",
                transactionVerdict: "true",
            })
        ).toEqual({
            id: 1,
            corporateTxnId: "P1",
            transactionDate: "2026-09-02",
            subscriberName: "Al Rams Trading",
            service: "Flights",
            totalAmount: 1080,
            netPlatformFee: 67.8,
            netCommission: 100,
            couponTotal: 100,
            gatewayCharge: 26.63,
            shareBase: 200,
            shareExcludingGST: 20,
            shareGST: 3.6,
            partnerShare: 23.6,
            sharePercentageApplied: 10.1,
            status: "SUCCESS",
            posting: { state: "posted", note: null, detail: null },
        });
    });

    it("carries the coupon figures and the rate that applied onto a subscription row", () => {
        expect(
            serializeSubscription({
                id: 9,
                corporateTxnId: "S9",
                transactionDate: "2026-09-02",
                subscriberName: "Al Rams Trading",
                planName: "eSign",
                billingType: "MONTHLY",
                subscriptionStatus: "ACTIVE",
                optional: "SUBSCRIPTION",
                totalAmount: "96.9700",
                netRevenue: "99.0000",
                couponTotal: "19.8500",
                gatewayCharge: null,
                shareBase: "113.7900",
                shareExcludingGST: "17.0685",
                shareGST: "3.0723",
                partnerShare: "20.1408",
                sharePercentageApplied: "15.000000",
                status: "SUCCESS",
                transactionVerdict: "false",
                transactionReason: "Duplicate reference number",
            })
        ).toEqual({
            id: 9,
            corporateTxnId: "S9",
            transactionDate: "2026-09-02",
            subscriberName: "Al Rams Trading",
            planName: "eSign",
            billingType: "MONTHLY",
            subscriptionStatus: "ACTIVE",
            addOn: false,
            totalAmount: 96.97,
            netRevenue: 99,
            couponTotal: 19.85,
            gatewayCharge: null,
            shareBase: 113.79,
            shareExcludingGST: 17.07,
            shareGST: 3.07,
            partnerShare: 20.14,
            sharePercentageApplied: 15,
            status: "SUCCESS",
            posting: { state: "notPosted", note: "Books refused it", detail: "Duplicate reference number" },
        });
    });

    it("reports no gateway charge for an order recorded before the charge existed", () => {
        const posted = { transactionVerdict: "true", sharePercentageApplied: "10" };
        expect(serializeTransaction(posted).gatewayCharge).toBeNull();
        expect(serializeSubscription(posted).gatewayCharge).toBeNull();
        expect(serializeTransaction({ ...posted, gatewayCharge: "0.0000" }).gatewayCharge).toBe(0);
        expect(serializeTransaction(posted).sharePercentageApplied).toBe(10);
    });

    it("reports no rate when the base was zero, rather than a rate of zero", () => {
        const posted = { transactionVerdict: "true" };
        expect(serializeTransaction({ ...posted, sharePercentageApplied: null }).sharePercentageApplied).toBeNull();
        expect(serializeSubscription({ ...posted, sharePercentageApplied: null }).sharePercentageApplied).toBeNull();
        expect(serializeTransaction(posted).sharePercentageApplied).toBeNull();
        expect(serializeSubscription(posted).sharePercentageApplied).toBeNull();
        expect(serializeTransaction({ ...posted, sharePercentageApplied: "0" }).sharePercentageApplied).toBe(0);
    });

    it("leaves every derived figure null when the sale entry was skipped or never recorded, and keeps it when the books refused it", () => {
        const skipped = serializeTransaction({
            totalAmount: "500.0000",
            netCommission: "10.0000",
            partnerShare: "2.0000",
            sharePercentageApplied: "10",
            transactionVerdict: "false",
            transactionSkipped: "true",
            transactionReason: "disabled",
        });
        expect(skipped.totalAmount).toBeNull();
        expect([skipped.netCommission, skipped.partnerShare, skipped.sharePercentageApplied]).toEqual([null, null, null]);
        expect(skipped.posting.state).toBe("notPosted");

        const never = serializeSubscription({ optional: "SUBSCRIPTION", totalAmount: "1180.0000", netRevenue: "99.0000", partnerShare: "5.0000" });
        expect([never.totalAmount, never.netRevenue, never.partnerShare]).toEqual([null, null, null]);

        expect(serializeTransaction({ netCommission: "10.0000", transactionVerdict: "false" }).netCommission).toBe(10);
    });

    it("leaves every amount null on a row whose entry never reached the books, so the cells dash", () => {
        const row = serializeSubscription({ optional: "SUBSCRIPTION", totalAmount: "1180.0000" });
        expect(row.totalAmount).toBeNull();
        expect(row.couponTotal).toBeNull();
        expect(row.netRevenue).toBeNull();
        expect(row.partnerShare).toBeNull();

        const transaction = serializeTransaction({ totalAmount: "500.0000" });
        expect(transaction.totalAmount).toBeNull();
        expect(transaction.netPlatformFee).toBeNull();
        expect(transaction.netCommission).toBeNull();
        expect(transaction.partnerShare).toBeNull();
    });

    it("marks an add-on apart from a plan on the subscriptions tab", () => {
        expect(serializeSubscription({ optional: "SUBSCRIPTION-ADDONS" }).addOn).toBe(true);
        expect(serializeSubscription({ optional: "SUBSCRIPTION" }).addOn).toBe(false);
    });
});

describe("what is owed", () => {
    it("is everything earned less everything paid, so an underpayment carries forward", () => {
        expect(buildPosition({ earned: 153.4, paid: 30 })).toEqual({
            earned: 153.4,
            paid: 30,
            debitNotes: 0,
            opening: 0,
            owed: 123.4,
        });
    });

    it("takes off every debit note raised, because it settles what is owed the way a payout does", () => {
        expect(buildPosition({ earned: 153.4, paid: 30, debitNotes: 20 })).toMatchObject({
            debitNotes: 20,
            owed: 103.4,
        });
    });

    it("reads the debit notes off their own table, standing and for the window", async () => {
        sequelizeConfig.query.mockResolvedValue([{ partnerCredentialId: 55, earned: "153.4000" }]);
        sumPaidToPartner.mockResolvedValueOnce(30).mockResolvedValueOnce(0);
        sumEntries.mockResolvedValueOnce(20).mockResolvedValueOnce(5);

        const summary = await getPartnerLedgerSummary(55, { from: "2026-09-15", to: "2026-09-30" });

        expect(sumEntries).toHaveBeenNthCalledWith(1, 55, "DEBIT_NOTE", null);
        expect(sumEntries).toHaveBeenNthCalledWith(2, 55, "DEBIT_NOTE", {
            from: "2026-09-15",
            to: "2026-09-30",
        });
        expect(summary.debitNotes).toBe(5);
        expect(summary.owed).toBe(103.4);
    });

    it("adds what Peko already owed before the portal started recording", () => {
        expect(buildPosition({ earned: 153.4, paid: 30, opening: 2000 }).owed).toBe(2123.4);
    });

    it("is the opening alone when nothing has been earned since", () => {
        expect(buildPosition({ earned: 0, paid: 0, opening: 2000 }).owed).toBe(2000);
    });

    it("goes negative when more was paid than earned", () => {
        expect(buildPosition({ earned: 100, paid: 120 }).owed).toBe(-20);
    });

    it("reports the standing debt even when the cards are scoped to a window", async () => {
        sequelizeConfig.query.mockResolvedValue([{ partnerCredentialId: 55, earned: "153.4000" }]);
        sumPaidToPartner.mockResolvedValueOnce(30).mockResolvedValueOnce(0);

        const summary = await getPartnerLedgerSummary(55, { from: "2026-09-15", to: "2026-09-30" });

        expect(summary.owed).toBe(123.4);
    });

    it("names the last payment for the card above the table", async () => {
        sequelizeConfig.query.mockResolvedValue([]);
        findLastPayout.mockResolvedValue({ payoutDate: "2026-09-10", amount: "30.0000" });

        const summary = await getPartnerLedgerSummary(55);

        expect([summary.lastPayoutDate, summary.lastPayoutAmount]).toEqual(["2026-09-10", 30]);
    });
});

describe("the list row and its cards", () => {
    it("keeps a partner with no share configured rather than hiding it", () => {
        expect(
            serializePartner({ credentialId: 56, partnerName: "Nile", sharePercentage: null }, null)
        ).toMatchObject({ sharePercentage: null, earned: 0, paid: 0, owed: 0, isActive: false });
    });

    it("builds the cards off the snapshot", () => {
        expect(
            buildPartnerKpis({
                totalPartners: 2,
                owedTotal: 53.4,
                awaitingPayout: 1,
                partnersWithoutShare: 1,
                monthly: { earned: 153.4, paid: 100, gmv: 31246.09 },
            })
        ).toEqual({
            totalPartners: 2,
            owedTotal: 53.4,
            awaitingPayout: 1,
            partnersWithoutShare: 1,
            earnedThisMonth: 153.4,
            paidThisMonth: 100,
            gmvThisMonth: 31246.09,
        });
    });

    it("keeps its own cache key", () => {
        expect(BALANCES_CACHE_KEY).toBe("accounting:partner-balances:v3");
    });
});

describe("entries that never reached the books", () => {
    it("counts no line of a skipped or never recorded entry", () => {
        [buildEarnedQuery({})].forEach(sql => {
            ["transaction","refund","adminRefund","cashback","cashbackReversal"].forEach(key => {
                expect(sql).toContain(`JSON_EXTRACT(orders.journalRecordStatus, '$.${key}')) = 'true'`);
                expect(sql).toContain(`JSON_EXTRACT(orders.journalData, '$.${key}.skipped')), 'false') <> 'true'`);
            });
        });
    });
});
