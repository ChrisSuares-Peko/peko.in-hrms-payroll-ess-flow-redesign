const { validateAccountingDashboardQuery } = require("../queryValidation");

const run = query => {
    const req = { query };
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    validateAccountingDashboardQuery(req, res, next);
    return { req, res, next };
};

describe("validateAccountingDashboardQuery", () => {
    it("defaults refresh to false", () => {
        const { req, next } = run({});
        expect(req.query).toEqual({ refresh: false });
        expect(next).toHaveBeenCalled();
    });

    it.each([
        ["1", true],
        ["true", true],
        ["0", false],
        ["false", false],
    ])("coerces refresh=%s to %s", (input, expected) => {
        const { req } = run({ refresh: input });
        expect(req.query.refresh).toBe(expected);
    });

    it("strips unknown parameters", () => {
        const { req } = run({ refresh: "1", page: "3" });
        expect(req.query).toEqual({ refresh: true });
    });

    it("rejects a non-boolean refresh flag", () => {
        const { res, next } = run({ refresh: "maybe" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ status: false, responseCode: "001", data: {} })
        );
        expect(next).not.toHaveBeenCalled();
    });
});
