const { requireCorporateOwner } = require('../../middlewares/requireCorporateOwner');
const {
    validateCtrlPayDocumentUpload,
    validateCtrlPayPanSearch,
    validateCtrlPaySenderAccount,
    validateCtrlPayTransactionFilters,
} = require('../../validations/ctrlPay');

const run = (middleware, req) => {
    const next = jest.fn();
    middleware(req, {}, next);
    return { next, error: next.mock.calls[0]?.[0] };
};

describe('CTRLPay owner gate', () => {
    const gate = requireCorporateOwner('owner only');

    it('lets the account owner through', () => {
        expect(run(gate, { user: { role: 'CORPORATE', corporateId: 77 } }).error).toBeUndefined();
    });

    it.each([
        ['a sub-user', { role: 'CORPORATE_SUB_USER', corporateId: 77, subCorporateId: 9 }],
        ['a sub-user carried as corporate', { role: 'CORPORATE', corporateId: 77, subCorporateId: 9 }],
        ['an employee', { role: 'USER', corporateId: 77 }],
        ['a session without a corporate', { role: 'CORPORATE' }],
    ])('refuses %s', (label, user) => {
        const { error } = run(gate, { user });
        expect(error).toMatchObject({ message: 'owner only', status_code: 403 });
    });
});

describe('CTRLPay request validation', () => {
    it('normalises the PAN and refuses a malformed mobile number', () => {
        const req = { body: { pan: ' aafcv4821k ', mobile: '9820012345' } };
        expect(run(validateCtrlPayPanSearch, req).error).toBeUndefined();
        expect(req.body.pan).toBe('AAFCV4821K');

        expect(run(validateCtrlPayPanSearch, { body: { pan: 'AAFCV4821K', mobile: '1234567890' } }).error).toMatchObject({
            status_code: 400,
        });
    });

    it('requires the identity document type for the front page only', () => {
        const base = { contentType: 'application/pdf', data: 'JVBERi0x' };
        expect(run(validateCtrlPayDocumentUpload, { body: { ...base, fileName: 'ovd_of_ubo' } }).error).toMatchObject({
            message: 'Choose the type of identity document.',
        });
        expect(
            run(validateCtrlPayDocumentUpload, { body: { ...base, fileName: 'ovd_of_ubo', ovdType: 'AADHAAR' } }).error
        ).toBeDefined();
        expect(
            run(validateCtrlPayDocumentUpload, { body: { ...base, fileName: 'pan_card', ovdType: 'PASSPORT' } }).error
        ).toBeDefined();
        expect(run(validateCtrlPayDocumentUpload, { body: { ...base, fileName: 'CERTIFICATE_OF_INCORPORATION' } }).error)
            .toBeUndefined();
    });

    it('refuses unknown fields, odd file names and unsupported types', () => {
        const valid = { fileName: 'pan_card', contentType: 'application/pdf', data: 'JVBERi0x' };
        expect(run(validateCtrlPayDocumentUpload, { body: { ...valid, extra: 1 } }).error).toBeDefined();
        expect(run(validateCtrlPayDocumentUpload, { body: { ...valid, fileName: '../etc/passwd' } }).error).toBeDefined();
        expect(run(validateCtrlPayDocumentUpload, { body: { ...valid, contentType: 'text/html' } }).error).toMatchObject({
            message: 'Only PDF, JPG, PNG or TIFF files can be uploaded.',
        });
    });

    it('upper-cases sender account details and checks the IFSC', () => {
        const req = { body: { accountName: 'vanta logistics', accountNumber: '123456789012', ifsc: 'utib0000123' } };
        expect(run(validateCtrlPaySenderAccount, req).error).toBeUndefined();
        expect(req.body).toEqual({ accountName: 'VANTA LOGISTICS', accountNumber: '123456789012', ifsc: 'UTIB0000123' });

        expect(
            run(validateCtrlPaySenderAccount, { body: { ...req.body, ifsc: 'UTIB1000123' } }).error
        ).toMatchObject({ message: 'Enter a valid IFSC code' });
    });

    it('defaults paging and drops unknown query parameters', () => {
        const req = { query: { kind: 'Spend', pageSize: '25', debug: 'true' } };
        expect(run(validateCtrlPayTransactionFilters, req).error).toBeUndefined();
        expect(req.query).toEqual({ kind: 'Spend', page: 1, pageSize: 25 });

        expect(run(validateCtrlPayTransactionFilters, { query: { pageSize: '500' } }).error).toBeDefined();
    });
});
