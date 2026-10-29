jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../cacheDataMethods', () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));

const axios = require('axios');
const { getValue, setValue } = require('../cacheDataMethods');
const mswipe = require('../gatewayProviders/mswipe');

const OPERATOR = {
    vendor: {
        apiUrl: 'https://dcuat.mswipetech.co.in/',
        optional1: 'client-id',
        optional2: 'secret',
        optional3: 'user-id',
        optional4: 'CUST001',
    },
};
const CREDENTIALS = mswipe.paymentCredentials(OPERATOR);
const PAYMENT_URL = 'https://dcuat.mswipetech.co.in/pay-by-link/payment-options?TransID=TRANS123';
const ORDER = {
    paymentRefId: '1729000000000',
    amount: '1000.00',
    customer: { name: 'Buyer', mobileNo: '9876543210', email: 'buyer@example.com' },
    returnUrl: 'https://api.example/return?orderId=1729000000000',
    note: 'tbo_airline',
};
const PAID_RECORD = {
    IPG_ID: 'IPG000000021511',
    Amount: 1000,
    Payment_Status: 1,
    Order_Id: '1729000000000',
    Payment_Id: '000007963164',
    TrxDateTime: '2026-10-20T10:00:00',
    CardNumber: '1234',
    CardType: 'C',
    PaymentType: 'VISA',
    MID: 'MID1',
    TID: 'TID1',
};

const tokenWithExpiry = (exp) =>
    ['header', Buffer.from(JSON.stringify({ exp })).toString('base64url'), 'signature'].join('.');

beforeEach(() => {
    jest.clearAllMocks();
    getValue.mockResolvedValue('session-token');
});

describe('credentials and order checks', () => {
    it('reads Optional 1-4 of the Mswipe vendor and needs all of them', () => {
        expect(CREDENTIALS).toEqual({
            apiUrl: 'https://dcuat.mswipetech.co.in',
            clientId: 'client-id',
            secretKey: 'secret',
            userId: 'user-id',
            custCode: 'CUST001',
        });
        expect(mswipe.paymentCredentials({ vendor: { ...OPERATOR.vendor, optional4: '' } })).toBeNull();
        expect(mswipe.paymentCredentials(null)).toBeNull();
    });

    it('ignores the per-service Cashfree overrides and named options', () => {
        const overridesOnly = {
            paymentclientid: 'cashfree-id',
            paymentclientsecret: 'REDACTED',
            vendor: {
                apiUrl: OPERATOR.vendor.apiUrl,
                optionals: { clientId: 'client-id', secretKey: 'secret', userId: 'user-id', custCode: 'CUST001' },
            },
        };
        expect(mswipe.paymentCredentials(overridesOnly)).toBeNull();
    });

    it('needs the buyer mobile number and email', () => {
        expect(mswipe.missingOrderDetails(ORDER)).toBeNull();
        expect(mswipe.missingOrderDetails({ ...ORDER, customer: { ...ORDER.customer, mobileNo: '' } })).toMatch(/mobile number/);
        expect(mswipe.missingOrderDetails({ ...ORDER, customer: { ...ORDER.customer, email: '' } })).toMatch(/email address/);
    });
});

describe('helpers', () => {
    it('caches the session token until an hour before it expires', () => {
        const nowMs = Date.UTC(2026, 9, 20);
        expect(mswipe.sessionTokenTtlSeconds(tokenWithExpiry(nowMs / 1000 + 86400), nowMs)).toBe(86400 - 3600);
        expect(mswipe.sessionTokenTtlSeconds(tokenWithExpiry(nowMs / 1000 + 10), nowMs)).toBe(60);
        expect(mswipe.sessionTokenTtlSeconds('not-a-jwt', nowMs)).toBe(24 * 60 * 60);
    });

    it('sets the link to expire on the next IST calendar day', () => {
        expect(mswipe.linkValidityDate(Date.parse('2026-10-20T20:00:00Z'))).toBe('2026-10-22');
        expect(mswipe.linkValidityDate(Date.parse('2026-10-20T05:00:00Z'))).toBe('2026-10-21');
    });

    it('extracts the TransID from the payment link', () => {
        expect(mswipe.parseTransId(PAYMENT_URL)).toBe('TRANS123');
        expect(mswipe.parseTransId('not a url')).toBeNull();
    });

    it('reads the order reference from a BackPosting', () => {
        expect(mswipe.parseNotification({ ME_InvNo: '1729', IPG_ID: 'IPG1', TRAN_STATUS: 'approved' })).toEqual({
            paymentRefId: '1729',
            providerOrderId: 'IPG1',
            status: 'approved',
        });
        expect(mswipe.parseNotification({ InvNo: '1730' }).paymentRefId).toBe('1730');
    });
});

describe('createOrder', () => {
    it('creates a payment link with the cached session token', async () => {
        axios.post.mockResolvedValueOnce({
            data: { status: 'True', txn_id: 'IPG1', smslink: PAYMENT_URL, responsecode: '200' },
        });

        const created = await mswipe.createOrder({ credentials: CREDENTIALS, order: ORDER });

        expect(created).toEqual({ paymentUrl: PAYMENT_URL, reference: 'TRANS123', providerOrderId: 'IPG1' });
        const [url, body] = axios.post.mock.calls[0];
        expect(url).toBe('https://dcuat.mswipetech.co.in/ipg/api/MswipePayment');
        expect(body).toMatchObject({
            amount: '1000.00',
            mobileno: '9876543210',
            email_id: 'buyer@example.com',
            invoice_id: '1729000000000',
            redirect_url: ORDER.returnUrl,
            sessiontoken: 'session-token',
            custcode: 'CUST001',
            IsSendSMS: false,
            ConvAllow: 'false',
            ClientId: 'client-id',
        });
    });

    it('refreshes a rejected session token once', async () => {
        axios.post
            .mockResolvedValueOnce({ data: { status: 'False', responsemessage: 'invalid token or not authorized' } })
            .mockResolvedValueOnce({ data: { status: 'true', token: 'fresh-token' } })
            .mockResolvedValueOnce({ data: { status: 'True', txn_id: 'IPG1', smslink: PAYMENT_URL } });

        await mswipe.createOrder({ credentials: CREDENTIALS, order: ORDER });

        expect(axios.post.mock.calls[1][0]).toBe('https://dcuat.mswipetech.co.in/ipg/api/CreatePBLAuthToken');
        expect(axios.post.mock.calls[1][1]).toMatchObject({ clientId: 'client-id', password: 'secret', userId: 'user-id' });
        expect(setValue).toHaveBeenCalledWith('mswipe:pbl:sessionToken:client-id', expect.any(Number), 'fresh-token');
        expect(axios.post.mock.calls[2][1].sessiontoken).toBe('fresh-token');
    });

    it('fails when Mswipe does not return a payment link', async () => {
        axios.post.mockResolvedValueOnce({ data: { status: 'False', responsemessage: 'request id already exist' } });

        await expect(mswipe.createOrder({ credentials: CREDENTIALS, order: ORDER })).rejects.toThrow(
            'Mswipe payment link creation was rejected'
        );
    });
});

describe('payment status', () => {
    const resolve = (Data, expectedAmount = '1000.00') =>
        mswipe.resolvePaymentStatus({ Status: 'True', Data }, { paymentRefId: '1729000000000', expectedAmount });

    it('succeeds when a paid record matches the order and amount', () => {
        expect(resolve([PAID_RECORD])).toMatchObject({ orderStatus: 'SUCCESS', record: PAID_RECORD });
        expect(resolve([{ ...PAID_RECORD, Order_Id: '' }]).orderStatus).toBe('SUCCESS');
    });

    it('refuses a paid record for another order or amount', () => {
        expect(resolve([{ ...PAID_RECORD, Order_Id: '999' }])).toMatchObject({ orderStatus: 'FAILURE', reason: 'orderMismatch' });
        expect(resolve([PAID_RECORD], '999.99')).toMatchObject({ orderStatus: 'FAILURE', reason: 'amountMismatch' });
    });

    it('stays pending until Mswipe reports an outcome', () => {
        expect(resolve([]).orderStatus).toBe('PENDING');
        expect(resolve([{ ...PAID_RECORD, Payment_Status: 2 }]).orderStatus).toBe('PENDING');
    });

    it('fails when every attempt was declined', () => {
        expect(resolve([{ ...PAID_RECORD, Payment_Status: 0 }])).toMatchObject({ orderStatus: 'FAILURE', reason: 'declined' });
    });

    it('verifies the order through the status API', async () => {
        axios.post.mockResolvedValueOnce({ data: { Status: 'True', Data: [PAID_RECORD] } });

        const { orderStatus, paymentResponse } = await mswipe.verifyOrder({
            credentials: CREDENTIALS,
            reference: 'TRANS123',
            paymentRefId: '1729000000000',
            expectedAmount: '1000.00',
        });

        expect(orderStatus).toBe('SUCCESS');
        expect(axios.post.mock.calls[0]).toEqual([
            'https://dcuat.mswipetech.co.in/ipg/api/getPBLTransactionDetails',
            { id: 'TRANS123' },
            expect.any(Object),
        ]);
        expect(paymentResponse[0]).toMatchObject({ gateway: mswipe.provider, payment_group: 'credit_card' });
    });

    it('keeps the order pending when Mswipe rejects the lookup', async () => {
        axios.post.mockResolvedValueOnce({ data: { Status: 'False', ResponseMessage: 'invalid id' } });

        await expect(
            mswipe.verifyOrder({ credentials: CREDENTIALS, reference: 'X', paymentRefId: '1', expectedAmount: '1' })
        ).resolves.toMatchObject({ orderStatus: 'PENDING' });
    });
});

describe('toGatewayPaymentResponse', () => {
    it('describes a card payment the way receipts and refunds expect', () => {
        const [payment] = mswipe.toGatewayPaymentResponse(PAID_RECORD, { paymentRefId: '1729000000000', reference: 'TRANS123' });
        expect(payment).toMatchObject({
            gateway: mswipe.provider,
            order_id: '1729000000000',
            payment_status: 'SUCCESS',
            payment_amount: 1000,
            payment_group: 'credit_card',
            payment_method: { card: { card_network: 'visa', card_number: 'XXXXXXXXXXXX1234', card_type: 'credit_card' } },
            bank_reference: '000007963164',
            gatewayDetails: { providerOrderId: 'IPG000000021511', reference: 'TRANS123' },
        });
    });

    it('describes a UPI QR payment as UPI', () => {
        const [payment] = mswipe.toGatewayPaymentResponse(
            { ...PAID_RECORD, PaymentType: 'QR', CardType: '' },
            { paymentRefId: '1', reference: 'T' }
        );
        expect(payment).toMatchObject({ payment_group: 'upi', payment_method: { upi: {} } });
    });
});
