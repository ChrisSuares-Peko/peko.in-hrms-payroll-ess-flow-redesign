const { Op } = require("sequelize");
const { uploadFileEncryptedToS3 } = require("../../../../../utils/s3");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const { findMaximumUsageLimit } = require("../../../subscription");
const { createAssetDoc } = require("../../cloud_assetDocs");

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_employees.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_fleets.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_maintenances.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_owners.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_softwares.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_subscriptions.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_usageHistories.js', () => ({
    belongsTo: jest.fn(),
}));

jest.mock('../../../../../utils/s3.js', () => ({
    uploadFileEncryptedToS3: jest.fn(),
}));

jest.mock('../../../../use-cases/subscription.js', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

describe('createAssetDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return error if document already exists', async () => {
        const data = {
            documentName: 'test document',
            cloudAssetId: 1
        };
        const user = {};

        cloud_documents.findOne.mockResolvedValue({
            id: 1,
            documentName: 'test document',
            documentCategory: 'ASSET',
            cloudAssetId: 1
        });

        const result = await createAssetDoc(data, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { documentName: data.documentName, documentCategory: 'ASSET', cloudAssetId: data.cloudAssetId },
                ],
            },
        });

        expect(result).toEqual({ success: false, error: "Document with this name already exists." });
    });

    it('should return error if cloud asset does not exist', async () => {
        const data = {
            documentName: 'new document',
            cloudAssetId: 1
        };
        const user = {};

        cloud_documents.findOne.mockResolvedValue(null);
        cloud_assets.findOne.mockResolvedValue(null);

        const result = await createAssetDoc(data, user);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({
            where: {
                id: data.cloudAssetId
            },
        });

        expect(result).toEqual({ success: false, error: "asset is not existing with the given details" });
    });

    it('should successfully create a document with file upload', async () => {
        const data = {
            documentName: 'new document',
            cloudAssetId: 1,
            documentBase: 'base64string',
            documentFormat: 'pdf'
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            username: 'testuser',
            subCorporateId: 2,
            subCorporateUsername: 'subuser',
            corporateId: 1 // assuming corporateId is required for findMaximumUsageLimit
        };

        cloud_documents.findOne.mockResolvedValue(null);
        cloud_assets.findOne.mockResolvedValue({ id: 1 });
        findMaximumUsageLimit.mockResolvedValue({ limit: 1000 });
        uploadFileEncryptedToS3.mockResolvedValue('s3://path/to/encrypted/file');
        cloud_documents.create.mockResolvedValue({
            id: 1,
            documentName: 'new document',
            documentCategory: 'ASSET',
            cloudAssetId: 1,
            document: 's3://path/to/encrypted/file',
            subCorporateUserId: 2
        });

        const result = await createAssetDoc(data, user);

        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            data.documentBase,
            `test/corporate/testuser/peko-cloud/sub-user/subuser`,
            data.documentFormat,
            { limit: 1000 }
        );

        expect(cloud_documents.create).toHaveBeenCalledWith({
            ...data,
            documentCategory: 'ASSET',
            document: 's3://path/to/encrypted/file',
            subCorporateUserId: 2
        });

        expect(result).toEqual({ success: true, data: {
            id: 1,
            documentName: 'new document',
            documentCategory: 'ASSET',
            cloudAssetId: 1,
            document: 's3://path/to/encrypted/file',
            subCorporateUserId: 2
        }});
    });

    it('should handle document creation failure', async () => {
        const data = {
            documentName: 'new document',
            cloudAssetId: 1
        };
        const user = {};

        cloud_documents.findOne.mockResolvedValue(null);
        cloud_assets.findOne.mockResolvedValue({ id: 1 });
        cloud_documents.create.mockResolvedValue(null);

        const result = await createAssetDoc(data, user);

        expect(result).toEqual({ success: false, error: "Failed to create document." });
    });
});
