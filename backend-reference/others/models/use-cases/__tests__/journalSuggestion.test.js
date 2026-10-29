const chartOfAccounts = require("../../entities/chartOfAccount");
const systemUser = require("../../entities/systemUser");
const { getGstDetails } = require("../setting");
const { ACCOUNT_NAMES, SPLIT_KEYS, PARTNER_SPLIT_KEYS, suggestJournalLines } = require("../journalSuggestion");

jest.mock("../setting", () => ({ getGstDetails: jest.fn() }));
jest.mock("../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn(), deleteKey: jest.fn() }));

const COA = Object.values(ACCOUNT_NAMES).map((name, index) => ({ account_name: name, provider_account_id: `A${index + 1}` }));
const idOf = name => COA.find(row => row.account_name === name).provider_account_id;

// A breakdown the pipeline once stored. The suggestion must never read it: an order whose
// entry was never worked out has none, and that is the order this is for.
const SPLIT = {
    totalTransactionAmount: 2000,
    paymentThroughGateway: 900,
    commissionExcludingGST: 10,
    vendorPayable: 1100,
    platformFeeIncludingGST: 118,
    partnerShipFee: 6,
    couponTotalDiscount: 20,
    paymentGatewayName: "Razorpay",
};

const order = (overrides = {}) => ({
    corporateTxnId: "TXN-1",
    amountInINR: "1180.0000",
    surcharge: "59.0000",
    paymentMode: "PAYMENT GATEWAY + WALLET",
    paymentModeResponse: '{"paymentGatewayName":"Cashfree","pgAmount":"500.00"}',
    journalData: SPLIT,
    ...overrides,
});

const lookupOrder = (overrides = {}) => ({ partnerId: 55, customer: { state: "Delhi" }, ...overrides });

const suggest = async args => (await suggestJournalLines(args)).lineItems;

const pick = (lines, name) => lines.filter(line => line.accountName === name);
const names = lines => lines.map(line => `${line.direction}:${line.accountName}:${line.amount}`);

beforeEach(() => {
    jest.clearAllMocks();
    chartOfAccounts.findAll.mockResolvedValue([...COA, { account_name: "Cashfree", provider_account_id: "PG1" }]);
    systemUser.findOne.mockResolvedValue({ state: "Delhi" });
    getGstDetails.mockResolvedValue({ details: { gst: 18 } });
});

describe("the suggested rows of a sale", () => {
    it("lays out only what the order itself knows: gateway, wallet, platform fee with its GST by the customer's state, and blank partner rows", async () => {
        const lines = await suggest({ journalKey: "transaction", order: order(), lookupOrder: lookupOrder() });

        expect(names(lines)).toEqual([
            "debit:Cashfree:500",
            "debit:Subscribers Wallet:680",
            "credit:Platform Fees:50",
            "credit:Output CGST:4.5",
            "credit:Output SGST:4.5",
            "debit:Partnership Fees:null",
            "debit:Input CGST:null",
            "debit:Input SGST:null",
            "credit:Partnership Fee Payable:null",
        ]);
        expect(lines[0]).toEqual({ accountId: "PG1", accountName: "Cashfree", direction: "debit", amount: 500, description: "TXN-1" });
        expect(pick(lines, "Platform Fees")[0].accountId).toBe(idOf("Platform Fees"));
        expect(systemUser.findOne).toHaveBeenCalledWith({ where: { credentialId: 55 }, attributes: ["state", "sharePercentage", "gatewayCharge"], raw: true });
        const [options] = chartOfAccounts.findAll.mock.calls[0];
        expect(options.where).toMatchObject({ vendorId: null, partnerId: null, corporateUserId: null });
    });

    it("never guesses commission, vendor deposit, sales or coupon rows, even when a stored breakdown names them", async () => {
        const lines = await suggest({ journalKey: "transaction", order: order(), lookupOrder: lookupOrder() });

        ["Commission", "Vendor Deposits", "Sales", "Coupon Discount Expense"].forEach(name => {
            expect(lines.some(line => line.accountName === name)).toBe(false);
        });
        expect(lines[0].amount).toBe(500);
        expect(lines[0].accountName).toBe("Cashfree");
    });

    it("reads the gateway and the whole amount off the order when nothing was paid from the wallet, and skips the partner rows without a partner", async () => {
        chartOfAccounts.findAll.mockResolvedValue(COA);
        const lines = await suggest({
            journalKey: "transaction",
            order: order({ journalData: null, paymentMode: "PAYMENT GATEWAY", paymentModeResponse: '{"pgAmount":"1180.00"}' }),
            lookupOrder: lookupOrder({ partnerId: null, customer: { state: "Kerala" } }),
        });

        expect(names(lines)).toEqual(["debit:null:1180", "credit:Platform Fees:50", "credit:Output IGST:9"]);
        expect(lines[0].accountId).toBeNull();
        expect(systemUser.findOne).not.toHaveBeenCalled();
    });

    it("leaves the platform fee rows out when the order carries no surcharge, and the amounts blank when the wallet share is unknown", async () => {
        const lines = await suggest({
            journalKey: "transaction",
            order: order({ surcharge: "0.0000", paymentModeResponse: null }),
            lookupOrder: lookupOrder({ partnerId: null }),
        });

        expect(names(lines)).toEqual(["debit:null:null", "debit:Subscribers Wallet:null"]);
    });

    it("keeps the account name when the chart of accounts has no such row, and assumes Peko's own state when a party's state is unknown", async () => {
        chartOfAccounts.findAll.mockResolvedValue([]);
        systemUser.findOne.mockResolvedValue(null);
        const lines = await suggest({ journalKey: "transaction", order: order(), lookupOrder: lookupOrder({ customer: null }) });

        expect(lines.every(line => line.accountId === null)).toBe(true);
        expect(pick(lines, "Output CGST").map(line => line.amount)).toEqual([4.5]);
        expect(pick(lines, "Input CGST")).toHaveLength(1);
    });
});

describe("the other events", () => {
    it("mirrors the sale for a refund, and for an admin refund keeps only the refund amount on the first row", async () => {
        const refund = await suggest({ journalKey: "refund", order: order(), lookupOrder: lookupOrder() });
        expect(names(refund).slice(0, 3)).toEqual(["credit:Cashfree:500", "credit:Subscribers Wallet:680", "debit:Platform Fees:50"]);

        const admin = await suggest({ journalKey: "adminRefund", order: order(), lookupOrder: lookupOrder(), refundAmount: 200 });
        expect(admin[0]).toMatchObject({ direction: "credit", accountName: "Cashfree", amount: 200 });
        expect(admin.slice(1).every(line => line.amount === null)).toBe(true);
    });

    it("pairs cashback expense with the subscribers wallet, flipped for a reversal", async () => {
        const cashback = await suggest({ journalKey: "cashback", order: order({ journalData: null }), lookupOrder: lookupOrder(), amount: 12 });
        expect(names(cashback)).toEqual(["debit:Cashback Expense:12", "credit:Subscribers Wallet:12"]);

        const reversal = await suggest({ journalKey: "cashbackReversal", order: order({ journalData: null }), lookupOrder: lookupOrder(), amount: 12 });
        expect(names(reversal)).toEqual(["credit:Cashback Expense:12", "debit:Subscribers Wallet:12"]);
    });

    it("falls back to 18% GST when the tax rate setting is missing or unreadable", async () => {
        getGstDetails.mockRejectedValue(new Error("db"));
        const lines = await suggest({
            journalKey: "transaction",
            order: order({ journalData: null, paymentMode: "PAYMENT GATEWAY" }),
            lookupOrder: lookupOrder({ partnerId: null }),
        });
        expect(pick(lines, "Platform Fees")[0].amount).toBe(50);
    });
});

describe("the suggested split", () => {
    it("offers every figure the profiles read, filled only where the order itself knows it", async () => {
        const full = (await suggestJournalLines({ journalKey: "transaction", order: order(), lookupOrder: lookupOrder() })).split;

        expect(Object.keys(full)).toEqual([...SPLIT_KEYS, ...PARTNER_SPLIT_KEYS]);
        expect(full).toMatchObject({
            totalTransactionAmount: 1180,
            paymentThroughGateway: 500,
            paymentThroughWallet: 680,
            platformFeeExcludingGST: 50,
            outputGSTonPlatformFee: 9,
            platformFeeIncludingGST: 59,
        });
        ["commissionExcludingGST", "vendorPayable", "principalSalesPayable", "couponTotalDiscount", "partnerShipFee"].forEach(key => {
            expect(full[key]).toBeNull();
        });
    });

    it("leaves the partner figures out without a partner, and carries nothing for a cashback", async () => {
        const bare = (await suggestJournalLines({
            journalKey: "transaction",
            order: order({ journalData: null, paymentMode: "PAYMENT GATEWAY", paymentModeResponse: '{"pgAmount":"1180.00"}' }),
            lookupOrder: lookupOrder({ partnerId: null }),
        })).split;
        expect(Object.keys(bare)).toEqual(SPLIT_KEYS);
        expect(bare).toMatchObject({ totalTransactionAmount: 1180, paymentThroughGateway: 1180, paymentThroughWallet: 0 });

        expect((await suggestJournalLines({ journalKey: "cashback", order: order(), lookupOrder: lookupOrder(), amount: 12 })).split).toEqual({});
    });
});
