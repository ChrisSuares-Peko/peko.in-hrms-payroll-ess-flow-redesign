const garage_operations_log = require("../../../../entities/garage/garage_operations_log");
const { findOneLogAndUpdateTime } = require("../../garage_logs");

jest.mock("../../../../entities/garage/garage_operations_log", () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe("findOneLogAndUpdateTime", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should find log and update time", async () => {
        const mockLog = {
            id: 1,
            changed: jest.fn(),
            save: jest.fn(),
        };
        garage_operations_log.findOne.mockResolvedValue(mockLog);

        const result = await findOneLogAndUpdateTime({ credentialId: 100 });

        expect(garage_operations_log.findOne).toHaveBeenCalledWith({
            where: { credentialId: 100 },
        });
        expect(mockLog.changed).toHaveBeenCalledWith("updatedAt", true);
        expect(mockLog.save).toHaveBeenCalled();
        expect(result).toEqual(mockLog);
    });

    it("should return null if log not found", async () => {
        garage_operations_log.findOne.mockResolvedValue(null);

        const result = await findOneLogAndUpdateTime({ credentialId: 999 });

        expect(result).toBeNull();
    });

    it("should return false on error", async () => {
        garage_operations_log.findOne.mockRejectedValue(new Error("DB error"));

        const result = await findOneLogAndUpdateTime({ credentialId: 100 });

        expect(result).toBe(false);
    });
});
