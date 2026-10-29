const { garage_fleet: GarageFleet } = require("../../../../entities/garage");
const { getAllFleets } = require("../../garage_fleet");

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

describe("getAllFleets", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return fleets with pagination", async () => {
        const mockResult = { count: 1, rows: [{ id: 1, vehicleNumber: "MH01" }] };
        GarageFleet.findAndCountAll.mockResolvedValue(mockResult);

        const result = await getAllFleets({
            page: 1, itemsPerPage: 10, sortField: "vehicleNumber", sort: "ASC",
            searchText: "", credentialId: 100,
        });

        expect(GarageFleet.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it("should return false on error", async () => {
        GarageFleet.findAndCountAll.mockRejectedValue(new Error("DB error"));

        const result = await getAllFleets({
            page: 1, itemsPerPage: 10, sortField: "vehicleNumber", sort: "ASC",
            searchText: "", credentialId: 100,
        });

        expect(result).toBe(false);
    });
});
