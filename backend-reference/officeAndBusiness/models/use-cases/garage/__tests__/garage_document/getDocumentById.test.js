const { garage_document: GarageDocument } = require("../../../../entities/garage");
const { getDocumentById } = require("../../garage_document");

jest.mock("../../../../entities/garage", () => ({
    garage_fleet: { belongsTo: jest.fn() },
    garage_driver: { belongsTo: jest.fn() },
    garage_assignment: { belongsTo: jest.fn() },
    garage_document: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), associate: jest.fn(), belongsTo: jest.fn() },
}));
jest.mock("../../../../../utils/commonUploadFile", () => ({ uploadFile: jest.fn() }));

describe("getDocumentById", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return document when found", async () => {
        const mockDoc = { id: 1, type: "Insurance" };
        GarageDocument.findByPk.mockResolvedValue(mockDoc);

        const result = await getDocumentById(1);

        expect(GarageDocument.findByPk).toHaveBeenCalledWith(1);
        expect(result).toEqual({ success: true, data: mockDoc });
    });

    it("should return not found when document does not exist", async () => {
        GarageDocument.findByPk.mockResolvedValue(null);

        const result = await getDocumentById(999);

        expect(result).toEqual({ success: false, message: "Document not found" });
    });

    it("should return error on exception", async () => {
        GarageDocument.findByPk.mockRejectedValue(new Error("DB error"));

        const result = await getDocumentById(1);

        expect(result.success).toBe(false);
    });
});
