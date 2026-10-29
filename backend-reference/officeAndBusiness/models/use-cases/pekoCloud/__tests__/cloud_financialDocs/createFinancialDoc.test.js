const { createFinancialDoc } = require("../../cloud_financialDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const ErrorResponse = require("../../../../../utils/error-response");
const { uploadFileEncryptedToS3 } = require("../../../../../utils/s3");
const { findMaximumUsageLimit } = require("../../../subscription");
const { Op } = require("sequelize");

jest.mock('../../../../entities/pekoCloud/cloud_documents', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    uploadFileEncryptedToS3: jest.fn(),
}));

jest.mock('../../../subscription', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

describe('createFinancialDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create a new document for CORPORATE_SUB_USER role', async () => {
        const data = {
            documentName: 'Financial Report',
            credentialId: 1,
            documentBase: 'fileBase64Data',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            subCorporateId: 1,
            username: 'johnDoe',
            subCorporateUsername: 'subUser'
        };

        cloud_documents.findOne.mockResolvedValue(null); // Document does not exist
        findMaximumUsageLimit.mockResolvedValue(1000); // Mock usage limit
        uploadFileEncryptedToS3.mockResolvedValue('s3-file-key'); // Mock successful upload
        cloud_documents.create.mockResolvedValue(data); // Mock successful document creation

        const result = await createFinancialDoc(data, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        documentName: data.documentName,
                        documentCategory: 'FINANCE',
                        credentialId: data.credentialId,
                    },
                ],
            },
        });
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            data.documentBase,
            `test/corporate/johnDoe/peko-cloud/sub-user/subUser`,
            data.documentFormat,
            1000
        );
        expect(cloud_documents.create).toHaveBeenCalledWith(expect.objectContaining(data));

        expect(result).toEqual({ success: true, data });
    });

    it('should return an error if the document already exists', async () => {
        const data = {
            documentName: 'Financial Report',
            credentialId: 1,
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
        };

        cloud_documents.findOne.mockResolvedValue({}); // Document already exists

        const result = await createFinancialDoc(data, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        documentName: data.documentName,
                        documentCategory: 'FINANCE',
                        credentialId: data.credentialId,
                    },
                ],
            },
        });

        expect(result).toEqual({
            success: false,
            error: "Document with this name already exists.",
        });
    });

    it('should successfully create a new document for non-CORPORATE_SUB_USER role', async () => {
        const data = {
            documentName: 'Financial Report',
            credentialId: 1,
            documentBase: 'fileBase64Data',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'ADMIN',
            username: 'adminUser'
        };

        cloud_documents.findOne.mockResolvedValue(null); // Document does not exist
        findMaximumUsageLimit.mockResolvedValue(1000); // Mock usage limit
        uploadFileEncryptedToS3.mockResolvedValue('s3-file-key'); // Mock successful upload
        cloud_documents.create.mockResolvedValue(data); // Mock successful document creation

        const result = await createFinancialDoc(data, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        documentName: data.documentName,
                        documentCategory: 'FINANCE',
                        credentialId: data.credentialId,
                    },
                ],
            },
        });
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            data.documentBase,
            `test/admin/adminUser/peko-cloud`,
            data.documentFormat,
            1000
        );
        expect(cloud_documents.create).toHaveBeenCalledWith(expect.objectContaining(data));

        expect(result).toEqual({ success: true, data });
    });

    it('should return an error if document creation fails', async () => {
        const data = {
            documentName: 'Financial Report',
            credentialId: 1,
            documentBase: 'fileBase64Data',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            subCorporateId: 1,
            username: 'johnDoe',
            subCorporateUsername: 'subUser'
        };

        cloud_documents.findOne.mockResolvedValue(null); // Document does not exist
        findMaximumUsageLimit.mockResolvedValue(1000); // Mock usage limit
        uploadFileEncryptedToS3.mockResolvedValue('s3-file-key'); // Mock successful upload
        cloud_documents.create.mockResolvedValue(null); // Document creation fails

        const result = await createFinancialDoc(data, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        documentName: data.documentName,
                        documentCategory: 'FINANCE',
                        credentialId: data.credentialId,
                    },
                ],
            },
        });
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            data.documentBase,
            `test/corporate/johnDoe/peko-cloud/sub-user/subUser`,
            data.documentFormat,
            1000
        );
        expect(cloud_documents.create).toHaveBeenCalledWith(expect.objectContaining(data));

        expect(result).toEqual({ success: false, error: "Failed to create document." });
    });

    it('should handle S3 upload errors', async () => {
        const data = {
            documentName: 'Financial Report',
            credentialId: 1,
            documentBase: 'fileBase64Data',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            subCorporateId: 1,
            username: 'johnDoe',
            subCorporateUsername: 'subUser'
        };

        cloud_documents.findOne.mockResolvedValue(null); // Document does not exist
        findMaximumUsageLimit.mockResolvedValue(1000); // Mock usage limit
        uploadFileEncryptedToS3.mockRejectedValue(new Error('S3 upload error')); // S3 upload fails

        const result = await createFinancialDoc(data, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        documentName: data.documentName,
                        documentCategory: 'FINANCE',
                        credentialId: data.credentialId,
                    },
                ],
            },
        });
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            data.documentBase,
            `test/corporate/johnDoe/peko-cloud/sub-user/subUser`,
            data.documentFormat,
            1000
        );
        expect(cloud_documents.create).not.toHaveBeenCalled();

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle unexpected errors', async () => {
        const data = {
            documentName: 'Financial Report',
            credentialId: 1,
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
        };

        cloud_documents.findOne.mockRejectedValue(new Error('Database error')); // Unexpected error during findOne

        const result = await createFinancialDoc(data, user);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
