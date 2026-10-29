const { updateChequeLeaf } = require("../../cloud_chequeLeaves");
const cloud_chequeLeaves = require("../../../../entities/pekoCloud/cloud_chequeLeaves");
const cloud_chequeBooks = require("../../../../entities/pekoCloud/cloud_chequeBooks");
const ErrorResponse = require("../../../../../utils/error-response");
const { findMaximumUsageLimit } = require("../../../subscription");
const { uploadFileEncryptedToS3, deleteEncryptedFromS3 } = require("../../../../../utils/s3");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    deleteEncryptedFromS3: jest.fn(),
    uploadFileEncryptedToS3: jest.fn(),
}));

jest.mock('../../../subscription', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

describe('updateChequeLeaf Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update a cheque leaf with a valid cheque leaf and cheque book', async () => {
        const id = 1;
        const newData = { cloudChequeBookId: 2, documentBase: 'base64string', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'testUser', subCorporateUsername: 'subUser', corporateId: 1 };

        const existingChequeLeaf = { id, document: 'oldFileKey' };
        const existingChequeBook = { id: 2 };

        cloud_chequeLeaves.findOne.mockResolvedValue(existingChequeLeaf);
        cloud_chequeBooks.findOne.mockResolvedValue(existingChequeBook);
        findMaximumUsageLimit.mockResolvedValue(1000);
        uploadFileEncryptedToS3.mockResolvedValue('newFileKey');
        cloud_chequeLeaves.update.mockResolvedValue([1]);

        const result = await updateChequeLeaf(id, newData, user);

        expect(cloud_chequeLeaves.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id: newData.cloudChequeBookId } });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith(existingChequeLeaf.document);
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(newData.documentBase, expect.any(String), newData.documentFormat, 1000);
        expect(cloud_chequeLeaves.update).toHaveBeenCalledWith(newData, { where: { id } });
        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return an error if the cheque leaf does not exist', async () => {
        const id = 1;
        const newData = {};
        const user = {};

        cloud_chequeLeaves.findOne.mockResolvedValue(null);

        const result = await updateChequeLeaf(id, newData, user);

        expect(cloud_chequeLeaves.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(result).toEqual({
            success: false,
            error: "cheque leaf is not existing with the given details",
        });
    });

    it('should return an error if the cheque book does not exist', async () => {
        const id = 1;
        const newData = { cloudChequeBookId: 2 };
        const user = {};

        const existingChequeLeaf = { id };

        cloud_chequeLeaves.findOne.mockResolvedValue(existingChequeLeaf);
        cloud_chequeBooks.findOne.mockResolvedValue(null);

        const result = await updateChequeLeaf(id, newData, user);

        expect(cloud_chequeLeaves.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id: newData.cloudChequeBookId } });
        expect(result).toEqual({
            success: false,
            error: "cheque book is not existing with the given details",
        });
    });

    it('should handle unexpected errors during update', async () => {
        const id = 1;
        const newData = {};
        const user = {};

        cloud_chequeLeaves.findOne.mockResolvedValue({ id });
        cloud_chequeLeaves.update.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await updateChequeLeaf(id, newData, user);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
