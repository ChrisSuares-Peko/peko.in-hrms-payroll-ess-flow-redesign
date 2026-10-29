const { garage_document: GarageDocument } = require("../../../../entities/garage");
const { getAllDocuments } = require("../../garage_document");

jest.mock("../../../../entities/garage", () => ({
    garage_fleet: { belongsTo: jest.fn() },
    garage_driver: { belongsTo: jest.fn() },
    garage_assignment: { belongsTo: jest.fn() },
    garage_document: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), associate: jest.fn(), belongsTo: jest.fn() },
}));
jest.mock("../../../../../utils/commonUploadFile", () => ({ uploadFile: jest.fn() }));

describe("getAllDocuments", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return documents with pagination", async () => {
        const mockResult = { count: 1, rows: [{ id: 1, type: "Insurance" }] };
        GarageDocument.findAndCountAll.mockResolvedValue(mockResult);

        const result = await getAllDocuments({
            page: 1, itemsPerPage: 10, sortField: "type", sort: "ASC",
            credentialId: 100,
        });

        expect(GarageDocument.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it("should return error on exception", async () => {
        GarageDocument.findAndCountAll.mockRejectedValue(new Error("DB error"));

        const result = await getAllDocuments({
            page: 1, itemsPerPage: 10, sortField: "type", sort: "ASC",
            credentialId: 100,
        });

        expect(result.success).toBe(false);
    });
});
