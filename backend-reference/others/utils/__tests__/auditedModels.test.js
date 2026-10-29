const PLAN_ENTITY_CONFIG = require("../planEntityConfig");
const { AUDITED_TABLES, CONFIG_TYPES, specOf, specOfTable, accessKeyOfTable, displayValue } = require("../auditedModels");

const ENTITY_OF_TABLE = {
    serviceOperators: "serviceOperator",
    vendors: "vendor",
    cashbacks: "cashback",
    packages: "package",
    mobileRechargeProviders: "mobileRechargeProvider",
    plans: "plans",
    systemUsers: "systemUser",
};

describe("the audit allow-list", () => {
    it.each(Object.entries(ENTITY_OF_TABLE))("only tracks columns that the %s model has", (table, entity) => {
        const attributes = Object.keys(require(`../../models/entities/${entity}`));

        AUDITED_TABLES[table].tracked.forEach(field => {
            expect(attributes).toContain(field);
        });
    });

    it("covers every plan table the Accounting Portal writes with raw SQL", () => {
        Object.values(PLAN_ENTITY_CONFIG).forEach(({ table }) => {
            expect(specOfTable(table)).toBeTruthy();
            expect(specOfTable(table).groups.PLAN_COMMISSION).toEqual(
                expect.arrayContaining(["commission", "isCommissionConfigured"])
            );
        });
    });

    it("names its configuration types the way the history page lists them", () => {
        expect([...CONFIG_TYPES].sort()).toEqual(
            [
                "CASHBACK",
                "PLAN_COMMISSION",
                "PLAN_PRICE",
                "PLATFORM_FEE",
                "SERVICE_COMMISSION",
                "SERVICE_VENDOR",
                "SUBSCRIPTION_ADDON",
                "SUBSCRIPTION_PRICING",
                "SUBSCRIPTION_STATUS",
                "WHITELABEL_SHARE",
                "WHITELABEL_STATUS",
                "VENDOR_LEDGER",
                "PARTNER_LEDGER",
                "GATEWAY_LEDGER",
                "VENDOR_INVOICE",
                "PAYMENT_LINK_CHARGE",
            ].sort()
        );
    });

    it("audits the price columns the Accounting Portal edits, as their own group", () => {
        expect(AUDITED_TABLES.work_plans.groups.PLAN_PRICE).toEqual(["price"]);
        expect(AUDITED_TABLES.plans.groups.PLAN_PRICE).toEqual(["price"]);
        expect(AUDITED_TABLES.hikes.groups.PLAN_PRICE).toEqual(["amount"]);
        expect(AUDITED_TABLES.carReportPlans.groups.PLAN_PRICE).toEqual(["price"]);
        expect(AUDITED_TABLES.softwares_subscriptions_plans.groups.PLAN_PRICE).toEqual(["monthlyPrice", "yearlyPrice"]);
        // Not edited there (vendor synced), so nothing to audit.
        expect(AUDITED_TABLES.esimPlans.groups.PLAN_PRICE).toBeUndefined();
    });

    it("keeps each flag in the group of the values it vouches for", () => {
        expect(AUDITED_TABLES.serviceOperators.groups.SERVICE_COMMISSION).toContain("isCommissionConfigured");
        expect(AUDITED_TABLES.cashbacks.groups.PLATFORM_FEE).toEqual(
            expect.arrayContaining(["surcharge", "surchargeType", "isSurchargeConfigured"])
        );
        expect(AUDITED_TABLES.packages.groups.PLAN_COMMISSION).toEqual(
            expect.arrayContaining(["planCommissions", "isCommissionConfigured"])
        );
    });

    it("gives every table a query that names its rows from a list of ids", () => {
        Object.values(AUDITED_TABLES).forEach(spec => {
            expect(spec.describe).toMatch(/:ids/);
            expect(spec.describe).toMatch(/AS name/);
            expect(spec.describe).toMatch(/AS parent/);
            expect(spec.describe).toMatch(/AS partner/);
        });
    });

    it("names a partner only for the settings that belong to one, and a whitelabel partner by its own name", () => {
        ["cashbacks", "packages", "work_plans", "hikes"].forEach(table => {
            expect(AUDITED_TABLES[table].describe).toMatch(/Peko \(Default\)/);
        });
        ["serviceOperators", "vendors", "plans", "esimPlans"].forEach(table => {
            expect(AUDITED_TABLES[table].describe).toMatch(/NULL AS partner/);
        });
        expect(AUDITED_TABLES.systemUsers.describe).toMatch(/credentials\.name AS partner/);
    });

    it("lists a tracked column once, whichever group holds it", () => {
        Object.values(AUDITED_TABLES).forEach(spec => {
            expect(new Set(spec.tracked).size).toBe(spec.tracked.length);
        });
    });

    it("audits the creation and removal of cashbacks only", () => {
        expect(Object.values(AUDITED_TABLES).filter(spec => spec.lifecycle).map(spec => spec.table)).toEqual(["cashbacks"]);
    });
});

describe("specOf", () => {
    it("finds a model by its table name, and nothing for an unknown or missing one", () => {
        expect(specOf({ tableName: "cashbacks" })).toBe(AUDITED_TABLES.cashbacks);
        expect(specOf({ tableName: "orders" })).toBeNull();
        expect(specOf({})).toBeNull();
        expect(specOf(undefined)).toBeNull();
    });
});

describe("accessKeyOfTable", () => {
    it("names the service of a table that serves one", () => {
        expect(accessKeyOfTable("plans")).toBe("workspace");
        expect(accessKeyOfTable("mobileRechargeProviders")).toBe("JRI_prepaid");
    });

    it("names none for a table shared by two services, or an unknown one", () => {
        expect(accessKeyOfTable("packages")).toBeNull();
        expect(accessKeyOfTable("orders")).toBeNull();
    });
});

describe("displayValue", () => {
    it("shows an empty value as null", () => {
        expect([undefined, null, ""].map(value => displayValue("surcharge", value))).toEqual([null, null, null]);
    });

    it("shows numbers as numbers, even when the database sent text", () => {
        expect(displayValue("surcharge", "2.5000")).toBe(2.5);
        expect(displayValue("surcharge", 3)).toBe(3);
        expect(displayValue("cashback", "-1")).toBe(-1);
    });

    it("shows a flag as true or false, whichever way it was stored", () => {
        expect([1, true, "1", "true"].map(value => displayValue("isCommissionConfigured", value))).toEqual([
            true,
            true,
            true,
            true,
        ]);
        expect([0, false, "0"].map(value => displayValue("isCommissionConfigured", value))).toEqual([false, false, false]);
    });

    it("keeps plain text as it is", () => {
        expect(displayValue("state", "Kerala")).toBe("Kerala");
        expect(displayValue("gstNo", "27ABCDE1234F1Z5")).toBe("27ABCDE1234F1Z5");
    });

    it("keeps an object as it is", () => {
        const prices = { monthly: 10 };

        expect(displayValue("packagePrices", prices)).toBe(prices);
    });
});
