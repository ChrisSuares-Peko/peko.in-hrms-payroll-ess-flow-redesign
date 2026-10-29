const { updateCompanyDoc } = require("../../cloud_companyDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const { deleteEncryptedFromS3, uploadFileEncryptedToS3 } = require("../../../../../utils/s3");
const ErrorResponse = require("../../../../../utils/error-response");
const { findMaximumUsageLimit } = require("../../../subscription");

jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    deleteEncryptedFromS3: jest.fn(),
    uploadFileEncryptedToS3: jest.fn(),
}));

jest.mock('../../../subscription', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

describe('updateCompanyDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update a document with a file upload', async () => {
        const id = 1;
        const newData = {
            documentBase: 'base64filedata',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            subCorporateId: 2,
            username: 'user1',
            subCorporateUsername: 'subuser1',
            corporateId: 3,
        };
        const existingDocument = {
            id: id,
            documentCategory: 'COMPANY',
            document: 'existing-file-key',
        };
        const newFileKey = 'new-file-key';

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        findMaximumUsageLimit.mockResolvedValue(1000);
        deleteEncryptedFromS3.mockResolvedValue(true);
        uploadFileEncryptedToS3.mockResolvedValue(newFileKey);
        cloud_documents.update.mockResolvedValue([1]);

        const result = await updateCompanyDoc(id, newData, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith(existingDocument.document);
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            newData.documentBase,
            'test/corporate/user1/peko-cloud/sub-user/subuser1',
            newData.documentFormat,
            1000 // findMaximumUsageLimit returns a number
        );
        expect(cloud_documents.update).toHaveBeenCalledWith(newData, {
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(result).toEqual({ success: true, data: {} });
    });

    it('should successfully update a document without a file upload', async () => {
        const id = 1;
        const newData = { documentName: 'Updated Document' };
        const user = { role: 'USER', username: 'user2' };
        const existingDocument = {
            id: id,
            documentCategory: 'COMPANY',
            document: 'existing-file-key',
        };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_documents.update.mockResolvedValue([1]);

        const result = await updateCompanyDoc(id, newData, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(deleteEncryptedFromS3).not.toHaveBeenCalled();
        expect(uploadFileEncryptedToS3).not.toHaveBeenCalled();
        expect(cloud_documents.update).toHaveBeenCalledWith(newData, {
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return an error if the document does not exist', async () => {
        const id = 1;
        const newData = { documentName: 'Updated Document' };
        const user = { role: 'USER', username: 'user2' };

        cloud_documents.findOne.mockResolvedValue(null);

        const result = await updateCompanyDoc(id, newData, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(result).toEqual({
            success: false,
            error: 'document is not existing with the given details',
        });
    });

    it('should return an error if the update operation fails', async () => {
        const id = 1;
        const newData = { documentName: 'Updated Document' };
        const user = { role: 'USER', username: 'user2' };
        const existingDocument = {
            id: id,
            documentCategory: 'COMPANY',
        };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_documents.update.mockResolvedValue([0]);

        const result = await updateCompanyDoc(id, newData, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(cloud_documents.update).toHaveBeenCalledWith(newData, {
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(result).toEqual({
            success: false,
            error: 'something went wrong while updating the document',
        });
    });

    it('should handle errors during file upload', async () => {
        const id = 1;
        const newData = {
            documentBase: 'base64filedata',
            documentFormat: 'pdf',
        };
        const user = { role: 'USER', username: 'user2' };
        const existingDocument = {
            id: id,
            documentCategory: 'COMPANY',
            document: 'existing-file-key',
        };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        findMaximumUsageLimit.mockResolvedValue(1000);
        deleteEncryptedFromS3.mockResolvedValue(true);
        uploadFileEncryptedToS3.mockImplementation(() => {
            throw new Error('Upload error');
        });

        const result = await updateCompanyDoc(id, newData, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'COMPANY' },
        });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith(existingDocument.document);
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            newData.documentBase,
            "test/user/user2/peko-cloud",
            newData.documentFormat,
            1000
        );
        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
