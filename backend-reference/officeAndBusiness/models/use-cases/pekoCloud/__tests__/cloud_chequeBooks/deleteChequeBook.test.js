const { deleteChequeBook } = require("../../cloud_chequeBooks");
const cloud_chequeBooks = require("../../../../entities/pekoCloud/cloud_chequeBooks");
const { deleteEncryptedFromS3 } = require("../../../../../utils/s3");
const sequelize = require("../../../../../configs/database/index");
const cloud_chequeLeaves = require("../../../../entities/pekoCloud/cloud_chequeLeaves");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
    destroy: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    deleteEncryptedFromS3: jest.fn(),
}));

jest.mock('../../../subscription', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

jest.mock('../../../../../configs/database/index', () => ({
    define: jest.fn(),
    transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
    }),
}));

describe('deleteChequeBook Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully delete a cheque book and its associated leaves', async () => {
        const id = 1;
        const mockChequeBook = { document: 'fileKey' };

        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);
        deleteEncryptedFromS3.mockResolvedValue();
        cloud_chequeLeaves.destroy.mockResolvedValue(1);
        cloud_chequeBooks.destroy.mockResolvedValue(1);

        const result = await deleteChequeBook(id);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('fileKey');
        expect(cloud_chequeLeaves.destroy).toHaveBeenCalledWith({
            where: { cloudChequeBookId: id },
            transaction: expect.any(Object),
        });
        expect(cloud_chequeBooks.destroy).toHaveBeenCalledWith({
            where: { id: id },
            transaction: expect.any(Object),
        });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return error if cheque book does not exist', async () => {
        const id = 1;

        cloud_chequeBooks.findOne.mockResolvedValue(null);

        const result = await deleteChequeBook(id);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(result).toEqual({ success: false, error: "cheque book is not existing with the given details" });
    });

    it('should handle error while deleting the document from S3', async () => {
        const id = 1;
        const mockChequeBook = { document: 'fileKey' };

        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);
        deleteEncryptedFromS3.mockRejectedValue(new Error('S3 deletion error'));
        cloud_chequeBooks.destroy.mockResolvedValue(1);

        const result = await deleteChequeBook(id);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('fileKey');

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle errors while deleting the cheque book and its associated leaves', async () => {
        const id = 1;
        const mockChequeBook = { document: 'fileKey' };

        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);
        deleteEncryptedFromS3.mockResolvedValue();
        cloud_chequeLeaves.destroy.mockRejectedValue(new Error('Deletion error'));
        cloud_chequeBooks.destroy.mockRejectedValue(1);

        const result = await deleteChequeBook(id);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('fileKey');
        expect(cloud_chequeLeaves.destroy).toHaveBeenCalledWith({
            where: { cloudChequeBookId: id },
            transaction: expect.any(Object),
        });
        expect(cloud_chequeBooks.destroy).not.toHaveBeenCalled();

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle case where no rows are deleted', async () => {
        const id = 1;
        const mockChequeBook = { document: 'fileKey' };

        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);
        deleteEncryptedFromS3.mockResolvedValue();
        cloud_chequeLeaves.destroy.mockResolvedValue(1);
        cloud_chequeBooks.destroy.mockResolvedValue(0);

        const result = await deleteChequeBook(id);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('fileKey');
        expect(cloud_chequeLeaves.destroy).toHaveBeenCalledWith({
            where: { cloudChequeBookId: id },
            transaction: expect.any(Object),
        });
        expect(cloud_chequeBooks.destroy).toHaveBeenCalledWith({
            where: { id: id },
            transaction: expect.any(Object),
        });

        expect(result).toEqual({ success: false, error: "cheque book is not able to delete try again" });
    });

    it('should handle transaction rollback on error', async () => {
        const id = 1;
        const mockChequeBook = { document: 'fileKey' };

        // Mock transaction
        const mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn(),
        };

        // Mock implementations
        sequelize.transaction.mockResolvedValue(mockTransaction);

        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);
        deleteEncryptedFromS3.mockResolvedValue();
        cloud_chequeBooks.destroy.mockRejectedValue(new Error('Transaction error'));

        const result = await deleteChequeBook(id);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('fileKey');
        expect(cloud_chequeBooks.destroy).toHaveBeenCalledWith({
            where: { id: id },
            transaction: expect.any(Object),
        });

        expect(sequelize.transaction).toHaveBeenCalled();

        // Check that rollback was called
        expect(mockTransaction.rollback).toHaveBeenCalled();

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
