const { WALLET_ROW_COLUMNS, walletLines } = require("../../subscriberStatement");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/credential", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/wallet", () => ({ findOne: jest.fn() }));
jest.mock("../../../entities/transaction", () => ({ findAndCountAll: jest.fn() }));

const ledgerRow = extra => ({
    id: 1,
    entryDate: "2026-09-05",
    reference: "TXN-1",
    category: "Electricity",
    debitAmount: "1199.0000",
    creditAmount: "12.0000",
    providerId: "",
    service: "Electricity Bill",
    transactionVerdict: "true",
    cashbackVerdict: "true",
    postingDue: 1,
    ...extra,
});

describe("WALLET_ROW_COLUMNS", () => {
    it("reads the posting of every journal event a line can belong to, and whether the order is past go live", () => {
        expect(WALLET_ROW_COLUMNS).toContain("DATE(transactions.transactionDate) AS entryDate");
        expect(WALLET_ROW_COLUMNS).toContain("JSON_UNQUOTE(JSON_EXTRACT(orders.journalRecordStatus, '$.transaction')) AS transactionVerdict");
        expect(WALLET_ROW_COLUMNS).toContain("JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.refund.skipped')) AS refundSkipped");
        expect(WALLET_ROW_COLUMNS).toContain("JSON_UNQUOTE(JSON_EXTRACT(orders.journalRecordStatus, '$.adminRefund')) AS adminRefundVerdict");
        expect(WALLET_ROW_COLUMNS).toContain("JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.cashback.reason')) AS cashbackReason");
        expect(WALLET_ROW_COLUMNS).toContain("AS cashbackReversalVerdict");
        expect(WALLET_ROW_COLUMNS).toContain(
            "CASE WHEN orders.id IS NOT NULL AND DATE(orders.transactionDate) > :accountingFloor THEN 1 ELSE 0 END AS postingDue"
        );
        expect(WALLET_ROW_COLUMNS).not.toContain("transactions.status");
        expect(WALLET_ROW_COLUMNS).not.toContain("remarks");
    });

    it("falls back to the order's own service name when there is no operator", () => {
        expect(WALLET_ROW_COLUMNS).toContain(
            "CASE WHEN JSON_VALID(orders.orderResponse) THEN JSON_UNQUOTE(JSON_EXTRACT(orders.orderResponse, '$.serviceName')) END"
        );
    });

    it("converts the operator name to utf8mb4 so a latin1 column can meet the json string", () => {
        expect(WALLET_ROW_COLUMNS).toContain(
            "COALESCE(CONVERT(serviceOperators.serviceProvider USING utf8mb4), CASE WHEN"
        );
    });
});

describe("walletLines", () => {
    const shape = row => [row.particulars, row.type, row.debit, row.credit, row.posting.state];

    it("credits a top-up with no journal to post", () => {
        expect(
            walletLines(ledgerRow({ category: "RECHARGE WALLET", debitAmount: "0", creditAmount: "25000.0000", service: null })).map(shape)
        ).toEqual([["Wallet top-up", "Top-up", null, 25000, "notApplicable"]]);
    });

    it("names the admin on a transfer either way", () => {
        expect(
            walletLines(ledgerRow({ category: "FUND TRANSFER", debitAmount: "0", creditAmount: "5000", providerId: "Rahul" })).map(shape)
        ).toEqual([["Funds added by Rahul", "Admin credit", null, 5000, "notApplicable"]]);
        expect(
            walletLines(ledgerRow({ category: "FUND REVERSAL", debitAmount: "5000", creditAmount: "0", providerId: null })).map(shape)
        ).toEqual([["Funds withdrawn by admin", "Admin withdrawal", 5000, null, "notApplicable"]]);
    });

    it("debits a purchase and credits its cashback as two lines", () => {
        expect(walletLines(ledgerRow()).map(shape)).toEqual([
            ["Purchase — Electricity Bill", "Purchase", 1199, null, "posted"],
            ["Cashback — Electricity Bill", "Cashback", null, 12, "posted"],
        ]);
    });

    it("yields only the cashback line for a gateway-only order and nothing for a zero row", () => {
        expect(walletLines(ledgerRow({ debitAmount: "0.0000" })).map(shape)).toEqual([
            ["Cashback — Electricity Bill", "Cashback", null, 12, "posted"],
        ]);
        expect(walletLines(ledgerRow({ debitAmount: "0", creditAmount: "0" }))).toEqual([]);
        expect(walletLines(ledgerRow({ debitAmount: null, creditAmount: null }))).toEqual([]);
    });

    it("reads a refund contra by its negated amounts", () => {
        const contra = ledgerRow({
            entryDate: "2026-09-09",
            debitAmount: "-1199.0000",
            creditAmount: "-12.0000",
            refundVerdict: "true",
            cashbackReversalVerdict: "false",
        });

        expect(walletLines(contra).map(shape)).toEqual([
            ["Refund — Electricity Bill", "Refund", null, 1199, "posted"],
            ["Cashback reversed — Electricity Bill", "Cashback reversal", 12, null, "notPosted"],
        ]);
        expect(walletLines(contra)[1].posting.note).toBe("Books refused it");
    });

    it("handles a partial refund that returned only part of the wallet share", () => {
        const [refund] = walletLines(ledgerRow({ debitAmount: "-500", creditAmount: "0" }));
        expect(shape(refund)).toEqual(["Refund — Electricity Bill", "Refund", null, 500, "notPosted"]);
        expect(refund.posting.note).toBe("Not recorded yet");
    });

    it("reads a refund the team made by hand off its own entry", () => {
        const [refund] = walletLines(
            ledgerRow({
                debitAmount: "-500",
                creditAmount: "0",
                adminRefundVerdict: "false",
                adminRefundSkipped: "true",
                adminRefundReason: "Transaction journal has not been recorded successfully yet",
            })
        );
        expect(refund.posting).toEqual({
            state: "notPosted",
            note: "Waiting for the sale entry",
            detail: "Transaction journal has not been recorded successfully yet",
        });
    });

    it("does not expect an entry for a wallet line whose order predates go live", () => {
        const [purchase] = walletLines(
            ledgerRow({ creditAmount: "0", transactionVerdict: null, postingDue: 0 })
        );
        expect(purchase.posting.state).toBe("notApplicable");
        expect(walletLines(ledgerRow({ creditAmount: "0", postingDue: 0 }))[0].posting.state).toBe("posted");
    });

    it("labels a row with no service as an order and keeps the reference", () => {
        const [line] = walletLines(ledgerRow({ service: null, creditAmount: "0" }));
        expect(line.particulars).toBe("Purchase — Order");
        expect(line.reference).toBe("TXN-1");
        expect(line.date).toBe("2026-09-05");
    });
});

