const garage_operations_log = require("../../../../entities/garage/garage_operations_log");
const { getAllOperationLogs } = require("../../garage_logs");

jest.mock("../../../../entities/garage/garage_operations_log", () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe("getAllOperationLogs", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return logs with pagination", async () => {
        const mockResult = { count: 1, rows: [{ id: 1, actionType: "ADD_DRIVER" }] };
        garage_operations_log.findAndCountAll.mockResolvedValue(mockResult);

        const result = await getAllOperationLogs({
            page: 1, itemsPerPage: 10, credentialId: 100,
            sortField: "createdAt", sort: "DESC",
        });

        expect(garage_operations_log.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it("should apply search text filter", async () => {
        garage_operations_log.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await getAllOperationLogs({
            page: 1, itemsPerPage: 10, credentialId: 100,
            sortField: "createdAt", sort: "DESC", searchText: "ADD",
        });

        expect(garage_operations_log.findAndCountAll).toHaveBeenCalled();
    });

    it("should return false on error", async () => {
        garage_operations_log.findAndCountAll.mockRejectedValue(new Error("DB error"));

        const result = await getAllOperationLogs({
            page: 1, itemsPerPage: 10, credentialId: 100,
        });

        expect(result).toBe(false);
    });
});
