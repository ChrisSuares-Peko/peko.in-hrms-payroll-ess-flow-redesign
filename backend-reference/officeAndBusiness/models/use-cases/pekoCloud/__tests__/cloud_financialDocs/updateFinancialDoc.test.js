const { updateFinancialDoc } = require("../../cloud_financialDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const { deleteEncryptedFromS3, uploadFileEncryptedToS3 } = require("../../../../../utils/s3");
const ErrorResponse = require("../../../../../utils/error-response");
const { findMaximumUsageLimit } = require("../../../subscription");

jest.mock('../../../../entities/pekoCloud/cloud_documents', () => ({
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

describe('updateFinancialDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update document successfully when document exists and file is uploaded', async () => {
        const id = 1;
        const newData = { documentBase: 'base64data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };
        const existingDocument = { id: 1, documentCategory: 'FINANCE', document: 'oldFileKey' };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        findMaximumUsageLimit.mockResolvedValue(1000); // Mock usage limit
        uploadFileEncryptedToS3.mockResolvedValue('newFileKey');
        cloud_documents.update.mockResolvedValue([1]);

        const result = await updateFinancialDoc(id, newData, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'FINANCE' },
        });

        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('oldFileKey');
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            newData.documentBase,
            'test/corporate/user1/peko-cloud/sub-user/subUser1',
            newData.documentFormat,
            1000
        );
        expect(cloud_documents.update).toHaveBeenCalledWith(newData, {
            where: { id: id, documentCategory: 'FINANCE' },
        });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should handle file upload failure', async () => {
        const id = 1;
        const newData = { documentBase: 'base64data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };
        const existingDocument = { id: 1, documentCategory: 'FINANCE', document: 'oldFileKey' };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        uploadFileEncryptedToS3.mockRejectedValue(new Error('Upload error'));

        const result = await updateFinancialDoc(id, newData, user);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should return error if document does not exist', async () => {
        const id = 1;
        const newData = { documentBase: 'base64data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };

        cloud_documents.findOne.mockResolvedValue(null);

        const result = await updateFinancialDoc(id, newData, user);

        expect(result).toEqual({
            success: false,
            error: "document is not existing with the given details",
        });
    });

    it('should return error if update operation fails', async () => {
        const id = 1;
        const newData = { documentBase: 'base64data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };
        const existingDocument = { id: 1, documentCategory: 'FINANCE', document: 'oldFileKey' };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        uploadFileEncryptedToS3.mockResolvedValue('newFileKey');
        cloud_documents.update.mockResolvedValue([0]);

        const result = await updateFinancialDoc(id, newData, user);

        expect(result).toEqual({
            success: false,
            error: "something went wrong while updating the document",
        });
    });

    it('should handle database errors', async () => {
        const id = 1;
        const newData = { documentBase: 'base64data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };

        cloud_documents.findOne.mockRejectedValue(new Error('Database error'));

        const result = await updateFinancialDoc(id, newData, user);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
