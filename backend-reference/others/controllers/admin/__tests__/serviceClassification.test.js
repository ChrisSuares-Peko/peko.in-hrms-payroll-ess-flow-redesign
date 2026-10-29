const { listClassification, classifyService } = require("../../../models/use-cases/serviceClassification");
const controller = require("../serviceClassification");

jest.mock("../../../models/use-cases/serviceClassification", () => ({
    listClassification: jest.fn(),
    classifyService: jest.fn(),
}));

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

const USER = { id: 42, name: "Ibrahim" };

beforeEach(() => jest.clearAllMocks());

describe("listServiceClassification", () => {
    it("pages through the operators with their classification", async () => {
        listClassification.mockResolvedValue({ services: [{ id: 1 }], recordsTotal: 31 });

        const { res } = await run(controller.listServiceClassification, {
            query: { classification: "unclassified", page: 3, itemsPerPage: 10, searchText: "air", sort: "ASC", sortField: "serviceProvider" },
        });

        expect(listClassification).toHaveBeenCalledWith({
            classification: "unclassified",
            limit: 10,
            offset: 20,
            searchText: "air",
            sort: "ASC",
            sortField: "serviceProvider",
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toEqual({
            status: true,
            data: { services: [{ id: 1 }], recordsTotal: 31, page: 3, itemsPerPage: 10 },
            message: "Service classification fetched successfully",
            responseCode: "000",
        });
    });
});

describe("classifyService", () => {
    it("classifies the key on behalf of the signed-in admin", async () => {
        classifyService.mockResolvedValue({ accessKey: "soundbox", planType: "with_plans", changed: true, autoApproved: [], skipped: [] });

        const { res } = await run(controller.classifyService, {
            params: { accessKey: "soundbox" },
            body: { planType: "with_plans" },
            user: USER,
        });

        expect(classifyService).toHaveBeenCalledWith({ accessKey: "soundbox", planType: "with_plans", actor: USER });
        expect(res.json.mock.calls[0][0]).toMatchObject({
            status: true,
            data: { accessKey: "soundbox", planType: "with_plans", changed: true },
            message: "Service classification updated",
        });
    });

    it("says so when nothing changed", async () => {
        classifyService.mockResolvedValue({ accessKey: "visa", planType: "without_plans", changed: false });

        const { res } = await run(controller.classifyService, {
            params: { accessKey: "visa" },
            body: { planType: "without_plans" },
            user: USER,
        });

        expect(res.json.mock.calls[0][0].message).toBe("Service classification unchanged");
    });

    it("answers 400 for a key without a service operator", async () => {
        classifyService.mockResolvedValue({ code: "UNKNOWN", accessKey: "ghost" });

        const { res, next } = await run(controller.classifyService, {
            params: { accessKey: "ghost" },
            body: { planType: null },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(next.mock.calls[0][0].message).toBe("Unknown access key: ghost");
        expect(res.json).not.toHaveBeenCalled();
    });
});
