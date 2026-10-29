const sequelizeConfig = require("../../../configs/database/index");
const {
    ENTRY_NUMBER_PREFIXES,
    CLAIM_SQL,
    CLAIMED_SQL,
    formatEntryNumber,
    nextEntryNumber,
    withEntryNumber,
} = require("../entryNumbers");

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.transaction = jest.fn(async callback => callback("TXN"));
    sequelizeConfig.query = jest.fn(async sql => (sql === CLAIMED_SQL ? [{ value: 12 }] : []));
});

describe("entry numbers", () => {
    it("keeps one series per kind of hand-recorded entry, with one shared by every opening balance", () => {
        expect(ENTRY_NUMBER_PREFIXES).toEqual({
            vendorDeposit: "DEP",
            vendorCreditNote: "VCN",
            vendorCommission: "COM",
            vendorCostOfSales: "COS",
            vendorDebitNote: "VDN",
            partnerPayout: "PAY",
            partnerDebitNote: "PDN",
            gatewayReceipt: "RCT",
            gatewayBill: "BIL",
            openingBalance: "OPB",
        });
        expect(new Set(Object.values(ENTRY_NUMBER_PREFIXES)).size).toBe(
            Object.keys(ENTRY_NUMBER_PREFIXES).length
        );
    });

    it("pads the running number to six digits and lets it grow past them", () => {
        expect(formatEntryNumber("DEP", 1)).toBe("DEP-000001");
        expect(formatEntryNumber("DEP", "12")).toBe("DEP-000012");
        expect(formatEntryNumber("VCN", 1234567)).toBe("VCN-1234567");
    });

    it("claims the next value of the series inside the caller's transaction", async () => {
        expect(await nextEntryNumber("PAY", "TXN")).toBe("PAY-000012");

        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
        expect(sequelizeConfig.query.mock.calls[0]).toEqual([
            CLAIM_SQL,
            { replacements: { name: "PAY" }, transaction: "TXN" },
        ]);
        expect(sequelizeConfig.query.mock.calls[1]).toEqual([
            CLAIMED_SQL,
            { transaction: "TXN", type: "SELECT" },
        ]);
        expect(CLAIM_SQL).toContain("LAST_INSERT_ID(1)");
        expect(CLAIM_SQL).toContain("ON DUPLICATE KEY UPDATE lastValue = LAST_INSERT_ID(lastValue + 1)");
    });

    it("opens a transaction, claims the number and hands both to the write", async () => {
        const write = jest.fn(async (entryNumber, transaction) => ({ entryNumber, transaction }));

        const result = await withEntryNumber("RCT", write);

        expect(sequelizeConfig.transaction).toHaveBeenCalledTimes(1);
        expect(write).toHaveBeenCalledWith("RCT-000012", "TXN");
        expect(result).toEqual({ entryNumber: "RCT-000012", transaction: "TXN" });
    });
});
