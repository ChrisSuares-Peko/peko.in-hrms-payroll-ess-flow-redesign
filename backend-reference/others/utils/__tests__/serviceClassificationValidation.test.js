const { validateServiceClassificationParams, validateServiceClassificationQuery } = require("../queryValidation");
const { validateServiceClassification } = require("../apiValidation");

const runQuery = (validator, req) => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    validator(req, res, next);
    return { res, next };
};

const runBody = (validator, body) => {
    const req = { body };
    const next = jest.fn();
    validator(req, {}, next);
    return { req, next };
};

describe("validateServiceClassificationParams", () => {
    it("trims the access key and keeps the other params", () => {
        const req = { params: { userId: "7", accessKey: " esim_tunz " } };

        const { next, res } = runQuery(validateServiceClassificationParams, req);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
        expect(req.params).toEqual({ userId: "7", accessKey: "esim_tunz" });
    });

    it("refuses a blank or oversized key", () => {
        ["", "   ", "x".repeat(101)].forEach(accessKey => {
            const { res } = runQuery(validateServiceClassificationParams, { params: { accessKey } });
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});

describe("validateServiceClassificationQuery", () => {
    it("fills the defaults and lists A to Z", () => {
        const req = { query: {} };

        const { next } = runQuery(validateServiceClassificationQuery, req);

        expect(next).toHaveBeenCalledWith();
        expect(req.query).toEqual({
            classification: "all",
            page: 1,
            itemsPerPage: 10,
            searchText: "",
            sort: "ASC",
            sortField: "serviceProvider",
        });
    });

    it("accepts every classification filter and refuses the rest", () => {
        ["all", "unclassified", "with_plans", "without_plans", "peko_subscription", "peko_subscription_vendor"].forEach(classification => {
            const req = { query: { classification, page: "2" } };
            runQuery(validateServiceClassificationQuery, req);
            expect(req.query).toMatchObject({ classification, page: 2 });
        });

        const { res } = runQuery(validateServiceClassificationQuery, { query: { classification: "maybe" } });
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("validateServiceClassification", () => {
    it("accepts either plan type or null and strips the rest", () => {
        ["with_plans", "without_plans", "peko_subscription", "peko_subscription_vendor", null].forEach(planType => {
            const { req, next } = runBody(validateServiceClassification, { planType, userId: 7, extra: true });
            expect(next).toHaveBeenCalledWith();
            expect(req.body).toEqual({ planType, userId: 7 });
        });
    });

    it("refuses a missing or unknown plan type", () => {
        [{}, { planType: "maybe" }, { planType: "" }].forEach(body => {
            const { next } = runBody(validateServiceClassification, body);
            expect(next.mock.calls[0][0].status_code).toBe(400);
        });
    });
});

describe("validateServicesTypeConfig", () => {
    const { validateServicesTypeConfig } = require("../apiValidation");

    it("keeps the list of Peko's own service subscriptions beside the two vendor lists", () => {
        const { req, next } = runBody(validateServicesTypeConfig, {
            service_with_plans: ["esim"],
            peko_service_subscriptions: ["ecommerce_store"],
            stray: true,
        });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({
            service_with_plans: ["esim"],
            service_without_plans: [],
            peko_service_subscriptions: ["ecommerce_store"],
            peko_subscription_vendors: [],
        });
    });
});
