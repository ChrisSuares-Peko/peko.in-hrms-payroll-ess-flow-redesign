const useCases = require("../../../models/use-cases/partnerLedger");
const payouts = require("../../../models/use-cases/partnerPayouts");
const entries = require("../../../models/use-cases/partnerLedgerEntries");
const statement = require("../../../models/use-cases/partnerStatement");
const { uploadFileEncryptedToS3 } = require("../../../utils/s3");
const {
    listPartnerLedger,
    getPartnerLedger,
    listPartnerTransactions,
    listPartnerSubscriptions,
    listPartnerPayouts,
    getPartnerPayoutSuggestion,
    createPartnerPayout,
    createPartnerOpeningBalance,
    reversePartnerPayout,
    listPartnerDebitNotes,
    createPartnerDebitNote,
    reversePartnerDebitNote,
    updatePartnerPayout,
    deletePartnerPayout,
    updatePartnerOpeningBalance,
    deletePartnerOpeningBalance,
    updatePartnerDebitNote,
    deletePartnerDebitNote,
    tagPartnerPayoutBooks,
    tagPartnerDebitNoteBooks,
    getPartnerStatement,
    exportPartnerStatement,
    exportPartnerStatementPdf,
} = require("../partnerLedger");
const { statementExcelRows } = require("../../../models/use-cases/partnerStatement");
const { generateExcelBufferAndType } = require("../../../utils/generateExcelBufferAndType");
const { renderPdf } = require("../../../utils/puppeteerPool");
const { ledgerStatementTemplate } = require("../../../utils/ledgerStatementTemplate");
const { openingBeforeGoLive } = require("../../../models/use-cases/accountingPeriod");

jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    openingBeforeGoLive: jest.fn(async () => null),
}));

jest.mock("../../../models/use-cases/partnerLedger", () => ({
    listPartners: jest.fn(),
    findPartnerById: jest.fn(),
    listPartnerOrders: jest.fn(),
    serializeTransaction: jest.fn(row => ({ id: row.id, kind: "txn" })),
    serializeSubscription: jest.fn(row => ({ id: row.id, kind: "sub" })),
    getPartnerLedgerSummary: jest.fn(),
    getPartnerLedgerSnapshot: jest.fn(),
    serializePartner: jest.fn(row => ({ credentialId: row.credentialId })),
    buildPartnerKpis: jest.fn(() => ({ totalPartners: 2 })),
}));

jest.mock("../../../models/use-cases/partnerPayouts", () => ({
    ENTRY_KINDS: { payout: "PAYOUT", opening: "OPENING" },
    updatePayout: jest.fn(),
    deletePayout: jest.fn(),
    tagPayoutBooks: jest.fn(),
    findFirstPayoutDate: jest.fn(),
    serializePayout: jest.fn(row => ({ id: row.id })),
    listByPartner: jest.fn(),
    createPayout: jest.fn(),
    createOpeningBalance: jest.fn(),
    findOpeningBalance: jest.fn(),
    reversePayout: jest.fn(),
}));

jest.mock("../../../models/use-cases/partnerLedgerEntries", () => ({
    ENTRY_KINDS: { debitNote: "DEBIT_NOTE" },
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    tagEntryBooks: jest.fn(),
    findFirstEntryDate: jest.fn(),
    serializeEntry: jest.fn(row => ({ id: row.id, kind: "debitNote" })),
    listByPartner: jest.fn(),
    createEntry: jest.fn(),
    reverseEntry: jest.fn(),
    findEntry: jest.fn(),
}));

jest.mock("../../../models/use-cases/partnerStatement", () => ({
    PARTNER_STATEMENT_CONVENTION: "convention",
    buildPartnerStatement: jest.fn(),
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

const PARTNER = { credentialId: 55, systemUserId: 11, partnerName: "Gulf Reach" };

const SUMMARY = {
    earned: 153.4,
    paid: 30,
    debitNotes: 0,
    owed: 123.4,
    lastPayoutDate: "2026-09-10",
    lastPayoutAmount: 30,
    partnershipAccountConfigured: true,
};

const tabReq = extra => ({
    params: { partnerId: "55" },
    query: { page: 2, itemsPerPage: 10, searchText: "", ...extra },
    user: USER,
});

const dataOf = res => res.json.mock.calls[0][0].data;

beforeEach(() => {
    jest.clearAllMocks();
    useCases.findPartnerById.mockResolvedValue(PARTNER);
    useCases.getPartnerLedgerSummary.mockResolvedValue(SUMMARY);
    payouts.findOpeningBalance.mockResolvedValue(null);
    openingBeforeGoLive.mockResolvedValue(null);
    useCases.listPartnerOrders.mockResolvedValue({ rows: [{ id: 7 }], count: 31 });
    payouts.listByPartner.mockResolvedValue({ rows: [{ id: 3 }], count: 1 });
    entries.listByPartner.mockResolvedValue({ rows: [{ id: 5 }], count: 1 });
});

describe("partner ledger controller", () => {
    it("lists partners with their balances and cards", async () => {
        useCases.getPartnerLedgerSnapshot.mockResolvedValue({
            balances: { 55: { owed: 123.4 } },
            partnershipAccountConfigured: true,
            generatedAt: "2026-09-22T08:30:00.000Z",
            cached: true,
        });
        useCases.listPartners.mockResolvedValue({ rows: [PARTNER], count: 2 });

        const { res } = await run(listPartnerLedger, {
            query: { page: 1, itemsPerPage: 10, searchText: "gulf", sort: "ASC", sortField: "partnerName", refresh: false },
            user: USER,
        });

        expect(useCases.getPartnerLedgerSnapshot).toHaveBeenCalledWith({ refresh: false });
        expect(dataOf(res)).toEqual({
            partners: [{ credentialId: 55 }],
            recordsTotal: 2,
            page: 1,
            itemsPerPage: 10,
            kpis: { totalPartners: 2 },
            partnershipAccountConfigured: true,
            generatedAt: "2026-09-22T08:30:00.000Z",
            cached: true,
        });
    });

    it("404s every partner scoped route when the partner is missing", async () => {
        useCases.findPartnerById.mockResolvedValue(null);

        const handlers = [
            getPartnerLedger,
            listPartnerTransactions,
            listPartnerSubscriptions,
            listPartnerPayouts,
            getPartnerPayoutSuggestion,
            listPartnerDebitNotes,
            createPartnerDebitNote,
            reversePartnerDebitNote,
            getPartnerStatement,
        ];

        await Promise.all(
            handlers.map(async handler => {
                const { next } = await run(handler, tabReq());
                expect(next).toHaveBeenCalledWith(
                    expect.objectContaining({ message: "Partner not found", status_code: 404 })
                );
            })
        );
    });

    it("pages the transactions and shapes them as transactions", async () => {
        const { res } = await run(listPartnerTransactions, tabReq());

        expect(useCases.listPartnerOrders).toHaveBeenCalledWith(
            expect.objectContaining({ partnerId: 55, subscriptions: false, limit: 10, offset: 10 })
        );
        expect(dataOf(res).entries).toEqual([{ id: 7, kind: "txn" }]);
        expect(dataOf(res).recordsTotal).toBe(31);
    });

    it("asks for the subscriptions on the other tab", async () => {
        const { res } = await run(listPartnerSubscriptions, tabReq());

        expect(useCases.listPartnerOrders).toHaveBeenCalledWith(
            expect.objectContaining({ subscriptions: true })
        );
        expect(dataOf(res).entries).toEqual([{ id: 7, kind: "sub" }]);
    });

    it("puts what is owed and the last payment beside the payouts", async () => {
        const { res } = await run(listPartnerPayouts, tabReq());

        expect(dataOf(res)).toMatchObject({
            entries: [{ id: 3 }],
            recordsTotal: 1,
            owed: 123.4,
            earned: 153.4,
            paid: 30,
            debitNotes: 0,
            lastPayoutDate: "2026-09-10",
            lastPayoutAmount: 30,
        });
    });

    it("suggests what is owed, unscoped by any date filter", async () => {
        const { res } = await run(getPartnerPayoutSuggestion, tabReq({ from: "2026-09-01", to: "2026-09-30" }));

        expect(useCases.getPartnerLedgerSummary).toHaveBeenCalledWith(55, null);
        expect(dataOf(res)).toMatchObject({ suggestedAmount: 123.4, earned: 153.4, paid: 30 });
    });

    it("stamps the payout with the figure the server worked out, not the one sent", async () => {
        payouts.createPayout.mockResolvedValue({ id: 9 });

        const { res } = await run(createPartnerPayout, {
            params: { partnerId: "55" },
            query: {},
            body: { amount: 100, payoutDate: "2026-09-20", reference: "NEFT-2", mode: "NEFT", note: "", calculatedAmount: 1 },
            user: USER,
        });

        expect(payouts.createPayout).toHaveBeenCalledWith(
            expect.objectContaining({
                partnerCredentialId: 55,
                calculatedAmount: 123.4,
                amount: 100,
                reference: "NEFT-2",
                actor: { id: 42, name: "Ibrahim" },
            })
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("turns a duplicate reference into a conflict rather than a crash", async () => {
        const duplicate = new Error("duplicate");
        duplicate.name = "SequelizeUniqueConstraintError";
        payouts.createPayout.mockRejectedValue(duplicate);

        const { next } = await run(createPartnerPayout, {
            params: { partnerId: "55" },
            query: {},
            body: { amount: 100, payoutDate: "2026-09-20", reference: "NEFT-2" },
            user: USER,
        });

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }));
    });

    it("stores only the s3 key of a slip, never the file", async () => {
        uploadFileEncryptedToS3.mockResolvedValue("s3/partner-key");
        payouts.createPayout.mockResolvedValue({ id: 9 });

        await run(createPartnerPayout, {
            params: { partnerId: "55" },
            query: {},
            body: {
                amount: 100,
                payoutDate: "2026-09-20",
                reference: "NEFT-3",
                slipBase64: "data:application/pdf;base64,AAAA",
                slipName: "slip.pdf",
                slipFormat: "pdf",
            },
            user: USER,
        });

        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith("AAAA", expect.any(String), "pdf");
        expect(payouts.createPayout.mock.calls[0][0].slip).toEqual({
            key: "s3/partner-key",
            name: "slip.pdf",
            format: "pdf",
        });
    });

    it("404s a payout that is already reversed", async () => {
        payouts.reversePayout.mockResolvedValue(null);

        const { next } = await run(reversePartnerPayout, {
            params: { partnerId: "55", id: "3" },
            query: {},
            body: { reason: "sent twice" },
            user: USER,
        });

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Payout not found or already reversed" })
        );
    });

    it("pages the statement in memory and keeps its totals whole", async () => {
        statement.buildPartnerStatement.mockResolvedValue({
            openingBalance: 0,
            totalDebit: 30,
            totalCredit: 153.4,
            closingBalance: 123.4,
            rows: [{ type: "Earned" }, { type: "Payout" }, { type: "Accrued" }],
            truncated: false,
        });

        const { res } = await run(getPartnerStatement, tabReq({ page: 1, itemsPerPage: 2 }));

        expect(dataOf(res)).toMatchObject({
            partnerName: "Gulf Reach",
            closingBalance: 123.4,
            recordsTotal: 3,
            truncated: false,
        });
        expect(dataOf(res).entries).toHaveLength(2);
    });

    it("covers the whole of the to day rather than cutting it off at midnight", async () => {
        await run(listPartnerTransactions, tabReq({ from: "2026-08-19", to: "2026-09-19" }));

        expect(useCases.listPartnerOrders.mock.calls[0][0].range).toEqual({
            from: "2026-08-19 00:00:00",
            to: "2026-09-19 23:59:59",
        });
    });

    it("records an opening balance and refuses one below the accounting go live date", async () => {
        payouts.createOpeningBalance.mockResolvedValue({ id: 11, entryKind: "OPENING" });

        const { res } = await run(createPartnerOpeningBalance, {
            params: { partnerId: "55" },
            query: {},
            body: { amount: 4500, asOfDate: "2026-09-30", note: "carried in" },
            user: USER,
        });
        expect(res.status).toHaveBeenCalledWith(201);

        openingBeforeGoLive.mockResolvedValue("An opening balance must be dated 2026-09-30 or later");
        const { next } = await run(createPartnerOpeningBalance, {
            params: { partnerId: "55" },
            query: {},
            body: { amount: 4500, asOfDate: "2026-08-19", note: "" },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(payouts.createOpeningBalance).toHaveBeenCalledTimes(1);
    });
});

describe("partner tab search and filters", () => {
    const query = { searchText: "air", status: "failed", mode: "UPI" };

    it("passes the search and the status on to the debit notes list, scoped to that kind", async () => {
        await run(listPartnerDebitNotes, tabReq(query));

        expect(entries.listByPartner).toHaveBeenCalledWith(
            expect.objectContaining({
                partnerCredentialId: 55,
                kind: "DEBIT_NOTE",
                searchText: "air",
                status: "failed",
                limit: 10,
                offset: 10,
            })
        );
        expect(entries.listByPartner.mock.calls[0][0].mode).toBeUndefined();
    });

    it("passes the search and the status on to both order tabs, the same on each", async () => {
        await run(listPartnerTransactions, tabReq(query));
        await run(listPartnerSubscriptions, tabReq(query));

        useCases.listPartnerOrders.mock.calls.forEach(([args]) => {
            expect(args).toMatchObject({ partnerId: 55, searchText: "air", status: "failed" });
        });
    });

    it("passes the search, the status and the mode on to the payments list", async () => {
        await run(listPartnerPayouts, tabReq(query));

        expect(payouts.listByPartner).toHaveBeenCalledWith(
            expect.objectContaining({ partnerCredentialId: 55, searchText: "air", status: "failed", mode: "UPI" })
        );
    });

    it("sends no status or mode to a list when none was chosen", async () => {
        await run(listPartnerPayouts, tabReq());

        const args = payouts.listByPartner.mock.calls[0][0];
        expect([args.status, args.mode]).toEqual([undefined, undefined]);
        expect(args.searchText).toBe("");
    });
});

describe("partner debit notes", () => {
    const body = { reference: "DN-1", amount: 150, issueDate: "2026-10-07", reason: "", againstCorporateTxnId: "" };

    it("lists the partner's debit notes, shaped as entries, with the page asked for", async () => {
        const { res } = await run(listPartnerDebitNotes, tabReq());

        expect(dataOf(res)).toEqual({ entries: [{ id: 5, kind: "debitNote" }], recordsTotal: 1, page: 2, itemsPerPage: 10 });
    });

    it("records a debit note under its own kind, stamped with who did it", async () => {
        entries.createEntry.mockResolvedValue({ id: 9 });

        const { res } = await run(createPartnerDebitNote, { params: { partnerId: "55" }, query: {}, body, user: USER });

        expect(entries.createEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                partnerCredentialId: 55,
                kind: "DEBIT_NOTE",
                reference: "DN-1",
                amount: 150,
                issueDate: "2026-10-07",
                gstInclusive: true,
                gstRate: 18,
                taxableAmount: 127.12,
                gstAmount: 22.88,
                slip: null,
                actor: { id: 42, name: "Ibrahim" },
            })
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(dataOf(res)).toEqual({ id: 9, kind: "debitNote" });
    });

    it("refuses a debit note dated on or before the opening balance", async () => {
        payouts.findOpeningBalance.mockResolvedValue({ payoutDate: "2026-10-07" });

        const { next } = await run(createPartnerDebitNote, { params: { partnerId: "55" }, query: {}, body, user: USER });

        expect(next.mock.calls[0][0]).toMatchObject({
            status_code: 400,
            message: "A debit note must be dated after the opening balance of 2026-10-07",
        });
        expect(entries.createEntry).not.toHaveBeenCalled();
    });

    it("turns a duplicate reference into a conflict rather than a crash", async () => {
        const duplicate = new Error("duplicate");
        duplicate.name = "SequelizeUniqueConstraintError";
        entries.createEntry.mockRejectedValue(duplicate);

        const { next } = await run(createPartnerDebitNote, { params: { partnerId: "55" }, query: {}, body, user: USER });

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ status_code: 409, message: "This debit note is already recorded for this partner" })
        );
    });

    it("stores only the s3 key of an attached document, never the file", async () => {
        uploadFileEncryptedToS3.mockResolvedValue("s3/partner-note");
        entries.createEntry.mockResolvedValue({ id: 9 });

        await run(createPartnerDebitNote, {
            params: { partnerId: "55" },
            query: {},
            body: { ...body, slipBase64: "data:application/pdf;base64,AAAA", slipName: "note.pdf", slipFormat: "pdf" },
            user: USER,
        });

        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith("AAAA", expect.any(String), "pdf");
        expect(entries.createEntry.mock.calls[0][0].slip).toEqual({ key: "s3/partner-note", name: "note.pdf", format: "pdf" });
    });

    it("reverses a debit note of that kind with a reason, and 404s one already reversed", async () => {
        entries.reverseEntry.mockResolvedValueOnce({ id: 10 }).mockResolvedValueOnce(null);
        const req = { params: { partnerId: "55", id: "5" }, query: {}, body: { reason: "raised twice" }, user: USER };

        const { res } = await run(reversePartnerDebitNote, req);
        expect(entries.reverseEntry).toHaveBeenCalledWith({
            id: "5",
            partnerCredentialId: 55,
            kind: "DEBIT_NOTE",
            reason: "raised twice",
            actor: { id: 42, name: "Ibrahim" },
        });
        expect(dataOf(res)).toEqual({ id: 10, kind: "debitNote" });

        const { next } = await run(reversePartnerDebitNote, req);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Debit note not found or already reversed", status_code: 404 })
        );
    });
});

const LINES = [
    { date: "2026-09-02", particulars: "Opening balance", reference: null, type: "Opening", debit: null, credit: 500, balance: 500 },
    { date: "2026-09-05", particulars: "Earned — Air Ticket", reference: "1789571685589", type: "Earned", debit: null, credit: 103.58, balance: 603.58 },
    { date: "2026-09-10", particulars: "Payout — NEFT", reference: "UTR-77", type: "Payout", debit: 300, credit: null, balance: 303.58 },
    { date: "2026-09-12", particulars: "Refund — Air Ticket", reference: "1789571685589", type: "Refund", debit: 20, credit: null, balance: 283.58 },
];

const FILTERABLE = {
    openingBalance: 0,
    totalDebit: 320,
    totalCredit: 603.58,
    closingBalance: 283.58,
    rows: LINES,
    truncated: false,
};

const PERIOD = { from: "2026-09-01", to: "2026-09-19" };

describe("partner statement — search and Debit / Credit filter", () => {
    beforeEach(() => {
        statement.buildPartnerStatement.mockResolvedValue(FILTERABLE);
        generateExcelBufferAndType.mockResolvedValue({ buffer: Buffer.from("xlsx"), fileType: "application/vnd.ms-excel" });
        renderPdf.mockResolvedValue(Buffer.from("%PDF"));
    });

    const listWith = async extra => dataOf((await run(getPartnerStatement, tabReq({ page: 1, ...extra }))).res);
    const particularsOf = data => data.entries.map(entry => entry.particulars);

    it("lists every line, with the period's figures, until something is asked for", async () => {
        const data = await listWith({});

        expect(data.entries).toEqual(LINES);
        expect(data.recordsTotal).toBe(4);
    });

    it("narrows to the debit lines, or the credit lines, and counts only those", async () => {
        const debits = await listWith({ side: "debit" });
        const credits = await listWith({ side: "credit" });

        expect(particularsOf(debits)).toEqual(["Payout — NEFT", "Refund — Air Ticket"]);
        expect(debits.recordsTotal).toBe(2);
        expect(particularsOf(credits)).toEqual(["Opening balance", "Earned — Air Ticket"]);
        expect(credits.recordsTotal).toBe(2);
    });

    it("keeps the figures and the running balance of the whole period when it narrows the lines", async () => {
        const data = await listWith({ side: "debit", searchText: "payout" });

        expect(data).toMatchObject({ openingBalance: 0, totalDebit: 320, totalCredit: 603.58, closingBalance: 283.58, recordsTotal: 1 });
        expect(data.entries).toEqual([LINES[2]]);
        expect(data.entries[0].balance).toBe(303.58);
    });

    it.each([
        ["the particulars", "air ticket", ["Earned — Air Ticket", "Refund — Air Ticket"]],
        ["the reference", "UTR-77", ["Payout — NEFT"]],
        ["the type", "opening", ["Opening balance"]],
    ])("searches %s", async (_name, searchText, expected) => {
        expect(particularsOf(await listWith({ searchText }))).toEqual(expected);
    });

    it("pages the lines that match, not the whole statement", async () => {
        const second = await listWith({ searchText: "air", itemsPerPage: 1, page: 2 });

        expect(particularsOf(second)).toEqual(["Refund — Air Ticket"]);
        expect(second.recordsTotal).toBe(2);
    });

    it("keeps the opening and closing lines in the Excel when nothing is filtered", async () => {
        const { res, next } = await run(exportPartnerStatement, tabReq(PERIOD));

        expect(next).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
        expect(statementExcelRows).toHaveBeenCalledWith({ ...FILTERABLE, rows: LINES }, "Gulf Reach", "Partner", {
            markers: true,
        });
    });

    it("lists only the matching lines in the Excel when filtered, without the whole-period opening and closing lines", async () => {
        const { res, next } = await run(
            exportPartnerStatement,
            tabReq({ ...PERIOD, side: "credit", searchText: "air" })
        );

        expect(next).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
        expect(statementExcelRows).toHaveBeenCalledWith({ ...FILTERABLE, rows: [LINES[1]] }, "Gulf Reach", "Partner", {
            markers: false,
        });
    });

    it("keeps the PDF whole and says nothing of filters when nothing is filtered", async () => {
        const { res, next } = await run(exportPartnerStatementPdf, tabReq(PERIOD));

        expect(next).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
        expect(ledgerStatementTemplate).toHaveBeenCalledWith(
            expect.objectContaining({ statement: FILTERABLE, filterLabel: "" })
        );
    });

    it("lists only the matching lines in the PDF when filtered, and says which filters were used", async () => {
        const { res, next } = await run(
            exportPartnerStatementPdf,
            tabReq({ ...PERIOD, side: "debit", searchText: "air" })
        );

        expect(next).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
        expect(ledgerStatementTemplate).toHaveBeenCalledWith(
            expect.objectContaining({
                statement: { ...FILTERABLE, rows: [LINES[3]] },
                filterLabel: 'Debit only  ·  Search: "air"',
            })
        );
    });

    it("tells the user when the filters match nothing, instead of sending an empty file", async () => {
        const request = tabReq({ ...PERIOD, searchText: "no such line" });
        const excel = await run(exportPartnerStatement, request);
        const pdf = await run(exportPartnerStatementPdf, request);

        [excel, pdf].forEach(({ next, res }) => {
            expect(next.mock.calls[0][0].status_code).toBe(404);
            expect(res.send).not.toHaveBeenCalled();
        });
        expect(generateExcelBufferAndType).not.toHaveBeenCalled();
        expect(renderPdf).not.toHaveBeenCalled();
    });
});

describe("correcting a partner entry recorded by hand", () => {
    const changeReq = (id, body) => ({ params: { partnerId: "55", id }, query: {}, body, user: USER });

    const PAYOUT_EDIT = {
        amount: 450,
        payoutDate: "2026-09-25",
        reference: "P-2",
        mode: "NEFT",
        note: "",
        changeReason: "Bank kept a charge",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useCases.findPartnerById.mockResolvedValue(PARTNER);
        payouts.findOpeningBalance.mockResolvedValue({ id: 21, payoutDate: "2026-08-31" });
        payouts.findFirstPayoutDate.mockResolvedValue("2026-09-05");
        entries.findFirstEntryDate.mockResolvedValue("2026-09-03");
        openingBeforeGoLive.mockResolvedValue(null);
    });

    it("edits a payout by its kind, labelled with the partner and kept under the partner's name", async () => {
        payouts.updatePayout.mockResolvedValue({ outcome: "UPDATED", row: { id: 4 } });

        const { res } = await run(updatePartnerPayout, changeReq("4", PAYOUT_EDIT));

        const [args] = payouts.updatePayout.mock.calls[0];
        expect(args).toMatchObject({
            id: "4",
            partnerCredentialId: 55,
            entryKind: "PAYOUT",
            values: { amount: 450, payoutDate: "2026-09-25", reference: "P-2" },
            changeReason: "Bank kept a charge",
        });
        expect(args.audit).toMatchObject({ configType: "PARTNER_LEDGER", partnerName: "Gulf Reach" });
        expect(args.audit.labelOf({ reference: "P-2" })).toBe("Gulf Reach › Payout P-2");
        expect(args.audit.labelOf({ entryNumber: "PAY-000002", reference: "P-2" })).toBe("Gulf Reach › Payout PAY-000002");
        expect(res.json.mock.calls[0][0].message).toBe("Payout updated successfully");
    });

    it("refuses a payout moved on or before the opening, and a missing partner", async () => {
        const early = await run(updatePartnerPayout, changeReq("4", { ...PAYOUT_EDIT, payoutDate: "2026-08-31" }));
        expect(early.next.mock.calls[0][0].status_code).toBe(400);

        useCases.findPartnerById.mockResolvedValue(null);
        const missing = await run(deletePartnerPayout, changeReq("4", { reason: "Duplicate" }));
        expect(missing.next.mock.calls[0][0].status_code).toBe(404);
        expect(payouts.updatePayout).not.toHaveBeenCalled();
        expect(payouts.deletePayout).not.toHaveBeenCalled();
    });

    it("edits the opening under its own kind and refuses to move it onto the first entry", async () => {
        payouts.updatePayout.mockResolvedValue({ outcome: "UPDATED", row: { id: 21 } });
        const body = { amount: 900, asOfDate: "2026-09-01", note: "", changeReason: "Statement" };

        await run(updatePartnerOpeningBalance, changeReq("21", body));
        expect(payouts.updatePayout.mock.calls[0][0]).toMatchObject({
            entryKind: "OPENING",
            values: { amount: 900, payoutDate: "2026-09-01", note: "" },
        });

        const onEntry = await run(updatePartnerOpeningBalance, changeReq("21", { ...body, asOfDate: "2026-09-03" }));
        expect(onEntry.next.mock.calls[0][0].message).toContain("before the first entry on this ledger, 2026-09-03");
        expect(payouts.updatePayout).toHaveBeenCalledTimes(1);
    });

    it("deletes the opening and a payout under their kinds", async () => {
        payouts.deletePayout.mockResolvedValue({ outcome: "DELETED", row: { id: 21 } });

        await run(deletePartnerOpeningBalance, changeReq("21", { reason: "Set twice" }));
        const { res } = await run(deletePartnerPayout, changeReq("4", { reason: "Duplicate" }));

        expect(payouts.deletePayout.mock.calls.map(([args]) => args.entryKind)).toEqual(["OPENING", "PAYOUT"]);
        expect(payouts.deletePayout.mock.calls[1][0].changeReason).toBe("Duplicate");
        expect(res.json.mock.calls[0][0].message).toBe("Payout deleted. Mark it removed from the books to take it off the portal");
    });

    it("edits and deletes a debit note, and says when it was already reversed", async () => {
        entries.updateEntry.mockResolvedValue({ outcome: "UPDATED", row: { id: 6 } });
        entries.deleteEntry.mockResolvedValue({ outcome: "REVERSED" });
        const body = { reference: "DN-2", amount: 50, issueDate: "2026-09-26", reason: "", againstCorporateTxnId: "", changeReason: "Typo" };

        const edited = await run(updatePartnerDebitNote, changeReq("6", body));
        const deleted = await run(deletePartnerDebitNote, changeReq("6", { reason: "Duplicate" }));

        expect(entries.updateEntry.mock.calls[0][0]).toMatchObject({ kind: "DEBIT_NOTE", partnerCredentialId: 55 });
        expect(entries.updateEntry.mock.calls[0][0].values).toMatchObject({
            amount: 50,
            gstInclusive: true,
            gstRate: 18,
            taxableAmount: 42.37,
            gstAmount: 7.63,
        });
        expect(entries.updateEntry.mock.calls[0][0].audit.labelOf({ reference: "DN-2" })).toBe("Gulf Reach › Debit note DN-2");
        expect(entries.updateEntry.mock.calls[0][0].audit.labelOf({ entryNumber: "PDN-000002", reference: "DN-2" })).toBe(
            "Gulf Reach › Debit note PDN-000002"
        );
        expect(edited.res.json.mock.calls[0][0].message).toBe("Debit note updated successfully");
        expect(deleted.next.mock.calls[0][0].status_code).toBe(409);
    });
});

describe("marking a partner entry as in the books", () => {
    const tagReq = (id, synced) => ({ params: { partnerId: "55", id }, query: {}, body: { synced }, user: USER });

    beforeEach(() => {
        jest.clearAllMocks();
        useCases.findPartnerById.mockResolvedValue(PARTNER);
    });

    it("marks a payout under the partner's name, and a debit note by its kind", async () => {
        payouts.tagPayoutBooks.mockResolvedValue({ outcome: "UPDATED", row: { id: 4, booksSynced: true } });
        entries.tagEntryBooks.mockResolvedValue({ outcome: "REMOVED", row: { id: 6 } });

        const payout = await run(tagPartnerPayoutBooks, tagReq("4", true));
        const debitNote = await run(tagPartnerDebitNoteBooks, tagReq("6", true));

        const [args] = payouts.tagPayoutBooks.mock.calls[0];
        expect(args).toMatchObject({ id: "4", partnerCredentialId: 55, synced: true });
        expect(args.audit).toMatchObject({ configType: "PARTNER_LEDGER", partnerName: "Gulf Reach" });
        expect(args.audit.labelOf({ entryKind: "OPENING" })).toBe("Gulf Reach › Opening balance");
        expect(entries.tagEntryBooks.mock.calls[0][0]).toMatchObject({ kind: "DEBIT_NOTE" });
        expect(payout.res.json.mock.calls[0][0].message).toBe("Entry marked as in the books");
        expect(debitNote.res.json.mock.calls[0][0].message).toBe("Debit note removed from the portal");
    });

    it("404s a missing partner without marking anything", async () => {
        useCases.findPartnerById.mockResolvedValue(null);

        const { next } = await run(tagPartnerPayoutBooks, tagReq("4", true));

        expect(next.mock.calls[0][0].status_code).toBe(404);
        expect(payouts.tagPayoutBooks).not.toHaveBeenCalled();
    });
});
