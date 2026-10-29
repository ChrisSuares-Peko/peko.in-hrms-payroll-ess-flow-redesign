const { Op } = require("sequelize");
const sequelizeConfig = require("../../../../configs/database/index");
const credential = require("../../../entities/credential");
const {
    RANKING_LIMIT,
    SERVICES_SQL,
    VENDORS_SQL,
    PARTNERS_SQL,
    withPartnerNames,
    getAccountingRankings,
} = require("../../accountingRankings");
const { gmvOfOrder } = require("../../journalPosting");

jest.mock("../../../entities/credential", () => ({ findAll: jest.fn() }));
jest.mock("../../setting", () => ({ getASetting: jest.fn(), upsertSetting: jest.fn() }));
jest.mock("../../../../utils/cacheDataMethods", () => ({
    getValue: jest.fn(),
    setValue: jest.fn(),
    deleteKey: jest.fn(),
}));

const RANGE = { from: "2026-09-01 00:00:00", to: "2026-09-16 23:59:59" };
const FLOOR = "2026-08-31";

const answering = ({ services = [], vendors = [], partners = [] }) => sql => {
    if (sql.includes("FROM orders INNER JOIN credentials customer")) return Promise.resolve(partners);
    if (sql.includes("INNER JOIN vendors")) return Promise.resolve(vendors);
    return Promise.resolve(services);
};

beforeEach(() => {
    jest.clearAllMocks();
    credential.findAll.mockResolvedValue([]);
});

describe("the ranking queries", () => {
    const all = [SERVICES_SQL, VENDORS_SQL, PARTNERS_SQL];

    it("count only successful orders inside the month window and above the go-live floor", () => {
        all.forEach(sql => {
            expect(sql).toContain("orders.status = 'SUCCESS'");
            expect(sql).toContain("DATE(orders.transactionDate) > :accountingFloor");
            expect(sql).toContain("orders.transactionDate BETWEEN :from AND :to");
            expect(sql).toContain("ORDER BY amount DESC");
            expect(sql).toContain(`LIMIT ${RANKING_LIMIT}`);
            expect(sql).not.toContain("journalRecordStatus");
            expect(sql).not.toContain("PRINCIPAL_MARKUP");
        });
        expect(RANKING_LIMIT).toBe(6);
    });

    it("rank services and partners by the amount charged, the same basis as GMV", () => {
        expect(SERVICES_SQL).toContain(`COALESCE(SUM(${gmvOfOrder("orders")}), 0) AS amount`);
        expect(SERVICES_SQL).toContain("INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId");
        expect(SERVICES_SQL).toContain("GROUP BY serviceOperators.id, serviceOperators.serviceProvider");
        expect(PARTNERS_SQL).toContain(`${gmvOfOrder("orders")} AS orderAmount`);
        expect(PARTNERS_SQL).toContain("COALESCE(SUM(orderAmount), 0) AS amount");
    });

    it("rank vendors by commission excluding GST, the same basis as the Commission card", () => {
        expect(VENDORS_SQL).toContain("JSON_EXTRACT(orders.journalData, '$.commissionExcludingGST')");
        expect(VENDORS_SQL).toContain("INNER JOIN vendors ON vendors.id = serviceOperators.vendorId");
        expect(VENDORS_SQL).toContain("GROUP BY vendors.id, vendors.vendorName");
    });

    it("fold every customer without a numeric partner into one default bucket and keep a partner's own orders under it", () => {
        expect(PARTNERS_SQL).toContain(
            "CASE WHEN customer.registeredBy REGEXP '^[0-9]+$' THEN CAST(customer.registeredBy AS UNSIGNED) ELSE 0 END AS partnerId"
        );
        expect(PARTNERS_SQL).toContain("GROUP BY partnerId");
        expect(PARTNERS_SQL).not.toContain("<> customer.id");
    });

    it("group partners by a derived column, because credentials has a real partnerId column that GROUP BY would pick over the alias", () => {
        expect(PARTNERS_SQL).toMatch(
            /^SELECT partnerId, .* FROM \(SELECT CASE WHEN customer\.registeredBy .* AS partnerId, .*\) AS partnerOrders GROUP BY partnerId ORDER BY amount DESC, partnerId ASC LIMIT 6$/
        );
        expect(PARTNERS_SQL.indexOf("customer.registeredBy")).toBeGreaterThan(PARTNERS_SQL.indexOf("FROM (SELECT"));
    });

    it("never alias a grouped column as id or the count as orders", () => {
        all.forEach(sql => {
            expect(sql).not.toMatch(/ AS id\b/);
            expect(sql).not.toMatch(/ AS orders\b/);
            expect(sql).toContain("COUNT(*) AS orderCount");
        });
    });
});

describe("getAccountingRankings", () => {
    it("runs the three queries against the month window and shapes numeric rows", async () => {
        sequelizeConfig.query.mockImplementation(
            answering({
                services: [{ serviceId: "12", name: "Visa", amount: "41250.7512", orderCount: "312" }],
                vendors: [{ vendorId: 4, name: "Acme Telecom", amount: "8650.4", orderCount: 190 }],
            })
        );

        const result = await getAccountingRankings({ range: RANGE, accountingFloor: FLOOR });

        expect(sequelizeConfig.query).toHaveBeenCalledTimes(3);
        sequelizeConfig.query.mock.calls.forEach(([, options]) => {
            expect(options).toEqual({
                replacements: { accountingFloor: FLOOR, from: RANGE.from, to: RANGE.to },
                type: "SELECT",
            });
        });
        expect(result.services).toEqual([{ id: 12, name: "Visa", amount: 41250.75, orders: 312 }]);
        expect(result.vendors).toEqual([{ id: 4, name: "Acme Telecom", amount: 8650.4, orders: 190 }]);
        expect(result.partners).toEqual([]);
        expect(credential.findAll).not.toHaveBeenCalled();
    });

    it("names the partners in one lookup, labels the default bucket with nulls and falls back to the id", async () => {
        sequelizeConfig.query.mockImplementation(
            answering({
                partners: [
                    { partnerId: 0, amount: "52310.2", orderCount: "615" },
                    { partnerId: "77", amount: "12980.4", orderCount: "88" },
                    { partnerId: "91", amount: "300", orderCount: "2" },
                ],
            })
        );
        credential.findAll.mockResolvedValue([{ id: 77, name: "Gulf Reach" }]);

        const { partners } = await getAccountingRankings({ range: RANGE, accountingFloor: FLOOR });

        expect(credential.findAll).toHaveBeenCalledWith({
            where: { id: { [Op.in]: [77, 91] } },
            attributes: ["id", "name"],
            raw: true,
        });
        expect(partners).toEqual([
            { id: null, name: null, amount: 52310.2, orders: 615 },
            { id: 77, name: "Gulf Reach", amount: 12980.4, orders: 88 },
            { id: 91, name: "91", amount: 300, orders: 2 },
        ]);
    });

    it("skips the name lookup when only the default bucket is present", async () => {
        const rows = await withPartnerNames([{ id: null, name: null, amount: 10, orders: 1 }]);

        expect(rows).toEqual([{ id: null, name: null, amount: 10, orders: 1 }]);
        expect(credential.findAll).not.toHaveBeenCalled();
    });

    it("tolerates a row with none of the expected fields", async () => {
        sequelizeConfig.query.mockResolvedValue([{}]);

        const result = await getAccountingRankings({ range: RANGE, accountingFloor: FLOOR });

        expect(result.services).toEqual([{ id: null, name: null, amount: 0, orders: 0 }]);
        expect(credential.findAll).not.toHaveBeenCalled();
    });
});
