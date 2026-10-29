const { Op } = require("sequelize");
const sequelizeConfig = require("../../../../configs/database/index");
const serviceOperator = require("../../../entities/serviceOperator");
const systemUser = require("../../../entities/systemUser");
const { getASetting } = require("../../setting");
const { getServicesTypeConfig } = require("../../accountingServices");
const { loadAddOnCounts } = require("../../accountingAddOns");
const { findChartOfAccountIssues } = require("../../accountingDashboard");
const { loadAccountingFloor } = require("../../accountingPeriod");
const {
    FINGERPRINT_FIELDS,
    CASHBACK_LINKS_SQL,
    buildPlansMissingQuery,
    buildOrdersQuery,
    loadReadinessContext,
    computeReadiness,
    fingerprintOf,
    driftOf,
} = require("../../serviceApprovalReadiness");

jest.mock("../../../entities/serviceOperator", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/systemUser", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/credential", () => ({}));
jest.mock("../../../entities/vendor", () => ({}));
jest.mock("../../setting", () => ({ getASetting: jest.fn(), upsertSetting: jest.fn() }));
jest.mock("../../accountingAddOns", () => ({ loadAddOnCounts: jest.fn(async () => new Map()) }));
jest.mock("../../accountingServices", () => {
    const actual = jest.requireActual("../../accountingServices");
    return { ...actual, getServicesTypeConfig: jest.fn() };
});
jest.mock("../../accountingDashboard", () => {
    const actual = jest.requireActual("../../accountingDashboard");
    return { ...actual, findChartOfAccountIssues: jest.fn() };
});
jest.mock("../../accountingPeriod", () => {
    const actual = jest.requireActual("../../accountingPeriod");
    return { ...actual, loadAccountingFloor: jest.fn() };
});
jest.mock("../../serviceApprovalTree", () => ({
    partnerIdOf: registeredBy => {
        const id = Number(registeredBy);
        return Number.isInteger(id) && id > 0 ? id : null;
    },
    unitKey: (partnerPermissionId, nodeKey) => `${partnerPermissionId}:${nodeKey}`,
}));
jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn(), deleteKey: jest.fn() }));
jest.mock("../../../../utils/sortHandle", () => ({ handleSortFields: jest.fn() }));

const operator = overrides => ({
    id: 5,
    accessKey: "esim_tunz",
    serviceProvider: "Tunz eSIM",
    serviceStatus: true,
    vendorId: 9,
    vendor: { id: 9, vendorName: "Tunz", state: "KA", gstNo: null, address: null },
    commissionMode: "MARGIN",
    commissionType: "PERCENTAGE",
    isCommissionConfigured: true,
    providerCommission: "2.5000",
    fixedCommissionPerTransaction: "0.0000",
    isCommissionInclGST: 1,
    recordJournalEntry: 1,
    ...overrides,
});

const NO_COA_ISSUES = { missing: [], unsynced: { count: 0, items: [] }, misclassified: [] };

const unit = overrides => ({
    partnerPermissionId: 1,
    registeredBy: null,
    nodeKey: "esim_tunz",
    accessKey: "esim_tunz",
    ...overrides,
});

const itemsByKey = readiness => Object.fromEntries(readiness.items.map(item => [item.key, item]));

beforeEach(() => {
    jest.clearAllMocks();
    getServicesTypeConfig.mockResolvedValue({ service_with_plans: ["esim_tunz"], service_without_plans: ["visa"] });
    serviceOperator.findAll.mockResolvedValue([operator()]);
    systemUser.findAll.mockResolvedValue([]);
    findChartOfAccountIssues.mockResolvedValue(NO_COA_ISSUES);
    getASetting.mockResolvedValue({ enabled: true });
    loadAccountingFloor.mockResolvedValue("2026-08-31");
    sequelizeConfig.query.mockImplementation(sql => {
        if (sql.includes("UNION ALL") || sql.includes("COUNT(*) AS total FROM esimPlans")) {
            return Promise.resolve([{ accessKey: "esim_tunz", total: "0" }]);
        }
        if (sql.includes("FROM cashbacks")) {
            return Promise.resolve([{ partnerKey: "default", serviceOperatorId: 5, total: "3" }]);
        }
        if (sql.includes("FROM orders")) {
            return Promise.resolve([
                {
                    serviceOperatorId: 5,
                    total: "12",
                    success: "10",
                    recorded: "8",
                    failed: "1",
                    skipped: "0",
                    notRecorded: "1",
                    internal: "2",
                    lastOrderAt: "2026-09-20 10:00:00",
                    lastRecordedAt: "2026-09-19 10:00:00",
                },
            ]);
        }
        return Promise.resolve([]);
    });
});

describe("the queries behind readiness", () => {
    it("builds one plan count per with-plans key without joins and with the packages extra clause", () => {
        const { sql, replacements } = buildPlansMissingQuery(["esim_tunz", "whatsApp_for_busines", "unknown_key"]);

        expect(sql).toContain("SELECT :key0 AS accessKey, COUNT(*) AS total FROM esimPlans WHERE esimPlans.status = 1 AND isCommissionConfigured = 0");
        expect(sql).toContain("FROM packages WHERE packages.status = 1 AND packages.accessCode = 'whatsapp'");
        expect(sql).toContain("AND isCommissionConfigured = 0 AND type = '2'");
        expect(sql).not.toContain("planCommissions");
        expect(sql).not.toContain("JOIN");
        expect(sql.split("UNION ALL")).toHaveLength(2);
        expect(replacements).toEqual({ key0: "esim_tunz", key1: "whatsApp_for_busines" });
    });

    it("aggregates orders per operator with every journal state, the internal flag and the go-live floor", () => {
        const sql = buildOrdersQuery();

        expect(sql).toContain("SUM(status = 'SUCCESS') AS success");
        expect(sql).toContain("JSON_EXTRACT(journalRecordStatus, '$.transaction') = true) AS recorded");
        expect(sql).toContain(
            "SUM(COALESCE(JSON_EXTRACT(journalData, '$.transaction.skipped') = true, false) = false " +
                "AND JSON_EXTRACT(journalRecordStatus, '$.transaction') = false) AS failed"
        );
        expect(sql).toContain("'$.transaction.skipped') = true, 0)) AS skipped");
        expect(sql).toContain("AS notRecorded");
        expect(sql).toContain("'$.journalAccountIds.isInternalAccount') = true, 0)) AS internal");
        expect(sql).toContain("MAX(CASE WHEN JSON_EXTRACT(journalRecordStatus, '$.transaction') = true THEN transactionDate END) AS lastRecordedAt");
        expect(sql).toContain("WHERE serviceOperatorId IN (:operatorIds) AND DATE(transactionDate) > :accountingFloor GROUP BY serviceOperatorId");
    });

    it("groups cashback links per partner and operator, normalising empty partner ids to default", () => {
        expect(CASHBACK_LINKS_SQL).toContain("COALESCE(NULLIF(NULLIF(CAST(p.partnerId AS CHAR), ''), 'null'), 'default') AS partnerKey");
        expect(CASHBACK_LINKS_SQL).toContain(
            "c.serviceOperatorId, COUNT(*) AS total, SUM(COALESCE(c.isSurchargeConfigured, 0) = 0) AS unconfigured " +
                "FROM cashbacks c INNER JOIN packages p ON p.id = c.packageId"
        );
        expect(CASHBACK_LINKS_SQL).not.toContain("c.surcharge");
        expect(CASHBACK_LINKS_SQL).toContain("WHERE c.serviceStatus = 1 AND p.status = 1 AND c.serviceOperatorId IN (:operatorIds)");
    });
});

describe("loadReadinessContext", () => {
    it("loads operators with their vendor, active first, and only for linked units", async () => {
        const context = await loadReadinessContext([unit(), unit({ nodeKey: "Insurance", accessKey: null })]);

        const query = serviceOperator.findAll.mock.calls[0][0];
        expect(query.where).toEqual({ accessKey: { [Op.in]: ["esim_tunz"] } });
        expect(query.attributes).toContain("vendorId");
        expect(query.attributes).toContain("recordJournalEntry");
        expect(query.order).toEqual([
            ["serviceStatus", "DESC"],
            ["id", "ASC"],
        ]);
        expect(context.operators.byKey.get("esim_tunz").serviceProvider).toBe("Tunz eSIM");
        expect(context.plansMissing.get("esim_tunz")).toBe(0);
        expect(context.cashbackLinks.get("default:5")).toEqual({ total: 3, unconfigured: 0 });
        expect(context.orders.get(5).success).toBe("10");
        expect(context.journalRecordingEnabled).toBe(true);
    });

    it("keeps the first operator per key and remembers how many share it", async () => {
        serviceOperator.findAll.mockResolvedValue([operator({ id: 5 }), operator({ id: 8, serviceStatus: false })]);

        const context = await loadReadinessContext([unit()]);

        expect(context.operators.byKey.get("esim_tunz").id).toBe(5);
        expect(context.operators.counts.get("esim_tunz")).toBe(2);
    });

    it("reads partners by numeric id only and skips the operator-based queries when nothing matches", async () => {
        systemUser.findAll.mockResolvedValue([{ credentialId: 77, sharePercentage: "12.5000", credential: { name: "Gulf Reach" } }]);
        serviceOperator.findAll.mockResolvedValue([]);

        const context = await loadReadinessContext([
            unit({ partnerPermissionId: 12, registeredBy: "77", nodeKey: "insurance_desk", accessKey: "insurance_desk" }),
            unit({ partnerPermissionId: 30, registeredBy: "abc", nodeKey: "insurance_desk", accessKey: "insurance_desk" }),
        ]);

        expect(serviceOperator.findAll).toHaveBeenCalledTimes(1);
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
        expect(systemUser.findAll.mock.calls[0][0].where).toEqual({ credentialId: { [Op.in]: [77] } });
        expect(context.partners.get("77").sharePercentage).toBe("12.5000");
    });

    it("survives a chart of accounts read failure", async () => {
        findChartOfAccountIssues.mockRejectedValue(new Error("db down"));

        expect((await loadReadinessContext([unit()])).coa).toBeNull();
    });
});

describe("computeReadiness", () => {
    it("passes every required check for a fully configured with-plans service on the Default tree", async () => {
        const context = await loadReadinessContext([unit()]);
        const readiness = computeReadiness([unit()], context).get("1:esim_tunz");
        const items = itemsByKey(readiness);

        expect(readiness.summary).toEqual({ passed: 6, total: 6, blocking: [], warnings: [] });
        expect(items.classification).toMatchObject({ status: "pass", detail: "Listed under Service with plans" });
        expect(items.commission).toMatchObject({ status: "pass", detail: "Every plan carries a commission", fix: { screen: "service_with_plans", accessKey: "esim_tunz", tab: "plans" } });
        expect(items.vendor).toMatchObject({ status: "pass", detail: "Vendor Tunz" });
        expect(items.journalFlag.status).toBe("pass");
        expect(items.partnerShare).toBeUndefined();
        expect(items.cashbackLink).toMatchObject({ status: "pass", detail: "3 packages of this partner include the service" });
        expect(items.platformFee).toMatchObject({ status: "pass", required: true, detail: "Platform fee marked as configured on 3 linked packages" });
        expect(items.cashbackLink.fix).toEqual({ screen: "service_with_plans", accessKey: "esim_tunz", tab: "cashbacks", partnerId: "default" });
        expect(items.platformFee.fix).toEqual({ screen: "service_with_plans", accessKey: "esim_tunz", tab: "platform-fee", partnerId: "default" });
        expect(items.classification.fix).toBeNull();
        expect(items.operator.fix).toBeNull();
        expect(items.evidence).toMatchObject({ status: "pass", detail: "8 of 10 successful orders have the journal recorded" });
        expect(readiness.evidence).toEqual({
            successOrders: 10,
            recorded: 8,
            failed: 1,
            skipped: 0,
            notRecorded: 1,
            internal: 2,
            lastOrderAt: "2026-09-20 10:00:00",
            lastRecordedAt: "2026-09-19 10:00:00",
        });
        expect(readiness.snapshot).toMatchObject({
            planType: "with_plans",
            operatorId: 5,
            vendorId: 9,
            providerCommission: 2.5,
            isCommissionInclGST: true,
            recordJournalEntry: true,
            plansMissingCommission: 0,
            partnerSharePercentage: null,
        });
    });

    it("blocks on each required configuration gap and says where the Settings-only ones are fixed", async () => {
        getServicesTypeConfig.mockResolvedValue({ service_with_plans: ["hike_service"], service_without_plans: ["visa"] });
        serviceOperator.findAll.mockResolvedValue([
            operator({
                vendorId: null,
                vendor: { id: null, vendorName: null, state: null },
                commissionType: null,
                isCommissionConfigured: false,
                providerCommission: "0",
                recordJournalEntry: 0,
            }),
        ]);

        const context = await loadReadinessContext([unit()]);
        const readiness = computeReadiness([unit()], context).get("1:esim_tunz");
        const items = itemsByKey(readiness);

        expect(readiness.summary.blocking).toEqual(["classification", "vendor", "commission", "journalFlag"]);
        expect(items.classification).toMatchObject({
            status: "fail",
            detail: "Not classified as Service with plans or Service without plans. Set the type in Settings › Service Classification.",
            fix: null,
        });
        expect(items.vendor).toMatchObject({
            status: "fail",
            detail: "No vendor linked to this service. Link one in Settings › Service Operators.",
            fix: null,
        });
        expect(items.journalFlag).toMatchObject({
            status: "fail",
            detail: "Journal recording is switched off for this service. Switch it on in Settings › Service Operators.",
            fix: null,
        });
    });

    it("links no service screen for an unclassified service, which would only answer not found", async () => {
        getServicesTypeConfig.mockResolvedValue({ service_with_plans: ["hike_service"], service_without_plans: ["visa"] });

        const readiness = computeReadiness([unit()], await loadReadinessContext([unit()])).get("1:esim_tunz");
        const items = itemsByKey(readiness);

        expect(items.classification.status).toBe("fail");
        expect(items.commission.fix).toBeNull();
        expect(items.cashbackLink.fix).toBeNull();
        expect(items.platformFee.fix).toBeNull();
    });

    it("sends a without-plans service's commission fix to its Commission tab", async () => {
        const visa = unit({ nodeKey: "visa", accessKey: "visa" });
        serviceOperator.findAll.mockResolvedValue([
            operator({ id: 6, accessKey: "visa", serviceProvider: "Visa Desk", commissionType: null, isCommissionConfigured: false }),
        ]);

        const readiness = computeReadiness([visa], await loadReadinessContext([visa])).get("1:visa");

        expect(itemsByKey(readiness).commission.fix).toEqual({ screen: "service_without_plans", accessKey: "visa", tab: "commission" });
    });

    it("sends the commission fix of a with-plans service without plan-level commission to its Plans tab", async () => {
        const gift = unit({ nodeKey: "gift_desk", accessKey: "gift_desk" });
        getServicesTypeConfig.mockResolvedValue({ service_with_plans: ["gift_desk"], service_without_plans: [] });
        serviceOperator.findAll.mockResolvedValue([
            operator({ id: 7, accessKey: "gift_desk", serviceProvider: "Gift Desk", commissionType: null, isCommissionConfigured: false }),
        ]);

        const readiness = computeReadiness([gift], await loadReadinessContext([gift])).get("1:gift_desk");

        expect(itemsByKey(readiness).commission).toMatchObject({
            status: "fail",
            detail: "No commission configured for this service",
            fix: { screen: "service_with_plans", accessKey: "gift_desk", tab: "plans" },
        });
    });

    it("fails the commission check while an add-on of the service has no confirmed commission", async () => {
        const whatsapp = unit({ nodeKey: "whatsApp_for_busines", accessKey: "REDACTED" });
        getServicesTypeConfig.mockResolvedValue({ service_with_plans: ["whatsApp_for_busines"], service_without_plans: [] });
        serviceOperator.findAll.mockResolvedValue([
            operator({ id: 8, accessKey: "REDACTED", serviceProvider: "WhatsApp for Business" }),
        ]);
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(sql.includes("FROM packages") ? [{ accessKey: "REDACTED", total: "0" }] : [])
        );
        loadAddOnCounts.mockResolvedValueOnce(
            new Map([["whatsApp_for_busines", { total: 2, notConfigured: [{ id: 7, name: "Bot Builder" }] }]])
        );

        const readiness = computeReadiness([whatsapp], await loadReadinessContext([whatsapp])).get("1:whatsApp_for_busines");

        expect(itemsByKey(readiness).commission).toMatchObject({ status: "fail", detail: "1 add-on without commission" });
        expect(readiness.snapshot.plansMissingCommission).toBe(1);
    });

    it("counts plans without commission for a with-plans service and warns when the vendor has no state", async () => {
        serviceOperator.findAll.mockResolvedValue([operator({ vendor: { id: 9, vendorName: "Tunz", state: null } })]);
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(sql.includes("FROM esimPlans") ? [{ accessKey: "esim_tunz", total: "3" }] : [])
        );

        const readiness = computeReadiness([unit()], await loadReadinessContext([unit()])).get("1:esim_tunz");
        const items = itemsByKey(readiness);

        expect(items.commission).toMatchObject({ status: "fail", detail: "3 plans without commission" });
        expect(items.vendor).toMatchObject({ status: "pass", detail: "Vendor Tunz — state not set, so GST cannot be split" });
        expect(items.cashbackLink).toMatchObject({ status: "warn" });
        expect(items.platformFee).toMatchObject({ status: "info" });
        expect(items.evidence).toMatchObject({ status: "info", detail: "No orders yet" });
        expect(readiness.summary.warnings).toEqual(["cashbackLink"]);
    });

    it("checks the operator's own commission for a without-plans service", async () => {
        const visa = unit({ nodeKey: "visa", accessKey: "visa" });
        serviceOperator.findAll.mockResolvedValue([
            operator({ id: 6, accessKey: "visa", serviceProvider: "Visa Desk", commissionType: "FLAT", providerCommission: "0", fixedCommissionPerTransaction: "49" }),
        ]);

        const readiness = computeReadiness([visa], await loadReadinessContext([visa])).get("1:visa");

        expect(itemsByKey(readiness).commission).toMatchObject({ status: "pass", detail: "Commission 49 fixed per transaction" });
        expect(sequelizeConfig.query.mock.calls.some(([sql]) => sql.includes("AS accessKey, COUNT(*) AS total FROM"))).toBe(false);
    });

    it("passes a zero commission for a without-plans service once the type is set", async () => {
        const visa = unit({ nodeKey: "visa", accessKey: "visa" });
        serviceOperator.findAll.mockResolvedValue([
            operator({ id: 6, accessKey: "visa", serviceProvider: "Visa Desk", commissionType: "PERCENTAGE", providerCommission: "0", fixedCommissionPerTransaction: "0" }),
        ]);

        const readiness = computeReadiness([visa], await loadReadinessContext([visa])).get("1:visa");

        expect(itemsByKey(readiness).commission).toMatchObject({ status: "pass", detail: "Commission 0%" });
        expect(readiness.snapshot).toMatchObject({ commissionType: "PERCENTAGE", providerCommission: 0, fixedCommissionPerTransaction: 0 });
    });

    it("describes a zero flat commission and joins a rate with a fixed amount", async () => {
        const visa = unit({ nodeKey: "visa", accessKey: "visa" });
        serviceOperator.findAll.mockResolvedValue([
            operator({ id: 6, accessKey: "visa", serviceProvider: "Visa Desk", commissionType: "FLAT", providerCommission: "0", fixedCommissionPerTransaction: "0" }),
        ]);
        let readiness = computeReadiness([visa], await loadReadinessContext([visa])).get("1:visa");
        expect(itemsByKey(readiness).commission).toMatchObject({ status: "pass", detail: "Commission 0 flat" });

        serviceOperator.findAll.mockResolvedValue([
            operator({ id: 6, accessKey: "visa", serviceProvider: "Visa Desk", commissionType: "PERCENTAGE", providerCommission: "2.5", fixedCommissionPerTransaction: "10" }),
        ]);
        readiness = computeReadiness([visa], await loadReadinessContext([visa])).get("1:visa");
        expect(itemsByKey(readiness).commission).toMatchObject({ status: "pass", detail: "Commission 2.5% + 10 fixed per transaction" });
    });

    it("still fails a without-plans service whose commission type was never set", async () => {
        const visa = unit({ nodeKey: "visa", accessKey: "visa" });
        serviceOperator.findAll.mockResolvedValue([
            operator({ id: 6, accessKey: "visa", serviceProvider: "Visa Desk", commissionType: null, isCommissionConfigured: false, providerCommission: "5", fixedCommissionPerTransaction: "0" }),
        ]);

        const readiness = computeReadiness([visa], await loadReadinessContext([visa])).get("1:visa");

        expect(itemsByKey(readiness).commission).toMatchObject({ status: "fail", detail: "No commission configured for this service" });
    });

    it("fails the operator check when the key matches no service operator", async () => {
        serviceOperator.findAll.mockResolvedValue([]);

        const readiness = computeReadiness([unit()], await loadReadinessContext([unit()])).get("1:esim_tunz");

        expect(readiness.summary.blocking).toEqual(["operator"]);
        expect(itemsByKey(readiness).operator).toMatchObject({
            detail: "No service operator carries the key esim_tunz. Add one in Settings › Service Operators.",
            fix: null,
        });
        expect(readiness.evidence).toBeNull();
    });

    it("requires the partner share on a partner tree even when no operator carries the key", async () => {
        systemUser.findAll.mockResolvedValue([{ credentialId: 77, sharePercentage: null, credential: { name: "Gulf Reach" } }]);
        serviceOperator.findAll.mockResolvedValue([]);
        const insurance = unit({ partnerPermissionId: 12, registeredBy: "77", nodeKey: "insurance_desk", accessKey: "insurance_desk" });

        const readiness = computeReadiness([insurance], await loadReadinessContext([insurance])).get("12:insurance_desk");
        const items = itemsByKey(readiness);

        expect(items.operator).toMatchObject({
            status: "fail",
            required: true,
            detail: "No service operator carries the key insurance_desk. Add one in Settings › Service Operators.",
        });
        expect(items.partnerShare).toMatchObject({ status: "fail", required: true, fix: { screen: "whitelabel_partners" } });
        expect(readiness.summary).toEqual({ passed: 0, total: 2, blocking: ["operator", "partnerShare"], warnings: [] });
        expect(readiness.evidence).toBeNull();
        expect(items.cashbackLink).toBeUndefined();
        expect(items.chartOfAccounts.status).toBe("pass");
    });

    it("passes the partner share once set and reads cashback links under the partner's own key", async () => {
        systemUser.findAll.mockResolvedValue([{ credentialId: 77, sharePercentage: "12.5000", credential: { name: "Gulf Reach" } }]);
        sequelizeConfig.query.mockImplementation(sql => {
            if (sql.includes("FROM cashbacks")) return Promise.resolve([{ partnerKey: "77", serviceOperatorId: 5, total: "1" }]);
            if (sql.includes("FROM esimPlans")) return Promise.resolve([{ accessKey: "esim_tunz", total: "0" }]);
            return Promise.resolve([]);
        });
        const partnerUnit = unit({ partnerPermissionId: 12, registeredBy: "77" });

        const readiness = computeReadiness([partnerUnit], await loadReadinessContext([partnerUnit])).get("12:esim_tunz");
        const items = itemsByKey(readiness);

        expect(items.partnerShare).toMatchObject({ status: "pass", detail: "Partner share 12.5%" });
        expect(items.cashbackLink).toMatchObject({ status: "pass", detail: "1 package of this partner include the service" });
        expect(items.platformFee).toMatchObject({ status: "pass", detail: "Platform fee marked as configured on 1 linked package" });
        expect(items.cashbackLink.fix).toMatchObject({ tab: "cashbacks", partnerId: "77" });
        expect(items.platformFee.fix).toMatchObject({ tab: "platform-fee", partnerId: "77" });
        expect(readiness.snapshot.partnerSharePercentage).toBe(12.5);
    });

    it("blocks approval while a linked package's platform fee is not marked as configured", async () => {
        sequelizeConfig.query.mockImplementation(sql => {
            if (sql.includes("FROM cashbacks")) {
                return Promise.resolve([{ partnerKey: "default", serviceOperatorId: 5, total: "3", unconfigured: "1" }]);
            }
            if (sql.includes("FROM esimPlans")) return Promise.resolve([{ accessKey: "esim_tunz", total: "0" }]);
            return Promise.resolve([]);
        });

        const readiness = computeReadiness([unit()], await loadReadinessContext([unit()])).get("1:esim_tunz");
        const items = itemsByKey(readiness);

        expect(items.platformFee).toMatchObject({
            status: "fail",
            required: true,
            detail: "Platform fee not marked as configured on 1 of 3 linked packages",
            fix: { screen: "service_with_plans", accessKey: "esim_tunz", tab: "platform-fee", partnerId: "default" },
        });
        expect(readiness.summary.blocking).toEqual(["platformFee"]);
    });

    it("also checks Domain and Hosting's own commission, which domain registrations are sold on", async () => {
        const domains = unit({ nodeKey: "domain_and_hosting", accessKey: "domain_and_hosting" });
        getServicesTypeConfig.mockResolvedValue({ service_with_plans: ["domain_and_hosting"], service_without_plans: [] });
        let plansWithout = "0";
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("FROM domainHostingPlans") ? [{ accessKey: "domain_and_hosting", total: plansWithout }] : []
            )
        );
        const domainOperator = overrides =>
            operator({ id: 11, accessKey: "domain_and_hosting", serviceProvider: "Domain and Hosting", ...overrides });

        serviceOperator.findAll.mockResolvedValue([domainOperator({ isCommissionConfigured: false })]);
        let items = itemsByKey(
            computeReadiness([domains], await loadReadinessContext([domains])).get("1:domain_and_hosting")
        );
        expect(items.commission).toMatchObject({
            status: "fail",
            detail: "Commission for domain registrations is not marked as configured",
            fix: { screen: "service_with_plans", accessKey: "domain_and_hosting", tab: "plans" },
        });

        plansWithout = "2";
        items = itemsByKey(
            computeReadiness([domains], await loadReadinessContext([domains])).get("1:domain_and_hosting")
        );
        expect(items.commission.detail).toBe(
            "2 plans without commission; Commission for domain registrations is not marked as configured"
        );

        plansWithout = "0";
        serviceOperator.findAll.mockResolvedValue([domainOperator({ isCommissionConfigured: 1 })]);
        items = itemsByKey(
            computeReadiness([domains], await loadReadinessContext([domains])).get("1:domain_and_hosting")
        );
        expect(items.commission).toMatchObject({
            status: "pass",
            detail: "Every plan and domain registrations carry a commission",
        });
    });

    it("keeps the platform-wide checks advisory", async () => {
        getASetting.mockResolvedValue({ enabled: false });
        findChartOfAccountIssues.mockResolvedValue({ missing: ["Sales"], unsynced: { count: 2, items: [] }, misclassified: [] });

        const readiness = computeReadiness([unit()], await loadReadinessContext([unit()])).get("1:esim_tunz");
        const items = itemsByKey(readiness);

        expect(items.journalRecording).toMatchObject({ status: "warn", required: false });
        expect(items.chartOfAccounts).toMatchObject({ status: "warn", detail: "3 chart of accounts issues need attention" });
        expect(readiness.summary.blocking).toEqual([]);
        expect(readiness.summary.warnings).toEqual(["chartOfAccounts", "journalRecording"]);
    });

    it("warns when orders exist but none recorded a journal", async () => {
        sequelizeConfig.query.mockImplementation(sql => {
            if (sql.includes("FROM orders")) return Promise.resolve([{ serviceOperatorId: 5, total: "4", success: "4", recorded: "0" }]);
            if (sql.includes("FROM esimPlans")) return Promise.resolve([{ accessKey: "esim_tunz", total: "0" }]);
            return Promise.resolve([]);
        });

        const readiness = computeReadiness([unit()], await loadReadinessContext([unit()])).get("1:esim_tunz");

        expect(itemsByKey(readiness).evidence).toMatchObject({ status: "warn", detail: "4 successful orders, none with a journal recorded" });
    });
});

describe("fingerprints and drift", () => {
    const snapshot = overrides => ({
        planType: "with_plans",
        operatorId: 5,
        vendorId: 9,
        vendorState: "KA",
        commissionMode: "MARGIN",
        commissionType: "PERCENTAGE",
        providerCommission: 2.5,
        fixedCommissionPerTransaction: 0,
        isCommissionInclGST: true,
        recordJournalEntry: true,
        plansMissingCommission: 0,
        partnerSharePercentage: null,
        ...overrides,
    });

    it("hashes the watched fields in a fixed order, ignoring anything else", () => {
        expect(FINGERPRINT_FIELDS).toHaveLength(12);
        expect(fingerprintOf(snapshot())).toBe(fingerprintOf({ ...snapshot(), vendorName: "Tunz" }));
        expect(fingerprintOf(snapshot())).not.toBe(fingerprintOf(snapshot({ providerCommission: 3 })));
        expect(fingerprintOf(snapshot())).toMatch(/^[0-9a-f]{64}$/);
    });

    it("reports drift only for approved rows whose hash moved, naming the changed fields", () => {
        const current = { snapshot: snapshot({ providerCommission: 0, recordJournalEntry: false }), hash: fingerprintOf(snapshot({ providerCommission: 0, recordJournalEntry: false })) };
        const approved = { status: "APPROVED", configHash: fingerprintOf(snapshot()), configSnapshot: JSON.stringify(snapshot()) };

        expect(driftOf(approved, current)).toEqual({
            changed: true,
            fields: [
                { field: "providerCommission", label: "Commission rate", before: 2.5, after: 0 },
                { field: "recordJournalEntry", label: "Journal recording for the service", before: true, after: false },
            ],
        });
        expect(driftOf({ ...approved, configHash: current.hash }, current)).toBeNull();
        expect(driftOf({ ...approved, status: "REJECTED" }, current)).toBeNull();
        expect(driftOf(null, current)).toBeNull();
        expect(driftOf({ status: "APPROVED", configHash: null }, current)).toBeNull();
    });
});
