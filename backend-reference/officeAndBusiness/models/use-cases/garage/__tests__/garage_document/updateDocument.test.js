const { garage_document: GarageDocument } = require("../../../../entities/garage");
const { uploadFile } = require("../../../../../utils/commonUploadFile");
const { updateDocument } = require("../../garage_document");

jest.mock("../../../../entities/garage", () => ({
    garage_fleet: { belongsTo: jest.fn() },
    garage_driver: { belongsTo: jest.fn() },
    garage_assignment: { belongsTo: jest.fn() },
    garage_document: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), associate: jest.fn(), belongsTo: jest.fn() },
}));
jest.mock("../../../../../utils/commonUploadFile", () => ({ uploadFile: jest.fn() }));

describe("updateDocument", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return error if document not found", async () => {
        GarageDocument.findByPk.mockResolvedValue(null);

        const result = await updateDocument(1, {}, {});

        expect(result).toEqual({ success: false, error: "Document not found." });
    });

    it("should update document with file upload", async () => {
        const mockExisting = { id: 1, update: jest.fn() };
        GarageDocument.findByPk.mockResolvedValue(mockExisting);
        uploadFile.mockResolvedValue("https://cdn.example.com/new-file.pdf");

        const result = await updateDocument(
            1,
            { type: "Insurance", documentBase: "base64data", documentFormat: "pdf", credentialId: 100 },
            { role: "CORPORATE", username: "user1" }
        );

        expect(uploadFile).toHaveBeenCalled();
        expect(mockExisting.update).toHaveBeenCalled();
        expect(result).toEqual({ success: true, data: mockExisting });
    });

    it("should update document without file upload", async () => {
        const mockExisting = { id: 1, update: jest.fn() };
        GarageDocument.findByPk.mockResolvedValue(mockExisting);

        const result = await updateDocument(1, { type: "License" }, {});

        expect(uploadFile).not.toHaveBeenCalled();
        expect(mockExisting.update).toHaveBeenCalled();
        expect(result).toEqual({ success: true, data: mockExisting });
    });

    it("should return error on exception", async () => {
        GarageDocument.findByPk.mockRejectedValue(new Error("DB error"));

        const result = await updateDocument(1, {}, {});

        expect(result.success).toBe(false);
    });
});
