const { validatePaymentLinkCharge } = require("../apiValidation");
const { validatePaymentLinkChargesQuery, validatePaymentLinkChargeParams } = require("../queryValidation");

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const runBody = body => {
    const req = { body };
    const next = jest.fn();
    validatePaymentLinkCharge(req, mockRes(), next);
    return { req, next };
};

const runQuery = (validator, req) => {
    const res = mockRes();
    const next = jest.fn();
    validator(req, res, next);
    return { req, res, next };
};

describe("validatePaymentLinkCharge", () => {
    it("keeps the two figures as numbers and drops anything else", () => {
        const { req, next } = runBody({ percentage: "1.95", fixed: "3", note: "x", userId: 1 });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ percentage: 1.95, fixed: 3, userId: 1 });
    });

    it("accepts a charge of nothing at all", () => {
        const { req, next } = runBody({ percentage: 0, fixed: 0 });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ percentage: 0, fixed: 0 });
    });

    it.each([
        [{ fixed: 3 }],
        [{ percentage: 1 }],
        [{ percentage: -1, fixed: 0 }],
        [{ percentage: 101, fixed: 0 }],
        [{ percentage: 1, fixed: -5 }],
        [{ percentage: "abc", fixed: 0 }],
    ])("rejects %j", body => {
        const { next } = runBody(body);

        expect(next.mock.calls[0][0].status_code).toBe(400);
    });
});

describe("validatePaymentLinkChargesQuery", () => {
    it("fills the defaults: every corporate, by name, first page of ten", () => {
        const { req, next } = runQuery(validatePaymentLinkChargesQuery, { query: {} });

        expect(next).toHaveBeenCalledWith();
        expect(req.query).toEqual({
            page: 1,
            itemsPerPage: 10,
            searchText: "",
            scope: "all",
            sort: "ASC",
            sortField: "corporate",
        });
    });

    it("keeps a custom-only listing sorted by when it was last set", () => {
        const { req, next } = runQuery(validatePaymentLinkChargesQuery, {
            query: { scope: "custom", sortField: "updatedAt", sort: "DESC", page: "2", searchText: "acme", extra: "1" },
        });

        expect(next).toHaveBeenCalledWith();
        expect(req.query).toEqual({
            page: 2,
            itemsPerPage: 10,
            searchText: "acme",
            scope: "custom",
            sort: "DESC",
            sortField: "updatedAt",
        });
    });

    it.each([[{ scope: "mine" }], [{ sortField: "charge" }], [{ itemsPerPage: "500" }]])("answers 400 to %j", query => {
        const { res, next } = runQuery(validatePaymentLinkChargesQuery, { query });

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("validatePaymentLinkChargeParams", () => {
    it("reads the corporate id as a number", () => {
        const { req, next } = runQuery(validatePaymentLinkChargeParams, { params: { credentialId: "99", userId: "7" } });

        expect(next).toHaveBeenCalledWith();
        expect(req.params).toEqual({ credentialId: 99, userId: "7" });
    });

    it.each([["abc"], ["0"], ["-4"], ["1.5"]])("answers 400 to a corporate id of %s", credentialId => {
        const { res, next } = runQuery(validatePaymentLinkChargeParams, { params: { credentialId } });

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
