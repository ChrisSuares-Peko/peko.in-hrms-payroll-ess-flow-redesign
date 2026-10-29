const useCases = require("../../../models/use-cases/paymentGatewayLedger");
const settlements = require("../../../models/use-cases/paymentGatewaySettlements");
const {
    listPaymentGatewayLedger,
    getPaymentGatewayLedger,
    listPaymentGatewayTransactions,
    listPaymentGatewaySettlements,
    getPaymentGatewaySettlementSuggestion,
    createPaymentGatewaySettlement,
    createPaymentGatewayOpeningBalance,
    reversePaymentGatewaySettlement,
    updatePaymentGatewaySettlement,
    deletePaymentGatewaySettlement,
    updatePaymentGatewayFee,
    deletePaymentGatewayFee,
    updatePaymentGatewayOpeningBalance,
    deletePaymentGatewayOpeningBalance,
    tagPaymentGatewaySettlementBooks,
    tagPaymentGatewayFeeBooks,
    getPaymentGatewayStatement,
    exportPaymentGatewayStatement,
    exportPaymentGatewayStatementPdf,
} = require("../paymentGatewayLedger");
const { statementExcelRows } = require("../../../models/use-cases/paymentGatewayStatement");
const { generateExcelBufferAndType } = require("../../../utils/generateExcelBufferAndType");
const { renderPdf } = require("../../../utils/puppeteerPool");
const { ledgerStatementTemplate } = require("../../../utils/ledgerStatementTemplate");
const { openingBeforeGoLive } = require("../../../models/use-cases/accountingPeriod");

jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    openingBeforeGoLive: jest.fn(async () => null),
}));

jest.mock("../../../models/use-cases/paymentGatewayLedger", () => ({
    listGateways: jest.fn(),
    findGatewayById: jest.fn(),
    listGatewayOrders: jest.fn(),
    serializeTransaction: jest.fn(row => ({ id: row.id })),
    getPaymentGatewayLedgerSummary: jest.fn(),
    getPaymentGatewayLedgerSnapshot: jest.fn(),
    serializeGateway: jest.fn(row => ({ gatewayAccountId: row.gatewayAccountId })),
    buildPaymentGatewayKpis: jest.fn(() => ({ totalGateways: 1 })),
}));

jest.mock("../../../models/use-cases/paymentGatewaySettlements", () => ({
    ENTRY_KINDS: { receipt: "RECEIPT", fee: "FEE", opening: "OPENING" },
    RECEIVED_TABLE_KINDS: ["RECEIPT", "OPENING"],
    serializeSettlement: jest.fn(row => ({ id: row.id, entryKind: row.entryKind })),
    listByGateway: jest.fn(),
    createSettlement: jest.fn(),
    createOpeningBalance: jest.fn(),
    findOpeningBalance: jest.fn(),
    reverseSettlement: jest.fn(),
    updateSettlement: jest.fn(),
    deleteSettlement: jest.fn(),
    tagSettlementBooks: jest.fn(),
    findFirstEntryDate: jest.fn(),
}));

jest.mock("../../../models/use-cases/paymentGatewayStatement", () => ({
    PAYMENT_GATEWAY_STATEMENT_CONVENTION: "convention",
    buildPaymentGatewayStatement: jest.fn(),
    statementExcelRows: jest.fn(() => []),
}));

jest.mock("../../../utils/s3", () => ({ uploadFileEncryptedToS3: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));
jest.mock("../../../utils/puppeteerPool", () => ({ renderPdf: jest.fn() }));
jest.mock("../../../utils/generateExcelBufferAndType", () => ({
    generateExcelBufferAndType: jest.fn(),
}));
jest.mock("../../../utils/ledgerStatementTemplate", () => ({
    ledgerStatementTemplate: jest.fn(() => "<html></html>"),
}));

const statementUseCase = require("../../../models/use-cases/paymentGatewayStatement");

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    res.send = jest.fn(() => res);
    res.setHeader = jest.fn();
    return res;
};

const run = async (handler, req) => {
    const res = mockRes();
    const next = jest.fn();
    await handler(req, res, next);
    return { res, next };
};

const USER = { id: 42, name: "Ibrahim" };

const GATEWAY_ID = "4567000000000777";

const GATEWAY = { gatewayAccountId: GATEWAY_ID, gatewayName: "Cashfree" };

const SUMMARY = {
    collected: 20000,
    received: 15000,
    fees: 400,
    outstanding: 4600,
    transactionCount: 14,
    lastReceiptDate: "2026-09-22",
    lastReceiptAmount: 15000,
};

const tabReq = extra => ({
    params: { gatewayId: GATEWAY_ID },
    query: { page: 1, itemsPerPage: 10, searchText: "", ...extra },
    user: USER,
});

const dataOf = res => res.json.mock.calls[0][0].data;

beforeEach(() => {
    jest.clearAllMocks();
    useCases.findGatewayById.mockResolvedValue(GATEWAY);
    useCases.getPaymentGatewayLedgerSummary.mockResolvedValue(SUMMARY);
    useCases.getPaymentGatewayLedgerSnapshot.mockResolvedValue({
        balances: { [GATEWAY_ID]: SUMMARY },
        generatedAt: "2026-09-23T08:30:00.000Z",
        cached: true,
    });
    useCases.listGateways.mockResolvedValue({ rows: [GATEWAY], count: 1 });
    useCases.listGatewayOrders.mockResolvedValue({ rows: [{ id: 7 }], count: 1 });
    settlements.listByGateway.mockResolvedValue({ rows: [], count: 0 });
    settlements.findOpeningBalance.mockResolvedValue(null);
    openingBeforeGoLive.mockResolvedValue(null);
    statementUseCase.buildPaymentGatewayStatement.mockResolvedValue({
        openingBalance: 0,
        totalDebit: 20000,
        totalCredit: 15400,
        closingBalance: 4600,
        rows: [],
        truncated: false,
    });
});

describe("a gateway that is not there", () => {
    it("is a 404 on every handler that needs one", async () => {
        useCases.findGatewayById.mockResolvedValue(null);

        const handlers = [
            getPaymentGatewayLedger,
            listPaymentGatewayTransactions,
            listPaymentGatewaySettlements,
            getPaymentGatewaySettlementSuggestion,
            createPaymentGatewaySettlement,
            reversePaymentGatewaySettlement,
            getPaymentGatewayStatement,
        ];

        for (const handler of handlers) {
            const { next } = await run(handler, {
                ...tabReq(),
                body: { reason: "x", amount: 1, expectedAmount: 1 },
            });
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ status_code: 404 })
            );
        }
    });
});

describe("the list", () => {
    it("positions every gateway off the one snapshot", async () => {
        const { res } = await run(listPaymentGatewayLedger, tabReq());

        expect(dataOf(res).gateways).toEqual([{ gatewayAccountId: GATEWAY_ID }]);
        expect(dataOf(res).kpis).toEqual({ totalGateways: 1 });
        expect(dataOf(res).cached).toBe(true);
    });
});

describe("the two settlement tables", () => {
    it("pages each on five rows of its own and carries the card above them", async () => {
        settlements.listByGateway
            .mockResolvedValueOnce({ rows: [{ id: 1, entryKind: "RECEIPT" }], count: 3 })
            .mockResolvedValueOnce({ rows: [{ id: 2, entryKind: "FEE" }], count: 3 });

        const { res } = await run(
            listPaymentGatewaySettlements,
            tabReq({ page: 2, feePage: 3 })
        );

        const [receiptCall] = settlements.listByGateway.mock.calls[0];
        const [feeCall] = settlements.listByGateway.mock.calls[1];
        // The opening is listed beside the receipts, because it is what they work down.
        expect([receiptCall.entryKind, receiptCall.limit, receiptCall.offset]).toEqual([
            ["RECEIPT", "OPENING"],
            5,
            5,
        ]);
        expect([feeCall.entryKind, feeCall.limit, feeCall.offset]).toEqual(["FEE", 5, 10]);

        const data = dataOf(res);
        expect(data.entries).toEqual([{ id: 1, entryKind: "RECEIPT" }]);
        expect(data.feeEntries).toEqual([{ id: 2, entryKind: "FEE" }]);
        expect(data.transactionCount).toBe(14);
        expect(data.outstanding).toBe(4600);
        expect(data.itemsPerPage).toBe(5);
    });
});

describe("recording a settlement", () => {
    const body = {
        amount: 4200,
        expectedAmount: 4600,
        entryDate: "2026-09-23",
        reference: "SETL-9000",
        mode: "NEFT",
        note: "",
    };

    beforeEach(() => {
        settlements.createSettlement.mockResolvedValue({
            receipt: { id: 3, entryKind: "RECEIPT" },
            fee: { id: 4, entryKind: "FEE" },
        });
    });

    it("works the fee out itself rather than taking one from the client", async () => {
        await run(createPaymentGatewaySettlement, {
            ...tabReq(),
            body: { ...body, feeAmount: 999999 },
        });

        const [args] = settlements.createSettlement.mock.calls[0];
        expect(args.feeAmount).toBe(400);
        expect(args.amount).toBe(4200);
        expect(args.expectedAmount).toBe(4600);
    });

    it("will not let the client claim more was expected than the gateway is holding", async () => {
        await run(createPaymentGatewaySettlement, {
            ...tabReq(),
            body: { ...body, expectedAmount: 99999 },
        });

        const [args] = settlements.createSettlement.mock.calls[0];
        expect(args.expectedAmount).toBe(4600);
    });

    it("accepts a smaller expected amount, so one batch can be settled at a time", async () => {
        await run(createPaymentGatewaySettlement, {
            ...tabReq(),
            body: { ...body, expectedAmount: 1000, amount: 960 },
        });

        const [args] = settlements.createSettlement.mock.calls[0];
        expect([args.expectedAmount, args.amount, args.feeAmount]).toEqual([1000, 960, 40]);
    });

    it("refuses a receipt larger than what it was scoped to", async () => {
        const { next } = await run(createPaymentGatewaySettlement, {
            ...tabReq(),
            body: { ...body, expectedAmount: 1000, amount: 1200 },
        });

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }));
        expect(settlements.createSettlement).not.toHaveBeenCalled();
    });

    it("returns both legs, so the caller can refresh either table", async () => {
        const { res } = await run(createPaymentGatewaySettlement, { ...tabReq(), body });

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json.mock.calls[0][0].data).toEqual({
            receipt: { id: 3, entryKind: "RECEIPT" },
            fee: { id: 4, entryKind: "FEE" },
        });
    });

    it("turns a duplicate reference into a 409 rather than a 500", async () => {
        settlements.createSettlement.mockRejectedValue({
            name: "SequelizeUniqueConstraintError",
        });

        const { next } = await run(createPaymentGatewaySettlement, { ...tabReq(), body });

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }));
    });
});

describe("the suggestion the drawer opens with", () => {
    it("is the same outstanding figure the create endpoint stamps", async () => {
        const { res } = await run(getPaymentGatewaySettlementSuggestion, tabReq());

        expect(dataOf(res).suggestedAmount).toBe(4600);
        expect(dataOf(res).transactionCount).toBe(14);
    });
});

describe("reversing", () => {
    it("returns both contra rows", async () => {
        settlements.reverseSettlement.mockResolvedValue([
            { id: 5, entryKind: "RECEIPT" },
            { id: 6, entryKind: "FEE" },
        ]);

        const { res } = await run(reversePaymentGatewaySettlement, {
            ...tabReq(),
            params: { gatewayId: GATEWAY_ID, id: "1" },
            body: { reason: "wrong gateway" },
        });

        expect(dataOf(res)).toEqual([
            { id: 5, entryKind: "RECEIPT" },
            { id: 6, entryKind: "FEE" },
        ]);
    });

    it("is a 404 when there was nothing live to reverse", async () => {
        settlements.reverseSettlement.mockResolvedValue(null);

        const { next } = await run(reversePaymentGatewaySettlement, {
            ...tabReq(),
            params: { gatewayId: GATEWAY_ID, id: "1" },
            body: { reason: "x" },
        });

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }));
    });
});

describe("the statement", () => {
    it("pages the rows it was handed and names the gateway", async () => {
        statementUseCase.buildPaymentGatewayStatement.mockResolvedValue({
            openingBalance: 0,
            totalDebit: 20000,
            totalCredit: 15400,
            closingBalance: 4600,
            rows: [{ type: "Collected" }, { type: "Received" }, { type: "Fee" }],
            truncated: false,
        });

        const { res } = await run(getPaymentGatewayStatement, tabReq({ page: 1, itemsPerPage: 2 }));

        expect(dataOf(res).gatewayName).toBe("Cashfree");
        expect(dataOf(res).entries).toHaveLength(2);
        expect(dataOf(res).recordsTotal).toBe(3);
    });
});

describe("the opening balance", () => {
    it("is recorded, and refused when it sits below the accounting go live date", async () => {
        settlements.createOpeningBalance.mockResolvedValue({ id: 11, entryKind: "OPENING" });

        const { res } = await run(createPaymentGatewayOpeningBalance, {
            params: { gatewayId: GATEWAY_ID },
            query: {},
            body: { amount: 82000, asOfDate: "2026-09-30", note: "carried in" },
            user: USER,
        });
        expect(res.status).toHaveBeenCalledWith(201);

        openingBeforeGoLive.mockResolvedValue("An opening balance must be dated 2026-09-30 or later");
        const { next } = await run(createPaymentGatewayOpeningBalance, {
            params: { gatewayId: GATEWAY_ID },
            query: {},
            body: { amount: 82000, asOfDate: "2026-08-19", note: "" },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(settlements.createOpeningBalance).toHaveBeenCalledTimes(1);
    });
});

describe("payment gateway transactions — search and Status filter", () => {
    it("passes the search and the status on to the list", async () => {
        await run(listPaymentGatewayTransactions, tabReq({ searchText: "hike", status: "failed" }));

        expect(useCases.listGatewayOrders).toHaveBeenCalledWith(
            expect.objectContaining({ gatewayAccountId: GATEWAY_ID, searchText: "hike", status: "failed" })
        );
    });

    it("sends no status when none was chosen", async () => {
        await run(listPaymentGatewayTransactions, tabReq());

        expect(useCases.listGatewayOrders.mock.calls[0][0].status).toBeUndefined();
    });
});

const LINES = [
    { date: "2026-09-02", particulars: "Collected — Hike", reference: "1791277232985", type: "Collected", debit: 11899, credit: null, balance: 11899 },
    { date: "2026-09-05", particulars: "Settlement received", reference: "UTR-5", type: "Received", debit: null, credit: 10000, balance: 1899 },
    { date: "2026-09-05", particulars: "Charges kept by Cashfree", reference: "BILL-5", type: "Charged", debit: null, credit: 100, balance: 1799 },
    { date: "2026-09-09", particulars: "Refund — Hike", reference: "1791277232985", type: "Refund", debit: null, credit: 11899, balance: -10100 },
];

const FILTERABLE = {
    openingBalance: 0,
    totalDebit: 11899,
    totalCredit: 21999,
    closingBalance: -10100,
    rows: LINES,
    truncated: false,
};

const PERIOD = { from: "2026-09-01", to: "2026-09-19" };

describe("payment gateway statement — search and Debit / Credit filter", () => {
    beforeEach(() => {
        statementUseCase.buildPaymentGatewayStatement.mockResolvedValue(FILTERABLE);
        generateExcelBufferAndType.mockResolvedValue({ buffer: Buffer.from("xlsx"), fileType: "application/vnd.ms-excel" });
        renderPdf.mockResolvedValue(Buffer.from("%PDF"));
    });

    const listWith = async extra => dataOf((await run(getPaymentGatewayStatement, tabReq({ page: 1, ...extra }))).res);
    const particularsOf = data => data.entries.map(entry => entry.particulars);

    it("lists every line, with the period's figures, until something is asked for", async () => {
        const data = await listWith({});

        expect(data.entries).toEqual(LINES);
        expect(data.recordsTotal).toBe(4);
    });

    it("narrows to the debit lines, or the credit lines, and counts only those", async () => {
        const debits = await listWith({ side: "debit" });
        const credits = await listWith({ side: "credit" });

        expect(particularsOf(debits)).toEqual(["Collected — Hike"]);
        expect(debits.recordsTotal).toBe(1);
        expect(particularsOf(credits)).toEqual(["Settlement received", "Charges kept by Cashfree", "Refund — Hike"]);
        expect(credits.recordsTotal).toBe(3);
    });

    it("keeps the figures and the running balance of the whole period when it narrows the lines", async () => {
        const data = await listWith({ side: "credit", searchText: "settlement" });

        expect(data).toMatchObject({
            openingBalance: 0,
            totalDebit: 11899,
            totalCredit: 21999,
            closingBalance: -10100,
            recordsTotal: 1,
        });
        expect(data.entries).toEqual([LINES[1]]);
        expect(data.entries[0].balance).toBe(1899);
    });

    it.each([
        ["the particulars", "charges kept", ["Charges kept by Cashfree"]],
        ["the reference", "UTR-5", ["Settlement received"]],
        ["the type", "refund", ["Refund — Hike"]],
    ])("searches %s", async (_name, searchText, expected) => {
        expect(particularsOf(await listWith({ searchText }))).toEqual(expected);
    });

    it("pages the lines that match, not the whole statement", async () => {
        const second = await listWith({ searchText: "hike", itemsPerPage: 1, page: 2 });

        expect(particularsOf(second)).toEqual(["Refund — Hike"]);
        expect(second.recordsTotal).toBe(2);
    });

    it("keeps the opening and closing lines in the Excel when nothing is filtered", async () => {
        const { res, next } = await run(exportPaymentGatewayStatement, tabReq(PERIOD));

        expect(next).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
        expect(statementExcelRows).toHaveBeenCalledWith({ ...FILTERABLE, rows: LINES }, "Cashfree", "Gateway", {
            markers: true,
        });
    });

    it("lists only the matching lines in the Excel when filtered, without the whole-period opening and closing lines", async () => {
        const { res, next } = await run(
            exportPaymentGatewayStatement,
            tabReq({ ...PERIOD, side: "debit", searchText: "hike" })
        );

        expect(next).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
        expect(statementExcelRows).toHaveBeenCalledWith({ ...FILTERABLE, rows: [LINES[0]] }, "Cashfree", "Gateway", {
            markers: false,
        });
    });

    it("keeps the PDF whole and says nothing of filters when nothing is filtered", async () => {
        const { res, next } = await run(exportPaymentGatewayStatementPdf, tabReq(PERIOD));

        expect(next).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
        expect(ledgerStatementTemplate).toHaveBeenCalledWith(
            expect.objectContaining({ statement: FILTERABLE, filterLabel: "" })
        );
    });

    it("lists only the matching lines in the PDF when filtered, and says which filters were used", async () => {
        const { res, next } = await run(
            exportPaymentGatewayStatementPdf,
            tabReq({ ...PERIOD, side: "credit", searchText: "hike" })
        );

        expect(next).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
        expect(ledgerStatementTemplate).toHaveBeenCalledWith(
            expect.objectContaining({
                statement: { ...FILTERABLE, rows: [LINES[3]] },
                filterLabel: 'Credit only  ·  Search: "hike"',
            })
        );
    });

    it("tells the user when the filters match nothing, instead of sending an empty file", async () => {
        const request = tabReq({ ...PERIOD, searchText: "no such line" });
        const excel = await run(exportPaymentGatewayStatement, request);
        const pdf = await run(exportPaymentGatewayStatementPdf, request);

        [excel, pdf].forEach(({ next, res }) => {
            expect(next.mock.calls[0][0].status_code).toBe(404);
            expect(res.send).not.toHaveBeenCalled();
        });
        expect(generateExcelBufferAndType).not.toHaveBeenCalled();
        expect(renderPdf).not.toHaveBeenCalled();
    });
});

describe("correcting a gateway entry recorded by hand", () => {
    const changeReq = (id, body) => ({ params: { gatewayId: GATEWAY_ID, id }, query: {}, body, user: USER });

    const RECEIPT_EDIT = {
        amount: 14999.999,
        entryDate: "2026-09-23",
        reference: "R-2",
        mode: "NEFT",
        note: "",
        changeReason: "Wrong amount",
    };

    beforeEach(() => {
        useCases.findGatewayById.mockResolvedValue(GATEWAY);
        settlements.findOpeningBalance.mockResolvedValue({ id: 31, entryDate: "2026-08-31" });
        settlements.findFirstEntryDate.mockResolvedValue("2026-09-04");
        openingBeforeGoLive.mockResolvedValue(null);
        settlements.updateSettlement.mockResolvedValue({ outcome: "UPDATED", row: { id: 9, entryKind: "RECEIPT" } });
    });

    it("edits a receipt by its kind, rounding the amount and naming the gateway", async () => {
        const { res } = await run(updatePaymentGatewaySettlement, changeReq("9", RECEIPT_EDIT));

        const [args] = settlements.updateSettlement.mock.calls[0];
        expect(args).toMatchObject({
            id: "9",
            gatewayAccountId: GATEWAY_ID,
            entryKind: "RECEIPT",
            values: { amount: 15000, entryDate: "2026-09-23", reference: "R-2" },
            changeReason: "Wrong amount",
        });
        expect(args.audit).toMatchObject({ configType: "GATEWAY_LEDGER", partnerName: null });
        expect(args.audit.labelOf({ reference: "R-2" })).toBe("Cashfree › Receipt R-2");
        expect(args.audit.labelOf({ entryNumber: "RCT-000002", reference: "R-2" })).toBe("Cashfree › Receipt RCT-000002");
        expect(res.json.mock.calls[0][0].message).toBe("Receipt updated successfully");
    });

    it("edits a fee by its kind and turns a taken reference into a 409", async () => {
        await run(updatePaymentGatewayFee, changeReq("12", { ...RECEIPT_EDIT, amount: 40 }));
        expect(settlements.updateSettlement.mock.calls[0][0]).toMatchObject({ entryKind: "FEE" });

        const conflict = new Error("Validation error");
        conflict.name = "SequelizeUniqueConstraintError";
        settlements.updateSettlement.mockRejectedValueOnce(conflict);
        const { next } = await run(updatePaymentGatewaySettlement, changeReq("9", RECEIPT_EDIT));
        expect(next.mock.calls[0][0].status_code).toBe(409);
        expect(next.mock.calls[0][0].message).toBe("A receipt with reference R-2 is already recorded for this gateway");
    });

    it("passes on the refusal of an entry recorded together with its fee", async () => {
        settlements.deleteSettlement.mockResolvedValue({ outcome: "REFUSED", reason: "This entry was recorded together with its fee, so it can only be reversed" });

        const { next } = await run(deletePaymentGatewaySettlement, changeReq("9", { reason: "Duplicate" }));

        expect(next.mock.calls[0][0].status_code).toBe(409);
        expect(next.mock.calls[0][0].message).toContain("can only be reversed");
    });

    it("deletes a fee and the opening under their kinds", async () => {
        settlements.deleteSettlement.mockResolvedValue({ outcome: "DELETED", row: { id: 12, entryKind: "FEE" } });

        const fee = await run(deletePaymentGatewayFee, changeReq("12", { reason: "Duplicate" }));
        await run(deletePaymentGatewayOpeningBalance, changeReq("31", { reason: "Set twice" }));

        expect(settlements.deleteSettlement.mock.calls.map(([args]) => args.entryKind)).toEqual(["FEE", "OPENING"]);
        expect(settlements.deleteSettlement.mock.calls[1][0].audit.labelOf({})).toBe("Cashfree › Opening balance");
        expect(fee.res.json.mock.calls[0][0].message).toBe("Fee deleted. Mark it removed from the books to take it off the portal");
    });

    it("edits the opening and refuses to move it onto the first entry", async () => {
        const body = { amount: 500, asOfDate: "2026-09-02", note: "", changeReason: "Statement" };

        await run(updatePaymentGatewayOpeningBalance, changeReq("31", body));
        expect(settlements.updateSettlement.mock.calls[0][0]).toMatchObject({
            entryKind: "OPENING",
            values: { amount: 500, entryDate: "2026-09-02", note: "" },
        });

        const onEntry = await run(updatePaymentGatewayOpeningBalance, changeReq("31", { ...body, asOfDate: "2026-09-04" }));
        expect(onEntry.next.mock.calls[0][0].status_code).toBe(400);
        expect(settlements.updateSettlement).toHaveBeenCalledTimes(1);
    });
});

describe("marking a gateway entry as in the books", () => {
    const tagReq = (id, synced) => ({ params: { gatewayId: GATEWAY_ID, id }, query: {}, body: { synced }, user: USER });

    beforeEach(() => {
        useCases.findGatewayById.mockResolvedValue(GATEWAY);
        settlements.tagSettlementBooks.mockResolvedValue({ outcome: "UNCHANGED", row: { id: 9, entryKind: "RECEIPT" } });
    });

    it("keeps the received table to receipts and the opening, and the bills table to fees", async () => {
        const received = await run(tagPaymentGatewaySettlementBooks, tagReq("9", true));
        await run(tagPaymentGatewayFeeBooks, tagReq("12", true));

        expect(settlements.tagSettlementBooks.mock.calls.map(([args]) => args.entryKinds)).toEqual([
            ["RECEIPT", "OPENING"],
            ["FEE"],
        ]);
        const { audit } = settlements.tagSettlementBooks.mock.calls[0][0];
        expect(audit.labelOf({ entryKind: "FEE", reference: "F-1" })).toBe("Cashfree › Fee F-1");
        expect(audit.labelOf({ entryKind: "RECEIPT", entryType: "REVERSAL", reference: "R-1" })).toBe(
            "Cashfree › Receipt R-1 reversal"
        );
        expect(received.res.json.mock.calls[0][0].message).toBe("Entry was already marked that way");
    });
});
