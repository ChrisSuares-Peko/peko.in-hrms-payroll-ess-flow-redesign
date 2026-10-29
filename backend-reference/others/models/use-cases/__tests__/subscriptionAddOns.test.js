const sequelizeConfig = require("../../../configs/database/index");
const {
    buildWhere,
    buildRowsQuery,
    listSubscriptionAddOns,
    normaliseKind,
    serializeSubscriptionAddOn,
} = require("../subscriptionAddOns");

// "CS+" bundles two services, each configured separately — packageId alone isn't a unique row.
const CONFIGURED_ROW_A = {
    packageId: 116,
    packageName: "CS+",
    partnerId: "1830",
    partnerName: "Cent Saarthi",
    serviceOperatorId: 64,
    serviceProvider: "E Sign",
    accessKey: "REDACTED",
    cashbackId: 832,
    unitPrice: "15.00",
    baseLimit: "5.00",
    cashbackType: "FLAT",
    cashback: "0.00",
    surchargeType: "FLAT",
    surcharge: "0.00",
};

const CONFIGURED_ROW_B = {
    ...CONFIGURED_ROW_A,
    serviceOperatorId: 136,
    serviceProvider: "eSign",
    cashbackId: 826,
    unitPrice: "30.00",
    baseLimit: "50.00",
};

const UNCONFIGURED_OWN_ROW = {
    packageId: 8,
    packageName: "eSign",
    partnerId: null,
    partnerName: null,
    serviceOperatorId: 64,
    serviceProvider: "E Sign",
    accessKey: "REDACTED",
    cashbackId: null,
    unitPrice: null,
    baseLimit: null,
    cashbackType: null,
    cashback: null,
    surchargeType: null,
    surcharge: null,
};

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.query.mockImplementation(sql =>
        Promise.resolve(
            sql.includes("COUNT(*)") ? [{ totalCount: "3" }] : [CONFIGURED_ROW_A, CONFIGURED_ROW_B, UNCONFIGURED_OWN_ROW]
        )
    );
});

describe("which packages are eligible", () => {
    it("only real subscription packages", () => {
        const sql = buildWhere({ partnerId: undefined, searchText: "" });
        expect(sql).toContain("packages.type = '1'");
    });

    it("only services that are themselves a standalone package, not bundled sub-services", () => {
        const sql = buildWhere({ partnerId: undefined, searchText: "" });
        expect(sql).toContain(
            "serviceOperators.accessKey IN (SELECT accessCode FROM packages WHERE type = '1' AND accessCode <> '')"
        );
    });

    it("never narrows to one service, whatever service key is sent", () => {
        const sql = buildWhere({ partnerId: undefined, searchText: "", accessKey: "corporate_cards" });
        expect(sql).not.toContain(":accessKey");
    });

    it("keeps one-time items such as Corporate Cards out of the add-ons, whatever kind is asked for", () => {
        const exclusion = "AND NOT (COALESCE(serviceOperators.accessKey, '') IN (:oneTimeItemKeys))";
        expect(buildWhere({ partnerId: undefined, searchText: "" })).toContain(exclusion);
        expect(buildWhere({ partnerId: undefined, searchText: "", kind: "addons" })).toContain(exclusion);
        expect(buildWhere({ partnerId: undefined, searchText: "", kind: "OTHERS" })).toContain(exclusion);
        expect(normaliseKind("others")).toBe("others");
        expect(normaliseKind(undefined)).toBe("addons");
    });

    it("lists only one-time items for the Others tab, still from real subscription packages", () => {
        const sql = buildWhere({ partnerId: undefined, searchText: "", kind: "others" });
        expect(sql).toContain("packages.type = '1'");
        expect(sql).toContain("AND (COALESCE(serviceOperators.accessKey, '') IN (:oneTimeItemKeys))");
        expect(sql).not.toContain("AND NOT (COALESCE");
    });

    it("adds a partner/search filter only when one was asked for", () => {
        const bare = buildWhere({ partnerId: undefined, searchText: "" });
        expect(bare).not.toContain("partnerId");
        expect(bare).not.toContain("LIKE");

        expect(buildWhere({ partnerId: "default", searchText: "" })).toContain(
            "packages.partnerId IS NULL"
        );
        expect(buildWhere({ partnerId: 5, searchText: "" })).toContain(
            "packages.partnerId = :partnerId"
        );
        expect(buildWhere({ partnerId: undefined, searchText: "payroll" })).toContain(
            "packages.packageName LIKE :searchText"
        );
    });

    it("unions every already-configured (package, service) row with a package's own not-yet-configured one", () => {
        const sql = buildRowsQuery({ partnerId: undefined, searchText: "" });
        expect(sql).toContain("FROM cashbacks");
        expect(sql).toContain("UNION ALL");
        expect(sql).toContain("FROM packages");
        expect(sql).toContain("cashbacks.id IS NULL");
    });
});

describe("listing them", () => {
    it("carries the count beside the page, including multiple rows for the same package", async () => {
        const result = await listSubscriptionAddOns({
            partnerId: undefined,
            searchText: "",
            limit: 10,
            offset: 0,
        });
        expect(result.count).toBe(3);
        expect(result.rows).toEqual([CONFIGURED_ROW_A, CONFIGURED_ROW_B, UNCONFIGURED_OWN_ROW]);
    });

    it("binds the one-time item keys on both queries and asks both for the kind wanted", async () => {
        await listSubscriptionAddOns({ partnerId: undefined, searchText: "", kind: "others", limit: 10, offset: 0 });

        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
        sequelizeConfig.query.mock.calls.forEach(([sql, options]) => {
            expect(sql).toContain("(COALESCE(serviceOperators.accessKey, '') IN (:oneTimeItemKeys))");
            expect(sql).not.toContain("AND NOT (COALESCE");
            expect(options.replacements.oneTimeItemKeys).toEqual(["corporate_cards"]);
        });
    });
});

describe("shaping a row", () => {
    it("carries a configured row's cashbackId and existing cashback/surcharge fields through", () => {
        expect(serializeSubscriptionAddOn(CONFIGURED_ROW_A)).toEqual({
            packageId: 116,
            cashbackId: 832,
            packageName: "CS+",
            serviceProvider: "E Sign",
            accessKey: "REDACTED",
            serviceOperatorId: 64,
            partnerId: "1830",
            partnerName: "Cent Saarthi",
            unitPrice: "15.00",
            baseLimit: "5.00",
            cashbackType: "FLAT",
            cashback: "0.00",
            surchargeType: "FLAT",
            surcharge: "0.00",
        });
    });

    it("reports null (not a fake 0) for a package's service with no add-on configured yet", () => {
        const result = serializeSubscriptionAddOn(UNCONFIGURED_OWN_ROW);
        expect(result.cashbackId).toBeNull();
        expect(result.unitPrice).toBeNull();
        expect(result.baseLimit).toBeNull();
    });
});
