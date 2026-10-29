const { validateServiceClassificationBulk } = require("../apiValidation");

const run = body => {
    const req = { body };
    const next = jest.fn();
    validateServiceClassificationBulk(req, {}, next);
    return { req, next };
};

describe("validateServiceClassificationBulk", () => {
    it("accepts a list of services and a plan type, trimming the keys and dropping the rest", () => {
        const { req, next } = run({ accessKeys: [" soundbox ", "visa"], planType: "with_plans", userId: 7, extra: 1 });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ accessKeys: ["soundbox", "visa"], planType: "with_plans", userId: 7 });
    });

    it("accepts Peko's own service subscription as a classification", () => {
        const { req, next } = run({ accessKeys: ["ecommerce_store"], planType: "peko_subscription" });

        expect(next).toHaveBeenCalledWith();
        expect(req.body.planType).toBe("peko_subscription");
    });

    it("accepts a vendor that provides a Peko subscription as a classification", () => {
        const { req, next } = run({ accessKeys: ["peko_pos"], planType: "peko_subscription_vendor" });

        expect(next).toHaveBeenCalledWith();
        expect(req.body.planType).toBe("peko_subscription_vendor");
    });

    it("refuses an empty list, a repeated key, or an unknown plan type", () => {
        expect(run({ accessKeys: [], planType: "with_plans" }).next.mock.calls[0][0].status_code).toBe(400);
        expect(run({ accessKeys: ["visa", "visa"], planType: "with_plans" }).next.mock.calls[0][0].status_code).toBe(400);
        expect(run({ accessKeys: ["visa"], planType: "none" }).next.mock.calls[0][0].status_code).toBe(400);
        expect(run({ accessKeys: ["visa"] }).next.mock.calls[0][0].status_code).toBe(400);
    });
});
