const axios = require('axios');

const { customLog } = require('../loggerHelper');
const { findServiceOperatorByAccessKey } = require('../checkAndFetchServiceDetails');
const {
    buildVendorId,
    buildVendorPayload,
    nextVendorId,
    getVendor,
    createVendor,
    splitOrder,
    ensureEasySplitVendor,
    resolveConfig,
    isEasySplitEnabled,
    isUsableCashfreeVendorStatus,
    isVendorIdConflictMessage,
    EASY_SPLIT_API_VERSION,
} = require('../easySplit');

jest.mock('axios', () => ({ default: jest.fn() }), { virtual: false });
jest.mock('../../models/use-cases/setting', () => ({ findByName: jest.fn() }));
jest.mock('../checkAndFetchServiceDetails', () => ({
    findServiceOperatorByAccessKey: jest.fn(),
}));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));

const request = axios.default;

/** All customLog calls at a given level, as { data, type, maskFields }. */
const logsAt = (level) =>
    customLog.mock.calls
        .filter((call) => call[1] === level)
        .map((call) => ({ data: call[2], type: call[3], maskFields: call[4] }));

const logFor = (level, step) => logsAt(level).find((entry) => entry.data.step === step);

const CONFIG = {
    clientId: 'CF_ID',
    clientSecret: 'REDACTED',
    baseUrl: 'https://sandbox.cashfree.com',
};

const ELIGIBLE_SELLER = {
    id: 12,
    bppId: 'staging-automation.ondc.org',
    providerId: 'P1',
    vendorName: 'ABC Traders',
    settlementType: 'neft',
    settlementBankAccountNo: '026291800001191',
    settlementIfscCode: 'yesb0000262',
    beneficiaryName: 'ABC Traders',
    gstNumber: '29AAICP2912R1ZR',
    panNumber: 'ABCPV1234D',
    splitEligible: true,
};

const SETTINGS = {
    scheduleOption: 2,
    verifyAccount: true,
    dashboardAccess: false,
    accountType: 'Proprietorship',
    businessType: 'Retail and Shopping',
    vendorEmailTemplate: 'easysplit+{slug}@peko.one',
    vendorPhone: '9999999999',
};

const httpError = (status, data) => {
    const error = new Error(`HTTP ${status}`);
    error.response = { status, data };
    return error;
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('buildVendorId', () => {
    it('is deterministic for the same seller', () => {
        expect(buildVendorId('bpp.example.com', 'P1')).toBe(buildVendorId('bpp.example.com', 'P1'));
    });

    it('differs per seller and stays Cashfree-safe (alphanumeric + underscore)', () => {
        const a = buildVendorId('bpp.example.com', 'P1');
        const b = buildVendorId('bpp.example.com', 'P2');
        expect(a).not.toBe(b);
        expect(a).toMatch(/^[a-z0-9_]+$/);
        expect(a.length).toBeLessThanOrEqual(50);
    });

    it('cannot collide when two long bppIds share a truncated prefix', () => {
        const long = 'a-very-long-seller-app-subscriber-id-that-truncates';
        expect(buildVendorId(`${long}-one`, 'P1')).not.toBe(buildVendorId(`${long}-two`, 'P1'));
    });
});

describe('buildVendorPayload', () => {
    it('maps a bank seller onto Cashfree fields and upper-cases the IFSC', () => {
        const payload = buildVendorPayload(ELIGIBLE_SELLER, SETTINGS);
        expect(payload).toMatchObject({
            status: 'ACTIVE',
            name: 'ABC Traders',
            phone: '9999999999',
            verify_account: true,
            dashboard_access: false,
            schedule_option: 2,
            bank: {
                account_number: '026291800001191',
                account_holder: 'ABC Traders',
                ifsc: 'YESB0000262',
            },
        });
        expect(payload.upi).toBeUndefined();
        expect(payload.email).toBe('partner@peko.one');
        expect(payload.kyc_details).toMatchObject({
            gst: '29AAICP2912R1ZR',
            pan: 'ABCPV1234D',
            business_type: 'Retail and Shopping',
        });
    });

    it('omits schedule_option when settings.scheduleOption is unset so Cashfree uses merchant default', () => {
        const payload = buildVendorPayload(ELIGIBLE_SELLER, {
            ...SETTINGS,
            scheduleOption: null,
        });
        expect(payload.schedule_option).toBeUndefined();
    });

    it('omits schedule_option when scheduleOption is 0 or invalid', () => {
        expect(
            buildVendorPayload(ELIGIBLE_SELLER, { ...SETTINGS, scheduleOption: 0 }).schedule_option
        ).toBeUndefined();
        expect(
            buildVendorPayload(ELIGIBLE_SELLER, { ...SETTINGS, scheduleOption: 'nope' }).schedule_option
        ).toBeUndefined();
    });

    it('sends upi instead of bank when the seller settles by UPI', () => {
        const payload = buildVendorPayload(
            { ...ELIGIBLE_SELLER, settlementType: 'upi', upiAddress: 'abc@okhdfcbank' },
            SETTINGS
        );
        expect(payload.upi).toEqual({ vpa: 'abc@okhdfcbank', account_holder: 'ABC Traders' });
        expect(payload.bank).toBeUndefined();
    });

    it('never forwards the BPP placeholder tax strings to Cashfree', () => {
        const payload = buildVendorPayload(
            { ...ELIGIBLE_SELLER, gstNumber: 'gst_number_of_sellerNP', panNumber: 'PAN_number_of_provider' },
            SETTINGS
        );
        expect(payload.kyc_details.gst).toBeUndefined();
        expect(payload.kyc_details.pan).toBeUndefined();
        expect(payload.kyc_details.account_type).toBe('Proprietorship');
    });

    it('uses ONDC on_init settlement bank details even when flagged masked/ineligible', () => {
        const payload = buildVendorPayload(
            {
                ...ELIGIBLE_SELLER,
                splitEligible: false,
                ineligibleReason: 'masked_settlement_details',
                settlementBankAccountNo: 'XXXX',
                settlementIfscCode: 'XXXX',
            },
            SETTINGS
        );
        expect(payload.verify_account).toBe(true);
        expect(payload.bank).toEqual({
            account_number: 'XXXX',
            account_holder: 'ABC Traders',
            ifsc: 'XXXX',
        });
    });

    it('strips special characters from vendor name', () => {
        const payload = buildVendorPayload(
            { ...ELIGIBLE_SELLER, vendorName: 'ABC@Traders!' },
            SETTINGS
        );
        expect(payload.name).toBe('ABC Traders');
    });
});

describe('getVendor', () => {
    it('reports a 404 as "not registered" rather than an error', async () => {
        request.mockRejectedValueOnce(httpError(404, { message: 'vendor not found' }));
        const result = await getVendor('ondc_x', CONFIG);
        expect(result).toEqual({ status: true, exists: false });
    });

    it('reports Cashfree GET 400 "vendor does not exist" as not registered (docs)', async () => {
        request.mockRejectedValueOnce(
            httpError(400, {
                message: 'vendor does not exist',
                code: 'api_request_failed',
                type: 'invalid_request_error',
            })
        );
        const result = await getVendor('ondc_x', CONFIG);
        expect(result).toEqual({ status: true, exists: false });
    });

    it('reports an existing vendor and pins the Easy Split api version', async () => {
        request.mockResolvedValueOnce({ data: { vendor_id: 'ondc_x', status: 'ACTIVE' } });
        const result = await getVendor('ondc_x', CONFIG);

        expect(result.exists).toBe(true);
        const sent = request.mock.calls[0][0];
        expect(sent.method).toBe('GET');
        expect(sent.url).toBe('https://sandbox.cashfree.com/pg/easy-split/vendors/ondc_x');
        expect(sent.headers['x-api-version']).toBe(EASY_SPLIT_API_VERSION);
        expect(sent.headers['x-api-version']).toBe('2022-09-01');
        expect(sent.headers['x-client-id']).toBe('CF_ID');
    });

    it('returns a result object, never throws, on a 500', async () => {
        request.mockRejectedValueOnce(httpError(500, { message: 'boom' }));
        await expect(getVendor('ondc_x', CONFIG)).resolves.toEqual({
            status: false,
            message: 'boom',
        });
    });
});

describe('createVendor', () => {
    it('POSTs to the vendors endpoint', async () => {
        request.mockResolvedValueOnce({ data: { vendor_id: 'ondc_x', status: 'ACTIVE' } });
        const result = await createVendor({ vendor_id: 'ondc_x' }, CONFIG);

        expect(result.status).toBe(true);
        const sent = request.mock.calls[0][0];
        expect(sent.method).toBe('POST');
        expect(sent.url).toBe('https://sandbox.cashfree.com/pg/easy-split/vendors');
        expect(sent.data).toEqual({ vendor_id: 'ondc_x' });
    });

    it('surfaces the rejection message Cashfree returns', async () => {
        request.mockRejectedValueOnce(httpError(400, { message: 'invalid ifsc' }));
        await expect(createVendor({ vendor_id: 'ondc_x' }, CONFIG)).resolves.toEqual({
            status: false,
            message: 'invalid ifsc',
        });
    });
});

describe('splitOrder', () => {
    it('posts the split rule for the Cashfree order and closes further splits', async () => {
        request.mockResolvedValueOnce({ data: { split: 'ok' } });
        const split = [
            { vendor_id: 'ondc_a', amount: 200, tags: { provider_id: 'P1' } },
            { vendor_id: 'ondc_b', amount: 55.5, tags: { provider_id: 'P2' } },
        ];

        const result = await splitOrder('peko_1758000000000', split, {}, CONFIG);

        expect(result.status).toBe(true);
        const sent = request.mock.calls[0][0];
        expect(sent.url).toBe(
            'https://sandbox.cashfree.com/pg/easy-split/orders/peko_1758000000000/split'
        );
        expect(sent.data).toEqual({ split, disable_split: true });
    });

    it('refuses to call Cashfree with nothing to split', async () => {
        await expect(splitOrder('peko_1', [], {}, CONFIG)).resolves.toMatchObject({ status: false });
        expect(request).not.toHaveBeenCalled();
    });

    it('requires a gateway order id', async () => {
        await expect(splitOrder(null, [{ vendor_id: 'v', amount: 1 }], {}, CONFIG)).resolves.toMatchObject({
            status: false,
        });
        expect(request).not.toHaveBeenCalled();
    });
});

describe('ensureEasySplitVendor', () => {
    it('registers the seller when Cashfree does not know them yet', async () => {
        request
            .mockRejectedValueOnce(httpError(404, {}))
            .mockResolvedValueOnce({ data: { vendor_id: 'x', status: 'IN_BENE_CREATION' } });
        const persist = jest.fn();

        const result = await ensureEasySplitVendor(ELIGIBLE_SELLER, {
            settings: SETTINGS,
            config: CONFIG,
            persist,
        });

        expect(result.created).toBe(true);
        expect(result.vendorStatus).toBe('IN_BENE_CREATION');
        expect(result.vendorId).toBe(buildVendorId(ELIGIBLE_SELLER.bppId, ELIGIBLE_SELLER.providerId));
        expect(request).toHaveBeenCalledTimes(2);
        expect(request.mock.calls[1][0].method).toBe('POST');
        expect(persist).toHaveBeenCalledWith(
            expect.objectContaining({ id: 12, cashfreeVendorStatus: 'IN_BENE_CREATION' })
        );
    });

    it('creates after Cashfree GET 400 vendor does not exist (docs path)', async () => {
        request
            .mockRejectedValueOnce(
                httpError(400, {
                    message: 'vendor does not exist',
                    code: 'api_request_failed',
                    type: 'invalid_request_error',
                })
            )
            .mockResolvedValueOnce({ data: { vendor_id: 'x', status: 'IN_BENE_CREATION' } });

        const result = await ensureEasySplitVendor(ELIGIBLE_SELLER, {
            settings: SETTINGS,
            config: CONFIG,
        });

        expect(result.created).toBe(true);
        expect(request).toHaveBeenCalledTimes(2);
        expect(request.mock.calls[1][0].method).toBe('POST');
        expect(request.mock.calls[1][0].url).toBe(
            'https://sandbox.cashfree.com/pg/easy-split/vendors'
        );
    });

    it('does NOT create the vendor when Cashfree already has them', async () => {
        request.mockResolvedValueOnce({ data: { vendor_id: 'ondc_x', status: 'ACTIVE' } });
        const persist = jest.fn();

        const result = await ensureEasySplitVendor(ELIGIBLE_SELLER, {
            settings: SETTINGS,
            config: CONFIG,
            persist,
        });

        expect(result.created).toBe(false);
        expect(request).toHaveBeenCalledTimes(1);
        expect(request.mock.calls[0][0].method).toBe('GET');
    });

    it('CONFIRMS a locally-registered seller with Cashfree instead of trusting the stored status', async () => {
        // A stored ACTIVE only proves the vendor was created once against SOME merchant.
        // It goes stale if the vendor is deleted or the configured cashfree_ondc account
        // changes, and one unknown vendor fails the split for every seller in the
        // checkout (one request, disable_split:true) — so the lookup is not optional.
        request.mockResolvedValueOnce({ data: { vendor_id: 'ondc_known', status: 'ACTIVE' } });

        const result = await ensureEasySplitVendor(
            { ...ELIGIBLE_SELLER, cashfreeVendorId: 'ondc_known', cashfreeVendorStatus: 'ACTIVE' },
            { settings: SETTINGS, config: CONFIG }
        );

        expect(result).toEqual({
            vendorId: 'ondc_known',
            created: false,
            confirmed: true,
            vendorStatus: 'ACTIVE',
        });
        expect(request).toHaveBeenCalledTimes(1);
        expect(request.mock.calls[0][0]).toMatchObject({ method: 'GET' });
    });

    it('recreates when the stored status says ACTIVE but Cashfree does not have the vendor', async () => {
        request
            .mockRejectedValueOnce(httpError(400, { message: 'vendor does not exist' }))
            .mockResolvedValueOnce({ data: { status: 'IN_BENE_CREATION' } });

        const result = await ensureEasySplitVendor(
            { ...ELIGIBLE_SELLER, cashfreeVendorId: 'ondc_stale', cashfreeVendorStatus: 'ACTIVE' },
            { settings: SETTINGS, config: CONFIG }
        );

        expect(result).toMatchObject({ created: true, vendorStatus: 'IN_BENE_CREATION' });
        expect(logFor('error', 'ensure-vendor').data.message).toContain('stale');
    });

    it('proceeds on the stored record when the confirmation lookup is inconclusive', async () => {
        // A Cashfree outage must not skip a seller we already know is registered —
        // being skipped costs them the payout entirely.
        request.mockRejectedValueOnce(httpError(503, { message: 'service unavailable' }));

        const result = await ensureEasySplitVendor(
            { ...ELIGIBLE_SELLER, cashfreeVendorId: 'ondc_known', cashfreeVendorStatus: 'ACTIVE' },
            { settings: SETTINGS, config: CONFIG }
        );

        expect(result).toMatchObject({ vendorId: 'ondc_known', created: false, confirmed: false });
        expect(result.error).toBeUndefined();
        // Must NOT blind-create on an inconclusive lookup.
        expect(request).toHaveBeenCalledTimes(1);
    });

    it('still creates for a masked seller using ONDC settlement bank details', async () => {
        request
            .mockRejectedValueOnce(
                httpError(400, { message: 'vendor does not exist', code: 'api_request_failed' })
            )
            .mockResolvedValueOnce({ data: { vendor_id: 'x', status: 'IN_BENE_CREATION' } });

        const result = await ensureEasySplitVendor(
            {
                ...ELIGIBLE_SELLER,
                splitEligible: false,
                ineligibleReason: 'masked_settlement_details',
                settlementBankAccountNo: 'XXXX',
                settlementIfscCode: 'XXXX',
            },
            { settings: SETTINGS, config: CONFIG }
        );

        expect(result.created).toBe(true);
        expect(request).toHaveBeenCalledTimes(2);
        const createBody = request.mock.calls[1][0].data;
        expect(createBody.bank.account_number).toBe('XXXX');
        expect(createBody.bank.ifsc).toBe('XXXX');
        expect(createBody.verify_account).toBe(true);
    });

    it('records the reason and clears ACTIVE when creation is rejected', async () => {
        request
            .mockRejectedValueOnce(httpError(404, {}))
            .mockRejectedValueOnce(httpError(400, { message: 'invalid account' }));
        const persist = jest.fn();

        const result = await ensureEasySplitVendor(ELIGIBLE_SELLER, {
            settings: SETTINGS,
            config: CONFIG,
            persist,
        });

        expect(result.error).toBe('vendor_create_failed');
        expect(persist).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 12,
                cashfreeVendorStatus: null,
                lastSyncError: 'invalid account',
            })
        );
    });

    it('recreates when Cashfree still returns the vendor_id but status is not ACTIVE', async () => {
        // Soft-delete / blocked ghosts: GET succeeds with a status string, but the
        // vendor is not settleable — must not reuse the dead id for the split.
        request
            .mockResolvedValueOnce({ data: { vendor_id: 'ondc_ghost', status: 'DELETED' } })
            .mockResolvedValueOnce({ data: { vendor_id: 'ondc_ghost', status: 'IN_BENE_CREATION' } });
        const persist = jest.fn();

        const result = await ensureEasySplitVendor(
            { ...ELIGIBLE_SELLER, cashfreeVendorId: 'ondc_ghost', cashfreeVendorStatus: 'ACTIVE' },
            { settings: SETTINGS, config: CONFIG, persist }
        );

        expect(result).toMatchObject({
            created: true,
            vendorId: 'ondc_ghost',
            vendorStatus: 'IN_BENE_CREATION',
        });
        expect(request).toHaveBeenCalledTimes(2);
        expect(request.mock.calls[1][0].method).toBe('POST');
        expect(logFor('error', 'ensure-vendor').data.message).toMatch(/not ACTIVE/i);
    });

    it('retries create with a versioned vendor_id when the sticky id is reserved', async () => {
        request
            .mockRejectedValueOnce(httpError(400, { message: 'vendor does not exist' }))
            .mockRejectedValueOnce(httpError(400, { message: 'vendor_id already exists' }))
            .mockResolvedValueOnce({ data: { vendor_id: 'ondc_stale_v2', status: 'IN_BENE_CREATION' } });
        const persist = jest.fn();

        const result = await ensureEasySplitVendor(
            { ...ELIGIBLE_SELLER, cashfreeVendorId: 'ondc_stale', cashfreeVendorStatus: 'ACTIVE' },
            { settings: SETTINGS, config: CONFIG, persist }
        );

        expect(result).toMatchObject({
            created: true,
            vendorId: 'ondc_stale_v2',
            vendorStatus: 'IN_BENE_CREATION',
        });
        expect(request).toHaveBeenCalledTimes(3);
        expect(request.mock.calls[1][0].data.vendor_id).toBe('ondc_stale');
        expect(request.mock.calls[2][0].data.vendor_id).toBe('ondc_stale_v2');
        expect(persist).toHaveBeenCalledWith(
            expect.objectContaining({
                cashfreeVendorId: 'ondc_stale_v2',
                cashfreeVendorStatus: 'IN_BENE_CREATION',
            })
        );
    });
});

describe('vendor id helpers', () => {
    it('marks only ACTIVE as usable', () => {
        expect(isUsableCashfreeVendorStatus('ACTIVE')).toBe(true);
        expect(isUsableCashfreeVendorStatus('IN_BENE_CREATION')).toBe(false);
        expect(isUsableCashfreeVendorStatus('DELETED')).toBe(false);
        expect(isUsableCashfreeVendorStatus(null)).toBe(false);
    });

    it('detects vendor_id conflict messages', () => {
        expect(isVendorIdConflictMessage('vendor_id already exists')).toBe(true);
        expect(isVendorIdConflictMessage('duplicate vendor')).toBe(true);
        expect(isVendorIdConflictMessage('vendor does not exist')).toBe(false);
        expect(isVendorIdConflictMessage('invalid account')).toBe(false);
    });

    it('builds versioned vendor ids', () => {
        expect(nextVendorId('ondc_seller_abc', 1)).toBe('ondc_seller_abc');
        expect(nextVendorId('ondc_seller_abc', 2)).toBe('ondc_seller_abc_v2');
        expect(nextVendorId('ondc_seller_abc_v2', 3)).toBe('ondc_seller_abc_v3');
    });
});

/**
 * These assert the logs carry what a human actually needs when money didn't move.
 * They are the contract for debuggability, so they are worth pinning.
 */
describe('debug logging', () => {
    it('logs a rejected split with the Cashfree body, the request and a masked secret', async () => {
        request.mockRejectedValueOnce(
            httpError(422, {
                message: 'split amount exceeds order amount',
                code: 'order_amount_error',
                type: 'invalid_request_error',
            })
        );

        await splitOrder(
            'peko_1758000000000',
            [{ vendor_id: 'ondc_a', amount: 500, tags: { provider_id: 'P1' } }],
            { logTraceId: 'trace-1' },
            CONFIG
        );

        const before = logFor('info', 'split-request');
        const entry = logFor('error', 'split-response');
        expect(before).toBeDefined();
        expect(before.data.requestPayload).toEqual({
            split: [{ vendor_id: 'ondc_a', amount: 500, tags: { provider_id: 'P1' } }],
            disable_split: true,
        });
        expect(entry).toBeDefined();
        expect(entry.type).toBe('VENDOR');
        expect(entry.data).toMatchObject({
            scope: 'easySplit',
            gatewayOrderId: 'peko_1758000000000',
            httpStatus: 422,
            cashfreeCode: 'order_amount_error',
            cashfreeMessage: 'split amount exceeds order amount',
            splitTotal: 500,
        });
        expect(entry.data.requestPayload).toEqual({
            split: [{ vendor_id: 'ondc_a', amount: 500, tags: { provider_id: 'P1' } }],
            disable_split: true,
        });
        expect(entry.maskFields).toEqual(expect.arrayContaining(['clientSecret', 'x-client-secret']));
        expect(customLog.mock.calls[0][0]).toBe('trace-1');
    });

    it('says which credential field is missing when config is incomplete', async () => {
        findServiceOperatorByAccessKey.mockResolvedValueOnce({
            id: 9,
            paymentclientid: 'CF_ID',
            paymentclientsecret: null,
            vendor: { id: 3, optional1: null, optional2: null, apiUrl: null },
        });

        const result = await resolveConfig('trace-2');

        expect(result.error).toMatch(/Incomplete Cashfree configuration/);
        const entry = logFor('error', 'config');
        expect(entry.data.have).toEqual({ clientId: true, clientSecret: false, baseUrl: false });
        expect(entry.data.accessKey).toBe('cashfree_ondc');
        expect(entry.data.serviceOperatorId).toBe(9);
    });

    it('explains a silent no-op when the serviceOperator row is missing', async () => {
        findServiceOperatorByAccessKey.mockResolvedValueOnce(null);

        await expect(isEasySplitEnabled('trace-3')).resolves.toBe(false);

        const entry = logFor('error', 'enabled-check');
        expect(entry.data.message).toMatch(/cashfree_ondc/);
        expect(entry.data.message).toMatch(/serviceStatus = true/);
    });

    it('explains a deliberate off-switch at info level, not as an error', async () => {
        findServiceOperatorByAccessKey.mockResolvedValueOnce({ id: 9, serviceStatus: false });

        await expect(isEasySplitEnabled('trace-4')).resolves.toBe(false);

        expect(logsAt('error')).toHaveLength(0);
        expect(logFor('info', 'enabled-check').data.message).toMatch(/serviceStatus = false/);
    });

    it('logs masked settlement then still hits Cashfree create with ONDC bank details', async () => {
        request
            .mockRejectedValueOnce(
                httpError(400, { message: 'vendor does not exist', code: 'api_request_failed' })
            )
            .mockResolvedValueOnce({ data: { vendor_id: 'x', status: 'IN_BENE_CREATION' } });

        const result = await ensureEasySplitVendor(
            {
                ...ELIGIBLE_SELLER,
                splitEligible: false,
                ineligibleReason: 'masked_settlement_details',
                settlementBankAccountNo: 'XXXX',
                settlementIfscCode: 'XXXX',
            },
            { settings: SETTINGS, config: CONFIG, logTraceId: 'trace-5' }
        );

        expect(result.created).toBe(true);
        const entry = logFor('info', 'ensure-vendor');
        expect(entry.data.message).toMatch(/ONDC on_init settlement/);
        expect(entry.data).toMatchObject({ providerId: 'P1', splitEligible: false });
    });
});
