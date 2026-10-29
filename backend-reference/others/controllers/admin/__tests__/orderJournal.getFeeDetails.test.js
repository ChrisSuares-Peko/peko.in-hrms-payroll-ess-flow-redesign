jest.mock("../../../models/entities/order", () => ({}));
jest.mock("../../../models/entities/serviceOperator", () => ({}));
jest.mock("../../../models/entities/credential", () => ({}));
jest.mock("../../../models/entities/vendor", () => ({}));
jest.mock("../../../models/use-cases/chartOfAccount", () => ({ findAllByProviderAccountIds: jest.fn() }));
jest.mock("../../../models/use-cases/credential", () => ({ findOneCredential: jest.fn() }));
jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    loadAccountingFloor: jest.fn().mockResolvedValue("2000-01-01"),
    goLiveWindowStart: jest.fn(() => new Date("2000-01-01T00:00:00.000Z")),
    isBeforeGoLive: jest.fn(),
}));
jest.mock("../../../models/use-cases/serviceOperator", () => ({ findServiceOperatorById: jest.fn() }));
jest.mock("../../../models/use-cases/feeDetails", () => ({
    listFeeDetails: jest.fn(),
    serializeFeeDetail: jest.fn(),
}));
jest.mock("../../../utils/bull/queue/accountingQueues", () => ({ dispatchJournalRetry: jest.fn() }));
jest.mock("../../../utils/pekoRecieptHelper", () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

const { listFeeDetails, serializeFeeDetail } = require("../../../models/use-cases/feeDetails");
const { getFeeDetails } = require("../orderJournal");

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const ROW = { id: 1, pekoInvoiceDetails: { vendor: { invoiceData: { a: 1 } } } };
const SERIALIZED = {
    id: 1,
    corporateTxnId: "TXN1",
    feeIncludingGST: 118,
    pekoInvoiceDetails: { vendor: { invoiceData: { a: 1 } } },
};

const run = async query => {
    listFeeDetails.mockResolvedValue({ rows: [], count: 0 });
    const req = { query };
    const res = mockRes();
    await getFeeDetails(req, res, jest.fn());
    return listFeeDetails.mock.calls.at(-1)[0];
};

describe("getFeeDetails — the shared drill-down behind the Commission and Platform Fee dashboard cards", () => {
    beforeEach(() => jest.clearAllMocks());

    it("defaults to commission when feeType is omitted or unrecognized", async () => {
        expect((await run({ from: "2026-09-01", to: "2026-09-16" })).feeType).toBe("commission");
        expect(
            (await run({ from: "2026-09-01", to: "2026-09-16", feeType: "nonsense" })).feeType
        ).toBe("commission");
    });

    it("passes platformFee through when explicitly asked for", async () => {
        const { feeType } = await run({ from: "2026-09-01", to: "2026-09-16", feeType: "platformFee" });
        expect(feeType).toBe("platformFee");
    });

    it("floors a requested date earlier than go-live, the same way Order Journals and Transactions do", async () => {
        const { range } = await run({ from: "1999-01-01", to: "2026-09-16" });
        expect(range).toEqual({ from: "2000-01-01 00:00:00", to: "2026-09-16 23:59:59" });
    });

    it("windows on the IST calendar day, so one picked day runs from its midnight to its last second", async () => {
        const { range } = await run({ from: "2026-10-21", to: "2026-10-21" });
        expect(range).toEqual({ from: "2026-10-21 00:00:00", to: "2026-10-21 23:59:59" });
    });

    it("passes the search text through", async () => {
        const { searchText } = await run({ from: "2026-09-01", to: "2026-09-16", searchText: "acme" });
        expect(searchText).toBe("acme");
    });

    it("parses vendorId to a number, and drops it when missing or invalid", async () => {
        expect((await run({ from: "2026-09-01", to: "2026-09-16", vendorId: "9" })).vendorId).toBe(9);
        expect((await run({ from: "2026-09-01", to: "2026-09-16" })).vendorId).toBeNull();
        expect(
            (await run({ from: "2026-09-01", to: "2026-09-16", vendorId: "abc" })).vendorId
        ).toBeNaN();
    });

    it("shapes each row through serializeFeeDetail and turns pekoInvoiceDetails into a documents summary", async () => {
        listFeeDetails.mockResolvedValue({ rows: [ROW], count: 1 });
        serializeFeeDetail.mockReturnValue(SERIALIZED);

        const req = { query: { from: "2026-09-01", to: "2026-09-16" } };
        const res = mockRes();
        await getFeeDetails(req, res, jest.fn());

        expect(serializeFeeDetail).toHaveBeenCalledWith(ROW, "commission");
        const [row] = res.json.mock.calls[0][0].data.result;
        expect(row.pekoInvoiceDetails).toBeUndefined();
        expect(row.corporateTxnId).toBe("TXN1");
        expect(row.documents).toEqual({
            subscriber: { invoice: false, planInvoice: false, receipt: false },
            vendor: { invoice: true, planInvoice: false },
        });
    });
});
