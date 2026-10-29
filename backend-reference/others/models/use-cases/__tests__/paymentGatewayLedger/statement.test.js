const sequelizeConfig = require("../../../../configs/database/index");
const { listAllByGateway } = require("../../paymentGatewaySettlements");
const {
    PAYMENT_GATEWAY_STATEMENT_CONVENTION,
    buildCollectionQuery,
    buildUnpostedCollectionQuery,
    collectionLine,
    settlementLine,
    signedOf,
    buildPaymentGatewayStatement,
} = require("../../paymentGatewayStatement");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/paymentGatewaySettlement", () => ({}));
jest.mock("../../paymentGatewaySettlements", () => ({
    listAllByGateway: jest.fn(),
    ENTRY_KINDS: { receipt: "RECEIPT", fee: "FEE" },
    ENTRY_TYPES: { entry: "ENTRY", reversal: "REVERSAL" },
}));

const GATEWAY = "4567000000000777";

const collection = (entryDate, orderId, direction, amount, eventKey) => ({
    eventKey: eventKey || (direction === "debit" ? "transaction" : "refund"),
    entryDate,
    orderId,
    reference: `G${orderId}`,
    direction,
    amount,
    eventVerdict: "true",
});

const receipt = over => ({
    id: 1,
    settlementId: 1,
    entryKind: "RECEIPT",
    entryType: "ENTRY",
    amount: 15000,
    entryDate: "2026-09-22",
    reference: "SETL-8891",
    mode: "NEFT",
    ...over,
});

const fee = over => ({
    id: 2,
    settlementId: 1,
    entryKind: "FEE",
    entryType: "ENTRY",
    amount: 400,
    entryDate: "2026-09-22",
    reference: "SETL-8891",
    mode: "NEFT",
    ...over,
});

const mockPostedRows = rows =>
    sequelizeConfig.query.mockImplementation(sql => Promise.resolve(sql.includes("AS unposted") ? [] : rows));

beforeEach(() => {
    jest.clearAllMocks();
    listAllByGateway.mockResolvedValue([]);
    mockPostedRows([]);
});

describe("what the statement reads", () => {
    const sql = buildCollectionQuery();

    it("covers every journal event on the gateway's own account", () => {
        expect(sql.split("UNION ALL")).toHaveLength(5);
        expect(sql).toContain("journalLines.accountId = :gatewayAccountId");
        expect(sql).toContain("journalAccountIds.paymentGateway");
    });

    it("drops the orders the gateway never answered on", () => {
        expect(sql).toContain("orders.status <> 'PENDING'");
    });
});

describe("an itemized collection row", () => {
    it("shows the transaction reference and amount collected", () => {
        expect(collectionLine(collection("2026-09-20", 1, "debit", 20000))).toMatchObject({
            date: "2026-09-20",
            particulars: "Collected — G1",
            reference: "G1",
            type: "Collected",
            debit: 20000,
            credit: null,
            posting: { state: "posted", note: null, detail: null },
        });
    });

    it("says why a collection has not reached the books, and marks a receipt as never going there", () => {
        expect(
            collectionLine({ ...collection("2026-09-20", 1, "debit", 20000), eventVerdict: null }).posting
        ).toEqual({ state: "notPosted", note: "Not recorded yet", detail: null });
        expect(settlementLine(receipt()).posting).toEqual({ state: "notApplicable", note: null, detail: null });
    });

    it("shows refunds as individual credit rows", () => {
        expect(
            collectionLine(collection("2026-09-21", 1, "credit", 250, "refund"))
        ).toMatchObject({
            particulars: "Refund — G1",
            reference: "G1",
            type: "Refund",
            debit: null,
            credit: 250,
        });
    });

    it("makes both settlement legs credits, and names each for what it is", () => {
        const received = settlementLine(receipt());
        const charged = settlementLine(fee());

        expect([received.type, received.credit, received.particulars]).toEqual([
            "Received",
            15000,
            "Received — NEFT",
        ]);
        expect([charged.type, charged.credit, charged.particulars]).toEqual([
            "Fee",
            400,
            "Gateway charges",
        ]);
    });

    it("makes a reversal a debit that puts the balance back", () => {
        const row = settlementLine(receipt({ entryType: "REVERSAL", note: "wrong gateway" }));

        expect(row.type).toBe("Reversal");
        expect(row.debit).toBe(15000);
        expect(row.particulars).toContain("wrong gateway");
    });

    it("raises the balance on a debit, because the gateway holding money is a receivable", () => {
        expect(signedOf({ debit: 20000, credit: null })).toBe(20000);
        expect(signedOf({ debit: null, credit: 15000 })).toBe(-15000);
    });
});

describe("itemized collections and settlements", () => {
    it("lists every collection before its receipt and fee", async () => {
        mockPostedRows([
            collection("2026-09-20", 1, "debit", 12000),
            collection("2026-09-21", 2, "debit", 8000),
        ]);
        listAllByGateway.mockResolvedValue([receipt(), fee()]);

        const statement = await buildPaymentGatewayStatement({ gatewayAccountId: GATEWAY });

        expect(statement.rows.map(row => [row.type, row.reference])).toEqual([
            ["Collected", "G1"],
            ["Collected", "G2"],
            ["Received", "SETL-8891"],
            ["Fee", "SETL-8891"],
        ]);
        expect(statement.closingBalance).toBe(4600);
    });

    it("keeps each collection after the last receipt as its own row", async () => {
        mockPostedRows([
            collection("2026-09-20", 1, "debit", 12000),
            collection("2026-09-25", 2, "debit", 5000),
        ]);
        listAllByGateway.mockResolvedValue([receipt({ amount: 12000 }), fee({ amount: 0 })]);

        const statement = await buildPaymentGatewayStatement({ gatewayAccountId: GATEWAY });

        expect(statement.rows.map(row => [row.type, row.reference])).toEqual([
            ["Collected", "G1"],
            ["Received", "SETL-8891"],
            ["Fee", "SETL-8891"],
            ["Collected", "G2"],
        ]);
        expect(statement.closingBalance).toBe(5000);
    });

    it("lists a bill recorded on its own at its own date, not only the fee that came with a receipt", async () => {
        mockPostedRows([collection("2026-09-20", 1, "debit", 12000)]);
        listAllByGateway.mockResolvedValue([
            receipt(),
            fee(),
            fee({ id: 5, settlementId: null, amount: 300, entryDate: "2026-09-25", reference: "BILL-7", mode: "OTHER" }),
            fee({ id: 6, settlementId: null, amount: 120, entryDate: "2026-09-22", reference: "BILL-6", mode: "OTHER" }),
            fee({ id: 7, settlementId: 99, amount: 50, entryDate: "2026-09-26", reference: "BILL-9", mode: "OTHER" }),
        ]);

        const statement = await buildPaymentGatewayStatement({ gatewayAccountId: GATEWAY });

        expect(statement.rows.map(row => [row.type, row.reference, row.credit, row.balance])).toEqual([
            ["Collected", "G1", null, 12000],
            ["Received", "SETL-8891", 15000, -3000],
            ["Fee", "SETL-8891", 400, -3400],
            ["Fee", "BILL-6", 120, -3520],
            ["Fee", "BILL-7", 300, -3820],
            ["Fee", "BILL-9", 50, -3870],
        ]);
        expect(statement.rows.filter(row => row.type === "Fee").map(row => row.particulars)).toEqual([
            "Gateway charges",
            "Gateway charges",
            "Gateway charges",
            "Gateway charges",
        ]);
        expect(statement.closingBalance).toBe(-3870);
    });

    it("shows a reversed bill as its own two lines that net to nothing", async () => {
        mockPostedRows([collection("2026-09-20", 1, "debit", 1000)]);
        listAllByGateway.mockResolvedValue([
            fee({ id: 5, settlementId: null, amount: 300, entryDate: "2026-09-25", reference: "BILL-7", mode: "OTHER", status: "VOIDED" }),
            fee({ id: 8, settlementId: null, amount: 300, entryDate: "2026-09-27", reference: "BILL-7", mode: "OTHER", entryType: "REVERSAL", note: "charged twice" }),
        ]);

        const statement = await buildPaymentGatewayStatement({ gatewayAccountId: GATEWAY });

        expect(statement.rows.map(row => [row.type, row.debit, row.credit])).toEqual([
            ["Collected", 1000, null],
            ["Fee", null, 300],
            ["Reversal", 300, null],
        ]);
        expect(statement.rows[2].particulars).toBe("Gateway charges reversed — charged twice");
        expect(statement.closingBalance).toBe(1000);
    });

    it("never lets a reversal close a period; it only moves the balance", async () => {
        mockPostedRows([collection("2026-09-20", 1, "debit", 20000)]);
        listAllByGateway.mockResolvedValue([
            receipt(),
            fee(),
            receipt({ id: 3, entryType: "REVERSAL", entryDate: "2026-09-24" }),
            fee({ id: 4, entryType: "REVERSAL", entryDate: "2026-09-24" }),
        ]);

        const statement = await buildPaymentGatewayStatement({ gatewayAccountId: GATEWAY });

        expect(statement.rows.filter(row => row.type === "Collected")).toHaveLength(1);
        expect(statement.rows.filter(row => row.type === "Reversal")).toHaveLength(2);
        // Everything reversed, so the whole collection is outstanding again.
        expect(statement.closingBalance).toBe(20000);
    });

    it("opens a ranged view from everything before it rather than restarting at zero", async () => {
        mockPostedRows([
            collection("2026-08-10", 1, "debit", 5000),
            collection("2026-09-20", 2, "debit", 20000),
        ]);
        listAllByGateway.mockResolvedValue([receipt(), fee()]);

        const statement = await buildPaymentGatewayStatement({
            gatewayAccountId: GATEWAY,
            range: { from: "2026-09-01", to: "2026-09-30" },
        });

        expect(statement.openingBalance).toBe(5000);
        expect(statement.rows.length).toBeGreaterThan(0);
    });

    it("states the convention the screen and the PDF both print", () => {
        expect(PAYMENT_GATEWAY_STATEMENT_CONVENTION).toContain("A debit is money the gateway took in");
        expect(PAYMENT_GATEWAY_STATEMENT_CONVENTION).toContain("kept as its charge");
    });
});

describe("entries that never reached the books", () => {
    it("counts no line of a skipped or never recorded entry", () => {
        [buildCollectionQuery()].forEach(sql => {
            ["transaction","refund","adminRefund","cashback","cashbackReversal"].forEach(key => {
                expect(sql).toContain(`JSON_EXTRACT(orders.journalRecordStatus, '$.${key}')) = 'true'`);
                expect(sql).toContain(`JSON_EXTRACT(orders.journalData, '$.${key}.skipped')), 'false') <> 'true'`);
            });
        });
    });
});

describe("entries that never reached the books stay on the statement with a dash", () => {
    it("asks for every event of the gateway's orders that was skipped or never recorded", () => {
        const sql = buildUnpostedCollectionQuery();
        expect(sql).toContain("'transaction' AS eventKey");
        expect(sql).toContain("NULL AS amount");
        expect(sql).toContain("JSON_EXTRACT(orders.journalRecordStatus, '$.transaction')) IS NULL");
        expect(sql).toContain("JSON_EXTRACT(orders.journalData, '$.refund') IS NOT NULL");
        expect(sql).toContain("namedGateway");
        expect(sql).toContain("= :gatewayAccountId");
        expect(sql).toContain("orders.status <> 'PENDING'");
    });

    it("drops the orders that have no journal and predate the floor before it reads any json", () => {
        const sql = buildUnpostedCollectionQuery();
        const branches = sql.split("UNION ALL");

        expect(branches).toHaveLength(5);
        branches.forEach(branch => {
            const prune = branch.indexOf(
                "WHERE (orders.journalData IS NOT NULL OR orders.transactionDate >= DATE_ADD(:accountingFloor, INTERVAL 1 DAY))"
            );
            expect(prune).toBeGreaterThan(-1);
            expect(prune).toBeLessThan(branch.indexOf("= :gatewayAccountId"));
            expect(prune).toBeLessThan(branch.indexOf("'$[0].pgAmount'"));
        });
    });

    it("keeps the balance where it was across a dashed line", async () => {
        sequelizeConfig.query.mockImplementation(sql => Promise.resolve(sql.includes("AS unposted") ? [{ eventKey: "transaction", entryDate: "2026-09-03", orderId: 9, reference: "TXN-9", service: "Flights", eventVerdict: null }] : []));
        const statement = await buildPaymentGatewayStatement({ gatewayAccountId: "G1" });
        expect(statement.rows[0]).toMatchObject({ particulars: "Collected — TXN-9", debit: null, credit: null, balance: 0, posting: { note: "Not recorded yet" } });
        expect(statement.closingBalance).toBe(0);
    });
});
