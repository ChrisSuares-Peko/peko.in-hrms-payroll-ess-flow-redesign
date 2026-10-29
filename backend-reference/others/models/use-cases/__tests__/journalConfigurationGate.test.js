const sequelizeConfig = require("../../../configs/database/index");
const serviceOperator = require("../../entities/serviceOperator");
const credential = require("../../entities/credential");
const {
    SURCHARGE_BY_PACKAGE_SQL,
    SURCHARGE_BY_SUBSCRIPTION_SQL,
    nameCandidates,
    refreshConfigurationGaps,
} = require("../journalConfigurationGate");

const electricity = { id: 12, serviceProvider: "Electricity Bill", accessKey: "electricity_bill", isCommissionConfigured: 1 };
const whatsapp = { id: 21, serviceProvider: "WhatsApp For Business", accessKey: "REDACTED", isCommissionConfigured: 0 };
const domains = { id: 31, serviceProvider: "Domain and Hosting", accessKey: "domain_and_hosting", isCommissionConfigured: 1 };

const order = (journalData, overrides = {}) => ({
    corporateTxnId: "1791010579744",
    serviceOperatorId: 12,
    credentialId: 501,
    journalData,
    ...overrides,
});

const split = { vendorPayable: 70698.35, commissionExcludingGST: 1.4, recordJournalEntry: true };

const queries = () => sequelizeConfig.query.mock.calls.map(([sql, options]) => ({ sql, replacements: options.replacements }));

beforeEach(() => {
    jest.clearAllMocks();
    serviceOperator.findOne.mockResolvedValue(electricity);
    credential.findOne.mockResolvedValue({ registeredBy: null });
    sequelizeConfig.query.mockResolvedValue([]);
});

describe("nameCandidates", () => {
    it("tries the name as stored and without the label a purchase put in front of it", () => {
        expect(nameCandidates("Service Package : Basic")).toEqual(["Service Package : Basic", "Basic"]);
        expect(nameCandidates("Asia 5GB")).toEqual(["Asia 5GB"]);
        expect(nameCandidates("  ")).toEqual([]);
        expect(nameCandidates(null)).toEqual([]);
    });
});

describe("refreshConfigurationGaps", () => {
    it("leaves an order that was configured at purchase alone, without reading anything", async () => {
        const result = await refreshConfigurationGaps(order(split), split);

        expect(result).toEqual({ journalData: split, refusal: null });
        expect(serviceOperator.findOne).not.toHaveBeenCalled();
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });

    it("clears the commission marker once the service's own commission is marked configured", async () => {
        const stored = { ...split, commissionNotConfiguredFor: "Electricity Bill", surchargeNotConfiguredFor: null };

        const result = await refreshConfigurationGaps(order(stored), stored);

        expect(result.refusal).toBeNull();
        expect(result.journalData).toEqual({ ...split, surchargeNotConfiguredFor: null });
        expect(serviceOperator.findOne).toHaveBeenCalledWith({
            where: { id: 12 },
            attributes: ["id", "serviceProvider", "accessKey", "isCommissionConfigured"],
            raw: true,
        });
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });

    it("refuses while the service's own commission is still not marked configured, keeping the marker", async () => {
        serviceOperator.findOne.mockResolvedValue({ ...electricity, isCommissionConfigured: 0 });
        const stored = { ...split, commissionNotConfiguredFor: "Electricity Bill" };

        const result = await refreshConfigurationGaps(order(stored), stored);

        expect(result.refusal).toBe(
            'Commission for "Electricity Bill" is still not marked as configured. Mark the service\'s commission as configured, then retry.'
        );
        expect(result.journalData.commissionNotConfiguredFor).toBe("Electricity Bill");
    });

    it("checks a plan by its own name within the customer's partner first", async () => {
        serviceOperator.findOne.mockResolvedValue(whatsapp);
        credential.findOne.mockResolvedValue({ registeredBy: "77" });
        sequelizeConfig.query.mockResolvedValueOnce([{ configured: 1 }]);
        const stored = { ...split, commissionNotConfiguredFor: "Service Package : Basic" };

        const result = await refreshConfigurationGaps(order(stored, { serviceOperatorId: 21 }), stored);

        expect(result).toEqual({ journalData: split, refusal: null });
        expect(queries()).toEqual([
            {
                sql:
                    "SELECT packages.isCommissionConfigured AS configured FROM packages " +
                    "LEFT JOIN credentials ON credentials.id = packages.partnerId WHERE " +
                    "packages.accessCode = 'whatsapp' AND packages.packageName IN (:names) AND credentials.id = :partner",
                replacements: { names: ["Service Package : Basic", "Basic"], partner: "77" },
            },
        ]);
    });

    it("looks beyond the partner when its own scope finds no plan, and refuses while one is not configured", async () => {
        serviceOperator.findOne.mockResolvedValue(whatsapp);
        sequelizeConfig.query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ configured: 1 }, { configured: 0 }]);
        const stored = { ...split, commissionNotConfiguredFor: "Service Package : Basic" };

        const result = await refreshConfigurationGaps(order(stored, { serviceOperatorId: 21 }), stored);

        expect(result.refusal).toBe(
            'Commission for the plan "Service Package : Basic" is still not marked as configured. Mark it as configured on the service\'s Plans tab, then retry.'
        );
        const [scoped, unscoped] = queries();
        expect(scoped.sql).toContain("AND credentials.id IS NULL");
        expect(unscoped.sql).not.toContain("credentials.id IS NULL");
        expect(unscoped.replacements).toEqual({ names: ["Service Package : Basic", "Basic"] });
    });

    it("falls back to the service's own commission for an item no plan carries, such as a domain", async () => {
        serviceOperator.findOne.mockResolvedValue(domains);
        const stored = { ...split, commissionNotConfiguredFor: "peko-example.in" };

        const result = await refreshConfigurationGaps(order(stored, { serviceOperatorId: 31 }), stored);

        expect(result.refusal).toBeNull();
        expect(queries()[0].sql).toContain("FROM domainHostingPlans WHERE domainHostingPlans.planName IN (:names)");
    });

    it("clears the platform fee marker against the very package the order used", async () => {
        sequelizeConfig.query.mockResolvedValueOnce([{ configured: 1 }]);
        const stored = {
            ...split,
            surchargeNotConfiguredFor: "Electricity Bill",
            surchargeNotConfiguredPackageId: 3,
        };

        const result = await refreshConfigurationGaps(order(stored), stored);

        expect(result).toEqual({ journalData: split, refusal: null });
        expect(queries()).toEqual([
            { sql: SURCHARGE_BY_PACKAGE_SQL, replacements: { serviceOperatorId: 12, packageId: 3 } },
        ]);
    });

    it("reads the customer's active package for an older order and refuses when no fee row can be confirmed", async () => {
        const stored = { ...split, surchargeNotConfiguredFor: "Electricity Bill" };

        const result = await refreshConfigurationGaps(order(stored), stored);

        expect(result.refusal).toBe(
            'Platform fee for "Electricity Bill" is still not marked as configured for this customer\'s package. Mark it as configured on the service\'s Platform Fee tab, then retry.'
        );
        expect(queries()).toEqual([
            { sql: SURCHARGE_BY_SUBSCRIPTION_SQL, replacements: { serviceOperatorId: 12, credentialId: 501 } },
        ]);
    });

    it("refuses on the platform fee even when the commission is now configured, and changes nothing", async () => {
        sequelizeConfig.query.mockResolvedValueOnce([{ configured: 0 }]);
        const stored = {
            ...split,
            commissionNotConfiguredFor: "Electricity Bill",
            surchargeNotConfiguredFor: "Electricity Bill",
            surchargeNotConfiguredPackageId: 3,
        };

        const result = await refreshConfigurationGaps(order(stored), stored);

        expect(result.refusal).toContain('Platform fee for "Electricity Bill"');
        expect(result.journalData).toEqual(stored);
    });

    it("clears both markers on a subscription, which carries neither a commission nor a platform fee", async () => {
        const stored = {
            netSubscriptionIncome: 999,
            commissionNotConfiguredFor: "Subscription Plans",
            surchargeNotConfiguredFor: null,
        };

        const result = await refreshConfigurationGaps(order(stored), stored);

        expect(result).toEqual({ journalData: { netSubscriptionIncome: 999 }, refusal: null });
        expect(serviceOperator.findOne).not.toHaveBeenCalled();
    });

    it("takes the markers from the stored order, never from figures edited on the way in", async () => {
        serviceOperator.findOne.mockResolvedValue({ ...electricity, isCommissionConfigured: 0 });
        const stored = { ...split, commissionNotConfiguredFor: "Electricity Bill" };
        const edited = { ...stored, vendorPayable: 70000, commissionNotConfiguredFor: null };

        const result = await refreshConfigurationGaps(order(stored), edited);

        expect(result.refusal).toContain('Commission for "Electricity Bill"');
        expect(result.journalData).toMatchObject({ vendorPayable: 70000, commissionNotConfiguredFor: "Electricity Bill" });
    });
});
