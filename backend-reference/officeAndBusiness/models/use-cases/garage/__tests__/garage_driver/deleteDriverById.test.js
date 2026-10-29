const { garage_driver: GarageDriver, garage_assignment } = require("../../../../entities/garage");
const { createLog } = require("../../garage_logs");
const { deleteDriverById } = require("../../garage_driver");

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

describe("deleteDriverById", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should delete driver when not assigned", async () => {
        const mockDriver = { id: 1, dlNumber: "DL123", destroy: jest.fn() };
        GarageDriver.findOne.mockResolvedValue(mockDriver);
        garage_assignment.findOne.mockResolvedValue(null);
        createLog.mockResolvedValue({});

        const result = await deleteDriverById(1, 100);

        expect(mockDriver.destroy).toHaveBeenCalled();
        expect(createLog).toHaveBeenCalledWith(expect.objectContaining({
            actionType: "DELETE_DRIVER",
        }));
        expect(result).toEqual({ success: true, message: "Driver permanently deleted" });
    });

    it("should return error if driver not found", async () => {
        GarageDriver.findOne.mockResolvedValue(null);

        const result = await deleteDriverById(999, 100);

        expect(result).toEqual({ success: false, message: "Driver not found" });
    });

    it("should return error if driver is assigned", async () => {
        GarageDriver.findOne.mockResolvedValue({ id: 1 });
        garage_assignment.findOne.mockResolvedValue({ id: 10 });

        const result = await deleteDriverById(1, 100);

        expect(result).toEqual({
            success: false,
            message: "Driver is assigned to a vehicle and cannot be deleted",
        });
    });

    it("should return error on exception", async () => {
        GarageDriver.findOne.mockRejectedValue(new Error("DB error"));

        const result = await deleteDriverById(1, 100);

        expect(result.success).toBe(false);
    });
});
