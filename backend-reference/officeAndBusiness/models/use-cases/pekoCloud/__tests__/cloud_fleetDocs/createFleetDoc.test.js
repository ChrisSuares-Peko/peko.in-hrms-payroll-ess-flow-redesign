const { createFleetDoc } = require("../../cloud_fleetDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const {  uploadFileEncryptedToS3 } = require("../../../../../utils/s3");
const ErrorResponse = require("../../../../../utils/error-response");
const { findMaximumUsageLimit } = require("../../../subscription");
const { Op } = require('sequelize');

jest.mock('../../../../entities/pekoCloud/cloud_documents', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    uploadFileEncryptedToS3: jest.fn(),
}));

jest.mock('../../../subscription', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

describe('createFleetDoc Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new document successfully when no existing document and valid fleet', async () => {
        const data = { documentName: 'Doc1', cloudFleetId: 1, documentBase: 'base64data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2, corporateId: 1 };
        const existingDocument = null;
        const existingFleet = { id: 1 };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        findMaximumUsageLimit.mockResolvedValue(1000);
        uploadFileEncryptedToS3.mockResolvedValue('fileKey');
        cloud_documents.create.mockResolvedValue(data);

        const result = await createFleetDoc(data, user);

        expect(cloud_documents.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { documentName: data.documentName, documentCategory: 'FLEET', cloudFleetId: data.cloudFleetId },
                ],
            },
        });
        expect(cloud_fleets.findOne).toHaveBeenCalledWith({
            where: {
                id: data.cloudFleetId,
            },
        });
        expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
            data.documentBase,
            'test/corporate/user1/peko-cloud/sub-user/subUser1',
            data.documentFormat,
            1000
        );
        expect(cloud_documents.create).toHaveBeenCalledWith({
            ...data,
            documentCategory: 'FLEET',
            document: 'fileKey',
            subCorporateUserId: user.subCorporateId,
        });

        expect(result).toEqual({ success: true, data });
    });

    it('should return error if document with the same name already exists', async () => {
        const data = { documentName: 'Doc1', cloudFleetId: 1 };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };
        const existingDocument = { id: 1 };

        cloud_documents.findOne.mockResolvedValue(existingDocument);

        const result = await createFleetDoc(data, user);

        expect(result).toEqual({ success: false, error: "Document with this name already exists." });
    });

    it('should return error if fleet does not exist', async () => {
        const data = { documentName: 'Doc1', cloudFleetId: 1 };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };
        const existingDocument = null;

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_fleets.findOne.mockResolvedValue(null);

        const result = await createFleetDoc(data, user);

        expect(result).toEqual({
            success: false,
            error: "fleet is not existing with the given details",
        });
    });

    it('should handle file upload failure', async () => {
        const data = { documentName: 'Doc1', cloudFleetId: 1, documentBase: 'base64data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };
        const existingDocument = null;
        const existingFleet = { id: 1 };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        uploadFileEncryptedToS3.mockRejectedValue(new Error('Upload error'));

        const result = await createFleetDoc(data, user);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle document creation failure', async () => {
        const data = { documentName: 'Doc1', cloudFleetId: 1, documentBase: 'base64data', documentFormat: 'pdf' };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };
        const existingDocument = null;
        const existingFleet = { id: 1 };

        cloud_documents.findOne.mockResolvedValue(existingDocument);
        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        findMaximumUsageLimit.mockResolvedValue(1000);
        uploadFileEncryptedToS3.mockResolvedValue('fileKey');
        cloud_documents.create.mockResolvedValue(null);

        const result = await createFleetDoc(data, user);

        expect(result).toEqual({ success: false, error: "Failed to create document." });
    });

    it('should handle database errors', async () => {
        const data = { documentName: 'Doc1', cloudFleetId: 1 };
        const user = { role: 'CORPORATE_SUB_USER', username: 'user1', subCorporateUsername: 'subUser1', subCorporateId: 2 };

        cloud_documents.findOne.mockRejectedValue(new Error('Database error'));

        const result = await createFleetDoc(data, user);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
