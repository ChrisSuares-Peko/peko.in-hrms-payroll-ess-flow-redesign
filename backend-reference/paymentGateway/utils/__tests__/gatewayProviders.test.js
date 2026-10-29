jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../cacheDataMethods', () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../checkAndFetchServiceDetails', () => ({ findServiceOperatorByAccessKey: jest.fn() }));
jest.mock('../../models/entities/paymentGatewayOrders', () => ({ update: jest.fn(), findOne: jest.fn() }));

const axios = require('axios');
const { findServiceOperatorByAccessKey } = require('../checkAndFetchServiceDetails');
const paymentGatewayOrders = require('../../models/entities/paymentGatewayOrders');
const { GATEWAY_PROVIDER } = require('../../constants/gatewayProviders');
const {
    getGatewayProvider,
    getOrderGatewayProvider,
    isGatewayProviderEligible,
    verifyGatewayOrder,
    reopenPaidGatewayOrder,
    extractPaymentRefId,
} = require('../gatewayProviders');

const PROVIDER = GATEWAY_PROVIDER.MSWIPE;
const OPERATOR = {
    vendor: {
        apiUrl: 'https://dcuat.mswipetech.co.in',
        optional1: 'client-id',
        optional2: 'secret',
        optional3: 'user-id',
        optional4: 'CUST001',
    },
};
const PAID_RECORD = {
    IPG_ID: 'IPG1',
    Amount: 1000,
    Payment_Status: 1,
    Order_Id: '1729000000000',
    PaymentType: 'QR',
};
const ORDER = { paymentRefId: '1729000000000', referenceNo: 'TRANS123', pgProvider: PROVIDER };

beforeEach(() => {
    jest.clearAllMocks();
    findServiceOperatorByAccessKey.mockResolvedValue(OPERATOR);
});

describe('provider registry', () => {
    it('registers the Mswipe adapter and leaves Cashfree and CC Avenue on their own flows', () => {
        expect(getGatewayProvider(GATEWAY_PROVIDER.MSWIPE)).not.toBeNull();
        expect(getGatewayProvider(GATEWAY_PROVIDER.CASHFREE)).toBeNull();
        expect(getGatewayProvider(GATEWAY_PROVIDER.CCAVENUE)).toBeNull();
    });

    it('ignores unknown providers and inherited keys', () => {
        expect(getGatewayProvider('cashfree_pg')).toBeNull();
        expect(getGatewayProvider('constructor')).toBeNull();
        expect(getGatewayProvider(undefined)).toBeNull();
    });

    it('resolves an order gateway from its provider', () => {
        expect(getOrderGatewayProvider({ pgProvider: PROVIDER })).toBe(getGatewayProvider(PROVIDER));
        expect(getOrderGatewayProvider({ pgProvider: null })).toBeNull();
    });
});

describe('service eligibility', () => {
    it('keeps bill payments, Office Supplies, ONDC and mandate subscriptions on their current gateways', () => {
        expect(isGatewayProviderEligible({ accessKey: 'bbps_telecom_postpaid' })).toBe(false);
        expect(isGatewayProviderEligible({ accessKey: 'bbps_utility_education' })).toBe(false);
        expect(isGatewayProviderEligible({ accessKey: 'ecommerce' })).toBe(false);
        expect(isGatewayProviderEligible({ accessKey: 'tbo_airline', billerId: 'BILLER1' })).toBe(false);
        expect(isGatewayProviderEligible({ accessKey: 'gift-card', isOndc: true })).toBe(false);
        expect(isGatewayProviderEligible({ accessKey: 'REDACTED', isSubscriptionMandate: true })).toBe(false);
        expect(isGatewayProviderEligible({ accessKey: '' })).toBe(false);
    });

    it('allows other services, including numeric catalogue keys', () => {
        expect(isGatewayProviderEligible({ accessKey: 'tbo_airline' })).toBe(true);
        expect(isGatewayProviderEligible({ accessKey: 'REDACTED' })).toBe(true);
        expect(isGatewayProviderEligible({ accessKey: 1042 })).toBe(true);
    });
});

describe('verifyGatewayOrder', () => {
    const verify = (orderDetails = ORDER) =>
        verifyGatewayOrder({ orderDetails, paymentBodyData: { pgAmount: '1000.00' } });

    it('returns the provider result', async () => {
        axios.post.mockResolvedValueOnce({ data: { Status: 'True', Data: [PAID_RECORD] } });

        const { orderStatus, paymentResponse } = await verify();

        expect(orderStatus).toBe('SUCCESS');
        expect(paymentResponse[0]).toMatchObject({ gateway: PROVIDER, order_id: '1729000000000' });
        expect(findServiceOperatorByAccessKey).toHaveBeenCalledWith(PROVIDER);
    });

    it('falls back to the reference stored with the order data', async () => {
        axios.post.mockResolvedValueOnce({ data: { Status: 'True', Data: [] } });

        await verifyGatewayOrder({
            orderDetails: { ...ORDER, referenceNo: null },
            paymentBodyData: { pgAmount: '1000.00', gatewayOrder: { reference: 'STORED' } },
        });

        expect(axios.post.mock.calls[0][1]).toEqual({ id: 'STORED' });
    });

    it('keeps the order pending when the provider call fails', async () => {
        axios.post.mockRejectedValueOnce(new Error('timeout'));

        await expect(verify()).resolves.toMatchObject({ orderStatus: 'PENDING' });
    });

    it('keeps the order pending when the provider is not configured', async () => {
        findServiceOperatorByAccessKey.mockResolvedValueOnce({ error: 'Service is disabled' });

        await expect(verify()).resolves.toMatchObject({ orderStatus: 'PENDING' });
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('keeps the order pending without a provider reference', async () => {
        await expect(verify({ ...ORDER, referenceNo: null })).resolves.toMatchObject({ orderStatus: 'PENDING' });
        expect(axios.post).not.toHaveBeenCalled();
    });
});

describe('reopenPaidGatewayOrder', () => {
    const declinedOrder = {
        ...ORDER,
        status: 'FAILED',
        paymentResponse: JSON.stringify({ gateway: PROVIDER, orderStatus: 'FAILURE', reason: 'declined' }),
    };
    const reopen = (orderDetails) => reopenPaidGatewayOrder({ orderDetails, paymentBodyData: { pgAmount: '1000.00' } });

    it('reopens a declined order that was later paid', async () => {
        axios.post.mockResolvedValueOnce({ data: { Status: 'True', Data: [PAID_RECORD] } });
        paymentGatewayOrders.update.mockResolvedValueOnce([1]);
        paymentGatewayOrders.findOne.mockResolvedValueOnce({ ...declinedOrder, status: 'ORDERED' });

        const reopened = await reopen(declinedOrder);

        expect(paymentGatewayOrders.update).toHaveBeenCalledWith(
            { status: 'ORDERED' },
            { where: { paymentRefId: '1729000000000', status: 'FAILED' } }
        );
        expect(reopened.status).toBe('ORDERED');
    });

    it('leaves a declined order alone while it is still unpaid', async () => {
        axios.post.mockResolvedValueOnce({ data: { Status: 'True', Data: [{ ...PAID_RECORD, Payment_Status: 0 }] } });

        expect(await reopen(declinedOrder)).toBe(declinedOrder);
        expect(paymentGatewayOrders.update).not.toHaveBeenCalled();
    });

    it('never reopens an order that failed after fulfilment started', async () => {
        const fulfilmentFailed = { ...declinedOrder, paymentResponse: JSON.stringify([{ gateway: PROVIDER, payment_status: 'SUCCESS' }]) };

        expect(await reopen(fulfilmentFailed)).toBe(fulfilmentFailed);
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('does nothing for orders that are not failed', async () => {
        const ordered = { ...declinedOrder, status: 'ORDERED' };

        expect(await reopen(ordered)).toBe(ordered);
        expect(axios.post).not.toHaveBeenCalled();
    });
});

describe('helpers', () => {
    it('extracts the order reference even when the gateway appends parameters', () => {
        expect(extractPaymentRefId('1729000000000?status=success')).toBe('1729000000000');
        expect(extractPaymentRefId('abc')).toBeNull();
        expect(extractPaymentRefId(undefined)).toBeNull();
    });
});
