jest.mock("../../entities/order", () => ({ findAndCountAll: jest.fn() }));
jest.mock("../../entities/serviceOperator", () => ({}));
jest.mock("../../entities/credential", () => ({}));

const orders = require("../../entities/order");
const { listOrderJournals, journalStatusText, orderJournalExportColumns } = require("../orderJournals");

const ROW = {
    transactionDate: "2026-09-24T06:14:02.000Z",
    corporateTxnId: "1791277831861",
    credential: { username: "100000919" },
    serviceOperator: { serviceProvider: "Peko Go" },
    order: {
        amountInINR: "1155.2700",
        paymentMode: "WALLET",
        status: "SUCCESS",
        journalRecordStatus: { transaction: true },
        journalData: null,
    },
    documents: { subscriber: { invoice: true, planInvoice: false, receipt: true }, vendor: { invoice: false } },
};

const cellsOf = row => orderJournalExportColumns().map(column => column.value(row));

beforeEach(() => jest.clearAllMocks());

describe("listOrderJournals", () => {
    it("asks for the page it was given, keeping orders that have no service or customer", async () => {
        orders.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await listOrderJournals({ where: { a: 1 }, order: [["transactionDate", "DESC"]], limit: 10, offset: 20 });

        const query = orders.findAndCountAll.mock.calls[0][0];
        expect(query).toMatchObject({ where: { a: 1 }, order: [["transactionDate", "DESC"]], limit: 10, offset: 20 });
        expect(query.include.map(join => join.required)).toEqual([false, false]);
    });
});

describe("journalStatusText", () => {
    it("counts each outcome across the five journals, as the table's Journal Status cell does", () => {
        const text = journalStatusText(
            { transaction: true, refund: false, cashback: false, cashbackReversal: true },
            { cashback: { skipped: true } }
        );

        expect(text).toBe("Success: 2, Failed: 1, Skipped: 1");
    });

    it("counts a skipped journal as skipped, not failed, even though nothing was recorded", () => {
        expect(journalStatusText({ transaction: false }, { transaction: { skipped: true } })).toBe("Skipped: 1");
    });

    it("says Not recorded when no journal has an outcome yet", () => {
        expect(journalStatusText(null, null)).toBe("Not recorded");
        expect(journalStatusText({}, {})).toBe("Not recorded");
    });
});

describe("orderJournalExportColumns", () => {
    it("lists the table's columns in the table's order", () => {
        expect(orderJournalExportColumns().map(column => column.header)).toEqual([
            "Transaction Date",
            "Transaction ID",
            "Customer",
            "Service",
            "Amount",
            "Payment Mode",
            "Status",
            "Journal Status",
        ]);
    });

    it("writes one row of cells, with the date in IST and the amount as a number", () => {
        expect(cellsOf(ROW)).toEqual([
            "24 Sep 2026, 11:44 AM",
            "1791277831861",
            "100000919",
            "Peko Go",
            1155.27,
            "WALLET",
            "SUCCESS",
            "Success: 1",
        ]);
        expect(orderJournalExportColumns().find(column => column.header === "Amount").money).toBe(true);
    });

    it("leaves what an order doesn't have blank, and counts a missing amount as zero", () => {
        const cells = cellsOf({
            ...ROW,
            transactionDate: null,
            credential: null,
            serviceOperator: null,
            order: { ...ROW.order, amountInINR: null, paymentMode: null },
        });

        expect(cells).toEqual(["", "1791277831861", undefined, undefined, 0, null, "SUCCESS", "Success: 1"]);
    });
});
