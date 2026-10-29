const ErrorResponse = require('../../error-response');
const { listProviders, getProvider, normalizePartnerId, loadVendorPlans } = require('../../packageSync');

jest.mock('../../checkAndFetchServiceDetails', () => ({ findServiceOperatorByAccessKey: jest.fn() }));

describe('packageSync registry', () => {
    it('lists both providers with their package access codes', () => {
        expect(listProviders()).toEqual([
            expect.objectContaining({ accessKey: 'peko_pos', packageAccessCode: 'peko_pos', syncedFields: ['packageName'] }),
            expect.objectContaining({ accessKey: 'accounting', packageAccessCode: 'accounting', syncedFields: ['packageName', 'description'] }),
        ]);
    });

    it('returns null for an unknown provider', () => {
        expect(getProvider('nope')).toBeNull();
        expect(getProvider('peko_pos').accessKey).toBe('peko_pos');
    });

    it.each([
        ['default', null],
        ['', null],
        [null, null],
        [undefined, null],
        [1830, '1830'],
        ['1830', '1830'],
    ])('normalizePartnerId(%p) -> %p', (input, expected) => {
        expect(normalizePartnerId(input)).toBe(expected);
    });
});

describe('loadVendorPlans', () => {
    const provider = (fetchPlans, label = 'Stub') => ({ accessKey: 'stub', label, fetchPlans });

    it('returns the plans when the vendor sends some', async () => {
        const plans = [{ externalId: 'a', fields: {}, raw: {} }];
        await expect(loadVendorPlans(provider(async () => plans), 't')).resolves.toBe(plans);
    });

    it('rejects with 502 on an empty vendor list so nothing is ever deactivated wholesale', async () => {
        await expect(loadVendorPlans(provider(async () => []), 't')).rejects.toMatchObject({ status_code: 502 });
    });

    it('maps a transport error to 502', async () => {
        const err = new Error('socket hang up');
        err.response = { status: 500 };
        await expect(loadVendorPlans(provider(async () => { throw err; }), 't')).rejects.toMatchObject({ status_code: 502 });
    });

    it('passes a provider ErrorResponse through unchanged', async () => {
        const err = new ErrorResponse('config missing', 503);
        await expect(loadVendorPlans(provider(async () => { throw err; }), 't')).rejects.toBe(err);
    });
});
