const { garage_fleet: GarageFleet } = require("../../../../entities/garage");
const { findOneFleet } = require("../../garage_fleet");

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

describe("findOneFleet", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return fleet when found", async () => {
        const mockFleet = { id: 1, vehicleNumber: "MH01" };
        GarageFleet.findOne.mockResolvedValue(mockFleet);

        const result = await findOneFleet({ id: 1 });

        expect(GarageFleet.findOne).toHaveBeenCalledWith({ where: { id: 1, isDeleted: false } });
        expect(result).toEqual({ success: true, data: mockFleet });
    });

    it("should return not found when fleet does not exist", async () => {
        GarageFleet.findOne.mockResolvedValue(null);

        const result = await findOneFleet({ id: 999 });

        expect(result).toEqual({ success: false, message: "Fleet not found" });
    });

    it("should return error on exception", async () => {
        GarageFleet.findOne.mockRejectedValue(new Error("DB error"));

        const result = await findOneFleet({ id: 1 });

        expect(result.success).toBe(false);
        expect(result.message).toBe("Unable to fetch fleet");
    });
});
