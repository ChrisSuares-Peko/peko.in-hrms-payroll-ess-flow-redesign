const sequelizeConfig = require("../../../../configs/database/index");
const {
    sumReceivedFromGateway,
    sumFeesForGateway,
    sumOpeningForGateway,
    sumSettledByGateway,
    sumReceivedInRange,
    findLastReceipt,
    findOpeningBalance,
    listGatewaysWithOpening,
} = require("../../paymentGatewaySettlements");
const {
    BALANCES_CACHE_KEY,
    GATEWAY_OF_ORDER,
    UNANSWERED_STATUS,
    buildCollectedQuery,
    sumCollected,
    listGatewayOrders,
    countGatewayOrders,
    serializeTransaction,
    buildPosition,
    getPaymentGatewayLedgerSummary,
    serializeGateway,
    buildPaymentGatewayKpis,
} = require("../../paymentGatewayLedger");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/paymentGatewaySettlement", () => ({}));
jest.mock("../../paymentGatewaySettlements", () => ({
    sumReceivedFromGateway: jest.fn(),
    sumFeesForGateway: jest.fn(),
    sumOpeningForGateway: jest.fn(),
    sumSettledByGateway: jest.fn(),
    sumReceivedInRange: jest.fn(),
    findLastReceipt: jest.fn(),
    findOpeningBalance: jest.fn(),
    listGatewaysWithOpening: jest.fn(),
}));

const GATEWAY = "4567000000000777";

beforeEach(() => {
    jest.clearAllMocks();
    sumReceivedFromGateway.mockResolvedValue(0);
    sumFeesForGateway.mockResolvedValue(0);
    sumOpeningForGateway.mockResolvedValue(0);
    sumSettledByGateway.mockResolvedValue({});
    sumReceivedInRange.mockResolvedValue(0);
    findLastReceipt.mockResolvedValue(null);
    findOpeningBalance.mockResolvedValue(null);
    listGatewaysWithOpening.mockResolvedValue({});
});

describe("what the gateway is holding", () => {
    const sql = buildCollectedQuery({ gatewayAccountId: GATEWAY });

    it("reads the posted lines on the gateway's own account across every journal event", () => {
        expect(sql.split("UNION ALL")).toHaveLength(5);
        expect(sql).toContain("journalLines.accountId = :gatewayAccountId");
        expect(sql).toContain("CASE WHEN direction = 'debit' THEN amount ELSE -amount END");
    });

    it("drops the orders the gateway never answered on", () => {
        expect(sql).toContain(`orders.status <> '${UNANSWERED_STATUS}'`);
    });

    it("anchors the roster on the account the journal recorded, not on the gateway's name", () => {
        expect(GATEWAY_OF_ORDER).toContain("journalAccountIds.paymentGateway");
        expect(buildCollectedQuery({})).toContain("journalAccountIds.paymentGateway");
    });

    it("dates a refund by the event rather than by the order", () => {
        expect(buildCollectedQuery({ range: {} })).toContain("$.refund.journalDate");
    });
});

describe("the transactions tab", () => {
    beforeEach(() => {
        sequelizeConfig.query.mockResolvedValue([]);
    });

    it("scopes to one gateway and skips the orders it never answered on", async () => {
        await listGatewayOrders({ gatewayAccountId: GATEWAY, limit: 10, offset: 0 });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain(
            "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.journalAccountIds.paymentGateway')), " +
                "namedGateway.gatewayAccountId) USING utf8mb4) = :gatewayAccountId"
        );
        expect(sql).toContain(`orders.status <> '${UNANSWERED_STATUS}'`);
        expect(options.replacements.gatewayAccountId).toBe(GATEWAY);
    });

    // The journal is not the only place an order names its gateway: the payment response on
    // the order does too, in two shapes, and the name is matched to the account the same way
    // the journal matches it. Only money actually going through a gateway makes it a row.
    it("places an order whose journal never ran by the gateway its payment response names", async () => {
        await listGatewayOrders({ gatewayAccountId: GATEWAY, limit: 10, offset: 0 });

        const [sql] = sequelizeConfig.query.mock.calls[0];
        expect(sql).not.toContain("orders.journalData IS NOT NULL");
        expect(sql).toContain("JSON_VALID(orders.paymentModeResponse)");
        expect(sql).toContain("'$.paymentGatewayName'");
        expect(sql).toContain("'$[0].paymentGatewayName'");
        expect(sql).toContain("FROM chartOfAccounts WHERE provider_account_id IS NOT NULL GROUP BY account_name) AS namedGateway");
        expect(sql).toContain("'$[0].pgAmount'");
        expect(sql).toContain(", 0) > 0");
        expect(sql).toContain("AS gatewayAmount");
    });

    // The card counts against the balance, which is built from journal lines, so it keeps to
    // the orders the journal placed on the gateway even though the tab lists more.
    it("counts only journal-placed orders on the card", async () => {
        await countGatewayOrders(GATEWAY);

        const [sql] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("journalAccountIds.paymentGateway')) = :gatewayAccountId");
        expect(sql).toContain("orders.journalData IS NOT NULL");
        expect(sql).not.toContain("namedGateway");
    });

    // The Status pill on this table reads the order's own status, so the filter does too.
    it.each([
        ["success", "orders.status IN ('SUCCESS', 'ORDERED')"],
        ["refunded", "orders.status IN ('REFUND', 'REFUNDED')"],
        ["failed", "orders.status IN ('FAILED', 'FAILURE')"],
    ])("narrows to the orders the Status pill calls %s, in the list and the count", async (status, clause) => {
        await listGatewayOrders({ gatewayAccountId: GATEWAY, status, limit: 10, offset: 0 });

        sequelizeConfig.query.mock.calls.forEach(([sql]) => expect(sql).toContain(`AND ${clause}`));
        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
    });

    it.each([[undefined], [""], ["received"], ["reversed"], ["orders.status = 1"]])(
        "lists every order for the status %p, which the Status pill does not have",
        async status => {
            await listGatewayOrders({ gatewayAccountId: GATEWAY, status, limit: 10, offset: 0 });

            expect(sequelizeConfig.query.mock.calls[0][0]).not.toContain("orders.status IN");
        }
    );

    it("keeps the status, the search and the date range together", async () => {
        await listGatewayOrders({
            gatewayAccountId: GATEWAY,
            status: "failed",
            searchText: "hike",
            range: { from: "2026-09-01", to: "2026-09-19" },
            limit: 10,
            offset: 0,
        });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("orders.status IN ('FAILED', 'FAILURE')");
        expect(sql).toContain("orders.corporateTxnId LIKE :searchText");
        expect(sql).toContain("DATE(orders.transactionDate) BETWEEN :from AND :to");
        expect(options.replacements.searchText).toBe("%hike%");
    });

    // The Subscriber column names the account by its name, else its contact person, else its
    // username, and the Service column by the service, else the plan.
    it("searches the txn id, the subscriber however it is named, and the service or the plan", async () => {
        await listGatewayOrders({ gatewayAccountId: GATEWAY, searchText: "hike", limit: 10, offset: 0 });

        const clause =
            "(orders.corporateTxnId LIKE :searchText OR corporateUsers.name LIKE :searchText " +
            "OR corporateUsers.contactPersonName LIKE :searchText OR customer.username LIKE :searchText " +
            "OR serviceOperators.serviceProvider LIKE :searchText " +
            "OR packages.packageName LIKE :searchText)";
        sequelizeConfig.query.mock.calls.forEach(([sql]) => expect(sql).toContain(clause));
    });

    it("dashes the gateway amount when neither the journal nor the response carried one", () => {
        expect(serializeTransaction({ totalAmount: "500.0000", transactionVerdict: "true" })).toMatchObject({
            totalAmount: 500,
            gatewayAmount: null,
        });
        expect(serializeTransaction({ totalAmount: "500.0000" }).totalAmount).toBeNull();
        expect(serializeTransaction({ gatewayAmount: "0.0000", transactionVerdict: "true" }).gatewayAmount).toBe(0);
    });

    it("falls back to the order's own amount, because a subscription emits no transaction total", async () => {
        await listGatewayOrders({ gatewayAccountId: GATEWAY, limit: 10, offset: 0 });

        const [sql] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("COALESCE(");
        expect(sql).toContain("totalTransactionAmount");
        expect(sql).toContain("orders.amountInINR) AS totalAmount");
    });

    it("narrows to the days after the floor before it reads any journal, and never scans the subscriptions per order", async () => {
        await listGatewayOrders({ gatewayAccountId: GATEWAY, limit: 10, offset: 0 });

        sequelizeConfig.query.mock.calls.forEach(([sql]) => {
            const floor = sql.indexOf("orders.transactionDate >= DATE_ADD(:accountingFloor, INTERVAL 1 DAY)");
            const gateway = sql.indexOf("namedGateway.gatewayAccountId) USING utf8mb4) = :gatewayAccountId");
            expect(floor).toBeGreaterThan(-1);
            expect(floor).toBeLessThan(gateway);
            expect(sql.indexOf("DATE(orders.transactionDate) > :accountingFloor")).toBeLessThan(gateway);
            expect(sql).toContain(
                "ROW_NUMBER() OVER (PARTITION BY corporateTxnId ORDER BY id DESC) AS latestFirst FROM subscriptions WHERE corporateTxnId IS NOT NULL) AS ranked WHERE latestFirst = 1) AS planSubscription"
            );
            expect(sql).not.toContain("MAX(id)");
        });
    });

    it("counts for the card from the orders that carry a journal, before anything else is read", async () => {
        await countGatewayOrders(GATEWAY);

        const [sql] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("WHERE orders.journalData IS NOT NULL AND orders.status <> 'PENDING' AND orders.transactionDate >= DATE_ADD(:accountingFloor, INTERVAL 1 DAY)");
    });

    it("reaches the plan name through subscriptions, never through serviceOperators alone", async () => {
        await listGatewayOrders({ gatewayAccountId: GATEWAY, limit: 10, offset: 0 });

        const [sql] = sequelizeConfig.query.mock.calls[0];
        // A subscription order carries serviceOperatorId NULL, so an inner join there would
        // drop every one of them.
        expect(sql).toContain("LEFT JOIN serviceOperators");
        expect(sql).toContain("packages.packageName");
    });
});

describe("shaping a row", () => {
    it("carries every figure the transactions tab asks for", () => {
        expect(
            serializeTransaction({
                id: 7,
                corporateTxnId: "1790073500101",
                transactionDate: "2026-09-22",
                subscriberName: "Al Rams Trading",
                service: "Payroll",
                paymentMode: "PAYMENT GATEWAY + WALLET",
                totalAmount: "1224.0000",
                gatewayAmount: "500.0000",
                status: "SUCCESS",
                transactionVerdict: "true",
            })
        ).toEqual({
            id: 7,
            corporateTxnId: "1790073500101",
            transactionDate: "2026-09-22",
            subscriberName: "Al Rams Trading",
            service: "Payroll",
            paymentMode: "PAYMENT GATEWAY + WALLET",
            totalAmount: 1224,
            gatewayAmount: 500,
            beforeOpening: false,
            status: "SUCCESS",
            posting: { state: "posted", note: null, detail: null },
        });
    });

    it("dashes the gateway amount when the sale entry was skipped or never recorded, and keeps it when the books refused it", () => {
        expect(serializeTransaction({ gatewayAmount: "500.0000", transactionVerdict: "false", transactionSkipped: "true" }).gatewayAmount).toBeNull();
        expect(serializeTransaction({ gatewayAmount: "500.0000" }).gatewayAmount).toBeNull();
        expect(serializeTransaction({ gatewayAmount: "500.0000", transactionVerdict: "false" }).gatewayAmount).toBe(500);
    });

    it("marks an order that falls inside the opening figure rather than hiding it", () => {
        const row = { transactionDate: "2026-09-28" };
        expect(serializeTransaction(row, "2026-10-01").beforeOpening).toBe(true);
        // On the as-of date itself is inside the opening too.
        expect(serializeTransaction({ transactionDate: "2026-10-01" }, "2026-10-01").beforeOpening).toBe(true);
        expect(serializeTransaction({ transactionDate: "2026-10-02" }, "2026-10-01").beforeOpening).toBe(false);
        expect(serializeTransaction(row, null).beforeOpening).toBe(false);
    });

    it("reports nothing rather than a blank for a row with no service or subscriber", () => {
        const row = serializeTransaction({});
        expect([row.service, row.subscriberName, row.status]).toEqual([null, null, null]);
    });
});

describe("what is still to come", () => {
    it("is everything collected less what was handed over and what was kept", () => {
        expect(buildPosition({ collected: 20000, received: 15000, fees: 400 })).toEqual({
            collected: 20000,
            received: 15000,
            fees: 400,
            opening: 0,
            outstanding: 4600,
        });
    });

    it("adds the position carried in from before the portal started recording", () => {
        expect(
            buildPosition({ collected: 20000, received: 15000, fees: 400, opening: 12400 })
                .outstanding
        ).toBe(17000);
    });

    it("is the opening alone when nothing has been collected since", () => {
        expect(
            buildPosition({ collected: 0, received: 0, fees: 0, opening: 12400 }).outstanding
        ).toBe(12400);
    });

    it("clears to zero once a settlement covers the balance exactly", () => {
        expect(buildPosition({ collected: 20000, received: 19600, fees: 400 }).outstanding).toBe(0);
    });

    it("goes negative when more came back than the gateway ever collected", () => {
        expect(buildPosition({ collected: 100, received: 150, fees: 0 }).outstanding).toBe(-50);
    });

    it("reports the standing debt even when the cards are scoped to a window", async () => {
        sequelizeConfig.query.mockResolvedValue([{ gatewayAccountId: GATEWAY, collected: 20000 }]);
        sumReceivedFromGateway.mockResolvedValue(15000);
        sumFeesForGateway.mockResolvedValue(400);

        const summary = await getPaymentGatewayLedgerSummary(GATEWAY, {
            from: "2026-09-01",
            to: "2026-09-30",
        });

        expect(summary.outstanding).toBe(4600);
    });

    it("names the last receipt for the card above the tables", async () => {
        sequelizeConfig.query.mockResolvedValue([]);
        findLastReceipt.mockResolvedValue({ entryDate: "2026-09-22", amount: "15000.0000" });

        const summary = await getPaymentGatewayLedgerSummary(GATEWAY);

        expect([summary.lastReceiptDate, summary.lastReceiptAmount]).toEqual([
            "2026-09-22",
            15000,
        ]);
    });
});

describe("the list row and its cards", () => {
    it("names a gateway by its account and positions it", () => {
        expect(
            serializeGateway(
                { gatewayAccountId: GATEWAY, gatewayName: "Cashfree", accountType: "bank" },
                { collected: 20000, received: 15000, fees: 400, outstanding: 4600 }
            )
        ).toEqual({
            gatewayAccountId: GATEWAY,
            gatewayName: "Cashfree",
            accountType: "bank",
            collected: 20000,
            received: 15000,
            fees: 400,
            outstanding: 4600,
        });
    });

    it("sits a gateway with no settlements at everything still to come", () => {
        const row = serializeGateway({ gatewayAccountId: GATEWAY, gatewayName: "CCAvenue" }, null);
        expect([row.collected, row.received, row.fees, row.outstanding]).toEqual([0, 0, 0, 0]);
    });

    it("builds the cards off the snapshot", () => {
        expect(
            buildPaymentGatewayKpis({
                totalGateways: 2,
                outstandingTotal: 4600,
                awaitingSettlement: 1,
                monthly: { collected: 20000, received: 15000 },
            })
        ).toEqual({
            totalGateways: 2,
            outstandingTotal: 4600,
            awaitingSettlement: 1,
            collectedThisMonth: 20000,
            receivedThisMonth: 15000,
        });
    });

    it("keeps its own cache key", () => {
        expect(BALANCES_CACHE_KEY).toBe("accounting:payment-gateway-balances:v1");
    });

    it("reports nothing rather than guessing when no gateway account has been posted to", async () => {
        sequelizeConfig.query.mockResolvedValue([]);
        await expect(sumCollected({})).resolves.toEqual({});
    });
});

describe("entries that never reached the books", () => {
    it("counts no line of a skipped or never recorded entry", () => {
        [buildCollectedQuery({ gatewayAccountId: "G" })].forEach(sql => {
            ["transaction","refund","adminRefund","cashback","cashbackReversal"].forEach(key => {
                expect(sql).toContain(`JSON_EXTRACT(orders.journalRecordStatus, '$.${key}')) = 'true'`);
                expect(sql).toContain(`JSON_EXTRACT(orders.journalData, '$.${key}.skipped')), 'false') <> 'true'`);
            });
        });
    });
});
