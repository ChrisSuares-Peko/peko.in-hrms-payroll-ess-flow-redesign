const { garage_driver: GarageDriver } = require("../../../../entities/garage");
const { findOneDriver } = require("../../garage_driver");

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

describe("findOneDriver", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return driver with assignments when found", async () => {
        const mockDriver = { id: 1, name: "John" };
        GarageDriver.findOne.mockResolvedValue(mockDriver);

        const result = await findOneDriver({ id: 1 });

        expect(GarageDriver.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ id: 1, status: true }),
            include: expect.any(Array),
        }));
        expect(result).toEqual({ success: true, data: mockDriver });
    });

    it("should return not found when driver does not exist", async () => {
        GarageDriver.findOne.mockResolvedValue(null);

        const result = await findOneDriver({ id: 999 });

        expect(result).toEqual({ success: false, message: "Driver not found" });
    });

    it("should return error on exception", async () => {
        GarageDriver.findOne.mockRejectedValue(new Error("DB error"));

        const result = await findOneDriver({ id: 1 });

        expect(result.success).toBe(false);
        expect(result.message).toBe("Unable to fetch driver");
    });
});
