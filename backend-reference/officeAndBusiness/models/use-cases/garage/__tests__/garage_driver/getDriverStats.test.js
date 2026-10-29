const { garage_driver: GarageDriver } = require("../../../../entities/garage");
const { getDriverStats } = require("../../garage_driver");

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

describe("getDriverStats", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return driver stats", async () => {
        GarageDriver.count
            .mockResolvedValueOnce(10)  // totalDrivers
            .mockResolvedValueOnce(3);  // expiringSoonDrivers

        const result = await getDriverStats({ credentialId: 100 });

        expect(GarageDriver.count).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
            success: true,
            data: { totalDrivers: 10, dlExpiringSoon: 3 },
        });
    });

    it("should handle subCorporateUserId", async () => {
        GarageDriver.count
            .mockResolvedValueOnce(5)
            .mockResolvedValueOnce(1);

        const result = await getDriverStats({ credentialId: 100, subCorporateUserId: 50 });

        expect(result.success).toBe(true);
    });

    it("should return error on exception", async () => {
        GarageDriver.count.mockRejectedValue(new Error("DB error"));

        const result = await getDriverStats({ credentialId: 100 });

        expect(result.success).toBe(false);
    });
});
