const { updatePackagePricing, updatePackagePricingBulk } = require("../../../models/use-cases/package");
const { updatePartnerShare } = require("../../../models/use-cases/systemUser");
const { getServicesTypeConfig } = require("../../../models/use-cases/accountingServices");
const { listSubscriptionPackages: listPackages } = require("../../../models/use-cases/subscriptionPackages");
const {
    validatePackagePricing,
    validatePackagePricingBulk,
    validatePartnerShare,
} = require("../../../utils/apiValidation");
const {
    updateSubscriptionPricing,
    updateSubscriptionPricingBulk,
    updateWhitelabelShare,
    listSubscriptionPackages,
} = require("../accountingCatalog");

jest.mock("../../../models/use-cases/package", () => ({
    updatePackagePricing: jest.fn(),
    updatePackagePricingBulk: jest.fn(),
}));
jest.mock("../../../models/use-cases/systemUser", () => ({ updatePartnerShare: jest.fn() }));
jest.mock("../../../models/use-cases/accountingServices", () => ({ getServicesTypeConfig: jest.fn() }));
jest.mock("../../../models/use-cases/subscriptionPackages", () => ({ listSubscriptionPackages: jest.fn() }));

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const run = async (handler, req) => {
    const res = mockRes();
    const next = jest.fn();
    await handler(req, res, next);
    return { res, next };
};

const pricing = {
    packagePrices: { monthly: 499, annually: 4999 },
    discount: { monthly: 50, annually: 500 },
};

describe("accountingCatalog controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getServicesTypeConfig.mockResolvedValue({ peko_service_subscriptions: ["ecommerce_store"] });
    });

    it("returns 404 when the package is missing", async () => {
        updatePackagePricing.mockResolvedValue(null);

        const { next, res } = await run(updateSubscriptionPricing, { params: { id: "9" }, body: pricing });

        expect(next.mock.calls[0][0].status_code).toBe(404);
        expect(res.json).not.toHaveBeenCalled();
    });

    it("returns the updated pricing", async () => {
        updatePackagePricing.mockResolvedValue({ id: 9, ...pricing });

        const { res } = await run(updateSubscriptionPricing, { params: { id: "9" }, body: pricing });

        expect(updatePackagePricing).toHaveBeenCalledWith("9", pricing, {
            serviceAccessCodes: ["ecommerce_store"],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toEqual(
            expect.objectContaining({ status: true, data: { id: 9, ...pricing }, responseCode: "000" })
        );
    });

    it("bulk-applies pricing and returns the ids", async () => {
        updatePackagePricingBulk.mockResolvedValue({ ids: [9, 10], ...pricing });

        const { res } = await run(updateSubscriptionPricingBulk, { body: { ids: [9, 10], ...pricing } });

        expect(updatePackagePricingBulk).toHaveBeenCalledWith([9, 10], pricing, {
            serviceAccessCodes: ["ecommerce_store"],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toEqual(
            expect.objectContaining({ status: true, data: { ids: [9, 10], ...pricing }, responseCode: "000" })
        );
    });

    it("returns 500 when the bulk update fails", async () => {
        updatePackagePricingBulk.mockResolvedValue(null);

        const { next } = await run(updateSubscriptionPricingBulk, { body: { ids: [9], ...pricing } });

        expect(next.mock.calls[0][0].status_code).toBe(500);
    });

    it("lists the plans and the packages of the services classified as Peko's own, a page at a time", async () => {
        listPackages.mockResolvedValue({ rows: [{ id: 40, packageName: "Commerce Pro" }], count: 11 });

        const { res } = await run(listSubscriptionPackages, {
            query: { searchText: "pro", page: 2, itemsPerPage: 10, partnerId: "default", sort: "ASC", sortField: "packageName" },
        });

        expect(listPackages).toHaveBeenCalledWith({
            serviceAccessCodes: ["ecommerce_store"],
            searchText: "pro",
            partnerId: "default",
            sort: "ASC",
            sortField: "packageName",
            limit: 10,
            offset: 10,
        });
        expect(res.json.mock.calls[0][0].data).toEqual({
            recordsTotal: 11,
            recordsFiltered: 11,
            data: [{ id: 40, packageName: "Commerce Pro" }],
        });
    });

    it("returns 404 when the partner is missing", async () => {
        updatePartnerShare.mockResolvedValue(null);

        const { next } = await run(updateWhitelabelShare, { params: { id: "3" }, body: { sharePercentage: 20 } });

        expect(next.mock.calls[0][0].status_code).toBe(404);
    });

    it("returns the updated share", async () => {
        updatePartnerShare.mockResolvedValue({ id: 3, sharePercentage: 20 });

        const { res } = await run(updateWhitelabelShare, { params: { id: "3" }, body: { sharePercentage: 20 } });

        expect(updatePartnerShare).toHaveBeenCalledWith("3", { sharePercentage: 20 });
        expect(res.json.mock.calls[0][0].data).toEqual({ id: 3, sharePercentage: 20 });
    });

    it("passes the gateway charge terms through, and only what the body carries", async () => {
        updatePartnerShare.mockResolvedValue({ id: 3, gatewayCharge: { percentage: 1.95, fixed: 3 } });

        const { res } = await run(updateWhitelabelShare, {
            params: { id: "3" },
            body: { gatewayCharge: { percentage: 1.95, fixed: 3 }, userId: 9, userType: "system_user" },
        });

        expect(updatePartnerShare).toHaveBeenCalledWith("3", { gatewayCharge: { percentage: 1.95, fixed: 3 } });
        expect(res.json.mock.calls[0][0].data).toEqual({ id: 3, gatewayCharge: { percentage: 1.95, fixed: 3 } });
    });
});

describe("accountingCatalog validators", () => {
    const validate = (validator, body) => {
        const req = { body };
        const next = jest.fn();
        validator(req, {}, next);
        return { req, next };
    };

    it("rejects a discount above the price", () => {
        const { next } = validate(validatePackagePricing, {
            ...pricing,
            discount: { monthly: 600, annually: 500 },
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(next.mock.calls[0][0].message).toContain("Monthly discount");
    });

    it("accepts valid pricing and strips unknown keys", () => {
        const { req, next } = validate(validatePackagePricing, { ...pricing, packageName: "x" });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual(pricing);
    });

    it("rejects a bulk update with no ids selected", () => {
        const { next } = validate(validatePackagePricingBulk, { ids: [], ...pricing });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(next.mock.calls[0][0].message).toContain("Select at least one row");
    });

    it("rejects a bulk discount above the price", () => {
        const { next } = validate(validatePackagePricingBulk, {
            ids: [1, 2],
            ...pricing,
            discount: { monthly: 600, annually: 500 },
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(next.mock.calls[0][0].message).toContain("Monthly discount");
    });

    it("accepts a valid bulk update and strips unknown keys", () => {
        const { req, next } = validate(validatePackagePricingBulk, {
            ids: [1, 2],
            ...pricing,
            packageName: "x",
        });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ ids: [1, 2], ...pricing });
    });

    it("rejects an out-of-range share percentage", () => {
        const { next } = validate(validatePartnerShare, { sharePercentage: 101 });

        expect(next.mock.calls[0][0].status_code).toBe(400);
    });

    it("accepts a valid share percentage", () => {
        const { req, next } = validate(validatePartnerShare, { sharePercentage: "12.5" });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ sharePercentage: 12.5 });
    });

    it("accepts the gateway charge terms on their own, as numbers", () => {
        const { req, next } = validate(validatePartnerShare, { gatewayCharge: { percentage: "1.95", fixed: "3" } });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ gatewayCharge: { percentage: 1.95, fixed: 3 } });
    });

    it("lets the terms be cleared", () => {
        const { req, next } = validate(validatePartnerShare, { gatewayCharge: null });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ gatewayCharge: null });
    });

    it("rejects an empty body, a half-filled charge, a negative fixed charge and a charge above 100%", () => {
        [
            {},
            { gatewayCharge: { percentage: 2 } },
            { gatewayCharge: { percentage: 2, fixed: -1 } },
            { gatewayCharge: { percentage: 101, fixed: 0 } },
        ].forEach(body => {
            expect(validate(validatePartnerShare, body).next.mock.calls[0][0].status_code).toBe(400);
        });
    });
});
