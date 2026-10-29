const { garage_fleet: GarageFleet } = require("../../../../entities/garage");
const { getExcelCSVData } = require("../../garage_fleet");

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

describe("getExcelCSVData (fleet)", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return formatted fleet data for export", async () => {
        const mockData = {
            count: 1,
            rows: [{
                createdAt: new Date("2024-01-15"),
                vehicleNumber: "MH01AB1234",
                model: "Swift",
                fuelType: "Petrol",
                pucValidUpto: new Date(Date.now() + 86400000 * 30).toISOString(),
                insuranceExpiry: new Date(Date.now() + 86400000 * 30).toISOString(),
                assignments: { driver: { name: "John" } },
            }],
        };
        GarageFleet.findAndCountAll.mockResolvedValue(mockData);

        const result = await getExcelCSVData({ credentialId: 100, sortField: "vehicleNumber", sort: "ASC" });

        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty("Vehicle No", "MH01AB1234");
        expect(result[0]).toHaveProperty("Driver Assigned", "John");
    });

    it("should handle empty data", async () => {
        GarageFleet.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await getExcelCSVData({ credentialId: 100, sortField: "vehicleNumber" });

        expect(result).toEqual([]);
    });
});
