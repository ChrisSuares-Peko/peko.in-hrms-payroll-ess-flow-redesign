const { validateManualJournalEntry } = require("../apiValidation");

const run = body => {
    const req = { body };
    const next = jest.fn();
    validateManualJournalEntry(req, {}, next);
    return { req, next };
};

const LINES = [
    { accountId: "A1", direction: "credit", amount: 100 },
    { accountId: 2, direction: "debit", amount: 100 },
];

describe("validateManualJournalEntry", () => {
    it("accepts an entry without account ids, as a suggested journal has none", () => {
        const { req, next } = run({ journalDate: "2026-10-06", lineItems: LINES, journalAccountIds: null, reason: "test" });

        expect(next).toHaveBeenCalledWith();
        expect(req.body.journalAccountIds).toBeNull();
        expect(req.body.lineItems[1].accountId).toBe("2");
    });

    it("still refuses unbalanced lines and a short reason", () => {
        const unbalanced = run({ journalDate: "2026-10-06", lineItems: [LINES[0], { ...LINES[1], amount: 90 }], reason: "test" });
        expect(unbalanced.next.mock.calls[0][0]).toMatchObject({ message: "Debits and credits must be equal" });

        const short = run({ journalDate: "2026-10-06", lineItems: LINES, reason: "no" });
        expect(short.next.mock.calls[0][0]).toMatchObject({ status_code: 400 });
    });
});

describe("validateManualJournalSetup", () => {
    const { validateManualJournalSetup } = require("../apiValidation");
    const setup = (overrides = {}) => ({
        paymentThrough: "GATEWAY",
        orderAmount: 1104.84,
        pgAmount: 1365.58,
        gateway: { name: "Cashfree", accountId: "A-CF" },
        subscription: { is: false, billingType: null },
        vendor: { present: true },
        commission: { present: true, type: "FLAT", mode: "PRINCIPAL_MARKUP", value: 50, fixed: 0, inclusiveOfGst: true },
        mixed: { principalAmount: null, marginAmount: null },
        platformFee: { type: "PERCENTAGE", value: 20 },
        partner: { present: true, sharePercentage: 10 },
        coupon: { used: false },
        ...overrides,
    });
    const runSetup = body => {
        const req = { body };
        const next = jest.fn();
        validateManualJournalSetup(req, {}, next);
        return { req, error: next.mock.calls[0][0] };
    };

    it("accepts a full set-up and fills the defaults it leaves out", () => {
        const { req, error } = runSetup(setup({ coupon: undefined, mixed: undefined }));

        expect(error).toBeUndefined();
        expect(req.body.coupon).toEqual({ used: false });
        expect(req.body.mixed).toEqual({});
        expect(req.body.commission.inclusiveOfGst).toBe(true);
    });

    it("needs the amounts sold each way to add up on a mixed order, and a gateway amount unless paid from the wallet", () => {
        const mixed = runSetup(setup({ commission: { present: true, type: "PERCENTAGE", mode: "MIXED", value: 10 }, mixed: { principalAmount: 600, marginAmount: 400 }, orderAmount: 1000 }));
        expect(mixed.error).toBeUndefined();

        const short = runSetup(setup({ commission: { present: true, type: "PERCENTAGE", mode: "MIXED", value: 10 }, mixed: { principalAmount: 600, marginAmount: 300 }, orderAmount: 1000 }));
        expect(short.error.message).toBe("The amounts sold as principal and on margin must add up to the order amount");

        const wallet = runSetup(setup({ paymentThrough: "WALLET", pgAmount: 0 }));
        expect(wallet.error).toBeUndefined();
        const gateway = runSetup(setup({ pgAmount: 0 }));
        expect(gateway.error.message).toBe("Paid via gateway must be above zero unless the order was paid from the wallet");
    });

    it("refuses a mode, a type or a cycle it does not know", () => {
        expect(runSetup(setup({ commission: { present: true, type: "FLAT", mode: "OWN_REVENUE" } })).error.status_code).toBe(400);
        expect(runSetup(setup({ platformFee: { type: "SLAB", value: 1 } })).error.status_code).toBe(400);
        expect(runSetup(setup({ subscription: { is: true, billingType: "WEEKLY" } })).error.status_code).toBe(400);
    });

    it("carries the partner's gateway charge terms, lets them be cleared, and refuses a negative one", () => {
        const terms = runSetup(
            setup({ partner: { present: true, sharePercentage: 10, gatewayCharge: { percentage: "1.95", fixed: "3" } } })
        );
        expect(terms.error).toBeUndefined();
        expect(terms.req.body.partner.gatewayCharge).toEqual({ percentage: 1.95, fixed: 3 });

        const cleared = runSetup(setup({ partner: { present: true, sharePercentage: 10, gatewayCharge: null } }));
        expect(cleared.error).toBeUndefined();
        expect(cleared.req.body.partner.gatewayCharge).toBeNull();

        const negative = runSetup(
            setup({ partner: { present: true, sharePercentage: 10, gatewayCharge: { percentage: 1.95, fixed: -3 } } })
        );
        expect(negative.error).toMatchObject({ status_code: 400 });
    });
});

describe("the facts a split may carry", () => {
    it("accepts the mode, the billing cycle, the gateway name and the GST flags beside the numbers, and nothing else that is not a number", () => {
        const body = {
            journalDate: "2026-09-10",
            lineItems: [
                { accountId: "A1", direction: "credit", amount: 100 },
                { accountId: "A2", direction: "debit", amount: 100 },
            ],
            journalData: { commissionMode: "OWN_REVENUE", billingType: "ANNUALLY", paymentGatewayName: "Cashfree", isInterState: true, vendorIsInterState: false, netSubscriptionIncome: 1000 },
            reason: "Worker never ran",
        };
        const next = jest.fn();
        validateManualJournalEntry({ body }, {}, next);
        expect(next).toHaveBeenCalledWith();

        const bad = jest.fn();
        validateManualJournalEntry({ body: { ...body, journalData: { ...body.journalData, commissionMode: "AGENT" } } }, {}, bad);
        expect(bad.mock.calls[0][0].status_code).toBe(400);
    });
});
