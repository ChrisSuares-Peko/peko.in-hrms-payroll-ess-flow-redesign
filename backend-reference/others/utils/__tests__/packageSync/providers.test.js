const axios = require('axios');

const { findServiceOperatorByAccessKey } = require('../../checkAndFetchServiceDetails');
const pekoPos = require('../../packageSync/providers/pekoPos');
const accounting = require('../../packageSync/providers/accounting');

jest.mock('axios');
jest.mock('../../checkAndFetchServiceDetails', () => ({ findServiceOperatorByAccessKey: jest.fn() }));
jest.mock('../../withRetry', () => fn => fn());

const RESTONIK_SAMPLE = {
    success: true,
    data: [
        {
            id: '6ab95a6901e6e53430693269',
            name: 'Base',
            description: 'Cloud billing, inventory, menu management and reports.',
            price: 10000,
            durationDays: 365,
            disabledModules: [],
        },
        {
            id: '6ab95a6901e6e5343069326c',
            name: 'Growth',
            description: 'Captain app, QR ordering, KDS and integrations.',
            price: 18000,
            durationDays: 365,
            disabledModules: [],
        },
    ],
    defaultPlanId: '6ab95a6901e6e53430693269',
};

const restonikVendor = {
    id: 1,
    vendor: { apiUrl: 'https://api.restonik.com/api/v1/partner/external', optional1: 'rk_key' },
};

describe('pekoPos provider', () => {
    beforeEach(() => jest.clearAllMocks());

    it('maps the verbatim Restonik response to externalId + packageName only', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue(restonikVendor);
        axios.mockResolvedValue({ status: 200, data: RESTONIK_SAMPLE });

        const plans = await pekoPos.fetchPlans('trace');

        expect(plans).toEqual([
            { externalId: '6ab95a6901e6e53430693269', fields: { packageName: 'Base' }, raw: RESTONIK_SAMPLE.data[0] },
            { externalId: '6ab95a6901e6e5343069326c', fields: { packageName: 'Growth' }, raw: RESTONIK_SAMPLE.data[1] },
        ]);
        expect(Object.keys(plans[0].fields)).toEqual(['packageName']);
        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'get',
                url: 'https://api.restonik.com/api/v1/partner/external/plans',
                headers: { 'X-API-Key': 'rk_key' },
                timeout: 15000,
            })
        );
    });

    it('drops vendor items without an id', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue(restonikVendor);
        axios.mockResolvedValue({ status: 200, data: { success: true, data: [{ name: 'No id' }, { id: 'ok', name: 'Ok' }] } });

        const plans = await pekoPos.fetchPlans('trace');
        expect(plans.map(p => p.externalId)).toEqual(['ok']);
    });

    it('rejects with 503 when the vendor configuration is missing', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue({ error: 'Service is disabled' });
        await expect(pekoPos.fetchPlans('trace')).rejects.toMatchObject({ status_code: 503 });
        expect(axios).not.toHaveBeenCalled();
    });

    it('rejects with 502 on an unexpected response shape', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue(restonikVendor);
        axios.mockResolvedValue({ status: 200, data: { success: false, message: 'nope' } });
        await expect(pekoPos.fetchPlans('trace')).rejects.toMatchObject({ status_code: 502 });
    });

    it('declares its contract', () => {
        expect(pekoPos.accessKey).toBe('peko_pos');
        expect(pekoPos.packageAccessCode).toBe('peko_pos');
        expect(pekoPos.syncedFields).toEqual(['packageName']);
        expect(pekoPos.syncedFields).not.toContain('status');
    });
});

describe('accounting provider', () => {
    beforeEach(() => jest.clearAllMocks());

    it('maps the Timber response with the bearer header and monthly search', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue({ id: 2, vendor: { apiUrl: 'https://timber.example', optional1: 'tok' } });
        axios.mockResolvedValue({
            status: 200,
            data: { status: true, data: { plans: [{ _id: 'p1', title: 'Starter', available_benefits: ['A', 'B'], offer_price: '499' }] } },
        });

        const plans = await accounting.fetchPlans('trace');

        expect(plans).toEqual([
            {
                externalId: 'p1',
                fields: { packageName: 'Starter', description: 'A\nB' },
                raw: { _id: 'p1', title: 'Starter', available_benefits: ['A', 'B'], offer_price: '499' },
            },
        ]);
        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({
                url: 'https://timber.example/user/partner/external/plans',
                params: { search: 'monthly' },
                headers: { Authorization: 'Bearer tok' },
            })
        );
    });

    it('rejects with 502 when the vendor reports status:false', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue({ id: 2, vendor: { apiUrl: 'https://timber.example', optional1: 'tok' } });
        axios.mockResolvedValue({ status: 200, data: { status: false } });
        await expect(accounting.fetchPlans('trace')).rejects.toMatchObject({ status_code: 502 });
    });

    it('declares its contract', () => {
        expect(accounting.accessKey).toBe('accounting');
        expect(accounting.packageAccessCode).toBe('accounting');
        expect(accounting.syncedFields).toEqual(['packageName', 'description']);
    });
});
