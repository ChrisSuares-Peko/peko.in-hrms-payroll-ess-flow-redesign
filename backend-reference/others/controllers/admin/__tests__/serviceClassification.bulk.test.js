const { classifyServices, listClassificationOptions } = require("../../../models/use-cases/serviceClassification");
const controller = require("../serviceClassification");

jest.mock("../../../models/use-cases/serviceClassification", () => ({
    listClassification: jest.fn(),
    classifyService: jest.fn(),
    classifyServices: jest.fn(),
    listClassificationOptions: jest.fn(),
}));

const run = async (handler, req) => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await handler(req, res, next);
    return { res, next };
};

const USER = { id: 42, name: "Ibrahim" };

beforeEach(() => jest.clearAllMocks());

describe("listClassificationOptions", () => {
    it("hands back the services the drawer can offer", async () => {
        listClassificationOptions.mockResolvedValue({ services: [{ accessKey: "soundbox" }] });

        const { res } = await run(controller.listClassificationOptions, {});

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toEqual({
            status: true,
            data: { services: [{ accessKey: "soundbox" }] },
            message: "Service classification options fetched successfully",
            responseCode: "000",
        });
    });
});

describe("classifyServices", () => {
    it("classifies the selected services on behalf of the signed-in admin", async () => {
        classifyServices.mockResolvedValue({ config: {}, results: [{ accessKey: "soundbox", changed: true }] });

        const { res } = await run(controller.classifyServices, {
            body: { accessKeys: ["soundbox", "forex_desk"], planType: "without_plans" },
            user: USER,
        });

        expect(classifyServices).toHaveBeenCalledWith({
            accessKeys: ["soundbox", "forex_desk"],
            planType: "without_plans",
            actor: USER,
        });
        expect(res.json.mock.calls[0][0]).toEqual({
            status: true,
            data: { config: {}, results: [{ accessKey: "soundbox", changed: true }] },
            message: "Service classification updated",
            responseCode: "000",
        });
    });

    it("rejects unknown services with a 400 naming them", async () => {
        classifyServices.mockResolvedValue({ code: "UNKNOWN", keys: ["ghost"] });

        const { next, res } = await run(controller.classifyServices, {
            body: { accessKeys: ["ghost"], planType: "with_plans" },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(next.mock.calls[0][0].message).toBe("Unknown access keys: ghost");
        expect(res.json).not.toHaveBeenCalled();
    });
});
