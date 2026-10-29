const { deleteFinancialDoc } = require("../../cloud_financialDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const { deleteEncryptedFromS3 } = require("../../../../../utils/s3");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_documents', () => ({
    findOne: jest.fn(),
    destroy: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    deleteEncryptedFromS3: jest.fn(),
}));

describe('deleteFinancialDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully delete a document if it exists and has an associated file', async () => {
        const id = 1;
        const existingDocument = { id: 1, documentCategory: 'FINANCE', document: 'fileKey' };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        deleteEncryptedFromS3.mockResolvedValue(); // Assuming the function does not return anything
        cloud_documents.destroy.mockResolvedValue(1); // Simulate successful deletion

        const result = await deleteFinancialDoc(id);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'FINANCE' },
        });

        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('fileKey');
        expect(cloud_documents.destroy).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'FINANCE' },
        });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should handle cases where the document does not exist', async () => {
        const id = 1;

        cloud_documents.findOne.mockResolvedValue(null);

        const result = await deleteFinancialDoc(id);

        expect(result).toEqual({
            success: false,
            error: "document is not existing with the given details",
        });
    });

    it('should handle cases where there is an error deleting the file from S3', async () => {
        const id = 1;
        const existingDocument = { id: 1, documentCategory: 'FINANCE', document: 'fileKey' };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        deleteEncryptedFromS3.mockRejectedValue(new Error('S3 deletion error'));

        const result = await deleteFinancialDoc(id);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle cases where the deletion operation fails', async () => {
        const id = 1;
        const existingDocument = { id: 1, documentCategory: 'FINANCE', document: 'fileKey' };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        deleteEncryptedFromS3.mockResolvedValue();
        cloud_documents.destroy.mockResolvedValue(0); // Simulate no rows deleted

        const result = await deleteFinancialDoc(id);

        expect(result).toEqual({
            success: false,
            error: "something went wrong while deleting the document",
        });
    });

    it('should handle database errors', async () => {
        const id = 1;

        cloud_documents.findOne.mockRejectedValue(new Error('Database error'));

        const result = await deleteFinancialDoc(id);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
