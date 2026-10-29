const sequelizeConfig = require("../../../../configs/database/index");
const {
    WALLET_TYPES,
    buildWalletMovementsQuery,
    buildWalletMovementsCountQuery,
    listWalletMovements,
    serializeWalletMovement,
} = require("../../subscriberWallet");
const { SUBSCRIBER_WALLET_TYPE_LABELS } = require("../../subscriberLedgerExport");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/credential", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/wallet", () => ({ findOne: jest.fn() }));

const RANGE = { from: "2026-09-01 00:00:00", to: "2026-09-19 23:59:59" };

const movement = extra => ({
    id: 4,
    transactionDate: "2026-09-10T06:30:00.000Z",
    entryDate: "2026-09-10",
    reference: "1787561688848",
    category: "Utility",
    providerId: "BBPS",
    remarks: "REFUND",
    service: "Electricity Bill",
    transactionVerdict: "true",
    refundVerdict: "false",
    refundReason: "Account not found",
    cashbackVerdict: "true",
    cashbackReversalVerdict: "true",
    postingDue: 1,
    debitAmount: "0",
    creditAmount: "0",
    movementOrder: 1,
    balanceAfter: "30000.0000",
    ...extra,
});

beforeEach(() => jest.clearAllMocks());

describe("the wallet movements query", () => {
    const sql = buildWalletMovementsQuery({ range: null });

    it("reads each side of a wallet row as its own line, so a purchase and its cashback both show", () => {
        const [debitSide, creditSide] = sql.split(" UNION ALL ");

        expect(debitSide).toContain("transactions.debitAmount, 0 AS creditAmount, 1 AS movementOrder");
        expect(debitSide).toContain("COALESCE(transactions.debitAmount, 0) <> 0");
        expect(creditSide).toContain("0 AS debitAmount, transactions.creditAmount, 2 AS movementOrder");
        expect(creditSide).toContain("COALESCE(transactions.creditAmount, 0) <> 0");
    });

    it("gives the first line of a two-sided row the balance between its two movements", () => {
        expect(sql).toContain("transactions.balance - COALESCE(transactions.creditAmount, 0) AS balanceAfter");
        expect(sql).toContain("transactions.balance AS balanceAfter");
    });

    it("lists newest first with the later side of a row on top, and carries the order and admin detail", () => {
        expect(sql).toContain(
            "ORDER BY transactionDate DESC, id DESC, movementOrder DESC LIMIT :limit OFFSET :offset"
        );
        expect(sql).toContain("LEFT JOIN orders ON orders.corporateTxnId = transactions.corporateTxnId");
        expect(sql).toContain("transactions.remarks");
        expect(sql).toContain("AS cashbackReversalVerdict");
        expect(sql).toContain("AS postingDue");
        expect(sql).not.toContain("transactions.status");
        expect(sql).not.toContain("BETWEEN");
    });

    it("applies the date range to both sides and to the count", () => {
        const ranged = buildWalletMovementsQuery({ range: RANGE });
        const count = buildWalletMovementsCountQuery({ range: RANGE });

        expect(ranged.split("transactions.transactionDate BETWEEN :from AND :to")).toHaveLength(3);
        expect(count).toContain(
            "(SELECT COUNT(*) FROM transactions WHERE transactions.credentialId = :credentialId AND COALESCE(transactions.debitAmount, 0) <> 0 AND transactions.transactionDate BETWEEN :from AND :to)"
        );
        expect(count).toContain("COALESCE(transactions.creditAmount, 0) <> 0");
        expect(count).toContain("AS totalCount");
        expect(buildWalletMovementsCountQuery({ range: null })).not.toContain("BETWEEN");
    });
});

describe("listWalletMovements", () => {
    it("binds the subscriber, the range and the page, and counts every line", async () => {
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(sql.includes("AS totalCount") ? [{ totalCount: "8" }] : [movement()])
        );

        const result = await listWalletMovements({ credentialId: 99, range: RANGE, limit: 10, offset: 20 });

        const [, listOptions] = sequelizeConfig.query.mock.calls[0];
        const [, countOptions] = sequelizeConfig.query.mock.calls[1];
        expect(listOptions.replacements).toEqual({
            credentialId: 99,
            ...RANGE,
            accountingFloor: "9999-12-31",
            limit: 10,
            offset: 20,
        });
        expect(countOptions.replacements).toEqual({ credentialId: 99, ...RANGE });
        expect(result).toEqual({ rows: [movement()], count: 8 });
    });

    it("binds no range when the tab has none", async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        const result = await listWalletMovements({ credentialId: 99, range: null, limit: 10, offset: 0 });

        expect(sequelizeConfig.query.mock.calls[1][1].replacements).toEqual({ credentialId: 99 });
        expect(result.count).toBe(0);
    });
});

describe("the wallet movements filters", () => {
    const armsOf = filters => {
        const [debitArm, creditArm] = buildWalletMovementsQuery(filters).split(" UNION ALL ");
        return { debitArm, creditArm };
    };
    const countOf = filters => buildWalletMovementsCountQuery(filters);
    const NOT_FUNDING =
        "NOT (COALESCE(transactions.transactionCategory, '') IN ('RECHARGE WALLET', 'FUND TRANSFER', 'FUND REVERSAL'))";

    it("adds nothing for no filter, an unknown type or an unknown side", () => {
        const plain = buildWalletMovementsQuery({ range: RANGE });

        expect(buildWalletMovementsQuery({ range: RANGE, type: "transfer", side: "both", searchText: "" })).toBe(plain);
        expect(countOf({ range: RANGE, type: "transfer", side: "both" })).toBe(countOf({ range: RANGE }));
    });

    it("lists the debits as money out: a positive debit side or a negative credit side", () => {
        const { debitArm, creditArm } = armsOf({ side: "debit" });

        expect(debitArm).toContain("AND transactions.debitAmount > 0");
        expect(creditArm).toContain("AND transactions.creditAmount < 0");
        expect(countOf({ side: "debit" })).toContain("transactions.debitAmount > 0");
        expect(countOf({ side: "debit" })).toContain("transactions.creditAmount < 0");
    });

    it("lists the credits as money in: a negative debit side or a positive credit side", () => {
        const { debitArm, creditArm } = armsOf({ side: "credit" });

        expect(debitArm).toContain("AND transactions.debitAmount < 0");
        expect(creditArm).toContain("AND transactions.creditAmount > 0");
        expect(countOf({ side: "credit" })).toContain("transactions.debitAmount < 0");
        expect(countOf({ side: "credit" })).toContain("transactions.creditAmount > 0");
    });

    it.each([
        ["purchase", { debit: `${NOT_FUNDING} AND transactions.debitAmount > 0`, credit: "1 = 0" }],
        ["refund", { debit: `${NOT_FUNDING} AND transactions.debitAmount < 0`, credit: "1 = 0" }],
        ["cashback", { debit: "1 = 0", credit: `${NOT_FUNDING} AND transactions.creditAmount > 0` }],
        ["cashback-reversal", { debit: "1 = 0", credit: `${NOT_FUNDING} AND transactions.creditAmount < 0` }],
    ])("reads the %s type off one side of an order's wallet row, by its sign", (type, { debit, credit }) => {
        const { debitArm, creditArm } = armsOf({ type });

        expect(debitArm).toContain(`AND ${debit}`);
        expect(creditArm).toContain(`AND ${credit}`);
    });

    it.each([
        ["top-up", "RECHARGE WALLET"],
        ["admin-credit", "FUND TRANSFER"],
        ["admin-withdrawal", "FUND REVERSAL"],
    ])("reads the %s type off the category, from either side and either sign", (type, category) => {
        const { debitArm, creditArm } = armsOf({ type });
        const condition = `COALESCE(transactions.transactionCategory, '') = '${category}'`;

        expect(debitArm).toContain(`AND ${condition}`);
        expect(creditArm).toContain(`AND ${condition}`);
        expect(debitArm).not.toContain("1 = 0");
        expect(creditArm).not.toContain("1 = 0");
    });

    it("keeps the type, the side and the date range together", () => {
        const { debitArm } = armsOf({ range: RANGE, type: "refund", side: "credit" });

        expect(debitArm).toContain(
            "transactions.transactionDate BETWEEN :from AND :to AND NOT (COALESCE(transactions.transactionCategory"
        );
        expect(debitArm.match(/transactions\.debitAmount < 0/g)).toHaveLength(2);
    });

    it("searches the reference, the service, and the team member and remark of an admin movement", () => {
        const { debitArm, creditArm } = armsOf({ searchText: "zzz" });

        [debitArm, creditArm].forEach(arm => {
            expect(arm).toContain("transactions.corporateTxnId LIKE :searchText");
            expect(arm).toContain(
                "COALESCE(CONVERT(serviceOperators.serviceProvider USING utf8mb4), CASE WHEN JSON_VALID(orders.orderResponse)"
            );
            expect(arm).toContain(") LIKE :searchText");
            expect(arm).toContain(
                "(COALESCE(transactions.transactionCategory, '') IN ('RECHARGE WALLET', 'FUND TRANSFER', 'FUND REVERSAL') AND (transactions.providerId LIKE :searchText OR transactions.remarks LIKE :searchText))"
            );
            expect(arm).not.toContain("1 = 0");
        });
    });

    it("lets a word that names a type find that type, by the label the table shows", () => {
        const { debitArm, creditArm } = armsOf({ searchText: "cash" });

        expect(debitArm).toContain("OR (1 = 0) OR (1 = 0))");
        expect(creditArm).toContain(`OR (${NOT_FUNDING} AND transactions.creditAmount > 0) OR (${NOT_FUNDING} AND transactions.creditAmount < 0))`);
        expect(armsOf({ searchText: "ADMIN" }).creditArm).toContain(
            "= 'FUND TRANSFER') OR (COALESCE(transactions.transactionCategory, '') = 'FUND REVERSAL'))"
        );
    });

    it("joins the order and its service to count only when a search needs them", () => {
        expect(countOf({ type: "refund" })).not.toContain("LEFT JOIN");
        expect(countOf({ side: "debit" })).not.toContain("LEFT JOIN");
        expect(countOf({ searchText: "hike" })).toContain(
            "FROM transactions LEFT JOIN orders ON orders.corporateTxnId = transactions.corporateTxnId LEFT JOIN serviceOperators"
        );
    });

    it("binds the search to the list and the count, and nothing when there is none", async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        await listWalletMovements({ credentialId: 99, range: null, searchText: "hike", type: "refund", side: "credit", limit: 10, offset: 0 });

        const [listSql, listOptions] = sequelizeConfig.query.mock.calls[0];
        const [countSql, countOptions] = sequelizeConfig.query.mock.calls[1];
        expect(listOptions.replacements).toMatchObject({ credentialId: 99, searchText: "%hike%" });
        expect(countOptions.replacements).toEqual({ credentialId: 99, searchText: "%hike%" });
        expect(listSql).toContain("transactions.debitAmount < 0");
        expect(countSql).toContain("transactions.debitAmount < 0");
    });

    it("words every type as the table does, so a filter never offers a name the table lacks", () => {
        expect(Object.keys(WALLET_TYPES).sort()).toEqual(Object.keys(SUBSCRIBER_WALLET_TYPE_LABELS).sort());
        Object.keys(WALLET_TYPES).forEach(key => {
            expect(WALLET_TYPES[key].label).toBe(SUBSCRIBER_WALLET_TYPE_LABELS[key]);
        });
    });

    // A row the filters select must read, in the table, as the type and side it was asked for.
    it.each([
        ["purchase", { debitAmount: "10" }, "debit", "debitAmount", ">"],
        ["refund", { debitAmount: "-10" }, "credit", "debitAmount", "<"],
        ["cashback", { creditAmount: "5", movementOrder: 2 }, "credit", "creditAmount", ">"],
        ["cashback-reversal", { creditAmount: "-5", movementOrder: 2 }, "debit", "creditAmount", "<"],
        ["top-up", { category: "RECHARGE WALLET", creditAmount: "5", movementOrder: 2 }, "credit", "creditAmount", ">"],
        ["admin-credit", { category: "FUND TRANSFER", creditAmount: "5", movementOrder: 2 }, "credit", "creditAmount", ">"],
        ["admin-credit", { category: "FUND TRANSFER", debitAmount: "-5" }, "credit", "debitAmount", "<"],
        ["admin-withdrawal", { category: "FUND REVERSAL", debitAmount: "5" }, "debit", "debitAmount", ">"],
        ["admin-withdrawal", { category: "FUND REVERSAL", creditAmount: "-5", movementOrder: 2 }, "debit", "creditAmount", "<"],
    ])("selects a %s row only on the side the table shows it on", (type, overrides, side, column, sign) => {
        const entry = serializeWalletMovement(movement(overrides));
        const { debitArm, creditArm } = armsOf({ side });
        const arm = column === "debitAmount" ? debitArm : creditArm;

        expect(entry.type).toBe(WALLET_TYPES[type].label);
        expect(entry[side]).toBeGreaterThan(0);
        expect(entry[side === "debit" ? "credit" : "debit"]).toBeNull();
        expect(arm).toContain(`AND transactions.${column} ${sign} 0`);
    });
});

describe("serializeWalletMovement", () => {
    it("shows wallet money spent on an order as a purchase debit with the order's posting status", () => {
        expect(
            serializeWalletMovement(
                movement({ remarks: "Payment successful", debitAmount: "674.0000", balanceAfter: "24326.0000" })
            )
        ).toEqual({
            id: "4-1",
            transactionDate: "2026-09-10T06:30:00.000Z",
            reference: "1787561688848",
            type: "Purchase",
            particulars: "Purchase — Electricity Bill",
            remark: null,
            debit: 674,
            credit: null,
            balanceAfter: 24326,
            posting: { state: "posted", note: null, detail: null },
        });
    });

    it("shows money back on a refund as a credit and the cashback clawed back as a debit", () => {
        expect(serializeWalletMovement(movement({ debitAmount: "-674.0000" }))).toMatchObject({
            type: "Refund",
            particulars: "Refund — Electricity Bill",
            credit: 674,
            debit: null,
            posting: { state: "notPosted", note: "Books refused it", detail: "Account not found" },
        });
        expect(serializeWalletMovement(movement({ creditAmount: "-12.0000", movementOrder: 2 }))).toMatchObject({
            id: "4-2",
            type: "Cashback reversal",
            particulars: "Cashback reversed — Electricity Bill",
            debit: 12,
            credit: null,
            posting: { state: "posted", note: null, detail: null },
        });
    });

    it("shows cashback earned on an order as a credit", () => {
        expect(serializeWalletMovement(movement({ creditAmount: "12.0000", movementOrder: 2 }))).toMatchObject({
            type: "Cashback",
            particulars: "Cashback — Electricity Bill",
            credit: 12,
            remark: null,
        });
    });

    it("names the team member behind an admin credit or withdrawal and keeps their remark", () => {
        const admin = { category: "FUND TRANSFER", providerId: "Rahul", remarks: "credit note settlement", service: null };

        expect(serializeWalletMovement(movement({ ...admin, creditAmount: "5000", movementOrder: 2 }))).toMatchObject({
            type: "Admin credit",
            particulars: "Funds added by Rahul",
            remark: "credit note settlement",
            credit: 5000,
            posting: { state: "notApplicable", note: null, detail: null },
        });
        expect(
            serializeWalletMovement(
                movement({ ...admin, category: "FUND REVERSAL", remarks: "wrong account", debitAmount: "1000" })
            )
        ).toMatchObject({
            type: "Admin withdrawal",
            particulars: "Funds withdrawn by Rahul",
            remark: "wrong account",
            debit: 1000,
        });
    });

    it("shows a top-up with its remark and no journal state", () => {
        expect(
            serializeWalletMovement(
                movement({
                    category: "RECHARGE WALLET",
                    remarks: "Fund added through gateway",
                    creditAmount: "25000",
                    movementOrder: 2,
                })
            )
        ).toMatchObject({
            type: "Top-up",
            particulars: "Wallet top-up",
            remark: "Fund added through gateway",
            credit: 25000,
            posting: { state: "notApplicable", note: null, detail: null },
        });
    });

    it("waits for an entry only on an order placed after go live", () => {
        const bare = { transactionVerdict: null, debitAmount: "674" };
        expect(serializeWalletMovement(movement(bare)).posting).toEqual({
            state: "notPosted",
            note: "Not recorded yet",
            detail: null,
        });
        expect(serializeWalletMovement(movement({ ...bare, postingDue: 0 })).posting).toEqual({
            state: "notApplicable",
            note: null,
            detail: null,
        });
    });

    it("dashes a balance the ledger never recorded", () => {
        expect(serializeWalletMovement(movement({ debitAmount: "674", balanceAfter: null })).balanceAfter).toBeNull();
    });
});
