const sequelizeConfig = require("../../../../configs/database/index");
const { listSubscriptionPackages } = require("../../subscriptionPackages");

const flat = sql => sql.replace(/\s+/g, " ");
const rowsCall = () => sequelizeConfig.query.mock.calls[0];

describe("listSubscriptionPackages", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        sequelizeConfig.QueryTypes = { SELECT: "SELECT" };
        sequelizeConfig.query = jest.fn(async sql =>
            sql.includes("COUNT(*)") ? [{ totalCount: 3 }] : [{ id: 40, packageName: "Commerce Pro" }]
        );
    });

    it("lists the plans alone while no service is classified as Peko's own", async () => {
        await listSubscriptionPackages({ serviceAccessCodes: [], limit: 10, offset: 0 });

        const [sql, options] = rowsCall();
        expect(flat(sql)).toContain("WHERE packages.type = '1' ORDER BY");
        expect(options.replacements).toEqual({ limit: 10, offset: 0 });
    });

    it("adds the service packages of Peko's own services, naming the service on those only", async () => {
        const result = await listSubscriptionPackages({
            serviceAccessCodes: ["ecommerce_store"],
            sort: "ASC",
            sortField: "packageName",
            limit: 10,
            offset: 20,
        });

        const [sql, options] = rowsCall();
        expect(flat(sql)).toContain(
            "(packages.type = '1' OR (packages.type = '2' AND packages.accessCode IN (:serviceAccessCodes)))"
        );
        expect(flat(sql)).toContain("CASE WHEN packages.type = '2' THEN");
        expect(flat(sql)).toContain("ORDER BY packages.packageName ASC, packages.id DESC LIMIT :limit OFFSET :offset");
        expect(options.replacements).toEqual({ serviceAccessCodes: ["ecommerce_store"], limit: 10, offset: 20 });
        expect(result).toEqual({ rows: [{ id: 40, packageName: "Commerce Pro" }], count: 3 });
    });

    it("narrows by search and partner, and reads Default as packages with no partner", async () => {
        await listSubscriptionPackages({ serviceAccessCodes: ["ecommerce_store"], searchText: "pro", partnerId: "default" });
        const defaultSql = flat(rowsCall()[0]);
        expect(defaultSql).toContain("packages.packageName LIKE :searchText");
        expect(defaultSql).toContain("packages.partnerId IS NULL");
        expect(rowsCall()[1].replacements.searchText).toBe("%pro%");

        sequelizeConfig.query.mockClear();
        await listSubscriptionPackages({ serviceAccessCodes: [], partnerId: "88" });
        expect(flat(rowsCall()[0])).toContain("packages.partnerId = :partnerId");
        expect(rowsCall()[1].replacements.partnerId).toBe("88");
    });

    it("falls back to the newest first for a sort it does not know", async () => {
        await listSubscriptionPackages({ sortField: "packagePrices" });

        expect(flat(rowsCall()[0])).toContain("ORDER BY packages.createdAt DESC");
    });
});
