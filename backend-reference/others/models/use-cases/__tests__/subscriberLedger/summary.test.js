const sequelizeConfig = require("../../../../configs/database/index");
const wallet = require("../../../entities/wallet");
const {
    loadWalletPosition,
    sumOrderTotals,
    findWalletBalance,
    buildSummary,
    getSubscriberLedgerSummary,
} = require("../../subscriberLedger");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/credential", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/wallet", () => ({ findOne: jest.fn() }));
jest.mock("../../../entities/transaction", () => ({ findAndCountAll: jest.fn() }));

const POSITION = {
    topUps: "30000.0000",
    withdrawals: "5000.0000",
    purchases: "2398.0000",
    refunds: "1199.0000",
    cashbackEarned: "24.0000",
    cashbackReversed: "12.0000",
    net: "23813.0000",
};

const RANGE = { from: "2026-09-01 00:00:00", to: "2026-09-19 23:59:59" };

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.query.mockResolvedValue([POSITION]);
    wallet.findOne.mockResolvedValue({ balance: "23813.0000" });
});

describe("loadWalletPosition", () => {
    it("splits every column by sign and tags funding rows by category", async () => {
        const position = await loadWalletPosition({ credentialId: 99 });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("COALESCE(transactions.transactionCategory, '') IN ('RECHARGE WALLET', 'FUND TRANSFER', 'FUND REVERSAL')");
        expect(sql).toContain("GREATEST(COALESCE(transactions.creditAmount, 0), 0)");
        expect(sql).toContain("GREATEST(-COALESCE(transactions.debitAmount, 0), 0)");
        expect(sql).toContain("AS net");
        expect(sql).not.toContain("status");
        expect(sql).not.toContain("remarks");
        expect(sql).not.toContain("BETWEEN");
        expect(options.replacements).toEqual({ credentialId: 99 });

        expect(position).toEqual({
            topUps: 30000,
            withdrawals: 5000,
            purchases: 2398,
            refunds: 1199,
            cashbackEarned: 24,
            cashbackReversed: 12,
            net: 23813,
        });
    });

    it("scopes to the range when one is given", async () => {
        await loadWalletPosition({ credentialId: 99, range: RANGE });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("transactions.transactionDate BETWEEN :from AND :to");
        expect(options.replacements).toEqual({ credentialId: 99, ...RANGE });
    });

    it("returns zeros for a wallet with no rows", async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        expect(await loadWalletPosition({ credentialId: 1 })).toEqual({
            topUps: 0,
            withdrawals: 0,
            purchases: 0,
            refunds: 0,
            cashbackEarned: 0,
            cashbackReversed: 0,
            net: 0,
        });
    });
});

describe("sumOrderTotals", () => {
    it("sums gateway share and platform fee on successful journaled orders", async () => {
        sequelizeConfig.query.mockResolvedValue([{ paidViaGateway: "8000.0000", platformFee: "49.0000" }]);

        const totals = await sumOrderTotals({ credentialId: 99, range: RANGE });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("orders.credentialId = :credentialId");
        expect(sql).toContain("orders.status = 'SUCCESS'");
        expect(sql).not.toContain("orders.journalData IS NOT NULL");
        expect(sql).toContain("JSON_EXTRACT(orders.journalData, '$.paymentThroughGateway')");
        expect(sql).toContain("CASE WHEN (JSON_UNQUOTE(JSON_EXTRACT(orders.journalRecordStatus, '$.transaction')) = 'true'");
        expect(sql).toContain("JSON_EXTRACT(orders.journalData, '$.platformFeeIncludingGST')");
        expect(sql).toContain(", orders.surcharge)");
        expect(sql).toContain("orders.transactionDate BETWEEN :from AND :to");
        expect(sql).toContain("DATE(orders.transactionDate) > :accountingFloor");
        expect(options.replacements).toEqual({
            credentialId: 99,
            ...RANGE,
            accountingFloor: "9999-12-31",
        });
        expect(totals).toEqual({ paidViaGateway: 8000, platformFee: 49 });
    });
});

describe("the two bases this ledger reads on", () => {
    it("floors the order side at go-live and leaves the wallet side whole", async () => {
        sequelizeConfig.query.mockResolvedValue([{}]);

        await sumOrderTotals({ credentialId: 99, range: null });
        const [orderSql, orderOptions] = sequelizeConfig.query.mock.calls[0];

        sequelizeConfig.query.mockClear();
        await loadWalletPosition({ credentialId: 99, range: null });
        const [walletSql, walletOptions] = sequelizeConfig.query.mock.calls[0];

        expect(orderSql).toContain(":accountingFloor");
        expect(orderOptions.replacements.accountingFloor).toBe("9999-12-31");
        expect(walletSql).not.toContain(":accountingFloor");
        expect(walletOptions.replacements).toEqual({ credentialId: 99 });
    });
});

describe("findWalletBalance", () => {
    it("reads the wallet row and treats a missing wallet as zero", async () => {
        expect(await findWalletBalance(99)).toBe(23813);
        expect(wallet.findOne).toHaveBeenCalledWith({
            where: { credentialId: 99 },
            attributes: ["balance"],
            raw: true,
        });

        wallet.findOne.mockResolvedValue(null);
        expect(await findWalletBalance(1)).toBe(0);
    });
});

describe("buildSummary", () => {
    const standing = {
        topUps: 30000,
        withdrawals: 5000,
        purchases: 2398,
        refunds: 1199,
        cashbackEarned: 24,
        cashbackReversed: 12,
        net: 23813,
    };

    it("keeps the ledger balance the sum of its own tiles", () => {
        const summary = buildSummary({
            standing,
            period: standing,
            orders: { paidViaGateway: 8000, platformFee: 49 },
            walletBalance: 23813,
        });

        expect(summary).toEqual({
            topUps: 30000,
            withdrawals: 5000,
            spent: 1199,
            paidViaGateway: 8000,
            platformFee: 49,
            cashback: 12,
            walletBalance: 23813,
            ledgerBalance: 23813,
            walletDifference: 0,
        });
        expect(summary.topUps - summary.withdrawals - summary.spent + summary.cashback).toBe(
            summary.ledgerBalance
        );
    });

    it("names the gap when the wallet moved without a ledger row", () => {
        const summary = buildSummary({
            standing,
            period: standing,
            orders: { paidViaGateway: 0, platformFee: 0 },
            walletBalance: 24313,
        });

        expect(summary.walletDifference).toBe(500);
    });
});

describe("getSubscriberLedgerSummary", () => {
    it("scopes every tile except the balances to the range", async () => {
        sequelizeConfig.query.mockImplementation(sql => {
            if (sql.includes("FROM orders")) {
                return Promise.resolve([{ paidViaGateway: "8000.0000", platformFee: "49.0000" }]);
            }
            return Promise.resolve([
                sql.includes("BETWEEN :from AND :to") ? { ...POSITION, topUps: "5000.0000", net: "0" } : POSITION,
            ]);
        });

        const summary = await getSubscriberLedgerSummary({ credentialId: 99 }, RANGE);

        expect(summary.topUps).toBe(5000);
        expect(summary.ledgerBalance).toBe(23813);
        expect(summary.walletBalance).toBe(23813);
        expect(summary.walletDifference).toBe(0);
        expect(summary.paidViaGateway).toBe(8000);

        const positionCalls = sequelizeConfig.query.mock.calls.filter(([sql]) => sql.includes("AS topUps"));
        expect(positionCalls).toHaveLength(2);
        expect(positionCalls.some(([sql]) => !sql.includes("BETWEEN"))).toBe(true);
    });

    it("runs the standing position only once when there is no range", async () => {
        await getSubscriberLedgerSummary({ credentialId: 99 });

        const positionCalls = sequelizeConfig.query.mock.calls.filter(([sql]) => sql.includes("AS topUps"));
        expect(positionCalls).toHaveLength(1);
    });
});
