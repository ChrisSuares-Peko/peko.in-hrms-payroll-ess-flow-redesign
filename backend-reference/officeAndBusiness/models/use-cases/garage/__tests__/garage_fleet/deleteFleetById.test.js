const { garage_fleet: GarageFleet, garage_assignment } = require("../../../../entities/garage");
const { createLog } = require("../../garage_logs");
const { deleteFleetById } = require("../../garage_fleet");

jest.mock("../../../../entities/garage", () => ({
    garage_fleet: { findOne: jest.fn(), create: jest.fn(), count: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn() },
    garage_assignment: { findOne: jest.fn() },
    garage_driver: {},
    garage_document: { associate: jest.fn(), belongsTo: jest.fn() },
}));
jest.mock("../../../../entities/garage/garage_operations_log", () => ({ create: jest.fn() }));
jest.mock("../../../../../configs/database/index", () => ({ transaction: jest.fn() }));
jest.mock("../../garage_logs", () => ({ createLog: jest.fn() }));
jest.mock("../../../../../utils/sortHandle", () => ({ handleSortFields: jest.fn((sf, s) => [[sf || 'createdAt', s || 'DESC']]) }));
jest.mock("moment", () => {
    const m = jest.fn(() => ({ isValid: () => true, diff: () => 2 }));
    m.fn = {};
    m.version = '2.30.1';
    return m;
});

describe("deleteFleetById", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should delete fleet when not assigned", async () => {
        const mockFleet = { id: 1, vehicleNumber: "MH01", destroy: jest.fn() };
        GarageFleet.findOne.mockResolvedValue(mockFleet);
        garage_assignment.findOne.mockResolvedValue(null);
        createLog.mockResolvedValue({});

        const result = await deleteFleetById(1, 100);

        expect(mockFleet.destroy).toHaveBeenCalled();
        expect(createLog).toHaveBeenCalledWith(expect.objectContaining({
            actionType: "DELETE_VEHICLE",
        }));
        expect(result).toEqual({ success: true, message: "Fleet deleted successfully" });
    });

    it("should return error if fleet not found", async () => {
        GarageFleet.findOne.mockResolvedValue(null);

        const result = await deleteFleetById(999, 100);

        expect(result).toEqual({ success: false, message: "Fleet not found" });
    });

    it("should return error if fleet is assigned", async () => {
        GarageFleet.findOne.mockResolvedValue({ id: 1 });
        garage_assignment.findOne.mockResolvedValue({ id: 10 });

        const result = await deleteFleetById(1, 100);

        expect(result).toEqual({
            success: false,
            message: "Fleet is assigned to a driver and cannot be deleted",
        });
    });

    it("should return error on exception", async () => {
        GarageFleet.findOne.mockRejectedValue(new Error("DB error"));

        const result = await deleteFleetById(1, 100);

        expect(result.success).toBe(false);
    });
});
