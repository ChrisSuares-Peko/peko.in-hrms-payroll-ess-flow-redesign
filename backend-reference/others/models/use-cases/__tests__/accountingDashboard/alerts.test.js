const { Op } = require("sequelize");
const sequelizeConfig = require("../../../../configs/database/index");
const serviceOperator = require("../../../entities/serviceOperator");
const systemUser = require("../../../entities/systemUser");
const chartOfAccount = require("../../../entities/chartOfAccount");
const { customLog } = require("../../../../utils/loggerHelper");
const { getServicesTypeConfig } = require("../../accountingServices");
const { loadAddOnCounts } = require("../../accountingAddOns");
const {
    findServicesWithoutCommission,
    findPartnersWithoutShare,
    findChartOfAccountIssues,
    buildPlansMissingCommissionQuery,
    buildPlansMissingCommissionRowsQuery,
    findPlansMissingCommission,
    buildFailedJournalsQuery,
    buildFailureReasonsQuery,
    buildSkippedJournalsQuery,
    buildSkipReasonsQuery,
    buildNotRecordedJournalsQuery,
    buildRefundsWaitingQuery,
    findJournalIssues,
    findPartnersWithoutGatewayCharge,
    buildPlatformFeeMissingCountQuery,
    buildPlatformFeeMissingRowsQuery,
    findPlatformFeeMissing,
    buildAlerts,
    buildAccountingDashboard,
    REQUIRED_ACCOUNT_NAMES,
    PLAN_CATALOGUES,
} = require("../../accountingDashboard");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/serviceOperator", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/systemUser", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/roleAndPermissions", () => ({}));
jest.mock("../../../entities/credential", () => ({ findAll: jest.fn().mockResolvedValue([]) }));
jest.mock("../../../entities/chartOfAccount", () => ({ findAll: jest.fn(), count: jest.fn() }));
jest.mock("../../../entities/vendor", () => ({}));
jest.mock("../../setting", () => ({ getASetting: jest.fn(), upsertSetting: jest.fn() }));
jest.mock("../../accountingAddOns", () => ({ loadAddOnCounts: jest.fn(async () => new Map()) }));
jest.mock("../../../../utils/sortHandle", () => ({ handleSortFields: jest.fn() }));
jest.mock("../../accountingServices", () => {
    const actual = jest.requireActual("../../accountingServices");
    return {
        getServicesTypeConfig: jest.fn(),
        isCommissionConfigured: actual.isCommissionConfigured,
    };
});

jest.mock("../../dashboardAlertFinders", () => {
    const finder = () => jest.fn().mockResolvedValue(null);
    return {
        findJournalRecordingOff: finder(),
        findChartOfAccountsPending: finder(),
        findDriftedApprovals: finder(),
        findVendorsWithoutGstDetails: finder(),
        findPekoPackagesWithoutPricing: finder(),
        findVendorBalanceIssues: finder(),
        findPartnersOverdue: finder(),
        findGatewayShortfalls: finder(),
        findOpeningBalancesMissing: finder(),
    };
});

const operator = (serviceProvider, isCommissionConfigured, providerCommission, fixed = "0", accessKey = null) => ({
    serviceProvider,
    accessKey,
    isCommissionConfigured,
    providerCommission,
    fixedCommissionPerTransaction: fixed,
});

const CORRECT_ACCOUNT_TYPES = {
    "Vendor Deposits": "other_current_asset",
    "Subscribers Wallet": "other_current_asset",
    "Partnership Fee Payable": "accounts_payable",
};

const requiredAccountRows = () =>
    REQUIRED_ACCOUNT_NAMES.map(account_name => ({
        account_name,
        account_type: CORRECT_ACCOUNT_TYPES[account_name] || "expense",
    }));

const mockChartOfAccounts = ({ requiredRows, unsyncedRows, unsyncedCount }) => {
    chartOfAccount.findAll.mockImplementation(query =>
        Promise.resolve(query.where.account_name ? requiredRows : unsyncedRows)
    );
    chartOfAccount.count.mockResolvedValue(unsyncedCount);
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe("findServicesWithoutCommission", () => {
    it("lists active classified services whose commission type was never set", async () => {
        getServicesTypeConfig.mockResolvedValue({
            service_with_plans: ["esim"],
            service_without_plans: ["attestation", "flights", "office", "visa"],
        });
        serviceOperator.findAll.mockResolvedValue([
            operator("Document Attestation", false, "0", "0", "attestation"),
            operator("Flights", true, "2.5", "0", "flights"),
            operator("Office Address", true, "0", "0", "office"),
            operator("Payroll Desk", false, "5", "0", "payroll"),
            operator("Visa", true, "0", "49", "visa"),
        ]);

        expect(await findServicesWithoutCommission()).toEqual([
            { label: "Document Attestation", accessKey: "attestation" },
            { label: "Payroll Desk", accessKey: "payroll" },
        ]);
        expect(serviceOperator.findAll.mock.calls[0][0].attributes).toContain("isCommissionConfigured");
        expect(serviceOperator.findAll.mock.calls[0][0].attributes).toContain("accessKey");
        expect(serviceOperator.findAll.mock.calls[0][0].where).toEqual({
            serviceStatus: true,
            accessKey: { [Op.in]: ["attestation", "flights", "office", "visa"] },
        });
    });

    it("checks nothing while no service is classified as without plans", async () => {
        getServicesTypeConfig.mockResolvedValue({ service_with_plans: ["esim"], service_without_plans: [] });

        expect(await findServicesWithoutCommission()).toEqual([]);
        expect(serviceOperator.findAll).not.toHaveBeenCalled();
    });
});

describe("findPartnersWithoutShare", () => {
    it("returns active partner names and falls back to the partner id", async () => {
        systemUser.findAll.mockResolvedValue([
            { id: 1, registeredBy: "100002226", credential: { name: "Gulf Reach" } },
            { id: 2, registeredBy: "100004213", credential: { name: null } },
        ]);

        expect(await findPartnersWithoutShare()).toEqual([
            { label: "Gulf Reach", partnerId: "100002226" },
            { label: "100004213", partnerId: "100004213" },
        ]);

        const query = systemUser.findAll.mock.calls[0][0];
        expect(query.where).toEqual({ sharePercentage: null, brandingStatus: true });
        expect(query.include[0].where).toEqual({ roleName: "partner" });
        expect(query.raw).toBe(true);
        expect(query.nest).toBe(true);
    });

    it("finds active partners with no gateway charge terms the same way", async () => {
        systemUser.findAll.mockResolvedValue([{ id: 1, registeredBy: "100002226", credential: { name: "Gulf Reach" } }]);

        expect(await findPartnersWithoutGatewayCharge()).toEqual([{ label: "Gulf Reach", partnerId: "100002226" }]);
        expect(systemUser.findAll.mock.calls[0][0].where).toEqual({ gatewayCharge: null, brandingStatus: true });
    });
});

describe("findChartOfAccountIssues", () => {
    it("reports required accounts that are missing and rows that are not synced", async () => {
        mockChartOfAccounts({
            requiredRows: requiredAccountRows().filter(row => row.account_name !== "Cashback Expense"),
            unsyncedRows: [{ account_name: "Platform Fees", syncStatus: "CREATE_FAILED" }],
            unsyncedCount: "1",
        });

        expect(await findChartOfAccountIssues()).toEqual({
            missing: ["Cashback Expense"],
            unsynced: { count: 1, items: [{ accountName: "Platform Fees", syncStatus: "CREATE_FAILED" }] },
            misclassified: [],
        });

        const unsyncedQuery = chartOfAccount.count.mock.calls[0][0];
        expect(unsyncedQuery.where[Op.or]).toEqual([
            { syncStatus: { [Op.in]: ["CREATE_FAILED", "UPDATE_FAILED"] } },
            { provider_account_id: null },
        ]);
    });

    it("reports nothing when every required account exists and is synced", async () => {
        mockChartOfAccounts({ requiredRows: requiredAccountRows(), unsyncedRows: [], unsyncedCount: 0 });

        expect(await findChartOfAccountIssues()).toEqual({
            missing: [],
            unsynced: { count: 0, items: [] },
            misclassified: [],
        });
    });

    it("flags a shared account booked on the wrong side of the balance sheet", async () => {
        mockChartOfAccounts({
            requiredRows: requiredAccountRows().map(row =>
                row.account_name === "Vendor Deposits"
                    ? { ...row, account_type: "other_current_liability" }
                    : row
            ),
            unsyncedRows: [],
            unsyncedCount: 0,
        });

        const issues = await findChartOfAccountIssues();

        expect(issues.misclassified).toEqual([
            { accountName: "Vendor Deposits", accountType: "other_current_liability" },
        ]);
        expect(issues.missing).toEqual([]);
    });

    it("accepts any asset type for the prepaid vendor account", async () => {
        const assetTypes = ["other_current_asset", "other_asset", "bank", "cash"];

        await Promise.all(
            assetTypes.map(async account_type => {
                mockChartOfAccounts({
                    requiredRows: requiredAccountRows().map(row =>
                        row.account_name === "Vendor Deposits" ? { ...row, account_type } : row
                    ),
                    unsyncedRows: [],
                    unsyncedCount: 0,
                });

                expect((await findChartOfAccountIssues()).misclassified).toEqual([]);
            })
        );
    });

    it("stays quiet on an account type it does not recognise", async () => {
        mockChartOfAccounts({
            requiredRows: requiredAccountRows().map(row =>
                row.account_name === "Vendor Deposits" ? { ...row, account_type: "something_new" } : row
            ),
            unsyncedRows: [],
            unsyncedCount: 0,
        });

        expect((await findChartOfAccountIssues()).misclassified).toEqual([]);
    });
});

describe("findPlansMissingCommission", () => {
    it("unions every plan catalogue and keeps only active rows with no commission type", () => {
        const sql = buildPlansMissingCommissionQuery();

        expect(PLAN_CATALOGUES.map(item => item.table)).toEqual([
            "packages",
            "plans",
            "work_plans",
            "businessRegistrationCatalogs",
            "esimPlans",
            "giftCards",
            "hikes",
            "softwares_subscriptions_plans",
            "domainHostingPlans",
            "mobileRechargeProviders",
            "govtServicesCatalogs",
        ]);
        PLAN_CATALOGUES.forEach(({ table }) => {
            expect(sql).toContain(`'${table}' AS catalogue`);
            expect(sql).toContain(`FROM ${table} WHERE status = 1 AND isCommissionConfigured = 0`);
        });
        expect(sql).toContain("FROM packages WHERE status = 1 AND isCommissionConfigured = 0 AND type = '2'");
        expect(sql).toContain("AND 'esim_tunz' IN (:planServiceKeys)");
        expect(sql).toContain(
            "AND type = '2' AND CASE accessCode WHEN 'whatsapp' THEN 'whatsApp_for_busines' WHEN 'ecommerce_store' THEN 'ecommerce_store' ELSE accessCode END IN (:planServiceKeys)"
        );
        expect(sql.match(/IN \(:planServiceKeys\)/g)).toHaveLength(PLAN_CATALOGUES.length);
        expect(sql).not.toContain("planCommissions");
        expect(sql).not.toContain("COALESCE(commission");
        expect(sql).toContain("CONCAT_WS(' - ', serviceName, variantName) AS name FROM businessRegistrationCatalogs");
        expect(sql).toContain("product_name AS name FROM giftCards");
        expect(sql.match(/UNION ALL/g)).toHaveLength(PLAN_CATALOGUES.length - 1);
        expect(sql).toContain("GROUP BY catalogue");
    });

    it("lists each plan with the service it belongs to, so the dashboard can open that service's plans", () => {
        const sql = buildPlansMissingCommissionRowsQuery();

        expect(sql).toContain("'esimPlans' AS catalogue, id AS planId, name AS name, 'esim_tunz' AS accessKey FROM esimPlans");
        expect(sql).toContain("'plans' AS catalogue, id AS planId, name AS name, 'workspace' AS accessKey FROM plans");
        expect(sql).toContain(
            "CASE accessCode WHEN 'whatsapp' THEN 'whatsApp_for_busines' WHEN 'ecommerce_store' THEN 'ecommerce_store' ELSE accessCode END AS accessKey FROM packages"
        );
        expect(sql).toContain("FROM packages WHERE status = 1 AND isCommissionConfigured = 0 AND type = '2'");
        expect(sql).toContain("ORDER BY name, catalogue LIMIT 50");
        expect(sql).not.toContain("GROUP BY");
        expect(sql.match(/IN \(:planServiceKeys\)/g)).toHaveLength(PLAN_CATALOGUES.length);
    });

    it("looks only at services classified as vendor service with plans, and at nothing while none is", async () => {
        getServicesTypeConfig.mockResolvedValue({
            service_with_plans: [],
            service_without_plans: ["visa"],
            peko_service_subscriptions: ["ecommerce_store"],
        });

        expect(await findPlansMissingCommission()).toEqual({ total: 0, catalogues: {}, items: [] });
        expect(sequelizeConfig.query).not.toHaveBeenCalled();

        getServicesTypeConfig.mockResolvedValue({
            service_with_plans: ["esim_tunz", "whatsApp_for_busines"],
            service_without_plans: ["visa"],
            peko_service_subscriptions: ["ecommerce_store"],
        });
        sequelizeConfig.query.mockResolvedValue([]);

        await findPlansMissingCommission();

        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
        sequelizeConfig.query.mock.calls.forEach(([, options]) =>
            expect(options.replacements).toEqual({ planServiceKeys: ["esim_tunz", "whatsApp_for_busines"] })
        );
    });

    it("adds the add-ons whose commission is not confirmed, listed after the plans", async () => {
        getServicesTypeConfig.mockResolvedValue({ service_with_plans: ["whatsApp_for_busines"], service_without_plans: [] });
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("GROUP BY catalogue")
                    ? [{ catalogue: "packages", total: "1" }]
                    : [{ catalogue: "packages", planId: 3, name: "Starter", accessKey: "REDACTED" }]
            )
        );
        loadAddOnCounts.mockResolvedValueOnce(
            new Map([
                [
                    "whatsApp_for_busines",
                    { total: 2, notConfigured: [{ id: 7, name: "Bot Builder" }, { id: 27, name: "Shopify Integration" }] },
                ],
            ])
        );

        expect(await findPlansMissingCommission()).toEqual({
            total: 3,
            catalogues: { packages: 1, settings: 2 },
            items: [
                { label: "Starter", catalogue: "packages", planId: 3, accessKey: "REDACTED" },
                { label: "Bot Builder", catalogue: "settings", planId: 7, accessKey: "REDACTED" },
                { label: "Shopify Integration", catalogue: "settings", planId: 27, accessKey: "REDACTED" },
            ],
        });
        expect(loadAddOnCounts).toHaveBeenCalledWith(["whatsApp_for_busines"]);
    });

    it("aggregates counts per catalogue and lists the plans themselves", async () => {
        getServicesTypeConfig.mockResolvedValue({
            service_with_plans: ["workspace", "esim_tunz", "hike_service"],
            service_without_plans: [],
        });
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("GROUP BY catalogue")
                    ? [
                          { catalogue: "plans", total: "4" },
                          { catalogue: "esimPlans", total: "3" },
                          { catalogue: "hikes", total: "1" },
                      ]
                    : [
                          { catalogue: "plans", planId: 7, name: "Basic", accessKey: "workspace" },
                          { catalogue: "esimPlans", planId: 2, name: "India 5GB", accessKey: "esim_tunz" },
                          { catalogue: "hikes", planId: 9, name: null, accessKey: "hike_service" },
                      ]
            )
        );

        expect(await findPlansMissingCommission()).toEqual({
            total: 8,
            catalogues: { plans: 4, esimPlans: 3, hikes: 1 },
            items: [
                { label: "Basic", catalogue: "plans", planId: 7, accessKey: "workspace" },
                { label: "India 5GB", catalogue: "esimPlans", planId: 2, accessKey: "esim_tunz" },
            ],
        });
        expect(sequelizeConfig.query).toHaveBeenCalledWith(expect.stringContaining("GROUP BY catalogue"), {
            type: "SELECT",
            replacements: { planServiceKeys: ["workspace", "esim_tunz", "hike_service"] },
        });
        expect(sequelizeConfig.query).toHaveBeenCalledWith(expect.stringContaining("AS planId"), {
            type: "SELECT",
            replacements: { planServiceKeys: ["workspace", "esim_tunz", "hike_service"] },
        });
    });
});

describe("findPlatformFeeMissing", () => {
    const CONFIG = {
        service_with_plans: ["esim_tunz"],
        service_without_plans: ["visa", "flights"],
        peko_service_subscriptions: ["ecommerce_store"],
    };

    it("counts active package links whose platform fee is not marked configured, per classification", () => {
        const countSql = buildPlatformFeeMissingCountQuery();
        const rowsSql = buildPlatformFeeMissingRowsQuery();

        [countSql, rowsSql].forEach(sql => {
            expect(sql).toContain("FROM cashbacks c INNER JOIN packages p ON p.id = c.packageId");
            expect(sql).toContain("INNER JOIN serviceOperators so ON so.id = c.serviceOperatorId");
            expect(sql).toContain("LEFT JOIN credentials cr ON cr.id = p.partnerId");
            expect(sql).toContain(
                "c.serviceStatus = 1 AND p.status = 1 AND COALESCE(c.isSurchargeConfigured, 0) = 0 AND so.serviceStatus = 1 AND so.accessKey IN (:accessKeys)"
            );
        });
        expect(countSql).toContain("COUNT(*) AS total, COUNT(DISTINCT so.id) AS services");
        expect(rowsSql).toContain("p.packageName, p.partnerId, cr.name AS partnerName");
        expect(rowsSql).toContain("ORDER BY so.serviceProvider, p.packageName, c.id LIMIT 50");
    });

    it("lists the packages per classification and skips a classification with no service", async () => {
        getServicesTypeConfig.mockResolvedValue(CONFIG);
        sequelizeConfig.query.mockImplementation((sql, options) => {
            const keys = options.replacements.accessKeys;
            if (sql.includes("COUNT(*)")) {
                return Promise.resolve([{ total: keys.length === 2 ? "3" : "1", services: keys.length === 2 ? "2" : "1" }]);
            }
            return Promise.resolve(
                keys.length === 2
                    ? [
                          { id: 1, serviceProvider: "Visa", accessKey: "visa", packageName: "Starter", partnerId: null, partnerName: null },
                          { id: 2, serviceProvider: "Visa", accessKey: "visa", packageName: "Pro", partnerId: 100002226, partnerName: "Gulf Reach" },
                          { id: 3, serviceProvider: null },
                      ]
                    : [{ id: 7, serviceProvider: "Tunz eSIM", accessKey: "esim_tunz", packageName: null, partnerId: "77", partnerName: null }]
            );
        });

        expect(await findPlatformFeeMissing()).toEqual({
            without_plans: {
                count: 3,
                services: 2,
                items: [
                    { label: "Visa · Starter", planType: "without_plans", accessKey: "visa", service: "Visa", packageName: "Starter", partnerId: null, partnerName: null },
                    { label: "Visa · Pro", planType: "without_plans", accessKey: "visa", service: "Visa", packageName: "Pro", partnerId: "100002226", partnerName: "Gulf Reach" },
                ],
            },
            with_plans: {
                count: 1,
                services: 1,
                items: [
                    { label: "Tunz eSIM · Package", planType: "with_plans", accessKey: "esim_tunz", service: "Tunz eSIM", packageName: null, partnerId: "77", partnerName: null },
                ],
            },
        });
        expect(sequelizeConfig.query).toHaveBeenCalledTimes(4);

        sequelizeConfig.query.mockClear();
        getServicesTypeConfig.mockResolvedValue({ ...CONFIG, service_with_plans: [] });

        expect((await findPlatformFeeMissing()).with_plans).toEqual({ count: 0, services: 0, items: [] });
        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
        sequelizeConfig.query.mock.calls.forEach(([, options]) =>
            expect(options.replacements).toEqual({ accessKeys: ["visa", "flights"] })
        );
    });
});

describe("findJournalIssues", () => {
    const range = { from: "2026-09-16 00:00:00", to: "2026-09-16 23:59:59" };

    it("lists today's failed entries by the day they were posted and the orders never attempted", () => {
        const failedSql = buildFailedJournalsQuery();
        const notRecordedSql = buildNotRecordedJournalsQuery();

        expect(failedSql).toContain("'refund' AS journalKey");
        expect(failedSql).toContain("JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.refund.reason')) AS reason");
        expect(failedSql).toContain(
            "CAST(JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.refund.journalDate')) AS DATE) BETWEEN :from AND :to"
        );
        expect(failedSql).toContain("'transaction' AS journalKey");
        expect(failedSql).toContain("transactionDate BETWEEN :from AND :to");
        expect(failedSql).toContain("DATE(transactionDate) > :accountingFloor");
        expect(failedSql).toContain("JSON_EXTRACT(journalRecordStatus, '$.refund') = false");
        expect(failedSql).toContain("ORDER BY eventDate DESC LIMIT 50");
        expect(failedSql.match(/UNION ALL/g)).toHaveLength(4);

        expect(notRecordedSql).toContain("status = 'SUCCESS'");
        expect(notRecordedSql).toContain("JSON_EXTRACT(journalRecordStatus, '$.transaction') IS NULL");
        expect(notRecordedSql).toContain("transactionDate BETWEEN :from AND :to");
        expect(notRecordedSql).toContain("DATE(transactionDate) > :accountingFloor");
        expect(notRecordedSql).toContain("ORDER BY transactionDate DESC LIMIT 50");
    });

    it("lists today's held-back entries, groups failure and skip reasons, and finds refunds waiting for their sale", () => {
        const skippedSql = buildSkippedJournalsQuery();
        const failureReasonsSql = buildFailureReasonsQuery();
        const skipReasonsSql = buildSkipReasonsQuery();
        const waitingCountSql = buildRefundsWaitingQuery({ count: true });
        const waitingSql = buildRefundsWaitingQuery();

        expect(skippedSql).toContain("JSON_EXTRACT(journalData, '$.cashback.skipped') = true");
        expect(skippedSql).toContain("'cashback' AS journalKey");
        expect(skippedSql).toContain("transactionDate BETWEEN :from AND :to");
        expect(skippedSql).toContain("AS skips ORDER BY transactionDate DESC LIMIT 50");
        expect(skippedSql.match(/UNION ALL/g)).toHaveLength(4);

        expect(failureReasonsSql).toContain("SELECT reason, COUNT(*) AS total FROM (");
        expect(failureReasonsSql).toContain("AS failureReasons GROUP BY reason ORDER BY total DESC");
        expect(failureReasonsSql).toContain("JSON_EXTRACT(journalRecordStatus, '$.adminRefund') = false");
        expect(skipReasonsSql).toContain("AS skipReasons GROUP BY reason ORDER BY total DESC");

        [waitingCountSql, waitingSql].forEach(sql => {
            expect(sql).toContain("JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.refund.reason')) = :waitingReason");
            expect(sql).toContain("'cashbackReversal' AS journalKey");
            expect(sql).not.toContain("'transaction' AS journalKey");
            expect(sql).not.toContain("BETWEEN");
            expect(sql).toContain("DATE(transactionDate) > :accountingFloor");
        });
        expect(waitingCountSql).toContain("SELECT COUNT(*) AS total FROM (");
        expect(waitingSql).toContain("AS waiting ORDER BY transactionDate DESC LIMIT 50");
    });

    it("names each order's service, keeps the failure reason and classifies every held-back entry", async () => {
        const order = (corporateTxnId, serviceOperatorId, amountInINR, extra = {}) => ({
            corporateTxnId,
            serviceOperatorId,
            amountInINR,
            orderDate: "2026-09-16",
            ...extra,
        });
        sequelizeConfig.query.mockImplementation(sql => {
            if (sql.includes("AS failures ")) {
                return Promise.resolve([
                    order("PK-1", 12, "1200.0000", { journalKey: "refund", reason: "No COA accounts found" }),
                    { corporateTxnId: null, serviceOperatorId: 12 },
                ]);
            }
            if (sql.includes("AS skips ")) {
                return Promise.resolve([
                    order("PK-3", 12, "80", { journalKey: "transaction", reason: "Commission not configured for Visa" }),
                    order("PK-4", 99, "90", { journalKey: "transaction", reason: "Journal recording is currently paused" }),
                ]);
            }
            if (sql.includes("AS failureReasons ")) {
                return Promise.resolve([
                    { reason: "No COA accounts found", total: "3" },
                    { reason: null, total: "1" },
                    { reason: "Ignored", total: "0" },
                ]);
            }
            if (sql.includes("AS skipReasons ")) {
                return Promise.resolve([
                    { reason: "Commission not configured for Visa", total: "2" },
                    { reason: "Commission not configured for Flights", total: "1" },
                    { reason: "Journal recording is currently paused", total: "4" },
                    { reason: "something new", total: "1" },
                ]);
            }
            if (sql.includes("SELECT COUNT(*) AS total FROM (") && sql.includes("AS waiting")) {
                return Promise.resolve([{ total: "7" }]);
            }
            if (sql.includes("AS waiting ")) {
                return Promise.resolve([order("PK-5", 12, "10", { journalKey: "refund" })]);
            }
            return Promise.resolve([order("PK-2", 99, "50")]);
        });
        serviceOperator.findAll.mockResolvedValue([{ id: 12, serviceProvider: "Visa", accessKey: "visa" }]);
        const config = { service_with_plans: [], service_without_plans: ["visa"], peko_service_subscriptions: [] };

        const result = await findJournalIssues(range, "2026-09-01", config);

        const visa = { service: "Visa", accessKey: "visa", planType: "without_plans" };
        const unknown = { service: null, accessKey: null, planType: null };
        expect(result.failed).toEqual([
            {
                label: "PK-1",
                corporateTxnId: "PK-1",
                ...visa,
                amount: 1200,
                orderDate: "2026-09-16",
                journalKey: "refund",
                journalLabel: "Refund",
                reason: "No COA accounts found",
            },
        ]);
        expect(result.notRecorded).toEqual([
            { label: "PK-2", corporateTxnId: "PK-2", ...unknown, amount: 50, orderDate: "2026-09-16" },
        ]);
        expect(result.skipped).toEqual([
            {
                label: "PK-3",
                corporateTxnId: "PK-3",
                ...visa,
                amount: 80,
                orderDate: "2026-09-16",
                journalKey: "transaction",
                journalLabel: "Transaction",
                reason: "Commission not configured for Visa",
                note: "Commission not configured",
            },
            {
                label: "PK-4",
                corporateTxnId: "PK-4",
                ...unknown,
                amount: 90,
                orderDate: "2026-09-16",
                journalKey: "transaction",
                journalLabel: "Transaction",
                reason: "Journal recording is currently paused",
                note: "Recording paused",
            },
        ]);
        expect(result.failedReasons).toEqual([
            { reason: "No COA accounts found", count: 3 },
            { reason: null, count: 1 },
        ]);
        expect(result.skipNotes).toEqual([
            { note: "Recording paused", count: 4 },
            { note: "Commission not configured", count: 3 },
            { note: "Could not be prepared", count: 1 },
        ]);
        expect(result.refundsWaiting).toEqual({
            count: 7,
            items: [
                {
                    label: "PK-5",
                    corporateTxnId: "PK-5",
                    ...visa,
                    amount: 10,
                    orderDate: "2026-09-16",
                    journalKey: "refund",
                    journalLabel: "Refund",
                },
            ],
        });
        expect(sequelizeConfig.query).toHaveBeenCalledTimes(7);
        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({
            accountingFloor: "2026-09-01",
            from: range.from,
            to: range.to,
        });
        expect(sequelizeConfig.query.mock.calls[5][1].replacements).toEqual({
            accountingFloor: "2026-09-01",
            waitingReason: "Transaction journal has not been recorded successfully yet",
        });
        expect(serviceOperator.findAll.mock.calls[0][0].where).toEqual({ id: { [Op.in]: [12, 99] } });
    });

    it("skips the service lookup when nothing is wrong today", async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        expect(await findJournalIssues(range, "2026-09-01")).toEqual({
            failed: [],
            notRecorded: [],
            skipped: [],
            failedReasons: [],
            skipNotes: [],
            refundsWaiting: { count: 0, items: [] },
        });
        expect(serviceOperator.findAll).not.toHaveBeenCalled();
    });
});

describe("buildAlerts", () => {
    const today = (failedEntries = 0) => ({ failedEntries });
    const noCoaIssues = { missing: [], unsynced: { count: 0, items: [] } };
    const noPlanIssues = { total: 0, catalogues: {}, items: [] };

    it("omits alerts that have nothing to report", () => {
        expect(
            buildAlerts({ today: today(), services: [], partners: [], coa: noCoaIssues, plans: noPlanIssues })
        ).toEqual([]);
    });

    it("skips alerts whose query failed", () => {
        expect(buildAlerts({ today: today(), services: null, partners: null, coa: null, plans: null })).toEqual([]);
    });

    it("warns about successful orders whose journal never ran, right after the failures", () => {
        const alerts = buildAlerts({
            today: { ...today(2), notRecordedEntries: 3 },
            services: [],
            partners: [],
            coa: noCoaIssues,
            plans: noPlanIssues,
        });

        expect(alerts.map(alert => [alert.type, alert.severity, alert.count])).toEqual([
            ["failed_journals_today", "error", 2],
            ["journals_not_recorded", "warning", 3],
        ]);
        expect(alerts.map(alert => alert.items)).toEqual([[], []]);
    });

    it("lists the orders behind today's failed and unrecorded entries", () => {
        const failed = [
            { label: "PK-1", corporateTxnId: "PK-1", journalKey: "refund", journalLabel: "Refund", service: "Visa" },
        ];
        const notRecorded = [{ label: "PK-2", corporateTxnId: "PK-2", service: "Flights" }];

        const alerts = buildAlerts({
            today: { failedEntries: 1, notRecordedEntries: 1 },
            journals: { failed, notRecorded },
        });

        expect(alerts[0]).toMatchObject({ type: "failed_journals_today", items: failed });
        expect(alerts[1]).toMatchObject({ type: "journals_not_recorded", items: notRecorded });
    });

    it("raises an error for failed journals and warnings for configuration gaps", () => {
        const services = ["A", "B", "C", "D", "E", "F"].map(label => ({ label, accessKey: label.toLowerCase() }));
        const alerts = buildAlerts({
            today: today(2),
            services,
            partners: [{ label: "Gulf Reach", partnerId: "100002226" }],
            coa: {
                missing: ["Cashback Expense"],
                unsynced: {
                    count: 2,
                    items: [
                        { accountName: "Sales", syncStatus: "CREATE_FAILED" },
                        { accountName: "Commission", syncStatus: null },
                    ],
                },
            },
            plans: {
                total: 7,
                catalogues: { plans: 4, esimPlans: 3 },
                items: [{ label: "Basic", catalogue: "plans", planId: 7, accessKey: "workspace" }],
            },
        });

        expect(alerts.map(alert => [alert.type, alert.severity, alert.count])).toEqual([
            ["failed_journals_today", "error", 2],
            ["services_without_commission", "warning", 6],
            ["partners_without_share", "warning", 1],
            ["chart_of_accounts_issues", "warning", 3],
            ["plans_missing_commission", "warning", 7],
        ]);
        expect(alerts[0].items).toEqual([]);
        expect(alerts[1].items).toEqual(services);
        expect(alerts[2].items).toEqual([{ label: "Gulf Reach", partnerId: "100002226" }]);
        expect(alerts[3]).toMatchObject({
            items: [
                { label: "Cashback Expense", issue: "missing", accountName: "Cashback Expense" },
                { label: "Sales", issue: "unsynced", accountName: "Sales", syncStatus: "CREATE_FAILED" },
                { label: "Commission", issue: "unsynced", accountName: "Commission", syncStatus: null },
            ],
            meta: { missing: 1, unsynced: 2, misclassified: 0 },
        });
        expect(alerts[4]).toMatchObject({
            items: [{ label: "Basic", catalogue: "plans", planId: 7, accessKey: "workspace" }],
            meta: { catalogues: { plans: 4, esimPlans: 3 } },
        });
    });

    it("raises one platform fee warning per classification, each right after that classification's commission alert", () => {
        const link = (service, packageName) => ({ label: `${service} · ${packageName}`, accessKey: service.toLowerCase(), service, packageName });
        const alerts = buildAlerts({
            today: today(0),
            services: [{ label: "Visa", accessKey: "visa" }],
            platformFees: {
                without_plans: { count: 2, services: 1, items: [link("Visa", "Starter"), link("Visa", "Pro")] },
                with_plans: { count: 1, services: 1, items: [link("Tunz eSIM", "Basic")] },
            },
            plans: { total: 1, catalogues: { esimPlans: 1 }, items: [{ label: "India 5GB", catalogue: "esimPlans", planId: 2, accessKey: "esim_tunz" }] },
        });

        expect(alerts.map(alert => [alert.type, alert.severity, alert.count])).toEqual([
            ["services_without_commission", "warning", 1],
            ["platform_fee_missing_without_plans", "warning", 2],
            ["plans_missing_commission", "warning", 1],
            ["platform_fee_missing_with_plans", "warning", 1],
        ]);
        expect(alerts[1]).toMatchObject({ items: [link("Visa", "Starter"), link("Visa", "Pro")], meta: { services: 1 } });
        expect(alerts[3]).toMatchObject({ items: [link("Tunz eSIM", "Basic")], meta: { services: 1 } });

        expect(
            buildAlerts({
                today: today(0),
                platformFees: { without_plans: { count: 0, services: 0, items: [] }, with_plans: null },
            })
        ).toEqual([]);
        expect(buildAlerts({ today: today(0), platformFees: null })).toEqual([]);
    });

    it("raises the health, configuration and money alerts in order, with their severities", () => {
        const group = (count, items = [{ label: `item-${count}` }], meta) => (meta ? { count, items, meta } : { count, items });
        const alerts = buildAlerts({
            today: { failedEntries: 0, notRecordedEntries: 0, skippedEntries: 4 },
            journals: {
                skipped: [{ label: "PK-3", note: "Commission not configured" }],
                skipNotes: [{ note: "Commission not configured", count: 4 }],
                refundsWaiting: group(2),
            },
            goLiveConfigured: false,
            recording: group(3, [{ label: "Journal recording is paused for every service", kind: "global" }], { paused: true, services: 2 }),
            partnersCharge: [{ label: "Gulf Reach", partnerId: "100002226" }],
            vendorsGst: group(2),
            coaPending: group(1),
            packages: group(5),
            drifted: group(1),
            vendorBalances: group(2, [{ label: "Paytm", negative: true }], { threshold: 25000, negative: 1 }),
            partnersOverdue: group(1, undefined, { days: 30 }),
            gatewayShortfalls: group(1, undefined, { shortfall: 12.5 }),
            openings: group(3, undefined, { vendors: 1, partners: 1, gateways: 1 }),
        });

        expect(alerts.map(alert => [alert.type, alert.severity, alert.count])).toEqual([
            ["go_live_not_set", "error", 1],
            ["journal_recording_off", "error", 3],
            ["journals_held_back_today", "warning", 4],
            ["refunds_waiting_for_sale", "warning", 2],
            ["partners_without_gateway_charge", "warning", 1],
            ["vendors_without_gst", "warning", 2],
            ["chart_of_accounts_pending", "warning", 1],
            ["peko_packages_without_pricing", "warning", 5],
            ["approvals_drifted", "warning", 1],
            ["vendor_balance_low", "error", 2],
            ["partner_payable_overdue", "warning", 1],
            ["gateway_settlements_short", "warning", 1],
            ["opening_balances_missing", "warning", 3],
        ]);
        expect(alerts[0]).toEqual({ type: "go_live_not_set", severity: "error", count: 1, items: [] });
        expect(alerts[1].meta).toEqual({ paused: true, services: 2 });
        expect(alerts[2]).toEqual({
            type: "journals_held_back_today",
            severity: "warning",
            count: 4,
            items: [{ label: "PK-3", note: "Commission not configured" }],
            meta: { notes: [{ note: "Commission not configured", count: 4 }] },
        });
        expect(alerts[9].meta).toEqual({ threshold: 25000, negative: 1 });
        expect(alerts[12].meta).toEqual({ vendors: 1, partners: 1, gateways: 1 });

        expect(
            buildAlerts({
                today: today(0),
                goLiveConfigured: true,
                recording: group(1, [{ label: "Visa", kind: "service" }], { paused: false, services: 1 }),
                vendorBalances: group(1, [{ label: "Paytm", negative: false }], { threshold: 25000, negative: 0 }),
                coaPending: { count: 0, items: [] },
                drifted: null,
            }).map(alert => [alert.type, alert.severity])
        ).toEqual([
            ["journal_recording_off", "warning"],
            ["vendor_balance_low", "warning"],
        ]);
    });

    it("calls out a failure reason shared by most of today's refusals", () => {
        const build = failedReasons =>
            buildAlerts({ today: today(5), journals: { failed: [], failedReasons } }).filter(
                alert => alert.type === "failures_share_reason"
            );

        expect(build([{ reason: "Token expired", count: 2 }, { reason: "Other", count: 3 }])).toEqual([]);
        expect(build([{ reason: "Token expired", count: 2 }, { reason: "Other", count: 1 }])).toEqual([]);

        const [shared] = build([
            { reason: "Token expired", count: 3 },
            { reason: null, count: 2 },
            { reason: "A", count: 1 },
        ]);
        expect(shared).toEqual({
            type: "failures_share_reason",
            severity: "error",
            count: 3,
            items: [
                { label: "Token expired", reason: "Token expired", count: 3 },
                { label: "No reason given", reason: null, count: 2 },
                { label: "A", reason: "A", count: 1 },
            ],
            meta: { total: 6, share: 50 },
        });
        expect(buildAlerts({ today: today(5), journals: null }).map(alert => alert.type)).toEqual([
            "failed_journals_today",
        ]);
    });

    it("caps every list at the item limit", () => {
        const services = Array.from({ length: 60 }, (_, index) => ({ label: `S${index}`, accessKey: `s${index}` }));

        const [alert] = buildAlerts({ today: today(0), services });

        expect(alert.count).toBe(60);
        expect(alert.items).toHaveLength(50);
    });

    it("escalates the chart of accounts alert to an error when an account is on the wrong side", () => {
        const [alert] = buildAlerts({
            today: today(0),
            coa: {
                missing: [],
                unsynced: { count: 0, items: [] },
                misclassified: [{ accountName: "Vendor Deposits", accountType: "other_current_liability" }],
            },
        });

        expect(alert).toMatchObject({
            type: "chart_of_accounts_issues",
            severity: "error",
            count: 1,
            items: [
                {
                    label: "Vendor Deposits (other_current_liability)",
                    issue: "misclassified",
                    accountName: "Vendor Deposits",
                    accountType: "other_current_liability",
                },
            ],
            meta: { missing: 0, unsynced: 0, misclassified: 1 },
        });
    });

    it("keeps working against chart of accounts findings in their older, name-only shape", () => {
        const [alert] = buildAlerts({
            today: today(0),
            coa: {
                missing: ["Sales"],
                unsynced: { count: 1, items: ["Commission"] },
                misclassified: ["Vendor Deposits (other_current_liability)"],
            },
        });

        expect(alert).toMatchObject({ severity: "error", count: 3 });
        expect(alert.items.map(item => [item.label, item.issue, item.accountName])).toEqual([
            ["Sales", "missing", "Sales"],
            ["Commission", "unsynced", "Commission"],
            ["Vendor Deposits (other_current_liability)", "misclassified", "Vendor Deposits (other_current_liability)"],
        ]);
    });

    it("keeps working against a cached alert payload written before misclassification existed", () => {
        const [alert] = buildAlerts({
            today: today(0),
            coa: { missing: ["Sales"], unsynced: { count: 0, items: [] } },
        });

        expect(alert).toMatchObject({ severity: "warning", count: 1 });
    });

    it("raises an error while the approval gate is off and a warning for services waiting on approval", () => {
        const items = ["Default · Visa", "Gulf Reach · eSIM", "A", "B", "C", "D", "E"].map((label, index) => ({
            label,
            partnerPermissionId: index + 1,
            partnerName: index ? "Gulf Reach" : null,
            accessKey: label.toLowerCase(),
            serviceLabel: label,
            status: index === 1 ? "REJECTED" : "PENDING",
        }));
        const alerts = buildAlerts({
            today: today(0),
            gate: { enabled: false, setByName: "Ibrahim", setAt: "2026-09-26T05:00:00.000Z" },
            approvals: { count: 7, items, undecided: 6, rejected: 1, partners: 2 },
        });

        expect(alerts.map(alert => [alert.type, alert.severity, alert.count])).toEqual([
            ["approval_gate_off", "error", 1],
            ["services_awaiting_approval", "warning", 7],
        ]);
        expect(alerts[0].meta).toEqual({ setByName: "Ibrahim", setAt: "2026-09-26T05:00:00.000Z" });
        expect(alerts[1].items).toEqual(items);
        expect(alerts[1].meta).toEqual({ undecided: 6, rejected: 1, partners: 2 });
    });

    it("stays quiet while the gate is on and nothing waits, or when those reads failed", () => {
        expect(buildAlerts({ today: today(0), gate: { enabled: true }, approvals: { count: 0, items: [] } })).toEqual([]);
        expect(buildAlerts({ today: today(0), gate: null, approvals: null })).toEqual([]);
    });
});

describe("buildAccountingDashboard", () => {
    const now = new Date("2026-09-16T08:30:00.000Z");

    beforeEach(() => {
        getServicesTypeConfig.mockResolvedValue({ service_with_plans: [], service_without_plans: [] });
        serviceOperator.findAll.mockResolvedValue([]);
        systemUser.findAll.mockResolvedValue([]);
        mockChartOfAccounts({ requiredRows: requiredAccountRows(), unsyncedRows: [], unsyncedCount: 0 });
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("GROUP BY catalogue") || sql.includes("ORDER BY amount DESC") ? [] : [{}]
            )
        );
    });

    it("queries only today and month-to-date in IST", async () => {
        const result = await buildAccountingDashboard(now);

        const ordersCalls = sequelizeConfig.query.mock.calls.filter(([sql]) => sql.includes("FROM orders"));
        // Other Sales totals read the journal status too now, to add up only what reached the
        // books, so they are told apart from the journal KPIs by the mode they filter on.
        const openScope = ([sql]) => !sql.includes("1 = 0") && !sql.includes(":accountScopeIds");
        const otherSalesCalls = ordersCalls.filter(([sql]) => sql.includes("PRINCIPAL_MARKUP")).filter(openScope);
        const kpiCalls = ordersCalls.filter(([sql]) => sql.includes("AS failedEntries")).filter(openScope);
        expect(kpiCalls).toHaveLength(2);
        expect(otherSalesCalls).toHaveLength(2);
        const issueCalls = ordersCalls.filter(
            ([sql, options]) =>
                !sql.includes("ORDER BY amount DESC") &&
                options.replacements &&
                options.replacements.from &&
                options.replacements.oneTimeItemKeys === undefined &&
                options.replacements.status === undefined &&
                Object.keys(options.replacements).length === 3
        );
        expect(issueCalls).toHaveLength(5);
        issueCalls.forEach(([, options]) =>
            expect(options.replacements).toEqual({
                accountingFloor: "9999-12-31",
                from: "2026-09-16 00:00:00",
                to: "2026-09-16 23:59:59",
            })
        );
        const waitingCalls = ordersCalls.filter(([sql]) => sql.includes("AS waiting"));
        expect(waitingCalls).toHaveLength(2);
        waitingCalls.forEach(([, options]) =>
            expect(options.replacements).toEqual({
                accountingFloor: "9999-12-31",
                waitingReason: "Transaction journal has not been recorded successfully yet",
            })
        );
        const rankingCalls = ordersCalls.filter(([sql]) => sql.includes("ORDER BY amount DESC"));
        expect(rankingCalls).toHaveLength(3);
        rankingCalls.forEach(([, options]) =>
            expect(options.replacements).toEqual({
                accountingFloor: "9999-12-31",
                from: "2026-09-01 00:00:00",
                to: "2026-09-16 23:59:59",
            })
        );
        expect(result.rankings).toEqual({ services: [], vendors: [], partners: [] });
        expect(kpiCalls[0][1].replacements).toEqual({
            accountingFloor: "9999-12-31",
            oneTimeItemKeys: ["corporate_cards"],
            from: "2026-09-16 00:00:00",
            to: "2026-09-16 23:59:59",
        });
        expect(kpiCalls[1][1].replacements).toEqual({
            accountingFloor: "9999-12-31",
            oneTimeItemKeys: ["corporate_cards"],
            from: "2026-09-01 00:00:00",
            to: "2026-09-16 23:59:59",
        });
        // Other Sales (principal markup) is computed separately from the journal KPIs, but
        // must be scoped to the exact same today/month-to-date windows and go-live floor.
        expect(otherSalesCalls[0][1].replacements).toEqual({
            accountingFloor: "9999-12-31",
            oneTimeItemKeys: ["corporate_cards"],
            from: "2026-09-16 00:00:00",
            to: "2026-09-16 23:59:59",
        });
        expect(otherSalesCalls[1][1].replacements).toEqual({
            accountingFloor: "9999-12-31",
            oneTimeItemKeys: ["corporate_cards"],
            from: "2026-09-01 00:00:00",
            to: "2026-09-16 23:59:59",
        });
        // Both windows sit on top of the go-live floor, so month-to-date cannot reach back
        // past the cut-off on go-live day itself.
        ordersCalls
            .filter(([sql]) => !sql.includes("AS waiting"))
            .forEach(([sql]) => expect(sql).toContain("transactionDate BETWEEN"));
        ordersCalls.forEach(([sql]) => expect(sql).toContain(":accountingFloor"));
        expect(result.generatedAt).toBe("2026-09-16T08:30:00.000Z");
        expect(Object.keys(result.sections)).toEqual(["today", "monthly"]);
        // The exact range used for each section rides along so the dashboard can link to
        // Other Sales (or anywhere else) with the identical boundaries used to compute it.
        expect(result.sections.today.range).toEqual({
            from: "2026-09-16 00:00:00",
            to: "2026-09-16 23:59:59",
        });
        expect(result.sections.monthly.range).toEqual({
            from: "2026-09-01 00:00:00",
            to: "2026-09-16 23:59:59",
        });
        expect(result.sections.today).toHaveProperty("otherSales");
        expect(result.sections.today).toHaveProperty("otherSalesCount");
        const linkCalls = sequelizeConfig.query.mock.calls
            .filter(([sql]) => sql.includes("FROM paymentLinks"))
            .filter(openScope);
        expect(linkCalls).toHaveLength(2);
        expect(linkCalls[0][1].replacements).toEqual({
            accountingFloor: "9999-12-31",
            from: "2026-09-16 00:00:00",
            to: "2026-09-16 23:59:59",
            status: "paid",
        });
        expect(linkCalls[1][1].replacements).toEqual({
            accountingFloor: "9999-12-31",
            from: "2026-09-01 00:00:00",
            to: "2026-09-16 23:59:59",
            status: "paid",
        });
        linkCalls.forEach(([sql]) => {
            expect(sql).toContain(":accountingFloor");
            expect(sql).not.toContain("journalRecordStatus");
        });
        expect(result.sections.today).toHaveProperty("thirdPartySales");
        expect(result.sections.today).toHaveProperty("thirdPartySalesCount");
        expect(result.sections.monthly).toHaveProperty("thirdPartySales");
        expect(result.goLiveConfigured).toBe(false);
        expect(result.alerts).toEqual([{ type: "go_live_not_set", severity: "error", count: 1, items: [] }]);
    });

    it("keeps the dashboard alive when one alert query fails", async () => {
        getServicesTypeConfig.mockResolvedValue({ service_with_plans: ["esim_tunz"], service_without_plans: [] });
        sequelizeConfig.query.mockImplementation(sql => {
            if (sql.includes("GROUP BY catalogue")) {
                return Promise.reject(new Error("Table 'peko.hikes' doesn't exist"));
            }
            return Promise.resolve([{ failedEntries: sql.includes("BETWEEN") ? "1" : "0" }]);
        });
        systemUser.findAll.mockResolvedValue([
            { id: 1, registeredBy: "100002226", credential: { name: "Gulf Reach" } },
        ]);

        const result = await buildAccountingDashboard(now);

        expect(result.sections.today.failedEntries).toBe(1);
        expect(result.sections.monthly.failedEntries).toBe(1);
        expect(result.alerts.map(alert => alert.type)).toEqual([
            "go_live_not_set",
            "failed_journals_today",
            "partners_without_share",
            "partners_without_gateway_charge",
        ]);
        expect(customLog).toHaveBeenCalledWith(
            null,
            "error",
            expect.objectContaining({
                message: expect.stringContaining("plans_missing_commission"),
                error: "Table 'peko.hikes' doesn't exist",
            })
        );
    });

    it("keeps the dashboard alive when the rankings read fails", async () => {
        sequelizeConfig.query.mockImplementation(sql => {
            if (sql.includes("ORDER BY amount DESC")) {
                return Promise.reject(new Error("Table 'peko.vendors' doesn't exist"));
            }
            return Promise.resolve(sql.includes("GROUP BY catalogue") ? [] : [{ failedEntries: "1" }]);
        });

        const result = await buildAccountingDashboard(now);

        expect(result.rankings).toBeNull();
        expect(result.sections.monthly.failedEntries).toBe(1);
        expect(customLog).toHaveBeenCalledWith(
            null,
            "error",
            expect.objectContaining({ message: expect.stringContaining("rankings") })
        );
    });

    it("rejects when a KPI query fails", async () => {
        sequelizeConfig.query.mockRejectedValue(new Error("connection lost"));

        await expect(buildAccountingDashboard(now)).rejects.toThrow("connection lost");
    });
});
