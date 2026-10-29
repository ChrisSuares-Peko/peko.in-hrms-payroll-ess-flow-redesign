const { createChequeLeaf } = require("../../cloud_chequeLeaves");
const cloud_chequeLeaves = require("../../../../entities/pekoCloud/cloud_chequeLeaves");
const cloud_chequeBooks = require("../../../../entities/pekoCloud/cloud_chequeBooks");
const { uploadFileEncryptedToS3 } = require("../../../../../utils/s3");
const ErrorResponse = require("../../../../../utils/error-response");
const { findMaximumUsageLimit } = require("../../../subscription");
const { Op } = require("sequelize");

jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    uploadFileEncryptedToS3: jest.fn(),
}));

jest.mock('../../../subscription', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

describe('createChequeLeaf Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create a cheque leaf', async () => {
        const data = {
            chequeBookNumber: '12345',
            chequeNumber: '67890',
            cloudChequeBookId: 1,
            documentBase: 'base64EncodedString',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            subCorporateId: 1,
            subCorporateUsername: 'subuser',
            username: 'user',
            corporateId: 1,
        };
        const mockChequeBook = { id: 1 };
        const fileKey = 's3FileKey';
        const responseData = { id: 1, ...data };

        cloud_chequeLeaves.findOne.mockResolvedValue(null); // Mocking no existing cheque leaf
        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);
        uploadFileEncryptedToS3.mockResolvedValue(fileKey);
        cloud_chequeLeaves.create.mockResolvedValue(responseData);
        findMaximumUsageLimit.mockResolvedValue({ maxUsageLimit: 1000 });

        const result = await createChequeLeaf(data, user);

        expect(cloud_chequeLeaves.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        chequeBookNumber: data.chequeBookNumber,
                        chequeNumber: data.chequeNumber,
                    },
                ],
            },
        });
        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({
            where: { id: data.cloudChequeBookId },
        });
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            data.documentBase,
            expect.stringContaining('test/corporate/user/peko-cloud/sub-user/subuser'),
            data.documentFormat,
            expect.any(Object),
        );
        expect(cloud_chequeLeaves.create).toHaveBeenCalledWith({
            ...data,
            document: fileKey,
            subCorporateUserId: user.subCorporateId,
        });
        expect(result).toEqual({ success: true, data: responseData });
    });

    it('should return error if cheque leaf already exists', async () => {
        const data = {
            chequeBookNumber: '12345',
            chequeNumber: '67890',
        };

        cloud_chequeLeaves.findOne.mockResolvedValue({ id: 1 });

        const result = await createChequeLeaf(data, {});

        expect(cloud_chequeLeaves.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        chequeBookNumber: data.chequeBookNumber,
                        chequeNumber: data.chequeNumber,
                    },
                ],
            },
        });
        expect(result).toEqual({
            success: false,
            error: "Cheque Leaf with this Book and Cheque Number already exists.",
        });
    });

    it('should return error if cheque book does not exist', async () => {
        const data = {
            chequeBookNumber: '12345',
            chequeNumber: '67890',
            cloudChequeBookId: 1,
        };

        cloud_chequeLeaves.findOne.mockResolvedValue(null);
        cloud_chequeBooks.findOne.mockResolvedValue(null);

        const result = await createChequeLeaf(data, {});

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({
            where: { id: data.cloudChequeBookId },
        });
        expect(result).toEqual({
            success: false,
            error: "cheque book is not existing with the given details",
        });
    });

    it('should handle document upload failure', async () => {
        const data = {
            chequeBookNumber: '12345',
            chequeNumber: '67890',
            cloudChequeBookId: 1,
            documentBase: 'base64EncodedString',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            subCorporateId: 1,
            subCorporateUsername: 'subuser',
            username: 'user',
            corporateId: 1,
        };
        const mockChequeBook = { id: 1 };

        cloud_chequeLeaves.findOne.mockResolvedValue(null); // Mocking no existing cheque leaf
        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);
        uploadFileEncryptedToS3.mockRejectedValue(new Error('Upload error'));

        const result = await createChequeLeaf(data, user);

        expect(cloud_chequeLeaves.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        chequeBookNumber: data.chequeBookNumber,
                        chequeNumber: data.chequeNumber,
                    },
                ],
            },
        });
        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({
            where: { id: data.cloudChequeBookId },
        });
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            data.documentBase,
            expect.stringContaining('test/corporate/user/peko-cloud/sub-user/subuser'),
            data.documentFormat,
            expect.any(Object),
        );
        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle failed cheque leaf creation', async () => {
        const data = {
            chequeBookNumber: '12345',
            chequeNumber: '67890',
            cloudChequeBookId: 1,
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            subCorporateId: 1,
            subCorporateUsername: 'subuser',
            username: 'user',
            corporateId: 1,
        };
        const mockChequeBook = { id: 1 };

        cloud_chequeLeaves.findOne.mockResolvedValue(null); // Mocking no existing cheque leaf
        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);
        cloud_chequeLeaves.create.mockResolvedValue(null); // Mocking failed creation

        const result = await createChequeLeaf(data, user);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({
            where: { id: data.cloudChequeBookId },
        });
        expect(cloud_chequeLeaves.create).toHaveBeenCalledWith({
            ...data,
            subCorporateUserId: user.subCorporateId,
        });
        expect(result).toEqual({ success: false, error: "Failed to create cheque leaf." });
    });

    it('should handle unexpected errors', async () => {
        const data = {
            chequeBookNumber: '12345',
            chequeNumber: '67890',
            cloudChequeBookId: 1,
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            subCorporateId: 1,
            subCorporateUsername: 'subuser',
            username: 'user',
            corporateId: 1,
        };

        cloud_chequeLeaves.findOne.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await createChequeLeaf(data, user);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
