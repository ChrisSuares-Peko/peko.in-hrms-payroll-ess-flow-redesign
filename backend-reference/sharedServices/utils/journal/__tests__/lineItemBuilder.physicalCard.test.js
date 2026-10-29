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
    "Input CGST": "ICGST",
    "Input SGST": "ISGST",
    "Input IGST": "IIGST",
    "Output CGST": "OCGST",
    "Output SGST": "OSGST",
    "Output IGST": "OIGST",
    "Coupon Discount Expense": "COUPON",
    "Subscription Fees": "SUBSCRIPTION",
    "Deferred Revenue": "DEFERRED",
    "Physical Card Sales": "CARD_SALES",
    "Rounding Off Account": "ROUNDING",
};

const COA = Object.entries(ACCOUNT_IDS).map(([account_name, provider_account_id]) => ({
    account_name,
    provider_account_id,
}));

// A ₹290 physical card bought through the gateway: ₹245.76 income and ₹44.24 GST.
const CARD = {
    paymentThroughGateway: 290,
    netSubscriptionIncome: 245.76,
    outputGSTonRevenue: 44.24,
    isInterState: false,
    isPhysicalCard: true,
};

const context = journalData => ({
    journalData,
    corporateTxnId: "TXN-1",
    vendor: null,
    paymentGatewayName: "Cashfree",
    credentialId: 5,
    registeredBy: null,
});

const asked = () => findAllByAccountNames.mock.calls[0][0];

const byAccount = lineItems =>
    Object.fromEntries(lineItems.map(item => [item.accountId, `${item.direction} ${item.amount}`]));

beforeEach(() => {
    jest.clearAllMocks();
    isInternalAccount.mockResolvedValue(false);
    findByCredentialId.mockResolvedValue({ id: 1 });
    findAllByAccountNames.mockImplementation(async names =>
        COA.filter(account => names.includes(account.account_name))
    );
});

describe("a physical card purchase", () => {
    it("credits Physical Card Sales, not Subscription Fees, and splits the GST as a subscription does", async () => {
        const result = await buildTransactionLineItems(context(CARD));

        expect(result.ok).toBe(true);
        expect(byAccount(result.lineItems)).toEqual({
            PG: "debit 290",
            CARD_SALES: "credit 245.76",
            OCGST: "credit 22.12",
            OSGST: "credit 22.12",
        });
        expect(asked()).toContain("Physical Card Sales");
        expect(asked()).not.toContain("Subscription Fees");
        expect(asked()).not.toContain("Deferred Revenue");
    });

    it("keeps its account id where a later partial refund looks for the revenue account", async () => {
        const result = await buildTransactionLineItems(context(CARD));

        expect(result.journalAccountIds.subscriptionFees).toBe("CARD_SALES");
    });

    it("ignores a billing cycle: it never defers its income", async () => {
        const result = await buildTransactionLineItems(context({ ...CARD, billingType: "ANNUALLY" }));

        expect(byAccount(result.lineItems).CARD_SALES).toBe("credit 245.76");
        expect(byAccount(result.lineItems).DEFERRED).toBeUndefined();
    });

    it("charges IGST to a customer in another state", async () => {
        const result = await buildTransactionLineItems(context({ ...CARD, isInterState: true }));

        expect(byAccount(result.lineItems)).toEqual({
            PG: "debit 290",
            CARD_SALES: "credit 245.76",
            OIGST: "credit 44.24",
        });
    });

    it("is not journalled when the Physical Card Sales account has not been created", async () => {
        findAllByAccountNames.mockImplementation(async names =>
            COA.filter(
                account => names.includes(account.account_name) && account.account_name !== "Physical Card Sales"
            )
        );

        const result = await buildTransactionLineItems(context(CARD));

        expect(result).toEqual({ ok: false, reason: "No COA account found for Physical Card Sales" });
    });

    it("is reversed on the same account when refunded", async () => {
        const result = await buildRefundLineItems(context(CARD));

        expect(result.ok).toBe(true);
        expect(byAccount(result.lineItems)).toEqual({
            PG: "credit 290",
            CARD_SALES: "debit 245.76",
            OCGST: "debit 22.12",
            OSGST: "debit 22.12",
        });
        expect(findAllByAccountNames.mock.calls[0][0]).toContain("Physical Card Sales");
    });

    it("is partly refunded from the account its journal stored", async () => {
        findByCorporateTxnId.mockResolvedValue({
            journalData: {
                ...CARD,
                journalAccountIds: {
                    isInternalAccount: false,
                    outputCGST: "OCGST",
                    outputSGST: "OSGST",
                    outputIGST: "OIGST",
                    paymentGateway: "PG",
                    subscriptionFees: "CARD_SALES",
                },
            },
        });

        const result = await buildAdminRefundLineItems({
            corporateTxnId: "TXN-1",
            refundAmount: 145,
            totalOrderAmount: 290,
        });

        expect(result.ok).toBe(true);
        expect(byAccount(result.lineItems)).toEqual({
            CARD_SALES: "debit 122.88",
            OCGST: "debit 11.06",
            OSGST: "debit 11.06",
            PG: "credit 145",
        });
    });
});

describe("a subscription, which a physical card must not change", () => {
    const SUBSCRIPTION = {
        paymentThroughGateway: 290,
        netSubscriptionIncome: 245.76,
        outputGSTonRevenue: 44.24,
        isInterState: false,
        billingType: "MONTHLY",
    };

    it("still credits Subscription Fees", async () => {
        const result = await buildTransactionLineItems(context(SUBSCRIPTION));

        expect(byAccount(result.lineItems).SUBSCRIPTION).toBe("credit 245.76");
        expect(byAccount(result.lineItems).CARD_SALES).toBeUndefined();
        expect(asked()).not.toContain("Physical Card Sales");
    });

    it("still defers an annual plan's income to Deferred Revenue", async () => {
        const result = await buildTransactionLineItems(context({ ...SUBSCRIPTION, billingType: "ANNUALLY" }));

        expect(byAccount(result.lineItems).DEFERRED).toBe("credit 245.76");
        expect(byAccount(result.lineItems).SUBSCRIPTION).toBeUndefined();
    });

    it("still reverses a refund on Subscription Fees", async () => {
        const result = await buildRefundLineItems(context(SUBSCRIPTION));

        expect(byAccount(result.lineItems).SUBSCRIPTION).toBe("debit 245.76");
    });
});
