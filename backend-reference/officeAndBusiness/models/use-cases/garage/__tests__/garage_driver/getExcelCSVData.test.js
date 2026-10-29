const { garage_driver: GarageDriver } = require("../../../../entities/garage");
const { getExcelCSVData } = require("../../garage_driver");

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

describe("getExcelCSVData (driver)", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return formatted driver data for export", async () => {
        const mockData = {
            count: 1,
            rows: [{
                createdAt: new Date("2024-01-15"),
                name: "John",
                dlNumber: "DL123",
                nonTransportValidTo: new Date("2025-12-31"),
                verificationStatus: "verified",
                photoUrl: "http://example.com/photo.jpg",
                assignments: { fleet: { vehicleNumber: "MH01AB1234" } },
                rawData: null,
            }],
        };
        GarageDriver.findAndCountAll.mockResolvedValue(mockData);

        const result = await getExcelCSVData({
            credentialId: 100, sortField: "name", sort: "ASC",
        });

        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty("Name", "John");
        expect(result[0]).toHaveProperty("DL Number", "DL123");
        expect(result[0]).toHaveProperty("Vehicle Assigned", "MH01AB1234");
    });

    it("should handle empty data", async () => {
        GarageDriver.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await getExcelCSVData({ credentialId: 100, sortField: "name" });

        expect(result).toEqual([]);
    });
});
