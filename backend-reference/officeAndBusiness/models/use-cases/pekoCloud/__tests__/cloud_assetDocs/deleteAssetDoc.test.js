const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const { deleteEncryptedFromS3 } = require("../../../../../utils/s3");
const { deleteAssetDoc } = require("../../cloud_assetDocs");

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
    belongsTo: jest.fn(),
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
    destroy: jest.fn(),
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
    deleteEncryptedFromS3: jest.fn(),
}));

describe('deleteAssetDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return error if document does not exist', async () => {
        const id = 1;

        cloud_documents.findOne.mockResolvedValue(null);

        const result = await deleteAssetDoc(id);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'ASSET' },
        });

        expect(result).toEqual({ success: false, error: "document is not existing with the given details" });
    });

    it('should successfully delete a document', async () => {
        const id = 1;

        cloud_documents.findOne.mockResolvedValue({
            id: 1,
            document: 's3://path/to/encrypted/file',
            documentCategory: 'ASSET'
        });
        deleteEncryptedFromS3.mockResolvedValue();
        cloud_documents.destroy.mockResolvedValue(1);

        const result = await deleteAssetDoc(id);

        expect(deleteEncryptedFromS3).toHaveBeenCalledWith('s3://path/to/encrypted/file');
        expect(cloud_documents.destroy).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'ASSET' },
        });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should handle delete failure', async () => {
        const id = 1;

        cloud_documents.findOne.mockResolvedValue({
            id: 1,
            documentCategory: 'ASSET'
        });
        cloud_documents.destroy.mockResolvedValue(0); // No rows deleted

        const result = await deleteAssetDoc(id);

        expect(result).toEqual({ success: false, error: "failed to delete the document" });
    });
});
