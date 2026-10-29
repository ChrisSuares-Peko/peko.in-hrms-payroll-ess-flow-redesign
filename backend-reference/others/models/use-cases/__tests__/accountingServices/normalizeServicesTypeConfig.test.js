const { getASetting } = require("../../setting");
const {
    normalizeServicesTypeConfig,
    getServicesTypeConfig,
    findOverlappingKeys,
    findPlanTypeForAccessKey,
    resolveClassificationFilter,
    classifiedKeys,
    isVendorPlanType,
    isCommissionConfigured,
    serializeService,
} = require("../../accountingServices");

jest.mock("../../setting", () => ({
    getASetting: jest.fn(),
    upsertSetting: jest.fn(),
}));

jest.mock("../../../entities/serviceOperator", () => ({
    findAll: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/vendor", () => ({}));

jest.mock("../../../../utils/sortHandle", () => ({
    handleSortFields: jest.fn((field, sort) => [[field, sort]]),
}));

describe("normalizeServicesTypeConfig", () => {
    it("returns empty lists when the row is missing", () => {
        expect(normalizeServicesTypeConfig(false)).toEqual({
            service_with_plans: [],
            service_without_plans: [],
            peko_service_subscriptions: [],
            peko_subscription_vendors: [],
        });
        expect(normalizeServicesTypeConfig(null)).toEqual({
            service_with_plans: [],
            service_without_plans: [],
            peko_service_subscriptions: [],
            peko_subscription_vendors: [],
        });
    });

    it("keeps only trimmed, non-empty, unique strings", () => {
        expect(
            normalizeServicesTypeConfig({
                service_with_plans: [" esim ", "esim", "", 12, null, "quickcilver"],
                service_without_plans: "not-an-array",
            })
        ).toEqual({
            service_with_plans: ["esim", "quickcilver"],
            service_without_plans: [],
            peko_service_subscriptions: [],
            peko_subscription_vendors: [],
        });
    });
});

describe("getServicesTypeConfig", () => {
    beforeEach(() => jest.clearAllMocks());

    it("reads the servicesTypeConfig row and normalises it", async () => {
        getASetting.mockResolvedValue({ service_with_plans: ["esim"], service_without_plans: ["tbo_airline"] });

        const result = await getServicesTypeConfig();

        expect(getASetting).toHaveBeenCalledWith("servicesTypeConfig");
        expect(result).toEqual({
            service_with_plans: ["esim"],
            service_without_plans: ["tbo_airline"],
            peko_service_subscriptions: [],
            peko_subscription_vendors: [],
        });
    });

    it("falls back to empty lists when the row does not exist", async () => {
        getASetting.mockResolvedValue(false);

        expect(await getServicesTypeConfig()).toEqual({
            service_with_plans: [],
            service_without_plans: [],
            peko_service_subscriptions: [],
            peko_subscription_vendors: [],
        });
    });
});

describe("findOverlappingKeys / findPlanTypeForAccessKey", () => {
    const config = { service_with_plans: ["esim", "shared"], service_without_plans: ["shared", "tbo_airline"] };

    it("lists keys present in both lists", () => {
        expect(findOverlappingKeys(config)).toEqual(["shared"]);
    });

    it("resolves the plan type of an access key when both lists are mapped", () => {
        expect(findPlanTypeForAccessKey(config, "esim")).toBe("with_plans");
        expect(findPlanTypeForAccessKey(config, "tbo_airline")).toBe("without_plans");
        expect(findPlanTypeForAccessKey(config, "unknown")).toBeNull();
    });

    it("leaves an unlisted key unclassified even when the without-plans list is empty", () => {
        const partial = { service_with_plans: ["esim"], service_without_plans: [] };
        expect(findPlanTypeForAccessKey(partial, "esim")).toBe("with_plans");
        expect(findPlanTypeForAccessKey(partial, "anything_else")).toBeNull();
    });
});

describe("Peko's own service subscriptions", () => {
    const config = normalizeServicesTypeConfig({
        service_with_plans: ["esim"],
        service_without_plans: ["tbo_airline"],
        peko_service_subscriptions: [" ecommerce_store ", "whatsapp", "whatsapp"],
        peko_subscription_vendors: [],
    });

    it("keeps a third list for services Peko sells as its own subscriptions", () => {
        expect(config.peko_service_subscriptions).toEqual(["ecommerce_store", "whatsapp"]);
        expect(classifiedKeys(config)).toEqual(["esim", "tbo_airline", "ecommerce_store", "whatsapp"]);
    });

    it("resolves such a service as Peko's own, which is not a vendor service", () => {
        expect(findPlanTypeForAccessKey(config, "ecommerce_store")).toBe("peko_subscription");
        expect(isVendorPlanType("peko_subscription")).toBe(false);
        expect(isVendorPlanType("with_plans")).toBe(true);
        expect(isVendorPlanType(null)).toBe(false);
    });

    it("keeps a fourth list for the vendors that provide a Peko subscription, listed on Vendors but never gated", () => {
        const withVendors = normalizeServicesTypeConfig({
            service_with_plans: ["esim"],
            peko_service_subscriptions: ["ecommerce_store"],
            peko_subscription_vendors: [" peko_pos ", "peko_pos", 7],
        });

        expect(withVendors.peko_subscription_vendors).toEqual(["peko_pos"]);
        expect(classifiedKeys(withVendors)).toEqual(["esim", "ecommerce_store", "peko_pos"]);
        expect(findPlanTypeForAccessKey(withVendors, "peko_pos")).toBe("peko_subscription_vendor");
        expect(isVendorPlanType("peko_subscription_vendor")).toBe(false);
        expect(resolveClassificationFilter(withVendors, "peko_subscription_vendor")).toEqual({ include: ["peko_pos"] });
        expect(resolveClassificationFilter(withVendors, "unclassified")).toEqual({
            exclude: ["esim", "ecommerce_store", "peko_pos"],
        });
    });

    it("filters by the new class and keeps it out of the unclassified list", () => {
        expect(resolveClassificationFilter(config, "peko_subscription")).toEqual({ include: ["ecommerce_store", "whatsapp"] });
        expect(resolveClassificationFilter(config, "unclassified")).toEqual({
            exclude: ["esim", "tbo_airline", "ecommerce_store", "whatsapp"],
        });
    });

    it("flags a key listed both as Peko's own and as a vendor service", () => {
        expect(findOverlappingKeys({ ...config, service_with_plans: ["esim", "whatsapp"] })).toEqual(["whatsapp"]);
    });
});

describe("isCommissionConfigured / serializeService", () => {
    it("reads the explicit flag, not whether commissionType happens to be set", () => {
        expect(isCommissionConfigured({ isCommissionConfigured: true, commissionType: "PERCENTAGE" })).toBe(true);
        expect(isCommissionConfigured({ isCommissionConfigured: 1 })).toBe(true);
        expect(isCommissionConfigured({ isCommissionConfigured: false, commissionType: "PERCENTAGE" })).toBe(false);
        expect(isCommissionConfigured({ isCommissionConfigured: 0 })).toBe(false);
        expect(isCommissionConfigured({})).toBe(false);
    });

    it("serialises a sequelize row into the API shape", () => {
        const row = {
            get: () => ({
                id: 7,
                serviceProvider: "Airline",
                accessKey: "tbo_airline",
                commissionType: "PERCENTAGE",
                providerCommission: "2.5000",
                fixedCommissionPerTransaction: null,
                isCommissionConfigured: true,
                vendor: { id: 3, vendorName: "Cleartrip", apiUrl: "x" },
            }),
        };

        expect(serializeService(row, "without_plans")).toEqual(
            expect.objectContaining({
                id: 7,
                providerCommission: 2.5,
                fixedCommissionPerTransaction: 0,
                vendor: { id: 3, vendorName: "Cleartrip", vendorEmail: [] },
                planType: "without_plans",
                commissionConfigured: true,
            })
        );
    });

    it("returns a null vendor when none is linked", () => {
        expect(serializeService({ id: 1, providerCommission: 0 }, "with_plans").vendor).toBeNull();
    });
});
