const { garage_driver: GarageDriver } = require("../../../../entities/garage");
const { getGarageDriverUsage } = require("../../garage_driver");

jest.mock("../../../../entities/garage", () => ({
    garage_driver: { findOne: jest.fn(), create: jest.fn(), count: jest.fn(), findAndCountAll: jest.fn() },
    garage_assignment: { findOne: jest.fn() },
    garage_fleet: {},
    garage_document: { associate: jest.fn(), belongsTo: jest.fn() },
}));
jest.mock("../../../../entities/garage/garage_operations_log", () => ({ create: jest.fn() }));
jest.mock("../../../../../configs/database/index", () => ({ transaction: jest.fn() }));
jest.mock("../../garage_logs", () => ({ createLog: jest.fn() }));
jest.mock("../../../../../utils/sortHandle", () => ({ handleSortFields: jest.fn((sf, s) => [[sf || 'createdAt', s || 'DESC']]) }));

describe("getGarageDriverUsage", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return driver count", async () => {
        GarageDriver.count.mockResolvedValue(5);

        const result = await getGarageDriverUsage(100);

        expect(GarageDriver.count).toHaveBeenCalledWith({ where: { credentialId: 100 } });
        expect(result).toEqual({ success: true, data: 5 });
    });

    it("should return error on exception", async () => {
        GarageDriver.count.mockRejectedValue(new Error("DB error"));

        const result = await getGarageDriverUsage(100);

        expect(result.success).toBe(false);
    });
});
