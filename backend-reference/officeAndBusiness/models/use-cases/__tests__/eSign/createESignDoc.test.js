const { createESignDoc } = require('../../eSign');
const eSign = require('../../../entities/eSign');
const { uploadFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../entities/eSign', () => ({
    create: jest.fn(),
}));
jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () =>({
    hasMany: jest.fn(),
    hasOne: jest.fn(),
    belongsTo: jest.fn(),
}));

describe('createESignDoc', () => {
    let req, apiRes;

    beforeEach(() => {
        req = {
            user: {
                id: 1,
                role: 'Admin',
                username: 'testUser',
            },
            body: {
                signers_info: [{ signer_name: 'John Doe' }],
                docket_title: 'Test Docket',
                expiry_date: new Date(),
                sequentialSignature: true,
                documentBase64: 'data:application/pdf;base64,testbase64data',
                reminder: true,
                reminder_interval: '15',
                initiator_email: 'initiator@test.com',
            }
        };

        apiRes = {
            signer_info: [{ signer_email: 'john.doe@test.com', document_id: 'doc123' }],
            docket_id: 'docket123',
            subCorporateUserId: 2,
        };

        jest.clearAllMocks();
    });

    it('should create an eSign document and return the new document if successful', async () => {
        const mockUploadedUrl = 'https://s3.amazonaws.com/bucket/test.pdf';
        const mockESignDoc = { id: 1, docket_title: 'Test Docket' };

        uploadFile.mockResolvedValue(mockUploadedUrl);
        eSign.create.mockResolvedValue(mockESignDoc);

        const result = await createESignDoc(apiRes, req);

        expect(uploadFile).toHaveBeenCalledWith(
            expect.any(String),
            `admin/testUser/eSignDocs`,
            'pdf'
        );
        expect(eSign.create).toHaveBeenCalledWith(expect.objectContaining({
            docket_id: apiRes.docket_id,
            document_id: 'doc123',
            docket_title: req.body.docket_title,
            document_url: mockUploadedUrl,
            expiry_date: req.body.expiry_date,
            sequentialSignature: req.body.sequentialSignature,
            signers_info: [
                { signer_name: 'John Doe', signer_email: 'john.doe@test.com', document_id: 'doc123', status: 'unsigned' }
            ],
            initiator_email: req.body.initiator_email,
            reminder: req.body.reminder,
            reminder_interval: 15,
            status: 'PENDING',
            credentialId: req.user.id,
            subCorporateUserId: apiRes.subCorporateUserId
        }));
        expect(result).toEqual({ status: true, data: mockESignDoc });
    });

    it('should return an error message if the eSign document creation fails', async () => {
        const mockUploadedUrl = 'https://s3.amazonaws.com/bucket/test.pdf';

        uploadFile.mockResolvedValue(mockUploadedUrl);
        eSign.create.mockResolvedValue(null);

        const result = await createESignDoc(apiRes, req);

        expect(uploadFile).toHaveBeenCalled();
        expect(eSign.create).toHaveBeenCalled();
        expect(result).toEqual({ status: false, message: 'Something went wrong while creating document' });
    });

    it('should return an error message if there is an exception during document creation', async () => {
        const mockError = new Error('Some error');
        uploadFile.mockRejectedValue(mockError);
        console.log = jest.fn();

        const result = await createESignDoc(apiRes, req);

        expect(uploadFile).toHaveBeenCalled();
        expect(eSign.create).not.toHaveBeenCalled();
        expect(result).toEqual({ status: false, message: 'Something went wrong while creating document' });
    });
});
