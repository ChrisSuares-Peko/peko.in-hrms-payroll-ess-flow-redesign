const {
    validateVendorDeposit,
    validateVendorCreditNote,
    validateVendorCommission,
    validateVendorDepositEdit,
    validatePartnerPayoutEdit,
    validatePaymentGatewaySettlementEdit,
    validatePaymentGatewayFeeEdit,
    validateLedgerOpeningBalanceEdit,
    validateLedgerEntryEdit,
    validateLedgerVoid,
    validateBooksTag,
} = require("../apiValidation");

const base64OfKb = kb => Buffer.alloc(kb * 1024, 1).toString("base64");

const run = (validator, body) => {
    const req = { body };
    const next = jest.fn();
    validator(req, {}, next);
    return { req, next };
};

const DEPOSIT = {
    amount: 25000,
    depositDate: "2026-09-18",
    reference: "UTR-778899",
    mode: "NEFT",
    note: "",
};

const CREDIT_NOTE = {
    reference: "CN-1",
    amount: 1500,
    issueDate: "2026-09-18",
};

const SLIP = { slipBase64: "JVBERi0xLjQK", slipName: "receipt.pdf", slipFormat: "pdf" };

describe("vendor deposit slip validation", () => {
    it("keeps the slip fields instead of stripping them", () => {
        const { req, next } = run(validateVendorDeposit, { ...DEPOSIT, ...SLIP });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toMatchObject(SLIP);
    });

    it("still accepts a deposit with no slip at all", () => {
        const { req, next } = run(validateVendorDeposit, { ...DEPOSIT });

        expect(next).toHaveBeenCalledWith();
        expect(req.body.slipBase64).toBeUndefined();
    });

    it("accepts an emptied slip field from a cleared upload", () => {
        const { next } = run(validateVendorDeposit, {
            ...DEPOSIT,
            slipBase64: null,
            slipName: "",
            slipFormat: "",
        });

        expect(next).toHaveBeenCalledWith();
    });

    it("rejects a file type that is not a pdf or an image", () => {
        const { next } = run(validateVendorDeposit, {
            ...DEPOSIT,
            ...SLIP,
            slipFormat: "exe",
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(next.mock.calls[0][0].message).toContain("PDF, JPG or PNG");
    });

    it("lower cases the format so jpeg and JPEG both pass", () => {
        const { req, next } = run(validateVendorDeposit, {
            ...DEPOSIT,
            ...SLIP,
            slipFormat: "JPEG",
        });

        expect(next).toHaveBeenCalledWith();
        expect(req.body.slipFormat).toBe("jpeg");
    });

    it("rejects a slip over five megabytes", () => {
        const { next } = run(validateVendorDeposit, {
            ...DEPOSIT,
            ...SLIP,
            slipBase64: base64OfKb(5 * 1024 + 64),
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(next.mock.calls[0][0].message).toContain("5 MB");
    });

    it("accepts a slip just under the cap", () => {
        const { next } = run(validateVendorDeposit, {
            ...DEPOSIT,
            ...SLIP,
            slipBase64: base64OfKb(4 * 1024),
        });

        expect(next).toHaveBeenCalledWith();
    });
});

describe("vendor ledger entry validation", () => {
    it("keeps the document fields", () => {
        const { req, next } = run(validateVendorCreditNote, { ...CREDIT_NOTE, ...SLIP });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toMatchObject(SLIP);
    });

    it("rejects an unsupported document type", () => {
        const { next } = run(validateVendorCreditNote, {
            ...CREDIT_NOTE,
            ...SLIP,
            slipFormat: "docx",
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
    });

    it("holds a manual commission to the same shape", () => {
        const { req, next } = run(validateVendorCommission, {
            reference: "CM-14",
            amount: 236,
            issueDate: "2026-09-19",
            reason: "Annual rebate",
        });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toMatchObject({ amount: 236, reason: "Annual rebate" });
        expect(req.body.reference).toBeUndefined();
    });

    it("needs a positive amount on either kind, and no number of its own", () => {
        [validateVendorCreditNote, validateVendorCommission].forEach(validator => {
            expect(run(validator, { amount: 1, issueDate: "2026-09-19" }).next).toHaveBeenCalledWith();
            expect(
                run(validator, { reference: "X", amount: 0, issueDate: "2026-09-19" }).next.mock.calls[0][0]
                    .status_code
            ).toBe(400);
        });
    });

    it("drops any number typed for the entry instead of passing it through", () => {
        const { req } = run(validateVendorCreditNote, { ...CREDIT_NOTE, creditNoteNumber: "CN-OLD" });

        expect(req.body.creditNoteNumber).toBeUndefined();
        expect(req.body.reference).toBeUndefined();
    });
});

describe("changing an entry recorded by hand", () => {
    const PAYOUT = { amount: 450, payoutDate: "2026-09-25", reference: "P-2", mode: "NEFT", note: "" };
    const GATEWAY_ENTRY = { amount: 900, entryDate: "2026-09-23", reference: "R-2", mode: "NEFT", note: "" };
    const OPENING = { amount: -1200, asOfDate: "2026-08-31", note: "" };

    it.each([
        ["a deposit", validateVendorDepositEdit, DEPOSIT],
        ["a payout", validatePartnerPayoutEdit, PAYOUT],
        ["a gateway receipt", validatePaymentGatewaySettlementEdit, GATEWAY_ENTRY],
        ["a gateway fee", validatePaymentGatewayFeeEdit, GATEWAY_ENTRY],
        ["an opening balance", validateLedgerOpeningBalanceEdit, OPENING],
        ["a credit note, commission or debit note", validateLedgerEntryEdit, CREDIT_NOTE],
    ])("needs a reason for changing %s, on top of the fields it was recorded with", (_, validator, body) => {
        const missing = run(validator, body);
        expect(missing.next.mock.calls[0][0].status_code).toBe(400);
        expect(missing.next.mock.calls[0][0].message).toBe("Say why the entry is being changed");

        const short = run(validator, { ...body, changeReason: "ok" });
        expect(short.next.mock.calls[0][0].message).toBe("Give a short reason for the change");

        const given = run(validator, { ...body, changeReason: "  Typed the wrong amount  " });
        expect(given.next).toHaveBeenCalledWith();
        expect(given.req.body.changeReason).toBe("Typed the wrong amount");
    });

    it("still holds an edited entry to the rules it was recorded under", () => {
        const { next } = run(validateVendorDepositEdit, { ...DEPOSIT, amount: 0, changeReason: "Wrong amount" });

        expect(next.mock.calls[0][0].status_code).toBe(400);
    });

    it("needs a reason to delete an entry", () => {
        expect(run(validateLedgerVoid, {}).next.mock.calls[0][0].status_code).toBe(400);
        expect(run(validateLedgerVoid, { reason: "Recorded twice" }).next).toHaveBeenCalledWith();
    });
});

describe("marking an entry as in the books", () => {
    it("takes a yes or a no and nothing else", () => {
        const yes = run(validateBooksTag, { synced: true, note: "dropped" });
        expect(yes.next).toHaveBeenCalledWith();
        expect(yes.req.body).toEqual({ synced: true });

        expect(run(validateBooksTag, { synced: "false" }).req.body).toEqual({ synced: false });
        expect(run(validateBooksTag, {}).next.mock.calls[0][0].status_code).toBe(400);
        expect(run(validateBooksTag, { synced: "maybe" }).next.mock.calls[0][0].status_code).toBe(400);
    });
});

describe("the GST toggle on an entry recorded by hand", () => {
    const { validatePartnerDebitNote } = require("../apiValidation");

    it("reads the amount as inclusive unless the form says otherwise", () => {
        expect(run(validateVendorCreditNote, CREDIT_NOTE).req.body.gstInclusive).toBe(true);
        expect(run(validateVendorCommission, { ...CREDIT_NOTE, gstInclusive: false }).req.body.gstInclusive).toBe(false);
        expect(run(validatePartnerDebitNote, { ...CREDIT_NOTE, gstInclusive: "false" }).req.body.gstInclusive).toBe(false);
    });

    it("refuses anything that is not a yes or a no", () => {
        expect(run(validateVendorCreditNote, { ...CREDIT_NOTE, gstInclusive: "maybe" }).next.mock.calls[0][0].status_code).toBe(400);
    });
});
