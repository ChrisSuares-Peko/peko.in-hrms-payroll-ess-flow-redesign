const { garage_driver: GarageDriver } = require("../../../../entities/garage");
const sequelize = require("../../../../../configs/database/index");
const garage_operations_log = require("../../../../entities/garage/garage_operations_log");
const { createDriver } = require("../../garage_driver");

jest.mock("../../../../entities/garage", () => ({
    garage_driver: { findOne: jest.fn(), create: jest.fn(), count: jest.fn(), findAndCountAll: jest.fn() },
    garage_assignment: { findOne: jest.fn() },
    garage_fleet: {},
    garage_document: { associate: jest.fn(), belongsTo: jest.fn() },
}));
jest.mock("../../../../entities/garage/garage_operations_log", () => ({
    create: jest.fn(),
}));
jest.mock("../../../../../configs/database/index", () => ({
    transaction: jest.fn(),
}));
jest.mock("../../garage_logs", () => ({ createLog: jest.fn() }));
jest.mock("../../../../../utils/sortHandle", () => ({ handleSortFields: jest.fn((sf, s) => [[sf || 'createdAt', s || 'DESC']]) }));

describe("createDriver", () => {
    let mockTransaction;
    beforeEach(() => {
        jest.clearAllMocks();
        mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelize.transaction.mockResolvedValue(mockTransaction);
    });

    it("should return error if driver already exists", async () => {
        GarageDriver.findOne.mockResolvedValue({ id: 1 });

        const result = await createDriver({ dlNumber: "DL123" }, 100);

        expect(result).toEqual({ success: false, error: "This driver is already added to your fleet." });
    });

    it("should create driver and log on success", async () => {
        GarageDriver.findOne.mockResolvedValue(null);
        const mockDriver = { id: 1, dlNumber: "DL123" };
        GarageDriver.create.mockResolvedValue(mockDriver);
        garage_operations_log.create.mockResolvedValue({});

        const result = await createDriver({ dlNumber: "DL123", verification_id: "V1" }, 100);

        expect(GarageDriver.create).toHaveBeenCalled();
        expect(garage_operations_log.create).toHaveBeenCalled();
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result).toEqual({ success: true, data: mockDriver });
    });

    it("should return error if create fails", async () => {
        GarageDriver.findOne.mockResolvedValue(null);
        GarageDriver.create.mockResolvedValue(null);

        const result = await createDriver({ dlNumber: "DL123" }, 100);

        expect(result).toEqual({ success: false, error: "Failed to create driver." });
    });

    it("should rollback on error", async () => {
        GarageDriver.findOne.mockRejectedValue(new Error("DB error"));

        const result = await createDriver({ dlNumber: "DL123" }, 100);

        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(result.success).toBe(false);
    });
});
