const useCases = require("../../../models/use-cases/accountingServices");
const { applyServicesTypeConfig } = require("../../../models/use-cases/serviceClassification");
const { withConfiguration } = require("../../../models/use-cases/serviceConfiguration");
const {
    getServicesTypeConfig,
    updateServicesTypeConfig,
    listAccountingServices,
    getAccountingService,
} = require("../accounting");

jest.mock("../../../models/use-cases/accountingServices", () => {
    const actual = jest.requireActual("../../../models/use-cases/accountingServices");
    return {
        findPlanTypeForAccessKey: actual.findPlanTypeForAccessKey,
        isVendorPlanType: actual.isVendorPlanType,
        serializeService: jest.fn(row => row),
        getServicesTypeConfig: jest.fn(),
        listServicesByPlanType: jest.fn(),
        findServiceByAccessKey: jest.fn(),
    };
});
jest.mock("../../../models/use-cases/serviceClassification", () => ({ applyServicesTypeConfig: jest.fn() }));
jest.mock("../../../models/use-cases/serviceConfiguration", () => ({
    withConfiguration: jest.fn(async services => services.map(service => ({ ...service, configuration: { checked: true } }))),
}));

jest.mock("../../../models/entities/serviceOperator", () => ({}));
jest.mock("../../../models/entities/vendor", () => ({}));
jest.mock("../../../models/use-cases/setting", () => ({}));
jest.mock("../../../utils/sortHandle", () => ({ handleSortFields: jest.fn() }));

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const run = async (handler, req) => {
    const res = mockRes();
    const next = jest.fn();
    await handler(req, res, next);
    return { res, next };
};

const CONFIG = { service_with_plans: ["esim"], service_without_plans: ["tbo_airline"] };
const PARTIAL_CONFIG = { service_with_plans: ["esim"], service_without_plans: [] };
const ACTOR = { id: 42, name: "Ibrahim" };

const listQuery = type => ({
    query: { type, page: 2, itemsPerPage: 10, searchText: "", sort: "DESC", sortField: "serviceProvider" },
});

describe("accounting controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useCases.getServicesTypeConfig.mockResolvedValue(CONFIG);
        useCases.listServicesByPlanType.mockResolvedValue({ rows: [], count: 0 });
    });

    it("returns the services type config", async () => {
        const { res } = await run(getServicesTypeConfig, {});

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toEqual(
            expect.objectContaining({ status: true, data: CONFIG, responseCode: "000" })
        );
    });

    it("rejects a config with a key in both lists", async () => {
        applyServicesTypeConfig.mockResolvedValue({ code: "OVERLAP", keys: ["esim"] });

        const { next, res } = await run(updateServicesTypeConfig, {
            body: { service_with_plans: ["esim"], service_without_plans: ["esim"] },
            user: ACTOR,
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(next.mock.calls[0][0].message).toContain("esim");
        expect(res.json).not.toHaveBeenCalled();
    });

    it("rejects unknown access keys", async () => {
        applyServicesTypeConfig.mockResolvedValue({ code: "UNKNOWN", keys: ["ghost"] });

        const { next } = await run(updateServicesTypeConfig, {
            body: { service_with_plans: ["ghost"], service_without_plans: [] },
            user: ACTOR,
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(next.mock.calls[0][0].message).toContain("ghost");
    });

    it("saves a valid config through the classification use-case with the actor", async () => {
        applyServicesTypeConfig.mockResolvedValue({ config: CONFIG, autoApproved: [], skipped: [] });

        const { res } = await run(updateServicesTypeConfig, { body: CONFIG, user: ACTOR });

        expect(applyServicesTypeConfig).toHaveBeenCalledWith({ config: CONFIG, actor: ACTOR });
        expect(res.json.mock.calls[0][0].data).toEqual(CONFIG);
    });

    it("lists services of the requested type with pagination", async () => {
        useCases.listServicesByPlanType.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });

        const { res } = await run(listAccountingServices, listQuery("with_plans"));

        expect(useCases.listServicesByPlanType).toHaveBeenCalledWith(
            expect.objectContaining({ config: CONFIG, type: "with_plans", limit: 10, offset: 10 })
        );
        expect(useCases.serializeService).toHaveBeenCalledWith({ id: 1 }, "with_plans");
        expect(withConfiguration).toHaveBeenCalledWith([{ id: 1 }]);
        expect(res.json.mock.calls[0][0].data).toEqual({
            services: [{ id: 1, configuration: { checked: true } }],
            recordsTotal: 1,
            page: 2,
            itemsPerPage: 10,
        });
    });

    it("returns 404 for a service that is not classified", async () => {
        const { next } = await run(getAccountingService, { params: { accessKey: "ghost" } });

        expect(next.mock.calls[0][0].status_code).toBe(404);
        expect(useCases.findServiceByAccessKey).not.toHaveBeenCalled();
    });

    it("keeps a Peko own service subscription off the vendor service pages", async () => {
        useCases.getServicesTypeConfig.mockResolvedValue({
            service_with_plans: [],
            service_without_plans: [],
            peko_service_subscriptions: ["ecommerce_store"],
        });

        const { next } = await run(getAccountingService, { params: { accessKey: "ecommerce_store" } });

        expect(next.mock.calls[0][0].status_code).toBe(404);
        expect(useCases.findServiceByAccessKey).not.toHaveBeenCalled();
    });

    it("no longer treats an unlisted key as without plans when that list is empty", async () => {
        useCases.getServicesTypeConfig.mockResolvedValue(PARTIAL_CONFIG);

        const { next } = await run(getAccountingService, { params: { accessKey: "tbo_airline" } });

        expect(next.mock.calls[0][0].status_code).toBe(404);
        expect(useCases.findServiceByAccessKey).not.toHaveBeenCalled();
    });

    it("returns 404 when the classified operator no longer exists", async () => {
        useCases.findServiceByAccessKey.mockResolvedValue(null);

        const { next } = await run(getAccountingService, { params: { accessKey: "esim" } });

        expect(next.mock.calls[0][0].status_code).toBe(404);
    });

    it("returns the classified service with its plan type", async () => {
        useCases.findServiceByAccessKey.mockResolvedValue({ id: 9 });

        const { res } = await run(getAccountingService, { params: { accessKey: "tbo_airline" } });

        expect(useCases.serializeService).toHaveBeenCalledWith({ id: 9 }, "without_plans");
        expect(withConfiguration).toHaveBeenCalledWith([{ id: 9 }]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0].data).toEqual({ id: 9, configuration: { checked: true } });
    });
});
