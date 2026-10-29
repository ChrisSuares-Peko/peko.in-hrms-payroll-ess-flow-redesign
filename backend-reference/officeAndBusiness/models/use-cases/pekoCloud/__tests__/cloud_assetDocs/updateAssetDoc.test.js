
const { uploadFileEncryptedToS3, deleteEncryptedFromS3 } = require("../../../../../utils/s3");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const { findMaximumUsageLimit } = require("../../../subscription");
const { updateAssetDoc } = require("../../cloud_assetDocs");

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
    update: jest.fn(),
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
    deleteEncryptedFromS3: jest.fn(),
}));

jest.mock('../../../../use-cases/subscription.js', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

describe('updateAssetDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return error if document does not exist', async () => {
        const id = 1;
        const newData = {};
        const user = {};

        cloud_documents.findOne.mockResolvedValue(null);

        const result = await updateAssetDoc(id, newData, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'ASSET' },
        });

        expect(result).toEqual({ success: false, error: "document is not existing with the given details" });
    });

    it('should return error if cloud asset does not exist', async () => {
        const id = 1;
        const newData = { cloudAssetId: 1 };
        const user = {};

        cloud_documents.findOne.mockResolvedValue({ id: 1 });
        cloud_assets.findOne.mockResolvedValue(null);

        const result = await updateAssetDoc(id, newData, user);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({
            where: { id: newData.cloudAssetId },
        });

        expect(result).toEqual({ success: false, error: "asset is not existing with the given details" });
    });

    it('should successfully update a document with file upload', async () => {
        const id = 1;
        const newData = {
            documentBase: 'base64string',
            documentFormat: 'pdf',
        };
        const user = {
            role: 'CORPORATE_SUB_USER',
            username: 'testuser',
            subCorporateId: 2,
            subCorporateUsername: 'subuser',
            corporateId: 1
        };

        cloud_documents.findOne.mockResolvedValue({
            document: 's3://path/to/old/file',
            documentCategory: 'ASSET'
        });
        cloud_assets.findOne.mockResolvedValue({ id: 1 });
        findMaximumUsageLimit.mockResolvedValue({ limit: 1000 });
        deleteEncryptedFromS3.mockResolvedValue();
        uploadFileEncryptedToS3.mockResolvedValue('s3://path/to/encrypted/file');
        cloud_documents.update.mockResolvedValue([1]);

        const result = await updateAssetDoc(id, newData, user);

        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('s3://path/to/old/file');
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            newData.documentBase,
            `test/corporate/testuser/peko-cloud/sub-user/subuser`,
            newData.documentFormat,
            { limit: 1000 }
        );

        expect(cloud_documents.update).toHaveBeenCalledWith(newData, {
            where: { id: id, documentCategory: 'ASSET' },
        });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should handle update failure', async () => {
        const id = 1;
        const newData = {};
        const user = {};

        cloud_documents.findOne.mockResolvedValue({
            documentCategory: 'ASSET'
        });
        cloud_documents.update.mockResolvedValue([0]);

        const result = await updateAssetDoc(id, newData, user);

        expect(result).toEqual({ success: false, error: "something went wrong while updating the document" });
    });
});
