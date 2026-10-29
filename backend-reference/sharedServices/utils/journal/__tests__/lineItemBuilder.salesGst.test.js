jest.mock("../../../models/use-cases/chartOfAccount", () => ({
    findAllByAccountNames: jest.fn(),
    findGenericAccountByName: jest.fn(),
}));
jest.mock("../../../models/use-cases/corporateUser", () => ({ findByCredentialId: jest.fn() }));
jest.mock("../../../models/use-cases/credential", () => ({ findById: jest.fn() }));
jest.mock("../../../models/use-cases/setting", () => ({ isInternalAccount: jest.fn() }));
jest.mock("../../../models/use-cases/order", () => ({ findByCorporateTxnId: jest.fn() }));

const { findAllByAccountNames } = require("../../../models/use-cases/chartOfAccount");
const { findByCredentialId } = require("../../../models/use-cases/corporateUser");
const { isInternalAccount } = require("../../../models/use-cases/setting");
const { findByCorporateTxnId } = require("../../../models/use-cases/order");
const {
    buildTransactionLineItems,
    buildRefundLineItems,
    buildAdminRefundLineItems,
} = require("../lineItemBuilder");

const ACCOUNT_IDS = {
    Cashfree: "PG",
    "Transaction Processing Fees": "TPF",
    "Input CGST": "ICGST",
    "Input SGST": "ISGST",
    "Input IGST": "IIGST",
    "Output CGST": "OCGST",
    "Output SGST": "OSGST",
    "Output IGST": "OIGST",
    "Coupon Discount Expense": "COUPON",
    "Platform Fees": "PLATFORM",
    Commission: "COMMISSION",
    Sales: "SALES",
    "Vendor Deposits": "VENDOR",
    "Internal Purchases Temporary Account": "INTERNAL",
    "Vendor Payable Temporary Account": "VPT",
    "Rounding Off Account": "ROUNDING",
};

const COA = Object.entries(ACCOUNT_IDS).map(([account_name, provider_account_id]) => ({
    account_name,
    provider_account_id,
}));

// One order with a principal-markup sale and an ordinary commission, so the two GST amounts
// differ (36 on the Sales margin, 18 on the commission) and can be told apart per account.
const JOURNAL = {
    totalTransactionAmount: 1654,
    paymentThroughGateway: 1654,
    paymentThroughWallet: 0,
    principalSalesPayable: 800,
    principalCommissionExcludingGST: 200,
    outputGSTonPrincipalCommission: 36,
    commissionIncludingGST: 118,
    commissionExcludingGST: 100,
    outputGSTonCommission: 18,
    vendorPayable: 500,
};

// What computeJournalData writes: the Sales state is the customer's, the commission state is
// the vendor's. In each case the two parties differ, so a wrong choice shows.
const CUSTOMER_SAME_STATE = {
    ...JOURNAL,
    isInterState: false,
    vendorIsInterState: true,
    salesIsInterState: false,
};
const CUSTOMER_OTHER_STATE = {
    ...JOURNAL,
    isInterState: true,
    vendorIsInterState: false,
    salesIsInterState: true,
};
// A journal with no Sales state: the vendor's is inter-state, but that is not what Sales uses.
const NO_SALES_STATE = {
    ...JOURNAL,
    isInterState: false,
    vendorIsInterState: true,
};

const GST_ACCOUNTS = new Set(["OCGST", "OSGST", "OIGST"]);

const gstOf = (lineItems, direction) =>
    lineItems
        .filter(item => GST_ACCOUNTS.has(item.accountId) && item.direction === direction)
        .reduce(
            (sums, item) => ({
                ...sums,
                [item.accountId]: Math.round(((sums[item.accountId] || 0) + item.amount) * 100) / 100,
            }),
            {}
        );

const context = journalData => ({
    journalData,
    corporateTxnId: "TXN-1",
    vendor: { vendorName: "Acme" },
    paymentGatewayName: "Cashfree",
    credentialId: 5,
    registeredBy: null,
});

const transactionGst = async (journalData, { internal = false } = {}) => {
    isInternalAccount.mockResolvedValue(internal);
    const result = await buildTransactionLineItems(context(journalData));
    expect(result.ok).toBe(true);
    return gstOf(result.lineItems, "credit");
};

const refundGst = async (journalData, { internal = false } = {}) => {
    isInternalAccount.mockResolvedValue(internal);
    const result = await buildRefundLineItems(context(journalData));
    expect(result.ok).toBe(true);
    return gstOf(result.lineItems, "debit");
};

const ADMIN_REFUND_ACCOUNTS = {
    isInternalAccount: false,
    outputCGST: "OCGST",
    outputSGST: "OSGST",
    outputIGST: "OIGST",
    sales: "SALES",
    commission: "COMMISSION",
    vendorPayable: "VENDOR",
    paymentGateway: "PG",
};

const adminRefundGst = async (journalData, { refundAmount = 1654, totalOrderAmount = 1654 } = {}) => {
    findByCorporateTxnId.mockResolvedValue({
        journalData: { ...journalData, journalAccountIds: ADMIN_REFUND_ACCOUNTS },
    });
    const result = await buildAdminRefundLineItems({
        corporateTxnId: "TXN-1",
        refundAmount,
        totalOrderAmount,
    });
    expect(result.ok).toBe(true);
    return gstOf(result.lineItems, "debit");
};

beforeEach(() => {
    jest.clearAllMocks();
    findAllByAccountNames.mockImplementation(async names =>
        COA.filter(account => names.includes(account.account_name))
    );
    findByCredentialId.mockResolvedValue({ id: 1 });
});

// Sales GST = 36, commission GST = 18. A customer in Peko's state gives CGST + SGST on the
// Sales margin, however far away the vendor is; the commission still follows the vendor.
const SAME_STATE_CUSTOMER_GST = { OCGST: 18, OSGST: 18, OIGST: 18 };
const OTHER_STATE_CUSTOMER_GST = { OIGST: 36, OCGST: 9, OSGST: 9 };
// Sales 36 is intra-state (CGST + SGST), the commission 18 still follows the vendor (IGST).
const NO_SALES_STATE_GST = { OCGST: 18, OSGST: 18, OIGST: 18 };

describe("the Sales GST on a sale", () => {
    it.each([
        ["an ordinary order", false],
    ])(
        "splits by the customer's state, not the vendor's, on %s",
        async (_name, internal) => {
            expect(await transactionGst(CUSTOMER_SAME_STATE, { internal })).toEqual(
                SAME_STATE_CUSTOMER_GST
            );
            expect(await transactionGst(CUSTOMER_OTHER_STATE, { internal })).toEqual(
                OTHER_STATE_CUSTOMER_GST
            );
        }
    );

    it("leaves the commission's GST on the vendor's state", async () => {
        const sameState = await transactionGst({ ...CUSTOMER_SAME_STATE, outputGSTonPrincipalCommission: 0, principalSalesPayable: 0, principalCommissionExcludingGST: 0, paymentThroughGateway: 618, totalTransactionAmount: 618 });
        const otherState = await transactionGst({ ...CUSTOMER_OTHER_STATE, outputGSTonPrincipalCommission: 0, principalSalesPayable: 0, principalCommissionExcludingGST: 0, paymentThroughGateway: 618, totalTransactionAmount: 618 });

        expect(sameState).toEqual({ OIGST: 18 });
        expect(otherState).toEqual({ OCGST: 9, OSGST: 9 });
    });

    it.each([
        ["an ordinary order", false],
    ])("splits the Sales GST into CGST and SGST when the journal has no Sales state, on %s", async (_name, internal) => {
        expect(await transactionGst(NO_SALES_STATE, { internal })).toEqual(NO_SALES_STATE_GST);
    });

    it("lets the Sales state on the journal win over the vendor's, even when it is false", async () => {
        const gst = await transactionGst({ ...CUSTOMER_OTHER_STATE, salesIsInterState: false });

        expect(gst).toEqual({ OCGST: 18 + 9, OSGST: 18 + 9 });
    });
});

describe("the Sales GST on a refund", () => {
    it.each([
        ["an ordinary order", false],
    ])("reverses by the customer's state, not the vendor's, on %s", async (_name, internal) => {
        expect(await refundGst(CUSTOMER_SAME_STATE, { internal })).toEqual(SAME_STATE_CUSTOMER_GST);
        expect(await refundGst(CUSTOMER_OTHER_STATE, { internal })).toEqual(OTHER_STATE_CUSTOMER_GST);
    });

    it("splits the Sales GST into CGST and SGST when the journal has no Sales state", async () => {
        expect(await refundGst(NO_SALES_STATE)).toEqual(NO_SALES_STATE_GST);
    });
});

describe("the Sales GST on an admin refund", () => {
    it("reverses by the customer's state, not the vendor's", async () => {
        expect(await adminRefundGst(CUSTOMER_SAME_STATE)).toEqual(SAME_STATE_CUSTOMER_GST);
        expect(await adminRefundGst(CUSTOMER_OTHER_STATE)).toEqual(OTHER_STATE_CUSTOMER_GST);
    });

    it("takes back half of it for half the order, still on the customer's state", async () => {
        const half = { refundAmount: 827, totalOrderAmount: 1654 };

        expect(await adminRefundGst(CUSTOMER_SAME_STATE, half)).toEqual({ OCGST: 9, OSGST: 9, OIGST: 9 });
        expect(await adminRefundGst(CUSTOMER_OTHER_STATE, half)).toEqual({ OIGST: 18, OCGST: 4.5, OSGST: 4.5 });
    });

    it("splits the Sales GST into CGST and SGST when the journal has no Sales state", async () => {
        expect(await adminRefundGst(NO_SALES_STATE)).toEqual(NO_SALES_STATE_GST);
    });
});

describe("what a refund takes back is what the sale posted", () => {
    it.each([
        ["a customer in Peko's state", CUSTOMER_SAME_STATE],
        ["a customer in another state", CUSTOMER_OTHER_STATE],
        ["a journal with no Sales state", NO_SALES_STATE],
    ])("account for account, for %s", async (_name, journalData) => {
        const posted = await transactionGst(journalData);

        expect(await refundGst(journalData)).toEqual(posted);
        expect(await adminRefundGst(journalData)).toEqual(posted);
    });
});

describe("a journal that does not say whether a sale was inter-state", () => {
    // Every GST amount then goes to CGST + SGST, never IGST: Sales 36 and commission 18 in half each.
    const UNDECIDED_GST = { OCGST: 27, OSGST: 27 };

    it.each([
        ["no state flags at all", JOURNAL],
        ["state flags that are null", { ...JOURNAL, isInterState: null, vendorIsInterState: null, salesIsInterState: null }],
    ])("splits the sale into CGST and SGST, with %s", async (_name, journalData) => {
        expect(await transactionGst(journalData)).toEqual(UNDECIDED_GST);
    });

    it("splits the refund and the admin refund into CGST and SGST too", async () => {
        expect(await refundGst(JOURNAL)).toEqual(UNDECIDED_GST);
        expect(await adminRefundGst(JOURNAL)).toEqual(UNDECIDED_GST);
    });
});

describe("the GST on the vendor's part of a principal sale", () => {
    // The vendor's price 800 carries 122 of GST and Peko's commission 200 carries 36: Sales is booked without the 122,
    // and the Output GST lines carry both. Sales 878 + GST 158 = the 1036 the customer paid.
    const WITH_VENDOR_GST = {
        totalTransactionAmount: 1036,
        paymentThroughGateway: 1036,
        paymentThroughWallet: 0,
        principalSalesPayable: 800,
        principalCommissionExcludingGST: 200,
        outputGSTonPrincipalCommission: 36,
        outputGSTonPrincipalSales: 122,
        isInterState: true,
        salesIsInterState: true,
    };
    // An order booked before the field existed: the vendor's price stays whole in Sales, GST only on the commission.
    const WITHOUT_VENDOR_GST = { ...WITH_VENDOR_GST, outputGSTonPrincipalSales: undefined };

    const salesOf = lineItems =>
        lineItems.filter(item => item.accountId === "SALES").reduce((sum, item) => sum + item.amount, 0);

    it.each([
        ["an ordinary order", false],
    ])("books Sales without that GST and posts it to Output GST, on %s", async (_name, internal) => {
        isInternalAccount.mockResolvedValue(internal);
        const result = await buildTransactionLineItems(context(WITH_VENDOR_GST));

        expect(result.ok).toBe(true);
        expect(salesOf(result.lineItems)).toBe(878);
        expect(gstOf(result.lineItems, "credit")).toEqual({ OIGST: 158 });
    });

    it("books an older order, without the field, exactly as before", async () => {
        isInternalAccount.mockResolvedValue(false);
        const result = await buildTransactionLineItems(context(WITHOUT_VENDOR_GST));

        expect(result.ok).toBe(true);
        expect(salesOf(result.lineItems)).toBe(1000);
        expect(gstOf(result.lineItems, "credit")).toEqual({ OIGST: 36 });
    });

    it("takes back the same Sales and GST in a refund and in an admin refund", async () => {
        isInternalAccount.mockResolvedValue(false);
        const refund = await buildRefundLineItems(context(WITH_VENDOR_GST));
        findByCorporateTxnId.mockResolvedValue({
            journalData: { ...WITH_VENDOR_GST, journalAccountIds: ADMIN_REFUND_ACCOUNTS },
        });
        const adminRefund = await buildAdminRefundLineItems({
            corporateTxnId: "TXN-1",
            refundAmount: 1036,
            totalOrderAmount: 1036,
        });

        [refund, adminRefund].forEach(result => {
            expect(result.ok).toBe(true);
            expect(salesOf(result.lineItems)).toBe(878);
            expect(gstOf(result.lineItems, "debit")).toEqual({ OIGST: 158 });
        });
    });
});

describe("an internal account's principal sale", () => {
    // Sales 1000 + the GST on it 36 = 1036 of principal sale, with a margin commission of 100 + 18 and 500 for the vendor.
    const amountOn = (lineItems, accountId, direction) =>
        lineItems
            .filter(item => item.accountId === accountId && item.direction === direction)
            .reduce((sum, item) => sum + item.amount, 0);
    const sumOf = (lineItems, direction) =>
        lineItems.filter(item => item.direction === direction).reduce((sum, item) => sum + item.amount, 0);

    const internalSale = async journalData => {
        isInternalAccount.mockResolvedValue(true);
        const result = await buildTransactionLineItems(context(journalData));
        expect(result.ok).toBe(true);
        return result;
    };

    it("credits the whole principal amount, GST included, to the Vendor Payable Temporary Account", async () => {
        const { lineItems, journalAccountIds } = await internalSale(CUSTOMER_SAME_STATE);

        expect(amountOn(lineItems, "VPT", "credit")).toBe(1036);
        expect(lineItems.filter(item => item.accountId === "SALES")).toEqual([]);
        expect(journalAccountIds).toEqual(expect.objectContaining({ isInternalAccount: true, vendorPayableTemporary: "VPT" }));
        expect(journalAccountIds.sales).toBeUndefined();
    });

    it("leaves only the margin commission's GST in Output GST, and still balances", async () => {
        const { lineItems } = await internalSale(CUSTOMER_SAME_STATE);

        expect(gstOf(lineItems, "credit")).toEqual({ OIGST: 18 });
        expect(amountOn(lineItems, "INTERNAL", "debit")).toBe(1654);
        expect(sumOf(lineItems, "credit")).toBe(1654);
    });

    it("takes the same whole amount when the journal also carries the GST on the vendor's part", async () => {
        const { lineItems } = await internalSale({
            totalTransactionAmount: 1036,
            paymentThroughGateway: 1036,
            paymentThroughWallet: 0,
            principalSalesPayable: 800,
            principalCommissionExcludingGST: 200,
            outputGSTonPrincipalCommission: 36,
            outputGSTonPrincipalSales: 122,
            salesIsInterState: true,
        });

        expect(amountOn(lineItems, "VPT", "credit")).toBe(1036);
        expect(gstOf(lineItems, "credit")).toEqual({});
        expect(sumOf(lineItems, "credit")).toBe(1036);
    });

    it("fails naming the account when the Vendor Payable Temporary Account is not in the chart", async () => {
        findAllByAccountNames.mockImplementation(async names =>
            COA.filter(account => names.includes(account.account_name) && account.account_name !== "Vendor Payable Temporary Account")
        );
        isInternalAccount.mockResolvedValue(true);

        const result = await buildTransactionLineItems(context(CUSTOMER_SAME_STATE));

        expect(result.ok).toBe(false);
        expect(result.reason).toContain("Vendor Payable Temporary Account");
    });

    it("takes it back from the same account in a refund", async () => {
        isInternalAccount.mockResolvedValue(true);
        findByCorporateTxnId.mockResolvedValue({ journalData: { journalAccountIds: { vendorPayableTemporary: "VPT" } } });

        const { ok, lineItems } = await buildRefundLineItems(context(CUSTOMER_SAME_STATE));

        expect(ok).toBe(true);
        expect(amountOn(lineItems, "VPT", "debit")).toBe(1036);
        expect(lineItems.filter(item => item.accountId === "SALES")).toEqual([]);
        expect(gstOf(lineItems, "debit")).toEqual({ OIGST: 18 });
        expect(amountOn(lineItems, "INTERNAL", "credit")).toBe(1654);
    });

    it("takes back a sale that was booked to Sales from Sales, with its GST, as it was posted", async () => {
        isInternalAccount.mockResolvedValue(true);
        findByCorporateTxnId.mockResolvedValue({ journalData: { journalAccountIds: { sales: "SALES" } } });

        const { ok, lineItems } = await buildRefundLineItems(context(CUSTOMER_SAME_STATE));

        expect(ok).toBe(true);
        expect(amountOn(lineItems, "SALES", "debit")).toBe(1000);
        expect(lineItems.filter(item => item.accountId === "VPT")).toEqual([]);
        expect(gstOf(lineItems, "debit")).toEqual(SAME_STATE_CUSTOMER_GST);
        expect(amountOn(lineItems, "INTERNAL", "credit")).toBe(1654);
    });

    describe("on an admin refund, which follows the account ids stored with the sale", () => {
        const STORED = {
            isInternalAccount: true,
            internalPurchases: "INTERNAL",
            commission: "COMMISSION",
            vendorPayable: "VENDOR",
            outputCGST: "OCGST",
            outputSGST: "OSGST",
            outputIGST: "OIGST",
        };
        const adminRefund = async (ids, options = {}) => {
            findByCorporateTxnId.mockResolvedValue({
                journalData: { ...CUSTOMER_SAME_STATE, journalAccountIds: { ...STORED, ...ids } },
            });
            const result = await buildAdminRefundLineItems({
                corporateTxnId: "TXN-1",
                refundAmount: 1654,
                totalOrderAmount: 1654,
                ...options,
            });
            expect(result.ok).toBe(true);
            return result.lineItems;
        };

        it("takes back the whole amount from the Vendor Payable Temporary Account", async () => {
            const lineItems = await adminRefund({ vendorPayableTemporary: "VPT" });

            expect(amountOn(lineItems, "VPT", "debit")).toBe(1036);
            expect(lineItems.filter(item => item.accountId === "SALES")).toEqual([]);
            expect(gstOf(lineItems, "debit")).toEqual({ OIGST: 18 });
            expect(amountOn(lineItems, "INTERNAL", "credit")).toBe(1654);
        });

        it("takes back half of it for half the order", async () => {
            const lineItems = await adminRefund({ vendorPayableTemporary: "VPT" }, { refundAmount: 827 });

            expect(amountOn(lineItems, "VPT", "debit")).toBe(518);
            expect(amountOn(lineItems, "INTERNAL", "credit")).toBe(827);
        });

        it("takes back a sale whose stored ids name Sales from Sales, with its GST", async () => {
            const lineItems = await adminRefund({ sales: "SALES" });

            expect(amountOn(lineItems, "SALES", "debit")).toBe(1000);
            expect(lineItems.filter(item => item.accountId === "VPT")).toEqual([]);
            expect(gstOf(lineItems, "debit")).toEqual(SAME_STATE_CUSTOMER_GST);
            expect(amountOn(lineItems, "INTERNAL", "credit")).toBe(1654);
        });

        it("refuses when the stored ids name neither account", async () => {
            findByCorporateTxnId.mockResolvedValue({ journalData: { ...CUSTOMER_SAME_STATE, journalAccountIds: STORED } });

            const result = await buildAdminRefundLineItems({ corporateTxnId: "TXN-1", refundAmount: 1654, totalOrderAmount: 1654 });

            expect(result).toEqual({ ok: false, reason: "Missing internal account IDs" });
        });
    });
});
