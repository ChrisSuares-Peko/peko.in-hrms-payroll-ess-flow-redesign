const { garage_document: GarageDocument } = require("../../../../entities/garage");
const { deleteDocument } = require("../../garage_document");

jest.mock("../../../../entities/garage", () => ({
    garage_fleet: { belongsTo: jest.fn() },
    garage_driver: { belongsTo: jest.fn() },
    garage_assignment: { belongsTo: jest.fn() },
    garage_document: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), associate: jest.fn(), belongsTo: jest.fn() },
}));
jest.mock("../../../../../utils/commonUploadFile", () => ({ uploadFile: jest.fn() }));

describe("deleteDocument", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should delete document when found", async () => {
        const mockDoc = { id: 1, destroy: jest.fn() };
        GarageDocument.findOne.mockResolvedValue(mockDoc);

        const result = await deleteDocument(1, 100);

        expect(GarageDocument.findOne).toHaveBeenCalledWith({ where: { id: 1, credentialId: 100 } });
        expect(mockDoc.destroy).toHaveBeenCalledWith({ force: true });
        expect(result).toEqual({ success: true, message: "Document permanently deleted" });
    });

    it("should return not found when document does not exist", async () => {
        GarageDocument.findOne.mockResolvedValue(null);

        const result = await deleteDocument(999, 100);

        expect(result).toEqual({ success: false, message: "Document not found" });
    });

    it("should return error on exception", async () => {
        GarageDocument.findOne.mockRejectedValue(new Error("DB error"));

        const result = await deleteDocument(1, 100);

        expect(result.success).toBe(false);
    });
});
