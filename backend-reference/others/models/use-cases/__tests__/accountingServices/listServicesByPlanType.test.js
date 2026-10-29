const { Op } = require("sequelize");
const serviceOperator = require("../../../entities/serviceOperator");
const { handleSortFields } = require("../../../../utils/sortHandle");
const {
    listServicesByPlanType,
    listOperatorsForClassification,
    resolveAccessKeyFilter,
    resolveClassificationFilter,
    findServiceByAccessKey,
    findUnknownAccessKeys,
} = require("../../accountingServices");

jest.mock("../../setting", () => ({
    getASetting: jest.fn(),
    upsertSetting: jest.fn(),
}));

jest.mock("../../../entities/serviceOperator", () => ({
    findAll: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/vendor", () => ({}));

jest.mock("../../../../utils/sortHandle", () => ({
    handleSortFields: jest.fn((field, sort) => [[field, sort]]),
}));

const config = (withPlans, withoutPlans) => ({
    service_with_plans: withPlans,
    service_without_plans: withoutPlans,
});

describe("resolveAccessKeyFilter", () => {
    it("includes the mapped keys for services with plans", () => {
        expect(resolveAccessKeyFilter(config(["esim"], []), "with_plans")).toEqual({
            include: ["esim"],
        });
    });

    it("includes the explicit keys for services without plans when mapped", () => {
        expect(resolveAccessKeyFilter(config(["esim"], ["tbo_airline"]), "without_plans")).toEqual({
            include: ["tbo_airline"],
        });
    });

    it("includes nothing for services without plans when that list is empty", () => {
        expect(resolveAccessKeyFilter(config(["esim"], []), "without_plans")).toEqual({
            include: [],
        });
    });
});

describe("resolveClassificationFilter", () => {
    it("maps each classification onto an include or exclude filter", () => {
        const mapped = config(["esim"], ["tbo_airline"]);
        expect(resolveClassificationFilter(mapped, "all")).toEqual({ exclude: [] });
        expect(resolveClassificationFilter(mapped, "unclassified")).toEqual({ exclude: ["esim", "tbo_airline"] });
        expect(resolveClassificationFilter(mapped, "with_plans")).toEqual({ include: ["esim"] });
        expect(resolveClassificationFilter(mapped, "without_plans")).toEqual({ include: ["tbo_airline"] });
        expect(resolveClassificationFilter(config([], []), "unclassified")).toEqual({ exclude: [] });
    });
});

describe("listOperatorsForClassification", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        serviceOperator.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    });

    it("lists every operator for the all filter and the unclassified ones outside both lists", async () => {
        await listOperatorsForClassification({ config: config(["esim"], ["tbo_airline"]), classification: "all", limit: 10, offset: 0 });
        expect(serviceOperator.findAndCountAll.mock.calls[0][0].where.accessKey).toBeUndefined();

        await listOperatorsForClassification({ config: config(["esim"], ["tbo_airline"]), classification: "unclassified" });
        expect(serviceOperator.findAndCountAll.mock.calls[1][0].where.accessKey).toEqual({
            [Op.notIn]: ["esim", "tbo_airline"],
        });
    });

    it("short-circuits an empty classified list and reuses the search clause", async () => {
        expect(await listOperatorsForClassification({ config: config([], []), classification: "with_plans" })).toEqual({ rows: [], count: 0 });
        expect(serviceOperator.findAndCountAll).not.toHaveBeenCalled();

        await listOperatorsForClassification({ config: config([], []), classification: "all", searchText: "air", sort: "ASC" });
        const query = serviceOperator.findAndCountAll.mock.calls[0][0];
        expect(query.where[Op.or]).toHaveLength(4);
        expect(handleSortFields).toHaveBeenCalledWith("serviceProvider", "ASC");
    });
});

describe("listServicesByPlanType", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        serviceOperator.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    });

    it("short-circuits when no service with plans is mapped", async () => {
        const result = await listServicesByPlanType({
            config: config([], []),
            type: "with_plans",
            limit: 10,
            offset: 0,
        });

        expect(result).toEqual({ rows: [], count: 0 });
        expect(serviceOperator.findAndCountAll).not.toHaveBeenCalled();
    });

    it("filters services with plans by the mapped keys with pagination and a whitelisted sort", async () => {
        await listServicesByPlanType({
            config: config(["esim", "quickcilver"], []),
            type: "with_plans",
            limit: 10,
            offset: 20,
            sort: "ASC",
            sortField: "vendor.vendorName",
        });

        const query = serviceOperator.findAndCountAll.mock.calls[0][0];
        expect(query.where.accessKey).toEqual({ [Op.in]: ["esim", "quickcilver"] });
        expect(query.where[Op.or]).toBeUndefined();
        expect(query.limit).toBe(10);
        expect(query.offset).toBe(20);
        expect(handleSortFields).toHaveBeenCalledWith("vendor.vendorName", "ASC");
    });

    it("lists the explicit without-plans keys when they are mapped", async () => {
        await listServicesByPlanType({
            config: config(["esim"], ["tbo_airline"]),
            type: "without_plans",
        });

        expect(serviceOperator.findAndCountAll.mock.calls[0][0].where.accessKey).toEqual({
            [Op.in]: ["tbo_airline"],
        });
    });

    it("lists nothing for services without plans while that list is empty, whatever is mapped as with plans", async () => {
        expect(
            await listServicesByPlanType({ config: config(["esim", "quickcilver"], []), type: "without_plans" })
        ).toEqual({ rows: [], count: 0 });
        expect(await listServicesByPlanType({ config: config([], []), type: "without_plans" })).toEqual({
            rows: [],
            count: 0,
        });
        expect(serviceOperator.findAndCountAll).not.toHaveBeenCalled();
    });

    it("adds a search clause covering the vendor name", async () => {
        await listServicesByPlanType({
            config: config(["esim"], []),
            type: "with_plans",
            searchText: "air",
            sort: "DESC",
        });

        const query = serviceOperator.findAndCountAll.mock.calls[0][0];
        expect(query.where[Op.or]).toEqual([
            { serviceProvider: { [Op.like]: "%air%" } },
            { accessKey: { [Op.like]: "%air%" } },
            { serviceCategory: { [Op.like]: "%air%" } },
            { "$vendor.vendorName$": { [Op.like]: "%air%" } },
        ]);
    });

    it("falls back to sorting by service name for an unknown sort field", async () => {
        await listServicesByPlanType({
            config: config(["esim"], []),
            type: "with_plans",
            sortField: "password",
            sort: "sideways",
        });

        expect(handleSortFields).toHaveBeenCalledWith("serviceProvider", "DESC");
    });
});

describe("findServiceByAccessKey", () => {
    it("loads one operator with its vendor", async () => {
        serviceOperator.findOne.mockResolvedValue({ id: 1 });

        const result = await findServiceByAccessKey("esim");

        expect(result).toEqual({ id: 1 });
        expect(serviceOperator.findOne.mock.calls[0][0].where).toEqual({ accessKey: "esim" });
    });
});

describe("findUnknownAccessKeys", () => {
    beforeEach(() => jest.clearAllMocks());

    it("returns the keys that have no service operator", async () => {
        serviceOperator.findAll.mockResolvedValue([{ accessKey: "esim" }]);

        expect(await findUnknownAccessKeys(["esim", "ghost"])).toEqual(["ghost"]);
    });

    it("skips the query for an empty list", async () => {
        expect(await findUnknownAccessKeys([])).toEqual([]);
        expect(serviceOperator.findAll).not.toHaveBeenCalled();
    });
});
