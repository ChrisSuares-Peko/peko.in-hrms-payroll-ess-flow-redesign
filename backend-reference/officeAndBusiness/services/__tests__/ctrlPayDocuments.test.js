const axios = require('axios');

jest.mock('axios', () => ({ put: jest.fn() }));
jest.mock('../../utils/ctrlPay/client', () => ({
    ...jest.requireActual('../../utils/ctrlPay/client'),
    createCtrlPaySession: jest.fn(),
}));
jest.mock('../../utils/cacheDataMethods', () => ({ client: {}, getValue: jest.fn(), setValue: jest.fn(), deleteValue: jest.fn() }));
jest.mock('../../utils/ctrlPay/store', () => ({
    ...jest.requireActual('../../utils/ctrlPay/store'),
    readTrackedUploads: jest.fn().mockResolvedValue({}),
    trackUpload: jest.fn(),
    forgetUpload: jest.fn(),
    clearPhoneOtp: jest.fn(),
}));
jest.mock('../../models/use-cases/ctrlPayConnection', () => ({}));

const { CTRLPAY_MESSAGES } = require('../../constants/ctrlPay');
const { createCtrlPaySession } = require('../../utils/ctrlPay/client');
const store = require('../../utils/ctrlPay/store');
const documents = require('../ctrlPayDocuments');

const user = { id: 501, corporateId: 77 };
const PDF = Buffer.from('%PDF-1.7 sample').toString('base64');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]).toString('base64');

const checklist = (overrides = {}) => ({
    constitution_code: 'D',
    constitution_description: 'Private Limited Company',
    doc_requirement: 'all',
    document_type: [
        { CERTIFICATE_OF_INCORPORATION: { status: 'NOT_UPLOADED', remarks: null, name: 'Certificate of Incorporation' } },
    ],
    pan_card: { status: 'NOT_UPLOADED', required: true, name: 'PAN card of Legal Entity', remarks: null },
    ovd: { status: 'NOT_UPLOADED', required: false, name: 'OVD', remarks: null, type: null },
    ovd_back: { status: 'NOT_UPLOADED', required: false, name: 'OVD back', remarks: null },
    ...overrides,
});

const reply = (httpStatus, payload) => ({ httpStatus, payload });
const uploadUrl = (path) => reply(200, { status: 'SUCCESS', upload_url: `https://bucket.s3.amazonaws.com/${path}?X-Amz-Signature=abc` });

const sessionWith = (...replies) => {
    const call = jest.fn();
    replies.forEach((value) => call.mockResolvedValueOnce(value));
    createCtrlPaySession.mockResolvedValue({ call, connection: { corporateId: 77 }, config: {} });
    return call;
};

beforeEach(() => {
    jest.clearAllMocks();
    axios.put.mockResolvedValue({ status: 200 });
});

describe('CTRLPay document upload', () => {
    it('refuses a file whose bytes do not match its type before calling CTRLPay', async () => {
        await expect(
            documents.uploadDocument({ user, fileName: 'pan_card', contentType: 'application/pdf', data: PNG })
        ).rejects.toMatchObject({ message: CTRLPAY_MESSAGES.documentContent, status_code: 400 });
        expect(createCtrlPaySession).not.toHaveBeenCalled();
    });

    it('uploads the PAN card through an application URL with no auth header', async () => {
        const call = sessionWith(reply(200, checklist()), uploadUrl('pan.pdf'));

        const result = await documents.uploadDocument({
            user,
            fileName: 'pan_card',
            contentType: 'application/pdf',
            data: PDF,
            originalName: 'pan card<script>.pdf',
        });

        expect(result).toEqual({ fileName: 'pan_card', status: 'PROCESSING' });
        expect(call).toHaveBeenLastCalledWith('s3.get_application_presigned_upload_url', {
            file_name: 'pan_card',
            content_type: 'application/pdf',
        });
        const [url, body, options] = axios.put.mock.calls[0];
        expect(url).toContain('X-Amz-Signature');
        expect(body.subarray(0, 5).toString()).toBe('%PDF-');
        expect(options.headers).toEqual({ 'Content-Type': 'application/pdf' });
        expect(store.trackUpload).toHaveBeenCalledWith(77, 'pan_card', 'pan cardscript.pdf', undefined);
    });

    it('uploads an entity document through a business URL and asks for a fresh URL once on 403', async () => {
        const call = sessionWith(reply(200, checklist()), uploadUrl('coi-1'), uploadUrl('coi-2'));
        axios.put.mockResolvedValueOnce({ status: 403 }).mockResolvedValueOnce({ status: 200 });

        await documents.uploadDocument({
            user,
            fileName: 'CERTIFICATE_OF_INCORPORATION',
            contentType: 'image/png',
            data: PNG,
        });

        expect(call).toHaveBeenNthCalledWith(2, 's3.get_business_documents_presigned_upload_url', {
            file_name: 'CERTIFICATE_OF_INCORPORATION',
            content_type: 'image/png',
        });
        expect(axios.put).toHaveBeenCalledTimes(2);
        expect(axios.put.mock.calls[1][0]).toContain('coi-2');
    });

    it('passes the identity document type for the proprietor front page', async () => {
        const call = sessionWith(
            reply(200, checklist({ ovd: { status: 'NOT_UPLOADED', required: true, name: 'OVD' } })),
            uploadUrl('ovd')
        );

        await documents.uploadDocument({
            user,
            fileName: 'ovd_of_ubo',
            contentType: 'application/pdf',
            data: PDF,
            ovdType: 'PASSPORT',
        });

        expect(call).toHaveBeenLastCalledWith('s3.get_application_presigned_upload_url', {
            file_name: 'ovd_of_ubo',
            content_type: 'application/pdf',
            ovd_type: 'PASSPORT',
        });
    });

    it('refuses slots outside the checklist and verified documents', async () => {
        sessionWith(reply(200, checklist()));
        await expect(
            documents.uploadDocument({ user, fileName: 'TRUST_DEED', contentType: 'application/pdf', data: PDF })
        ).rejects.toMatchObject({ status_code: 404 });

        sessionWith(reply(200, checklist()));
        await expect(
            documents.uploadDocument({ user, fileName: 'ovd_of_ubo', contentType: 'application/pdf', data: PDF, ovdType: 'PASSPORT' })
        ).rejects.toMatchObject({ status_code: 404 });

        sessionWith(reply(200, checklist({ pan_card: { status: 'VERIFIED', required: true } })));
        await expect(
            documents.uploadDocument({ user, fileName: 'pan_card', contentType: 'application/pdf', data: PDF })
        ).rejects.toMatchObject({ message: CTRLPAY_MESSAGES.documentVerified });
    });

    it('never PUTs to an upload URL that is not https', async () => {
        sessionWith(reply(200, checklist()), reply(200, { status: 'SUCCESS', upload_url: 'http://169.254.169.254/latest' }));

        await expect(
            documents.uploadDocument({ user, fileName: 'pan_card', contentType: 'application/pdf', data: PDF })
        ).rejects.toMatchObject({ message: CTRLPAY_MESSAGES.documentUploadFailed });
        expect(axios.put).not.toHaveBeenCalled();
    });
});

describe('CTRLPay checklist and submission', () => {
    it('shows a recent upload as processing until CTRLPay registers it', async () => {
        sessionWith(reply(200, checklist()));
        store.readTrackedUploads.mockResolvedValueOnce({
            pan_card: { originalName: 'pan.pdf', uploadedAt: Date.now() - 1000 },
        });

        const result = await documents.getDocuments({ user });

        expect(result.panCard).toMatchObject({ status: 'PROCESSING', uploadedFileName: 'pan.pdf' });
        expect(result.entityDocuments[0]).toMatchObject({ status: 'NOT_UPLOADED', uploadedFileName: null });
        expect(result.complete).toBe(false);
    });

    it('refuses to submit before every required document is in', async () => {
        const call = sessionWith(reply(200, checklist()));

        await expect(
            documents.submitApplication({ user, address: 'Unit 402, Lower Parel, Mumbai', pincode: '400013' })
        ).rejects.toMatchObject({ message: CTRLPAY_MESSAGES.documentsIncomplete, status_code: 422 });
        expect(call).toHaveBeenCalledTimes(1);
    });

    it('fills the visit address, then submits', async () => {
        const complete = checklist({
            pan_card: { status: 'UPLOADED', required: true },
            document_type: [{ CERTIFICATE_OF_INCORPORATION: { status: 'VERIFIED' } }],
        });
        const call = sessionWith(
            reply(200, complete),
            reply(200, { status: 'SUCCESS' }),
            reply(200, { status: 'VERIFY_PHONE' })
        );

        const result = await documents.submitApplication({
            user,
            address: 'Unit 402, Lower Parel, Mumbai',
            pincode: '400013',
        });

        expect(result).toEqual({ status: 'VERIFY_PHONE' });
        expect(call).toHaveBeenNthCalledWith(2, 'user.fill_osv_address', {
            osv_address: 'Unit 402, Lower Parel, Mumbai',
            osv_pincode: '400013',
        });
        expect(call).toHaveBeenNthCalledWith(3, 'onboarding.submit_for_verification', {});
        expect(store.clearPhoneOtp).toHaveBeenCalled();
    });

    it('cannot withdraw a verified document', async () => {
        sessionWith(reply(409, { status: 'ERROR', message: "A document with status 'VERIFIED' cannot be deleted." }));

        await expect(documents.withdrawDocument({ user, fileName: 'pan_card' })).rejects.toMatchObject({
            message: CTRLPAY_MESSAGES.documentVerified,
        });
    });
});
