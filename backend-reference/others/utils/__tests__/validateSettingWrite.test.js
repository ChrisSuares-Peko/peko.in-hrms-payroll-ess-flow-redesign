const { validateSettingWrite } = require("../apiValidation");
const { PROTECTED_SETTING_NAMES, PROTECTED_SETTING_MESSAGE } = require("../protectedSettings");

const run = body => {
    const req = { body };
    const next = jest.fn();
    validateSettingWrite(req, {}, next);
    return { req, next };
};

describe("validateSettingWrite", () => {
    it("passes a well-formed write through with a trimmed name", () => {
        const { req, next } = run({ name: "  theme ", details: { dark: true }, userId: 1 });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ name: "theme", details: { dark: true }, userId: 1 });
    });

    it("rejects a missing name or value", () => {
        expect(run({ details: 1 }).next.mock.calls[0][0].status_code).toBe(400);
        expect(run({ name: "x" }).next.mock.calls[0][0].status_code).toBe(400);
    });

    it("refuses the accounting settings with a 403", () => {
        PROTECTED_SETTING_NAMES.forEach(name => {
            const { next } = run({ name, details: {} });

            expect(next.mock.calls[0][0].status_code).toBe(403);
            expect(next.mock.calls[0][0].message).toBe(PROTECTED_SETTING_MESSAGE);
        });
    });
});
