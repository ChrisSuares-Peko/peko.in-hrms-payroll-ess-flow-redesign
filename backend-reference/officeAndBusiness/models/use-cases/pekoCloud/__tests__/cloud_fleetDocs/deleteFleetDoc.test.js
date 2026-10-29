const { deleteFleetDoc } = require("../../cloud_fleetDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const { deleteEncryptedFromS3 } = require("../../../../../utils/s3");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_documents', () => ({
    findOne: jest.fn(),
    destroy: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    deleteEncryptedFromS3: jest.fn(),
}));

describe('deleteFleetDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully delete the document and remove the file from S3', async () => {
        const id = 1;
        const existingDocument = { id: 1, document: 'fileKey' };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        deleteEncryptedFromS3.mockResolvedValue();
        cloud_documents.destroy.mockResolvedValue(1);

        const result = await deleteFleetDoc(id);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'FLEET' },
        });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith(existingDocument.document);
        expect(cloud_documents.destroy).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'FLEET' },
        });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return error if the document does not exist', async () => {
        const id = 1;

        cloud_documents.findOne.mockResolvedValue(null);

        const result = await deleteFleetDoc(id);

        expect(result).toEqual({
            success: false,
            error: "document is not existing with the given details",
        });
    });

    it('should handle failure in S3 file deletion', async () => {
        const id = 1;
        const existingDocument = { id: 1, document: 'fileKey' };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        deleteEncryptedFromS3.mockRejectedValue(new Error('S3 deletion error'));
        cloud_documents.destroy.mockResolvedValue(1);

        const result = await deleteFleetDoc(id);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle failure in document deletion', async () => {
        const id = 1;
        const existingDocument = { id: 1, document: 'fileKey' };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        deleteEncryptedFromS3.mockResolvedValue();
        cloud_documents.destroy.mockResolvedValue(0);

        const result = await deleteFleetDoc(id);

        expect(result).toEqual({
            success: false,
            error: "document is not existing with the given details",
        });
    });

    it('should handle database errors', async () => {
        const id = 1;

        cloud_documents.findOne.mockRejectedValue(new Error('Database error'));

        const result = await deleteFleetDoc(id);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
