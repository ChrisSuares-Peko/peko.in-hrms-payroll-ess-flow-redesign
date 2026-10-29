const { deleteCompanyDoc } = require("../../cloud_companyDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const { deleteEncryptedFromS3 } = require("../../../../../utils/s3");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    deleteEncryptedFromS3: jest.fn(),
}));

describe('deleteCompanyDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully delete a document with existing document and file', async () => {
        const id = 1;
        const existingDocument = {
            id: id,
            documentCategory: 'COMPANY',
            document: 'existing-file-key',
        };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        deleteEncryptedFromS3.mockResolvedValue(true);
        cloud_documents.destroy.mockResolvedValue(1);

        const result = await deleteCompanyDoc(id);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith(existingDocument.document);
        expect(cloud_documents.destroy).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(result).toEqual({ success: true, data: {} });
    });

    it('should successfully delete a document with no associated file', async () => {
        const id = 2;
        const existingDocument = {
            id: id,
            documentCategory: 'COMPANY',
            document: null,
        };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_documents.destroy.mockResolvedValue(1);

        const result = await deleteCompanyDoc(id);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(deleteEncryptedFromS3).not.toHaveBeenCalled();
        expect(cloud_documents.destroy).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return an error if the document does not exist', async () => {
        const id = 3;

        cloud_documents.findOne.mockResolvedValue(null);

        const result = await deleteCompanyDoc(id);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(result).toEqual({
            success: false,
            error: 'document is not existing with the given details',
        });
    });

    it('should handle errors during file deletion from S3', async () => {
        const id = 4;
        const existingDocument = {
            id: id,
            documentCategory: 'COMPANY',
            document: 'existing-file-key',
        };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        deleteEncryptedFromS3.mockImplementation(() => {
            throw new Error('S3 delete error');
        });

        const result = await deleteCompanyDoc(id);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith(existingDocument.document);
        expect(cloud_documents.destroy).not.toHaveBeenCalled();
        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle errors during document deletion in the database', async () => {
        const id = 5;
        const existingDocument = {
            id: id,
            documentCategory: 'COMPANY',
            document: 'existing-file-key',
        };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        deleteEncryptedFromS3.mockResolvedValue(true);
        cloud_documents.destroy.mockResolvedValue(0);

        const result = await deleteCompanyDoc(id);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith(existingDocument.document);
        expect(cloud_documents.destroy).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(result).toEqual({
            success: false,
            error: 'document is not existing with the given details',
        });
    });

    it('should handle unexpected errors', async () => {
        const id = 6;

        cloud_documents.findOne.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await deleteCompanyDoc(id);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
