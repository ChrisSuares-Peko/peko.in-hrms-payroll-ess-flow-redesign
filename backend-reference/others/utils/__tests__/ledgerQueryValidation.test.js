const {
    validatePaymentGatewaySettlementQuery,
    validateSubscriberLedgerQuery,
    validateOtherSalesQuery,
    validateThirdPartySalesQuery,
    validateLedgerTabQuery,
    validateLedgerDetailQuery,
    validateVendorLedgerTabQuery,
    validateVendorLedgerDetailQuery,
} = require("../queryValidation");

const run = (validator, query) => {
    const req = { query };
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    validator(req, res, next);
    return { req, res, next };
};

describe("validateSubscriberLedgerQuery", () => {
    it("fills the defaults for an empty query", () => {
        const { req, next } = run(validateSubscriberLedgerQuery, {});

        expect(next).toHaveBeenCalledWith();
        expect(req.query).toEqual({
            page: 1,
            itemsPerPage: 10,
            searchText: "",
            sort: "ASC",
            sortField: "name",
            refresh: false,
        });
    });

    it("accepts every listed sort field and the refresh flag as a string", () => {
        ["name", "username", "walletBalance", "isActive", "createdAt"].forEach(sortField => {
            expect(run(validateSubscriberLedgerQuery, { sortField, sort: "DESC" }).next).toHaveBeenCalledWith();
        });

        const { req } = run(validateSubscriberLedgerQuery, { refresh: "1", page: "3" });
        expect(req.query.refresh).toBe(true);
        expect(req.query.page).toBe(3);
    });

    it("accepts a partner id or Default, and treats an empty one as no filter", () => {
        expect(run(validateSubscriberLedgerQuery, { partnerId: "55" }).req.query.partnerId).toBe(55);
        expect(run(validateSubscriberLedgerQuery, { partnerId: "default" }).req.query.partnerId).toBe("default");
        expect(run(validateSubscriberLedgerQuery, { partnerId: "" }).req.query.partnerId).toBeUndefined();
    });

    it("rejects a partner that is neither an id nor Default", () => {
        const { res, next } = run(validateSubscriberLedgerQuery, { partnerId: "abc" });

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rejects a sort field that is not a column of the list", () => {
        const { res, next } = run(validateSubscriberLedgerQuery, { sortField: "password" });

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0]).toMatchObject({ status: false, responseCode: "001" });
    });

    it("drops unknown keys instead of passing them through", () => {
        const { req } = run(validateSubscriberLedgerQuery, { role: "ADMIN" });

        expect(req.query.role).toBeUndefined();
    });
});

describe("validateLedgerTabQuery status", () => {
    it("accepts the three statuses the vendor Transactions tab filters by, and an empty one as none", () => {
        ["success", "refunded", "failed"].forEach(status => {
            expect(run(validateLedgerTabQuery, { status }).req.query.status).toBe(status);
        });
        expect(run(validateLedgerTabQuery, { status: "" }).req.query.status).toBeUndefined();
    });

    it("accepts the five statuses the vendor Commissions tab filters by", () => {
        ["earned", "refunded", "active", "reversal", "reversed"].forEach(status => {
            expect(run(validateLedgerTabQuery, { status }).req.query.status).toBe(status);
        });
    });

    it("accepts the opening status the vendor Deposits tab filters by", () => {
        expect(run(validateLedgerTabQuery, { status: "opening" }).req.query.status).toBe("opening");
    });

    it("accepts the paid status the partner Payments tab filters by", () => {
        expect(run(validateLedgerTabQuery, { status: "paid" }).req.query.status).toBe("paid");
    });

    it("accepts the received and charged statuses the payment gateway tables filter by", () => {
        ["received", "charged"].forEach(status => {
            expect(run(validateLedgerTabQuery, { status }).req.query.status).toBe(status);
        });
    });

    it("accepts each deposit mode, and an empty one as none, and rejects any other", () => {
        ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"].forEach(mode => {
            expect(run(validateLedgerTabQuery, { mode }).req.query.mode).toBe(mode);
        });
        expect(run(validateLedgerTabQuery, { mode: "" }).req.query.mode).toBeUndefined();

        const { res, next } = run(validateLedgerTabQuery, { mode: "CASH" });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rejects any other status", () => {
        const { res, next } = run(validateLedgerTabQuery, { status: "pending" });

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("validateLedgerTabQuery type and side", () => {
    it("accepts each kind of wallet movement, and an empty one as none, and rejects any other", () => {
        [
            "purchase",
            "refund",
            "cashback",
            "cashback-reversal",
            "top-up",
            "admin-credit",
            "admin-withdrawal",
        ].forEach(type => {
            expect(run(validateLedgerTabQuery, { type }).req.query.type).toBe(type);
        });
        expect(run(validateLedgerTabQuery, { type: "" }).req.query.type).toBeUndefined();

        const { res, next } = run(validateLedgerTabQuery, { type: "transfer" });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("accepts debit and credit, and an empty one as none, and rejects any other", () => {
        ["debit", "credit"].forEach(side => {
            expect(run(validateLedgerTabQuery, { side }).req.query.side).toBe(side);
        });
        expect(run(validateLedgerTabQuery, { side: "" }).req.query.side).toBeUndefined();

        const { res, next } = run(validateLedgerTabQuery, { side: "both" });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("validatePaymentGatewaySettlementQuery", () => {
    it("fills the defaults, with no filter on either table", () => {
        const { req, next } = run(validatePaymentGatewaySettlementQuery, {});

        expect(next).toHaveBeenCalledWith();
        expect(req.query).toEqual({
            page: 1,
            feePage: 1,
            itemsPerPage: 5,
            searchText: "",
            feeSearchText: "",
        });
    });

    it("gives the received table the plain search, status and mode, and the fee table its own", () => {
        const { req } = run(validatePaymentGatewaySettlementQuery, {
            searchText: "utr",
            status: "opening",
            mode: "UPI",
            feeSearchText: "bill",
            feeStatus: "charged",
            feePage: "2",
        });

        expect(req.query).toMatchObject({
            searchText: "utr",
            status: "opening",
            mode: "UPI",
            feeSearchText: "bill",
            feeStatus: "charged",
            feePage: 2,
        });
    });

    it.each([
        ["status", ["received", "opening", "reversal", "reversed"], "charged"],
        ["feeStatus", ["charged", "reversal", "reversed"], "opening"],
    ])("accepts only the names the %s table's pill uses, and an empty one as none", (key, names, other) => {
        names.forEach(name => {
            expect(run(validatePaymentGatewaySettlementQuery, { [key]: name }).req.query[key]).toBe(name);
        });
        expect(run(validatePaymentGatewaySettlementQuery, { [key]: "" }).req.query[key]).toBeUndefined();

        const { res, next } = run(validatePaymentGatewaySettlementQuery, { [key]: other });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("accepts each mode, and rejects any other", () => {
        ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"].forEach(mode => {
            expect(run(validatePaymentGatewaySettlementQuery, { mode }).req.query.mode).toBe(mode);
        });

        const { res, next } = run(validatePaymentGatewaySettlementQuery, { mode: "CASH" });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("validateOtherSalesQuery partner", () => {
    it("accepts a partner id or Default, and treats an empty one as no filter", () => {
        expect(run(validateOtherSalesQuery, { partnerId: "55" }).req.query.partnerId).toBe(55);
        expect(run(validateOtherSalesQuery, { partnerId: "default" }).req.query.partnerId).toBe("default");
        expect(run(validateOtherSalesQuery, { partnerId: "" }).req.query.partnerId).toBeUndefined();
    });

    it("rejects a partner that is neither an id nor Default", () => {
        const { res, next } = run(validateOtherSalesQuery, { partnerId: "abc" });

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("shared ledger validators", () => {
    it("keeps the vendor names as aliases of the generic validators", () => {
        expect(validateVendorLedgerTabQuery).toBe(validateLedgerTabQuery);
        expect(validateVendorLedgerDetailQuery).toBe(validateLedgerDetailQuery);
    });

    it("requires from and to together on the tab query", () => {
        expect(run(validateLedgerTabQuery, { from: "2026-09-01" }).res.status).toHaveBeenCalledWith(400);
        expect(run(validateLedgerTabQuery, { from: "2026-09-01", to: "2026-08-01" }).res.status).toHaveBeenCalledWith(400);

        const { req, next } = run(validateLedgerTabQuery, { from: "2026-09-01", to: "2026-09-19", page: "2" });
        expect(next).toHaveBeenCalledWith();
        expect(req.query.page).toBe(2);
        expect(req.query.itemsPerPage).toBe(10);
    });

    it("accepts an empty detail query and a paired range", () => {
        expect(run(validateLedgerDetailQuery, {}).next).toHaveBeenCalledWith();
        expect(run(validateLedgerDetailQuery, { from: "2026-09-01", to: "2026-09-19" }).next).toHaveBeenCalledWith();
        expect(run(validateLedgerDetailQuery, { to: "2026-09-19" }).res.status).toHaveBeenCalledWith(400);
    });
});

describe("validateThirdPartySalesQuery", () => {
    const runKind = (query, kind = "payment-links", format) => {
        const req = { query, params: format ? { kind, format } : { kind } };
        const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
        const next = jest.fn();
        validateThirdPartySalesQuery(req, res, next);
        return { req, res, next };
    };

    it("fills the defaults for an empty query, dated by when the link was answered or raised", () => {
        const { req, next } = runKind({});

        expect(next).toHaveBeenCalledWith();
        expect(req.query).toEqual({
            page: 1,
            itemsPerPage: 10,
            searchText: "",
            accounts: "all",
            sort: "DESC",
            sortField: "eventDate",
        });
    });

    it("accepts each outcome as a status, and an empty one as no filter", () => {
        ["paid", "pending", "failed", "expired"].forEach(status => {
            const { req, next } = runKind({ status });
            expect(next).toHaveBeenCalledWith();
            expect(req.query.status).toBe(status);
        });
        expect(runKind({ status: "" }).req.query.status).toBeUndefined();
    });

    it("rejects a status or a sort field it does not list", () => {
        expect(runKind({ status: "settled" }).res.status).toHaveBeenCalledWith(400);
        expect(runKind({ sortField: "password" }).res.status).toHaveBeenCalledWith(400);
        ["eventDate", "amount", "createdAt", "status"].forEach(sortField => {
            expect(runKind({ sortField }).next).toHaveBeenCalledWith();
        });
    });

    it("requires from and to together, in order", () => {
        expect(runKind({ from: "2026-09-01" }).res.status).toHaveBeenCalledWith(400);
        expect(runKind({ from: "2026-09-16", to: "2026-09-01" }).res.status).toHaveBeenCalledWith(400);
        expect(runKind({ from: "2026-09-01", to: "2026-09-16" }).next).toHaveBeenCalledWith();
    });

    it("knows payment links, with or without an export format beside it, and nothing else", () => {
        expect(runKind({}, "payment-links", "pdf").next).toHaveBeenCalledWith();

        const { res, next } = runKind({}, "qr-codes");
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: false,
            message: "Unknown third-party sales kind",
            data: {},
            responseCode: "001",
        });
    });
});

describe("the account scope on the sales listings", () => {
    it("accepts all or internal, treats an empty one as all, and refuses anything else", () => {
        expect(run(validateOtherSalesQuery, { accounts: "internal" }).req.query.accounts).toBe("internal");
        expect(run(validateOtherSalesQuery, { accounts: "" }).req.query.accounts).toBe("all");
        expect(run(validateOtherSalesQuery, {}).req.query.accounts).toBe("all");
        expect(run(validateOtherSalesQuery, { accounts: "bogus" }).res.status).toHaveBeenCalledWith(400);

        const kinds = (query, kind = "payment-links") => {
            const req = { query, params: { kind } };
            const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
            validateThirdPartySalesQuery(req, res, jest.fn());
            return { req, res };
        };
        expect(kinds({ accounts: "internal" }).req.query.accounts).toBe("internal");
        expect(kinds({ accounts: "bogus" }).res.status).toHaveBeenCalledWith(400);
    });
});
