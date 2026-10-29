const { Op } = require("sequelize");
const sequelizeConfig = require("../../../../configs/database/index");
const serviceOperator = require("../../../entities/serviceOperator");
const credential = require("../../../entities/credential");
const chartOfAccount = require("../../../entities/chartOfAccount");
const vendor = require("../../../entities/vendor");
const vendorDeposits = require("../../../entities/vendorDeposit");
const partnerPayouts = require("../../../entities/partnerPayout");
const paymentGatewaySettlements = require("../../../entities/paymentGatewaySettlement");
const { getASetting } = require("../../setting");
const { listTrees, loadApprovals } = require("../../serviceApprovalTree");
const { loadReadinessContext, computeReadiness, driftOf } = require("../../serviceApprovalReadiness");
const { getVendorLedgerSnapshot, getLowBalanceThreshold } = require("../../vendorLedger");
const { getPartnerLedgerSnapshot } = require("../../partnerLedger");
const finders = require("../../dashboardAlertFinders");

jest.mock("../../../entities/serviceOperator", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/credential", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/chartOfAccount", () => ({ findAll: jest.fn(), count: jest.fn() }));
jest.mock("../../../entities/vendor", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/vendorDeposit", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/partnerPayout", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/paymentGatewaySettlement", () => ({ findAll: jest.fn() }));
jest.mock("../../setting", () => ({ getASetting: jest.fn(), upsertSetting: jest.fn() }));
jest.mock("../../serviceApprovalTree", () => ({
    listTrees: jest.fn(),
    loadApprovals: jest.fn(),
    unitKey: (partnerPermissionId, accessKey) => `${partnerPermissionId}:${accessKey}`,
}));
jest.mock("../../serviceApprovalReadiness", () => ({
    loadReadinessContext: jest.fn(),
    computeReadiness: jest.fn(),
    driftOf: jest.fn(),
}));
jest.mock("../../vendorLedger", () => ({ getVendorLedgerSnapshot: jest.fn(), getLowBalanceThreshold: jest.fn() }));
jest.mock("../../partnerLedger", () => ({ getPartnerLedgerSnapshot: jest.fn() }));
jest.mock("../../paymentGatewayLedger", () => ({
    GATEWAY_OF_ORDER: "JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.journalAccountIds.paymentGateway'))",
}));

const CONFIG = {
    service_with_plans: ["esim_tunz"],
    service_without_plans: ["visa", "flights"],
    peko_service_subscriptions: ["ecommerce_store"],
};

const NOW = new Date("2026-10-20T06:00:00.000Z");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("findJournalRecordingOff", () => {
    it("names the global pause first, then every switched-on vendor service set not to post", async () => {
        getASetting.mockResolvedValue({ enabled: false, setByName: "Ibrahim", setAt: "2026-10-19T10:00:00.000Z" });
        serviceOperator.findAll.mockResolvedValue([
            { id: 1, serviceProvider: "Visa", accessKey: "visa" },
            { id: 2, serviceProvider: "Tunz eSIM", accessKey: "esim_tunz" },
        ]);

        expect(await finders.findJournalRecordingOff(CONFIG)).toEqual({
            count: 3,
            items: [
                { label: "Journal recording is paused for every service", kind: "global", setByName: "Ibrahim", setAt: "2026-10-19T10:00:00.000Z" },
                { label: "Visa", kind: "service", accessKey: "visa", planType: "without_plans" },
                { label: "Tunz eSIM", kind: "service", accessKey: "esim_tunz", planType: "with_plans" },
            ],
            meta: { paused: true, services: 2 },
        });
        expect(getASetting).toHaveBeenCalledWith("journalRecording");
        expect(serviceOperator.findAll.mock.calls[0][0].where).toEqual({
            serviceStatus: true,
            recordJournalEntry: false,
            accessKey: { [Op.in]: ["esim_tunz", "visa", "flights"] },
        });
    });

    it("answers nothing while recording is on everywhere, and reads no services without a classification", async () => {
        getASetting.mockResolvedValue({ enabled: true });
        serviceOperator.findAll.mockResolvedValue([]);

        expect(await finders.findJournalRecordingOff(CONFIG)).toEqual({ count: 0, items: [], meta: { paused: false, services: 0 } });

        serviceOperator.findAll.mockClear();
        expect(await finders.findJournalRecordingOff({ service_with_plans: [], service_without_plans: [] })).toEqual({
            count: 0,
            items: [],
            meta: { paused: false, services: 0 },
        });
        expect(serviceOperator.findAll).not.toHaveBeenCalled();
    });
});

describe("findChartOfAccountsPending", () => {
    it("lists accounts stuck in a pending sync for more than a day", async () => {
        chartOfAccount.count.mockResolvedValue("2");
        chartOfAccount.findAll.mockResolvedValue([
            { id: 1, account_name: "Sales", syncStatus: "CREATE_PENDING", updatedAt: "2026-10-18T10:00:00.000Z" },
            { id: 2, account_name: "Commission", syncStatus: "UPDATE_PENDING", updatedAt: null },
        ]);

        expect(await finders.findChartOfAccountsPending(NOW)).toEqual({
            count: 2,
            items: [
                { label: "Sales", accountName: "Sales", syncStatus: "CREATE_PENDING", since: "2026-10-18T10:00:00.000Z" },
                { label: "Commission", accountName: "Commission", syncStatus: "UPDATE_PENDING", since: null },
            ],
        });
        const { where } = chartOfAccount.findAll.mock.calls[0][0];
        expect(where.syncStatus).toEqual({ [Op.in]: ["CREATE_PENDING", "UPDATE_PENDING"] });
        expect(where.updatedAt[Op.lt].toISOString()).toBe("2026-10-19T06:00:00.000Z");
        expect(chartOfAccount.count.mock.calls[0][0].where).toBe(where);
    });
});

describe("findDriftedApprovals", () => {
    const node = (accessKey, label, hasAccess = true) => ({ nodeKey: accessKey, accessKey, label, hasAccess });

    it("lists approved, switched-on services whose settings changed since approval", async () => {
        listTrees.mockResolvedValue([
            { id: 1, registeredBy: null, partnerName: null, treeStatus: true, nodes: [node("visa", "Visa"), node("esim_tunz", "eSIM", false)] },
            { id: 12, registeredBy: "100002226", partnerName: "Gulf Reach", treeStatus: true, nodes: [node("visa", "Visa")] },
            { id: 20, registeredBy: "999", partnerName: "Old", treeStatus: false, nodes: [node("visa", "Visa")] },
        ]);
        loadApprovals.mockResolvedValue(
            new Map([
                ["1:visa", { status: "APPROVED", configHash: "a" }],
                ["12:visa", { status: "REJECTED" }],
            ])
        );
        loadReadinessContext.mockResolvedValue({ ctx: true });
        computeReadiness.mockReturnValue(new Map([["1:visa", { hash: "b" }]]));
        driftOf.mockImplementation(approval =>
            approval.status === "APPROVED" ? { changed: true, fields: [{ field: "providerCommission", label: "Commission rate" }, { field: "x" }] } : null
        );

        expect(await finders.findDriftedApprovals()).toEqual({
            count: 1,
            items: [
                {
                    label: "Default · Visa",
                    partnerPermissionId: 1,
                    partnerName: null,
                    accessKey: "visa",
                    serviceLabel: "Visa",
                    changes: ["Commission rate", "x"],
                },
            ],
        });
        expect(computeReadiness.mock.calls[0][0]).toEqual([
            { partnerPermissionId: 1, registeredBy: null, nodeKey: "visa", accessKey: "visa" },
            { partnerPermissionId: 12, registeredBy: "100002226", nodeKey: "visa", accessKey: "visa" },
        ]);
        expect(listTrees).toHaveBeenCalledWith({ partnersOnly: true });
    });

    it("computes nothing when no service is switched on", async () => {
        listTrees.mockResolvedValue([{ id: 1, treeStatus: true, nodes: [node("visa", "Visa", false)] }]);
        loadApprovals.mockResolvedValue(new Map());

        expect(await finders.findDriftedApprovals()).toEqual({ count: 0, items: [] });
        expect(loadReadinessContext).not.toHaveBeenCalled();
    });
});

describe("findVendorsWithoutGstDetails", () => {
    it("groups vendor services by vendor and says which GST detail is missing", async () => {
        serviceOperator.findAll.mockResolvedValue([
            { id: 1, serviceProvider: "Visa", accessKey: "visa", vendor: { id: 7, vendorName: "Paytm", state: "", gstNo: "27AAA" } },
            { id: 2, serviceProvider: "Flights", accessKey: "flights", vendor: { id: 7, vendorName: "Paytm", state: "", gstNo: "27AAA" } },
            { id: 3, serviceProvider: "Tunz eSIM", accessKey: "esim_tunz", vendor: { id: 8, vendorName: null, state: "KL", gstNo: null } },
            { id: 4, serviceProvider: "Ghost", accessKey: "ghost", vendor: null },
        ]);

        expect(await finders.findVendorsWithoutGstDetails(CONFIG)).toEqual({
            count: 2,
            items: [
                { label: "Paytm", vendorId: 7, accessKey: "visa", planType: "without_plans", services: ["Visa", "Flights"], missing: ["state"] },
                { label: "Vendor 8", vendorId: 8, accessKey: "esim_tunz", planType: "with_plans", services: ["Tunz eSIM"], missing: ["GST number"] },
            ],
        });
        const query = serviceOperator.findAll.mock.calls[0][0];
        expect(query.where).toEqual({ serviceStatus: true, accessKey: { [Op.in]: ["esim_tunz", "visa", "flights"] } });
        expect(query.include[0].required).toBe(true);
        expect(query.include[0].where[Op.or]).toEqual([{ state: null }, { state: "" }, { gstNo: null }, { gstNo: "" }]);
    });

    it("reads nothing while no service is classified as a vendor service", async () => {
        expect(await finders.findVendorsWithoutGstDetails({ service_with_plans: [], service_without_plans: [] })).toEqual({ count: 0, items: [] });
        expect(serviceOperator.findAll).not.toHaveBeenCalled();
    });
});

describe("findPekoPackagesWithoutPricing", () => {
    it("scopes to plan packages and Peko's own service packages with no monthly or annual price", async () => {
        const rowsSql = finders.buildPackagesWithoutPricingQuery(["ecommerce_store"]);
        const countSql = finders.buildPackagesWithoutPricingQuery(["ecommerce_store"], { count: true });

        expect(rowsSql).toContain("(p.type = '1' OR (p.type = '2' AND p.accessCode IN (:pekoKeys)))");
        expect(rowsSql).toContain("p.packagePrices IS NULL OR (COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p.packagePrices, '$.monthly')), 'null'), '') = ''");
        expect(rowsSql).toContain("JSON_EXTRACT(p.packagePrices, '$.annually')");
        expect(rowsSql).toContain("ORDER BY p.packageName, p.id LIMIT 50");
        expect(countSql).toContain("SELECT COUNT(*) AS total FROM packages p");
        expect(finders.buildPackagesWithoutPricingQuery([])).toContain("WHERE p.status = 1 AND p.type = '1' AND");

        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("COUNT(*)")
                    ? [{ total: "3" }]
                    : [
                          { id: 1, packageName: "Starter", accessCode: "", type: "1", partnerId: null, partnerName: null },
                          { id: 2, packageName: "Commerce Pro", accessCode: "ecommerce_store", type: "2", partnerId: 100002226, partnerName: "Gulf Reach" },
                          { id: null },
                      ]
            )
        );

        expect(await finders.findPekoPackagesWithoutPricing(CONFIG)).toEqual({
            count: 3,
            items: [
                { label: "Starter", packageId: 1, packageName: "Starter", accessCode: null, ownService: false, partnerId: null, partnerName: null },
                { label: "Commerce Pro", packageId: 2, packageName: "Commerce Pro", accessCode: "ecommerce_store", ownService: true, partnerId: "100002226", partnerName: "Gulf Reach" },
            ],
        });
        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({ pekoKeys: ["ecommerce_store"] });
    });
});

describe("findVendorBalanceIssues", () => {
    it("lists vendors under the low-balance threshold, lowest first, and counts the negative ones", async () => {
        getVendorLedgerSnapshot.mockResolvedValue({
            balances: { 7: { available: 1000 }, 8: { available: -250.5 }, 9: { available: 90000 } },
        });
        getLowBalanceThreshold.mockResolvedValue(25000);
        vendor.findAll.mockResolvedValue([{ id: 7, vendorName: "Paytm" }]);

        expect(await finders.findVendorBalanceIssues()).toEqual({
            count: 2,
            items: [
                { label: "Vendor 8", vendorId: 8, available: -250.5, threshold: 25000, negative: true },
                { label: "Paytm", vendorId: 7, available: 1000, threshold: 25000, negative: false },
            ],
            meta: { threshold: 25000, negative: 1 },
        });
        expect(vendor.findAll.mock.calls[0][0].where).toEqual({ id: { [Op.in]: [8, 7] } });
    });

    it("answers nothing when every vendor is above the threshold", async () => {
        getVendorLedgerSnapshot.mockResolvedValue({ balances: { 7: { available: 30000 } } });
        getLowBalanceThreshold.mockResolvedValue(25000);

        expect(await finders.findVendorBalanceIssues()).toEqual({ count: 0, items: [], meta: { threshold: 25000, negative: 0 } });
        expect(vendor.findAll).not.toHaveBeenCalled();
    });
});

describe("findPartnersOverdue", () => {
    it("flags partners owed money with no payout for thirty days, counting from their first order when never paid", async () => {
        getPartnerLedgerSnapshot.mockResolvedValue({
            balances: {
                100: { owed: 500 },
                200: { owed: 1200 },
                300: { owed: 80 },
                400: { owed: 0 },
                500: { owed: 60 },
            },
        });
        partnerPayouts.findAll.mockResolvedValue([
            { partnerCredentialId: 100, lastPayout: "2026-10-01" },
            { partnerCredentialId: 200, lastPayout: new Date("2026-08-15T00:00:00.000Z") },
        ]);
        sequelizeConfig.query.mockResolvedValue([
            { partnerId: "300", firstOrder: "2026-07-01 10:00:00" },
            { partnerId: "500", firstOrder: "2026-10-15 10:00:00" },
        ]);
        credential.findAll.mockResolvedValue([
            { id: 200, name: "Gulf Reach" },
            { id: 300, name: "Musi" },
        ]);

        expect(await finders.findPartnersOverdue({ now: NOW, accountingFloor: "2026-06-30" })).toEqual({
            count: 2,
            items: [
                { label: "Gulf Reach", partnerId: "200", owed: 1200, lastPayout: "2026-08-15", since: "2026-08-15" },
                { label: "Musi", partnerId: "300", owed: 80, lastPayout: null, since: "2026-07-01" },
            ],
            meta: { days: 30 },
        });
        expect(partnerPayouts.findAll.mock.calls[0][0].where).toMatchObject({
            partnerCredentialId: { [Op.in]: ["100", "200", "300", "500"] },
            entryKind: "PAYOUT",
            entryType: "PAYOUT",
            status: "ACTIVE",
        });
        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({
            partnerIds: ["100", "200", "300", "500"],
            accountingFloor: "2026-06-30",
        });
    });

    it("answers nothing when no partner is owed anything", async () => {
        getPartnerLedgerSnapshot.mockResolvedValue({ balances: { 100: { owed: 0 } } });

        expect(await finders.findPartnersOverdue({ now: NOW, accountingFloor: "2026-06-30" })).toEqual({ count: 0, items: [] });
        expect(partnerPayouts.findAll).not.toHaveBeenCalled();
    });
});

describe("findGatewayShortfalls", () => {
    it("lists receipts short of their expected amount with no fee entry explaining the difference", async () => {
        const rowsSql = finders.buildGatewayShortfallQuery();
        const countSql = finders.buildGatewayShortfallQuery({ count: true });

        [rowsSql, countSql].forEach(sql => {
            expect(sql).toContain("LEFT JOIN paymentGatewaySettlements f ON f.settlementId = r.id AND f.entryKind = 'FEE'");
            expect(sql).toContain("r.entryKind = 'RECEIPT' AND r.entryType = 'ENTRY' AND r.status = 'ACTIVE' AND r.deletedAt IS NULL");
            expect(sql).toContain("r.expectedAmount > r.amount AND f.id IS NULL");
            expect(sql).toContain("NOT EXISTS (SELECT 1 FROM paymentGatewaySettlements x WHERE x.reversesId = r.id");
        });
        expect(countSql).toContain("COALESCE(SUM(r.expectedAmount - r.amount), 0) AS shortfall");
        expect(rowsSql).toContain("ORDER BY r.entryDate DESC, r.id DESC LIMIT 50");

        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("COUNT(*)")
                    ? [{ total: "1", shortfall: "12.5" }]
                    : [{ id: 9, gatewayAccountId: "4521", amount: "87.5", expectedAmount: "100", entryDate: "2026-10-04", reference: "UTR1" }]
            )
        );
        chartOfAccount.findAll.mockResolvedValue([{ provider_account_id: "4521", account_name: "Razorpay" }]);

        expect(await finders.findGatewayShortfalls()).toEqual({
            count: 1,
            items: [
                {
                    label: "Razorpay · 2026-10-04",
                    settlementId: 9,
                    gatewayAccountId: "4521",
                    gatewayName: "Razorpay",
                    amount: 87.5,
                    expectedAmount: 100,
                    shortfall: 12.5,
                    date: "2026-10-04",
                    reference: "UTR1",
                },
            ],
            meta: { shortfall: 12.5 },
        });
    });
});

describe("findOpeningBalancesMissing", () => {
    it("does nothing until the go-live date is set", async () => {
        expect(await finders.findOpeningBalancesMissing({ accountingFloor: "9999-12-31", config: CONFIG })).toEqual({ count: 0, items: [] });
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });

    it("names vendors, partners and gateways with orders before go-live and no opening balance", async () => {
        sequelizeConfig.query.mockImplementation(sql => {
            if (sql.includes("so.vendorId AS profileId")) {
                return Promise.resolve([
                    { profileId: 7, profileName: "Paytm", orders: "12" },
                    { profileId: 8, profileName: "Cleartrip", orders: "3" },
                ]);
            }
            if (sql.includes("customer.registeredBy AS profileId")) {
                return Promise.resolve([{ profileId: "100002226", profileName: "Gulf Reach", orders: "5" }]);
            }
            return Promise.resolve([{ profileId: "4521", orders: "40" }, { profileId: "9000", orders: "1" }]);
        });
        vendorDeposits.findAll.mockResolvedValue([{ vendorId: 8 }]);
        partnerPayouts.findAll.mockResolvedValue([]);
        paymentGatewaySettlements.findAll.mockResolvedValue([{ gatewayAccountId: "9000" }]);
        chartOfAccount.findAll.mockResolvedValue([{ provider_account_id: "4521", account_name: "Razorpay" }]);

        expect(await finders.findOpeningBalancesMissing({ accountingFloor: "2026-08-31", config: CONFIG })).toEqual({
            count: 3,
            items: [
                { label: "Paytm", ledger: "vendors", profileId: "7", profileName: "Paytm", orders: 12 },
                { label: "Gulf Reach", ledger: "partners", profileId: "100002226", profileName: "Gulf Reach", orders: 5 },
                { label: "Razorpay", ledger: "gateways", profileId: "4521", profileName: "Razorpay", orders: 40 },
            ],
            meta: { vendors: 1, partners: 1, gateways: 1 },
        });
        expect(finders.VENDORS_BEFORE_GO_LIVE).toContain("DATE(o.transactionDate) <= :accountingFloor AND so.accessKey IN (:vendorKeys)");
        expect(finders.PARTNERS_BEFORE_GO_LIVE).toContain("roleAndPermissions.roleName = 'partner'");
        expect(finders.gatewaysBeforeGoLiveQuery()).toContain("journalAccountIds.paymentGateway");
        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({ accountingFloor: "2026-08-31", vendorKeys: ["esim_tunz", "visa", "flights"] });
        expect(vendorDeposits.findAll.mock.calls[0][0].where).toEqual({ entryType: "OPENING", status: "ACTIVE" });
        expect(partnerPayouts.findAll.mock.calls[0][0].where).toEqual({ entryKind: "OPENING", status: "ACTIVE" });
        expect(paymentGatewaySettlements.findAll.mock.calls[0][0].where).toEqual({ entryKind: "OPENING", status: "ACTIVE" });
    });
});
