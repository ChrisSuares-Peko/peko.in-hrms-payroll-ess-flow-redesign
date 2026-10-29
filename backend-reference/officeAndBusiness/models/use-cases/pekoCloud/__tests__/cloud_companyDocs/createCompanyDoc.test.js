const { createCompanyDoc } = require("../../cloud_companyDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const { findMaximumUsageLimit } = require("../../../subscription");
const { uploadFileEncryptedToS3 } = require("../../../../../utils/s3");
const { Op } = require("sequelize");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
}));

jest.mock('../../../subscription', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    uploadFileEncryptedToS3: jest.fn(),
}));

describe('createCompanyDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create a document when it does not already exist', async () => {
        const data = {
            documentName: 'DocName',
            credentialId: 1,
            documentBase: 'base64string',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            subCorporateId: 2,
            username: 'testUser',
            subCorporateUsername: 'subUser',
            corporateId: 3
        };

        cloud_documents.findOne.mockResolvedValue(null);
        findMaximumUsageLimit.mockResolvedValue(1000);
        uploadFileEncryptedToS3.mockResolvedValue('fileKey');
        cloud_documents.create.mockResolvedValue({
            id: 1,
            document: 'fileKey',
            subCorporateUserId: user.subCorporateId,
            documentCategory: "COMPANY",
            ...data
        });

        const result = await createCompanyDoc(data, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        documentName: data.documentName,
                        documentCategory: "COMPANY",
                        credentialId: data.credentialId,
                    },
                ],
            },
        });
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(data.documentBase, expect.any(String), data.documentFormat, 1000);
        expect(cloud_documents.create).toHaveBeenCalledWith({
            ...data,
            document: 'fileKey',
            subCorporateUserId: user.subCorporateId,
            documentCategory: "COMPANY",
        });
        expect(result).toEqual({
            success: true,
            data: {
                id: 1,
                document: 'fileKey',
                subCorporateUserId: user.subCorporateId,
                documentCategory: "COMPANY",
                ...data
            },
        });
    });

    it('should return an error if the document already exists', async () => {
        const data = {
            documentName: 'DocName',
            credentialId: 1,
        };
        const user = {};

        cloud_documents.findOne.mockResolvedValue({ id: 1 });

        const result = await createCompanyDoc(data, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        documentName: data.documentName,
                        documentCategory: "COMPANY",
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

    it('should handle the case where document creation fails', async () => {
        const data = {
            documentName: 'DocName',
            credentialId: 1,
        };
        const user = {};

        cloud_documents.findOne.mockResolvedValue(null);
        cloud_documents.create.mockResolvedValue(null);

        const result = await createCompanyDoc(data, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        documentName: data.documentName,
                        documentCategory: "COMPANY",
                        credentialId: data.credentialId,
                    },
                ],
            },
        });
        expect(cloud_documents.create).toHaveBeenCalledWith({
            ...data,
            documentCategory: "COMPANY",
        });
        expect(result).toEqual({
            success: false,
            error: "Failed to create document.",
        });
    });

    it('should handle unexpected errors', async () => {
        const data = {
            documentName: 'DocName',
            credentialId: 1,
        };
        const user = {};

        cloud_documents.findOne.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await createCompanyDoc(data, user);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
