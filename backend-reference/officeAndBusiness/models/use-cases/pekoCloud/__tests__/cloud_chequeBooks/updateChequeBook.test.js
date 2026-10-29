const { updateChequeBook } = require("../../cloud_chequeBooks");
const cloud_chequeBooks = require("../../../../entities/pekoCloud/cloud_chequeBooks");
const ErrorResponse = require("../../../../../utils/error-response");
const { deleteEncryptedFromS3, uploadFileEncryptedToS3 } = require("../../../../../utils/s3");
const { findMaximumUsageLimit } = require("../../../subscription");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
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

describe('updateChequeBook Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update cheque book with document upload', async () => {
        const id = 1;
        const newData = { documentBase: 'base64data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', subCorporateId: 1, username: 'user', subCorporateUsername: 'subUser', corporateId: 1 };
        const mockChequeBook = { document: 'oldFileKey' };
        const mockFileKey = 'newFileKey';

        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);
        deleteEncryptedFromS3.mockResolvedValue();
        findMaximumUsageLimit.mockResolvedValue(100);
        uploadFileEncryptedToS3.mockResolvedValue(mockFileKey);
        cloud_chequeBooks.update.mockResolvedValue([1]);

        const result = await updateChequeBook(id, newData, user);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('oldFileKey');
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(newData.documentBase, expect.any(String), newData.documentFormat, 100);
        expect(cloud_chequeBooks.update).toHaveBeenCalledWith(newData, { where: { id } });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should successfully update cheque book without document upload', async () => {
        const id = 1;
        const newData = { accountName: 'Updated Account Name' };
        const user = { role: 'CORPORATE_SUB_USER', subCorporateId: 1, username: 'user', subCorporateUsername: 'subUser', corporateId: 1 };
        const mockChequeBook = { document: 'oldFileKey' };

        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);
        cloud_chequeBooks.update.mockResolvedValue([1]);

        const result = await updateChequeBook(id, newData, user);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(cloud_chequeBooks.update).toHaveBeenCalledWith(newData, { where: { id } });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return error if cheque book does not exist', async () => {
        const id = 1;
        const newData = { accountName: 'Updated Account Name' };
        const user = { role: 'CORPORATE_SUB_USER', subCorporateId: 1 };

        cloud_chequeBooks.findOne.mockResolvedValue(null);

        const result = await updateChequeBook(id, newData, user);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(result).toEqual({ success: false, error: "cheque book is not existing with the given details" });
    });

    it('should handle error while uploading document to S3', async () => {
        const id = 1;
        const newData = { documentBase: 'base64data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', subCorporateId: 1, username: 'user', subCorporateUsername: 'subUser' };
        const mockChequeBook = { document: 'oldFileKey' };

        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);
        deleteEncryptedFromS3.mockResolvedValue();
        findMaximumUsageLimit.mockResolvedValue(100);
        uploadFileEncryptedToS3.mockRejectedValue(new Error('Upload error'));

        const result = await updateChequeBook(id, newData, user);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('oldFileKey');
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(newData.documentBase, expect.any(String), newData.documentFormat, 100);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle error while updating the cheque book', async () => {
        const id = 1;
        const newData = { accountName: 'Updated Account Name' };
        const user = { role: 'CORPORATE_SUB_USER', subCorporateId: 1 };

        cloud_chequeBooks.findOne.mockResolvedValue({ document: 'oldFileKey' });
        cloud_chequeBooks.update.mockRejectedValue(new Error('Update error'));

        const result = await updateChequeBook(id, newData, user);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(cloud_chequeBooks.update).toHaveBeenCalledWith(newData, { where: { id } });

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle case where update affects no rows', async () => {
        const id = 1;
        const newData = { accountName: 'Updated Account Name' };
        const user = { role: 'CORPORATE_SUB_USER', subCorporateId: 1 };

        cloud_chequeBooks.findOne.mockResolvedValue({ document: 'oldFileKey' });
        cloud_chequeBooks.update.mockResolvedValue([0]);

        const result = await updateChequeBook(id, newData, user);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(cloud_chequeBooks.update).toHaveBeenCalledWith(newData, { where: { id } });

        expect(result).toEqual({ success: false, error: "something went wrong while updating the cheque book" });
    });
});
