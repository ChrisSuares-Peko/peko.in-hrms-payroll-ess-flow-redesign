const { garage_document: GarageDocument } = require("../../../../entities/garage");
const { uploadFile } = require("../../../../../utils/commonUploadFile");
const { createDocument } = require("../../garage_document");

jest.mock("../../../../entities/garage", () => ({
    garage_fleet: { belongsTo: jest.fn() },
    garage_driver: { belongsTo: jest.fn() },
    garage_assignment: { belongsTo: jest.fn() },
    garage_document: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), associate: jest.fn(), belongsTo: jest.fn() },
}));
jest.mock("../../../../../utils/commonUploadFile", () => ({ uploadFile: jest.fn() }));

describe("createDocument", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return error if document already exists", async () => {
        GarageDocument.findOne.mockResolvedValue({ id: 1 });

        const result = await createDocument({ type: "Insurance", expiryDate: "2025-12-31", credentialId: 100 }, {});

        expect(result).toEqual({ success: false, error: "Document with this name already exists." });
    });

    it("should create document with file upload", async () => {
        GarageDocument.findOne.mockResolvedValue(null);
        uploadFile.mockResolvedValue("https://cdn.example.com/file.pdf");
        const mockDoc = { id: 1, type: "Insurance" };
        GarageDocument.create.mockResolvedValue(mockDoc);

        const result = await createDocument(
            { type: "Insurance", expiryDate: "2025-12-31", credentialId: 100, documentBase: "base64data", documentFormat: "pdf" },
            { role: "CORPORATE", username: "user1" }
        );

        expect(uploadFile).toHaveBeenCalled();
        expect(GarageDocument.create).toHaveBeenCalled();
        expect(result).toEqual({ success: true, data: mockDoc });
    });

    it("should create document without file upload", async () => {
        GarageDocument.findOne.mockResolvedValue(null);
        const mockDoc = { id: 1, type: "License" };
        GarageDocument.create.mockResolvedValue(mockDoc);

        const result = await createDocument(
            { type: "License", expiryDate: "2025-12-31", credentialId: 100 },
            { role: "CORPORATE", username: "user1" }
        );

        expect(uploadFile).not.toHaveBeenCalled();
        expect(result).toEqual({ success: true, data: mockDoc });
    });

    it("should return error on exception", async () => {
        GarageDocument.findOne.mockRejectedValue(new Error("DB error"));

        const result = await createDocument({ type: "Insurance" }, {});

        expect(result.success).toBe(false);
    });
});
