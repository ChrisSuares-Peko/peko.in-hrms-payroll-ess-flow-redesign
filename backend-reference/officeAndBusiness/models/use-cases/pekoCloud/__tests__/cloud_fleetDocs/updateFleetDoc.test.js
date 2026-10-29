const { updateFleetDoc } = require("../../cloud_fleetDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const { deleteEncryptedFromS3, uploadFileEncryptedToS3 } = require("../../../../../utils/s3");
const ErrorResponse = require("../../../../../utils/error-response");
const { findMaximumUsageLimit } = require("../../../subscription");


jest.mock('../../../../entities/pekoCloud/cloud_documents', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    deleteEncryptedFromS3: jest.fn(),
    uploadFileEncryptedToS3: jest.fn(),
}));

jest.mock('../../../subscription', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

describe('updateFleetDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update the document with new data when the document and fleet exist', async () => {
        const id = 1;
        const newData = { documentName: 'UpdatedDoc', documentBase: 'newBase64Data', documentFormat: 'pdf', cloudFleetId: 1 };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2, corporateId: 1 };
        const existingDocument = { id: 1, document: 'oldFileKey' };
        const existingFleet = { id: 1 };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        findMaximumUsageLimit.mockResolvedValue(1000);
        uploadFileEncryptedToS3.mockResolvedValue('newFileKey');
        cloud_documents.update.mockResolvedValue([1]);

        const result = await updateFleetDoc(id, newData, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: { id: id, documentCategory: 'FLEET' },
        });
        expect(cloud_fleets.findOne).toHaveBeenCalledWith({
            where: { id: newData.cloudFleetId },
        });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith(existingDocument.document);
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            newData.documentBase,
            'test/corporate/user1/peko-cloud/sub-user/subUser1',
            newData.documentFormat,
            1000
        );
        expect(cloud_documents.update).toHaveBeenCalledWith(newData, {
            where: { id: id, documentCategory: 'FLEET' },
        });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return error if the document does not exist', async () => {
        const id = 1;
        const newData = { documentName: 'UpdatedDoc' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };

        cloud_documents.findOne.mockResolvedValue(null);

        const result = await updateFleetDoc(id, newData, user);

        expect(result).toEqual({
            success: false,
            error: "document is not existing with the given details",
        });
    });

    it('should return error if the fleet does not exist', async () => {
        const id = 1;
        const newData = { documentName: 'UpdatedDoc', cloudFleetId: 1 };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };
        const existingDocument = { id: 1 };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_fleets.findOne.mockResolvedValue(null);

        const result = await updateFleetDoc(id, newData, user);

        expect(result).toEqual({
            success: false,
            error: "fleet is not existing with the given details",
        });
    });

    it('should handle file upload failure', async () => {
        const id = 1;
        const newData = { documentName: 'UpdatedDoc', documentBase: 'newBase64Data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };
        const existingDocument = { id: 1, document: 'oldFileKey' };
        const existingFleet = { id: 1 };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        findMaximumUsageLimit.mockResolvedValue(1000);
        uploadFileEncryptedToS3.mockRejectedValue(new Error('Upload error'));

        const result = await updateFleetDoc(id, newData, user);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle document update failure', async () => {
        const id = 1;
        const newData = { documentName: 'UpdatedDoc', documentBase: 'newBase64Data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };
        const existingDocument = { id: 1, document: 'oldFileKey' };
        const existingFleet = { id: 1 };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        findMaximumUsageLimit.mockResolvedValue(1000);
        uploadFileEncryptedToS3.mockResolvedValue('newFileKey');
        cloud_documents.update.mockResolvedValue([0]);

        const result = await updateFleetDoc(id, newData, user);

        expect(result).toEqual({
            success: false,
            error: "something went wrong while updating the document",
        });
    });

    it('should handle database errors', async () => {
        const id = 1;
        const newData = { documentName: 'UpdatedDoc' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };

        cloud_documents.findOne.mockRejectedValue(new Error('Database error'));

        const result = await updateFleetDoc(id, newData, user);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle cases with no new document base provided', async () => {
        const id = 1;
        const newData = { documentName: 'UpdatedDoc' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };
        const existingDocument = { id: 1, document: 'existingFileKey' };
        const existingFleet = { id: 1 };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        cloud_documents.update.mockResolvedValue([1]);

        const result = await updateFleetDoc(id, newData, user);

        expect(cloud_documents.update).toHaveBeenCalledWith(newData, {
            where: { id: id, documentCategory: 'FLEET' },
        });

        expect(result).toEqual({ success: true, data: {} });
    });
});
