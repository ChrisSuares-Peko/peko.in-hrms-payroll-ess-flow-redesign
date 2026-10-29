const garage_operations_log = require("../../../../entities/garage/garage_operations_log");
const { createLog } = require("../../garage_logs");

jest.mock("../../../../entities/garage/garage_operations_log", () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe("createLog", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should create a log entry", async () => {
        const mockLog = { id: 1, actionType: "ADD_DRIVER" };
        garage_operations_log.create.mockResolvedValue(mockLog);

        const data = { actionType: "ADD_DRIVER", referenceId: "123", description: "test", credentialId: 100 };
        const result = await createLog(data);

        expect(garage_operations_log.create).toHaveBeenCalledWith(data);
        expect(result).toEqual({ success: true, data: mockLog });
    });

    it("should return error on exception", async () => {
        garage_operations_log.create.mockRejectedValue(new Error("DB error"));

        const result = await createLog({});

        expect(result.success).toBe(false);
    });
});
