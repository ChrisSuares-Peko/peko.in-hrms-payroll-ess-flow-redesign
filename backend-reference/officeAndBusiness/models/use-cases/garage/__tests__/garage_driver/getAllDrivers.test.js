const { garage_driver: GarageDriver } = require("../../../../entities/garage");
const { getAllDrivers } = require("../../garage_driver");

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

describe("getAllDrivers", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return drivers with pagination", async () => {
        const mockResult = { count: 1, rows: [{ id: 1, name: "John" }] };
        GarageDriver.findAndCountAll.mockResolvedValue(mockResult);

        const result = await getAllDrivers({
            page: 1, itemsPerPage: 10, sortField: "name", sort: "ASC",
            searchText: "", credentialId: 100,
        });

        expect(GarageDriver.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it("should apply search text filter", async () => {
        GarageDriver.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await getAllDrivers({
            page: 1, itemsPerPage: 10, sortField: "name", sort: "ASC",
            searchText: "John", credentialId: 100,
        });

        expect(GarageDriver.findAndCountAll).toHaveBeenCalled();
    });

    it("should return false on error", async () => {
        GarageDriver.findAndCountAll.mockRejectedValue(new Error("DB error"));

        const result = await getAllDrivers({
            page: 1, itemsPerPage: 10, sortField: "name", sort: "ASC",
            searchText: "", credentialId: 100,
        });

        expect(result).toBe(false);
    });
});
