const { Op } = require("sequelize");
const { uploadFileEncryptedToS3 } = require("../../../../../utils/s3");
const cloud_chequeBooks = require("../../../../entities/pekoCloud/cloud_chequeBooks");
const { findMaximumUsageLimit } = require("../../../subscription");
const { createChequeBook } = require("../../cloud_chequeBooks");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
}));
jest.mock('../../../../../utils/s3', () => ({
    uploadFileEncryptedToS3: jest.fn(),
}));
jest.mock('../../../subscription', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

describe('createChequeBook Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create a cheque book', async () => {
        const data = {
            bookId: '123',
            accountName: 'Sample Account',
            accountNumber: '456',
            bankName: 'Sample Bank',
            documentBase: 'sample-base64',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            username: 'john_doe',
            subCorporateId: 1,
            subCorporateUsername: 'sub_user',
        };

        const mockExistingChequeBook = null;
        const mockFileKey = 's3://path/to/file';
        const mockResponseData = { id: 1, ...data };

        cloud_chequeBooks.findOne.mockResolvedValue(mockExistingChequeBook);
        uploadFileEncryptedToS3.mockResolvedValue(mockFileKey);
        findMaximumUsageLimit.mockResolvedValue(100); // Simulate the maximum usage limit

        cloud_chequeBooks.create.mockResolvedValue(mockResponseData);

        const result = await createChequeBook(data, user);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        bookId: data.bookId,
                        accountName: data.accountName,
                        accountNumber: data.accountNumber,
                        bankName: data.bankName,
                    },
                ],
            },
        });

        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            data.documentBase,
            `test/corporate/john_doe/peko-cloud/sub-user/sub_user`,
            data.documentFormat,
            100
        );

        expect(cloud_chequeBooks.create).toHaveBeenCalledWith({
            ...data,
            document: mockFileKey,
            subCorporateUserId: user.subCorporateId,
        });

        expect(result).toEqual({ success: true, data: mockResponseData });
    });

    it('should return an error if cheque book already exists', async () => {
        const data = {
            bookId: '123',
            accountName: 'Sample Account',
            accountNumber: '456',
            bankName: 'Sample Bank',
        };
        const user = {};

        const mockExistingChequeBook = { id: 1 };

        cloud_chequeBooks.findOne.mockResolvedValue(mockExistingChequeBook);

        const result = await createChequeBook(data, user);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        bookId: data.bookId,
                        accountName: data.accountName,
                        accountNumber: data.accountNumber,
                        bankName: data.bankName,
                    },
                ],
            },
        });

        expect(result).toEqual({
            success: false,
            error: "Cheque Book with this ID and Account Number already exists.",
        });
    });

    it('should handle file upload failure', async () => {
        const data = {
            bookId: '123',
            accountName: 'Sample Account',
            accountNumber: '456',
            bankName: 'Sample Bank',
            documentBase: 'sample-base64',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            username: 'john_doe',
            subCorporateId: 1,
            subCorporateUsername: 'sub_user',
        };

        const mockExistingChequeBook = null;

        cloud_chequeBooks.findOne.mockResolvedValue(mockExistingChequeBook);
        uploadFileEncryptedToS3.mockRejectedValue(new Error('Upload failed'));

        const result = await createChequeBook(data, user);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        bookId: data.bookId,
                        accountName: data.accountName,
                        accountNumber: data.accountNumber,
                        bankName: data.bankName,
                    },
                ],
            },
        });

        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            data.documentBase,
            `test/corporate/john_doe/peko-cloud/sub-user/sub_user`,
            data.documentFormat,
            expect.any(Number)
        );

        expect(result).toEqual({
            success: false,
            error: "File upload failed.",
        });
    });

    it('should handle database creation error', async () => {
        const data = {
            bookId: '123',
            accountName: 'Sample Account',
            accountNumber: '456',
            bankName: 'Sample Bank',
            documentBase: 'sample-base64',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            username: 'john_doe',
            subCorporateId: 1,
            subCorporateUsername: 'sub_user',
        };

        const mockExistingChequeBook = null;
        const mockFileKey = 's3://path/to/file';

        cloud_chequeBooks.findOne.mockResolvedValue(mockExistingChequeBook);
        uploadFileEncryptedToS3.mockResolvedValue(mockFileKey);
        findMaximumUsageLimit.mockResolvedValue(100); // Simulate the maximum usage limit
        cloud_chequeBooks.create.mockRejectedValue(new Error('Database error'));

        const result = await createChequeBook(data, user);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        bookId: data.bookId,
                        accountName: data.accountName,
                        accountNumber: data.accountNumber,
                        bankName: data.bankName,
                    },
                ],
            },
        });

        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            data.documentBase,
            `test/corporate/john_doe/peko-cloud/sub-user/sub_user`,
            data.documentFormat,
            100
        );

        expect(cloud_chequeBooks.create).toHaveBeenCalledWith({
            ...data,
            document: mockFileKey,
            subCorporateUserId: user.subCorporateId,
        });

        expect(result).toEqual({
            success: false,
            error: "Failed to create cheque book.",
        });
    });
});
