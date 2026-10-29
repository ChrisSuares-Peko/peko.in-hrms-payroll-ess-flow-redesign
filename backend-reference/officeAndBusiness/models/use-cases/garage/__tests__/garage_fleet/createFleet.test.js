const { garage_fleet: GarageFleet } = require("../../../../entities/garage");
const sequelize = require("../../../../../configs/database/index");
const garage_operations_log = require("../../../../entities/garage/garage_operations_log");
const { createFleet } = require("../../garage_fleet");

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

describe("createFleet", () => {
    let mockTransaction;
    beforeEach(() => {
        jest.clearAllMocks();
        mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelize.transaction.mockResolvedValue(mockTransaction);
    });

    it("should return error if fleet already exists", async () => {
        GarageFleet.findOne.mockResolvedValue({ id: 1 });

        const result = await createFleet({ vehicleNumber: "MH01" }, 100);

        expect(result).toEqual({ success: false, error: "This vehicle is already added to your fleet." });
    });

    it("should create fleet and log on success", async () => {
        GarageFleet.findOne.mockResolvedValue(null);
        const mockFleet = { id: 1, vehicleNumber: "MH01" };
        GarageFleet.create.mockResolvedValue(mockFleet);
        garage_operations_log.create.mockResolvedValue({});

        const result = await createFleet({ vehicleNumber: "MH01", verification_id: "V1" }, 100);

        expect(GarageFleet.create).toHaveBeenCalled();
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result).toEqual({ success: true, data: mockFleet });
    });

    it("should rollback on error", async () => {
        GarageFleet.findOne.mockRejectedValue(new Error("DB error"));

        const result = await createFleet({ vehicleNumber: "MH01" }, 100);

        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(result.success).toBe(false);
    });
});
