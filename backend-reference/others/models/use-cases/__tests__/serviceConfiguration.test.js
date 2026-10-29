jest.mock("../accountingAddOns", () => ({ loadAddOnCounts: jest.fn(async () => new Map()) }));

const sequelizeConfig = require("../../../configs/database/index");
const { loadAddOnCounts } = require("../accountingAddOns");
const {
    PLATFORM_FEE_COUNTS_SQL,
    buildPlanCountsQuery,
    loadServiceConfiguration,
    withConfiguration,
} = require("../serviceConfiguration");

const service = overrides => ({ id: 5, accessKey: "electricity_bill", planType: "without_plans", ...overrides });

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.query.mockResolvedValue([]);
});

describe("the queries behind the configuration summary", () => {
    it("counts active package fees per service and how many are not marked configured", () => {
        expect(PLATFORM_FEE_COUNTS_SQL).toBe(
            "SELECT c.serviceOperatorId, COUNT(*) AS total, " +
                "SUM(COALESCE(c.isSurchargeConfigured, 0) = 0) AS notConfigured " +
                "FROM cashbacks c INNER JOIN packages p ON p.id = c.packageId " +
                "WHERE c.serviceStatus = 1 AND p.status = 1 AND c.serviceOperatorId IN (:operatorIds) " +
                "GROUP BY c.serviceOperatorId"
        );
    });

    it("counts active plans per service with plans, keeping each service's own filter", () => {
        const { sql, replacements } = buildPlanCountsQuery(["esim_tunz", "whatsApp_for_busines", "unknown_key"]);

        expect(sql).toBe(
            "SELECT :key0 AS accessKey, COUNT(*) AS total, " +
                "SUM(COALESCE(esimPlans.isCommissionConfigured, 0) = 0) AS notConfigured " +
                "FROM esimPlans WHERE esimPlans.status = 1 UNION ALL " +
                "SELECT :key1 AS accessKey, COUNT(*) AS total, " +
                "SUM(COALESCE(packages.isCommissionConfigured, 0) = 0) AS notConfigured " +
                "FROM packages WHERE packages.status = 1 AND packages.accessCode = 'whatsapp' AND type = '2'"
        );
        expect(replacements).toEqual({ key0: "esim_tunz", key1: "whatsApp_for_busines" });
    });
});

describe("loadServiceConfiguration", () => {
    it("gives a service without plans only its platform fee counts", async () => {
        sequelizeConfig.query.mockResolvedValueOnce([{ serviceOperatorId: 5, total: "4", notConfigured: "1" }]);

        const summary = await loadServiceConfiguration([service()]);

        expect(summary.get(5)).toEqual({
            plans: null,
            serviceCommissionItems: null,
            platformFee: { total: 4, notConfigured: 1 },
        });
        expect(sequelizeConfig.query).toHaveBeenCalledTimes(1);
        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({ operatorIds: [5] });
    });

    it("adds add-on counts for a service that has add-ons, and nothing for one that has none", async () => {
        loadAddOnCounts.mockResolvedValueOnce(
            new Map([["whatsApp_for_busines", { total: 2, notConfigured: [{ id: 7, name: "Bot Builder" }] }]])
        );

        const summary = await loadServiceConfiguration([
            service({ id: 9, accessKey: "REDACTED", planType: "with_plans" }),
            service({ id: 8, accessKey: "esim_tunz", planType: "with_plans" }),
        ]);

        expect(summary.get(9).addOns).toEqual({ total: 2, notConfigured: 1 });
        expect(summary.get(8)).not.toHaveProperty("addOns");
        expect(loadAddOnCounts).toHaveBeenCalledWith(["whatsApp_for_busines", "esim_tunz"]);
    });

    it("adds plan counts for a service with plans, and names what Domain and Hosting sells outside them", async () => {
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("FROM cashbacks")
                    ? [{ serviceOperatorId: 8, total: 2, notConfigured: 0 }]
                    : [
                          { accessKey: "esim_tunz", total: "12", notConfigured: "3" },
                          { accessKey: "domain_and_hosting", total: "6", notConfigured: "0" },
                      ]
            )
        );

        const summary = await loadServiceConfiguration([
            service({ id: 8, accessKey: "esim_tunz", planType: "with_plans" }),
            service({ id: 9, accessKey: "domain_and_hosting", planType: "with_plans" }),
        ]);

        expect(summary.get(8)).toEqual({
            plans: { total: 12, notConfigured: 3 },
            serviceCommissionItems: null,
            platformFee: { total: 2, notConfigured: 0 },
        });
        expect(summary.get(9)).toEqual({
            plans: { total: 6, notConfigured: 0 },
            serviceCommissionItems: "domain registrations",
            platformFee: { total: 0, notConfigured: 0 },
        });
    });

    it("leaves plan counts out for a service with plans that has no plan list, which is set as one commission", async () => {
        const summary = await loadServiceConfiguration([
            service({ id: 7, accessKey: "gift_desk", planType: "with_plans" }),
        ]);

        expect(summary.get(7).plans).toBeNull();
        expect(sequelizeConfig.query).toHaveBeenCalledTimes(1);
    });

    it("reads nothing for an empty page", async () => {
        expect((await loadServiceConfiguration([])).size).toBe(0);
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });
});

describe("withConfiguration", () => {
    it("attaches each service's summary without changing anything else", async () => {
        const rows = [service(), service({ id: 6, accessKey: "water" })];

        const result = await withConfiguration(rows);

        expect(result).toEqual([
            { ...rows[0], configuration: { plans: null, serviceCommissionItems: null, platformFee: { total: 0, notConfigured: 0 } } },
            { ...rows[1], configuration: { plans: null, serviceCommissionItems: null, platformFee: { total: 0, notConfigured: 0 } } },
        ]);
    });
});
