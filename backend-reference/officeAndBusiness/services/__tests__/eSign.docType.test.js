jest.mock('../../utils/checkAndFetchServiceDetails', () => ({
    fetchServiceDetails: jest.fn(),
    findServiceOperatorByAccessKey: jest.fn(),
}));
jest.mock('../../models/use-cases/eSign', () => ({
    findESignDoc: jest.fn(),
    findDocToUpdate: jest.fn(),
    findESignDocById: jest.fn(),
}));
jest.mock('../../models/use-cases/invoiceSupplier', () => ({ findAgreementToUpdate: jest.fn() }));
jest.mock('../../models/use-cases/agreement', () => ({
    updateAgreement: jest.fn(),
    pushAgreementTimeline: jest.fn(),
}));
jest.mock('../../models/use-cases/legalDocument', () => ({ updateById: jest.fn() }));
jest.mock('../../models/entities/eSign', () => ({}));
jest.mock('../../utils/s3', () => ({
    uploadFileToS3: jest.fn(),
    uploadFileEncryptedToS3: jest.fn(),
}));
jest.mock('../../utils/commonUploadFile', () => ({ uploadFile: jest.fn() }));
jest.mock('../../utils/emailer', () => ({ email: jest.fn() }));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

process.env.STAGING_URL = process.env.STAGING_URL || 'https://staging.test';
process.env.PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://prod.test';

const eSignService = require('../eSign');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');

describe('ESIGN_DOC_TYPE', () => {
    it('asks AuthBridge for the audit-trail copy by the name the vendor accepts', () => {
        expect(eSignService.ESIGN_DOC_TYPE.AUDIT_TRAIL).toBe('ephotocopy');
    });

    it('keeps the flattened copy as the name every other flow already used', () => {
        expect(eSignService.ESIGN_DOC_TYPE.FLAT).toBe('Flat');
    });
});

describe('fetchSignedPdfBase64', () => {
    const originalDownload = eSignService.downloadDocumentAuthBridge;
    const originalToken = eSignService.getAuthBridgeAccessToken;

    beforeEach(() => {
        jest.clearAllMocks();
        findServiceOperatorByAccessKey.mockResolvedValue({
            vendor: { apiUrl: 'https://vendor.test', optional5: 'tenant-1' },
        });
        eSignService.getAuthBridgeAccessToken = jest.fn().mockResolvedValue('token-1');
        eSignService.downloadDocumentAuthBridge = jest.fn().mockResolvedValue({
            headers: { 'content-type': 'application/pdf' },
            data: Buffer.from('pdf-bytes'),
        });
    });

    afterEach(() => {
        eSignService.downloadDocumentAuthBridge = originalDownload;
        eSignService.getAuthBridgeAccessToken = originalToken;
    });

    it('forwards the requested docType to the vendor', async () => {
        await eSignService.fetchSignedPdfBase64('doc-9', 'trace-1', 'ephotocopy');

        expect(eSignService.downloadDocumentAuthBridge).toHaveBeenCalledWith(
            expect.objectContaining({ docId: 'doc-9', docType: 'ephotocopy' })
        );
    });

    it('defaults to the flattened copy so callers that never asked keep their document', async () => {
        await eSignService.fetchSignedPdfBase64('doc-9', 'trace-1');

        expect(eSignService.downloadDocumentAuthBridge).toHaveBeenCalledWith(
            expect.objectContaining({ docType: 'Flat' })
        );
    });

    it('returns the document as base64', async () => {
        const result = await eSignService.fetchSignedPdfBase64('doc-9', 'trace-1', 'ephotocopy');

        expect(result).toBe(Buffer.from('pdf-bytes').toString('base64'));
    });

    it('returns null when the vendor answers with an error body instead of a document', async () => {
        eSignService.downloadDocumentAuthBridge = jest.fn().mockResolvedValue({
            headers: { 'content-type': 'application/json' },
            data: Buffer.from('{"message":"bad docType"}'),
        });

        const result = await eSignService.fetchSignedPdfBase64('doc-9', 'trace-1', 'ephotocopy');

        expect(result).toBeNull();
    });
});
