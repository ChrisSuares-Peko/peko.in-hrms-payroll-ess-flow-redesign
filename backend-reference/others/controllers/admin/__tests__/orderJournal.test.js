const { Op } = require("sequelize");
const orders = require("../../../models/entities/order");
const { getOrderJournals } = require("../orderJournal");

jest.mock("../../../utils/bull/queue/accountingQueues", () => ({ dispatchJournalRetry: jest.fn() }));
jest.mock("../../../utils/cacheDataMethods", () => ({
    getValue: jest.fn(),
    setValue: jest.fn(),
    deleteKey: jest.fn(),
}));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));
jest.mock("../../../utils/pekoRecieptHelper", () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock("../../../utils/pdfHelper", () => ({ isPdfBuffer: jest.fn() }));
jest.mock("../../../models/use-cases/chartOfAccount", () => ({
    findAllByProviderAccountIds: jest.fn(),
}));
jest.mock("../../../models/use-cases/credential", () => ({ findOneCredential: jest.fn() }));
jest.mock("../../../models/use-cases/serviceOperator", () => ({ findServiceOperatorById: jest.fn() }));
jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    loadAccountingFloor: jest.fn(async () => "2026-08-31"),
    goLiveWindowStart: jest.fn(() => new Date("2026-09-01T00:00:00.000Z")),
    isBeforeGoLive: jest.fn(() => false),
}));

const run = async query => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await getOrderJournals({ query, user: { id: 1 } }, res, next);
    return { res, next };
};

const literalOf = () => {
    const { where } = orders.findAndCountAll.mock.calls[0][0];
    return where[Op.and] ? where[Op.and].val : undefined;
};

beforeEach(() => {
    jest.clearAllMocks();
    orders.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
});

describe("the journal status filter", () => {
    it("reads success and failure off the verdict the provider left", async () => {
        await run({ journalStatus: "success" });
        expect(literalOf()).toBe("JSON_EXTRACT(`orders`.`journalRecordStatus`, '$.transaction') = true");

        orders.findAndCountAll.mockClear();
        await run({ journalStatus: "failed" });
        expect(literalOf()).toBe(
            "COALESCE(JSON_EXTRACT(`orders`.`journalData`, '$.transaction.skipped') = true, false) = false " +
                "AND JSON_EXTRACT(`orders`.`journalRecordStatus`, '$.transaction') = false"
        );
    });

    it("leaves an entry held back before it was sent to the skipped filter only, on every key", async () => {
        await run({ journalStatus: "failed", journalKey: "any" });
        const anyKey = literalOf();
        ["transaction", "refund", "adminRefund", "cashback", "cashbackReversal"].forEach(key =>
            expect(anyKey).toContain(
                `COALESCE(JSON_EXTRACT(\`orders\`.\`journalData\`, '$.${key}.skipped') = true, false) = false ` +
                    `AND JSON_EXTRACT(\`orders\`.\`journalRecordStatus\`, '$.${key}') = false`
            )
        );
    });

    // A skipped journal leaves a marker and no verdict; one that never ran leaves neither.
    // The two are different things to the accounts team, so they are two filters.
    it("tells a skipped journal from one that never ran", async () => {
        await run({ journalStatus: "skipped" });
        expect(literalOf()).toBe("JSON_EXTRACT(`orders`.`journalData`, '$.transaction.skipped') = true");

        orders.findAndCountAll.mockClear();
        await run({ journalStatus: "notRecorded" });
        expect(literalOf()).toBe(
            "JSON_EXTRACT(`orders`.`journalRecordStatus`, '$.transaction') IS NULL " +
                "AND COALESCE(JSON_EXTRACT(`orders`.`journalData`, '$.transaction.skipped') = true, false) = false"
        );
    });

    it("applies no journal filter for an unknown or empty value", async () => {
        await run({ journalStatus: "" });
        expect(literalOf()).toBeUndefined();

        orders.findAndCountAll.mockClear();
        await run({ journalStatus: "whatever" });
        expect(literalOf()).toBeUndefined();
    });
});
