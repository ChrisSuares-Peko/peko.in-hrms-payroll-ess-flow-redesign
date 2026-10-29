const sequelizeConfig = require("../../../configs/database/index");
const { isVendorService, isPekoOwnService, isListedVendorService } = require("../classifiedServices");
const {
    listVendorsWithServices,
    buildVendorMovementQuery,
    buildVendorSplitQuery,
    buildVendorReversalQuery,
    buildVendorCommissionQuery,
    buildCommissionReversalListQuery,
} = require("../vendorLedger");
const { buildVendorStatementQuery, buildVendorUnpostedQuery } = require("../vendorStatement");
const { SERVICES_SQL, VENDORS_SQL } = require("../accountingRankings");

const VENDOR_SERVICE = isVendorService();
const LISTED_VENDOR_SERVICE = isListedVendorService();
const count = (sql, part) => sql.split(part).length - 1;

describe("services classified as vendor services", () => {
    it("reads both vendor lists from the classification setting and treats a missing list as empty", () => {
        expect(VENDOR_SERVICE).toContain("'$.service_with_plans'");
        expect(VENDOR_SERVICE).toContain("'$.service_without_plans'");
        expect(VENDOR_SERVICE).not.toContain("peko_service_subscriptions");
        expect(VENDOR_SERVICE).not.toContain("peko_subscription_vendors");
        expect(VENDOR_SERVICE).toContain("WHERE settings.name = 'servicesTypeConfig'");
        expect(VENDOR_SERVICE).toContain("JSON_ARRAY()");
        expect(VENDOR_SERVICE).toContain("JSON_QUOTE(COALESCE(serviceOperators.accessKey, ''))");
        expect(isPekoOwnService()).toContain("'$.peko_service_subscriptions'");
        expect(isVendorService("serviceOperator.accessKey")).toContain(
            "JSON_QUOTE(COALESCE(serviceOperator.accessKey, ''))"
        );
    });

    it("hold every vendor balance, split, reversal and statement to those services", () => {
        const range = { from: "2026-10-01", to: "2026-10-31" };

        expect(buildVendorMovementQuery({ range, vendorId: 5 })).toContain(VENDOR_SERVICE);
        expect(buildVendorSplitQuery({ range, vendorId: 5, hasLedgerAccounts: true })).toContain(VENDOR_SERVICE);
        expect(buildVendorReversalQuery({ range, vendorId: 5 })).toContain(VENDOR_SERVICE);
        expect(buildCommissionReversalListQuery({ range })).toContain(VENDOR_SERVICE);
        expect(buildVendorStatementQuery({ range, floorDate: "2026-01-01" })).toContain(VENDOR_SERVICE);
        expect(buildVendorUnpostedQuery({ range, floorDate: "2026-01-01" })).toContain(VENDOR_SERVICE);
    });

    it("hold the vendor's order commissions to them but keep commissions recorded by hand", () => {
        const sql = buildVendorCommissionQuery({ range: null, searchText: "", status: null, countOnly: false, hasLedgerAccounts: true });

        expect(count(sql, VENDOR_SERVICE)).toBe(1);
        expect(sql.indexOf(VENDOR_SERVICE)).toBeLessThan(sql.indexOf("FROM vendorLedgerEntries"));
    });

    it("rank vendors by them, while the service ranking still lists every service", () => {
        expect(VENDORS_SQL).toContain(VENDOR_SERVICE);
        expect(SERVICES_SQL).not.toContain("servicesTypeConfig");
    });

    it("decide which vendors are listed at all, together with the vendors that provide a Peko subscription", async () => {
        sequelizeConfig.QueryTypes = { SELECT: "SELECT" };
        sequelizeConfig.query = jest.fn(async () => [{ totalCount: 0 }]);

        await listVendorsWithServices({ limit: 10, offset: 0, searchText: "", sort: "ASC", sortField: "vendorName" });

        expect(LISTED_VENDOR_SERVICE).toBe(`(${VENDOR_SERVICE} OR JSON_CONTAINS(COALESCE((SELECT JSON_EXTRACT(settings.details, '$.peko_subscription_vendors') FROM settings WHERE settings.name = 'servicesTypeConfig' LIMIT 1), JSON_ARRAY()), JSON_QUOTE(COALESCE(serviceOperators.accessKey, ''))))`);
        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
        sequelizeConfig.query.mock.calls.forEach(([sql]) => expect(sql).toContain(`WHERE ${LISTED_VENDOR_SERVICE}`));
    });
});
