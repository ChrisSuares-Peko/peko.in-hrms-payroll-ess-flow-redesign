/**
 * Guards the invariant that broke /cashfree-gateway/complete with a 500
 * "Payment failed": create-order and the completion paths MUST authenticate as
 * the same Cashfree merchant. A Cashfree order exists only on the merchant it was
 * created against, so any drift makes the payments lookup 404 and throws after the
 * buyer's money has already left.
 */
const { pickCashfreeCredentials, hasCashfreeCredentials } = require('../../../utils/cashfreeMerchant');

const SHARED = {
    accessKey: 'cashfree_pg',
    vendor: {
        optional1: 'SHARED_ID',
        optional2: 'SHARED_SECRET',
        optional3: '2023-08-01',
        apiUrl: 'https://sandbox.cashfree.com',
    },
};

const ONDC = {
    accessKey: 'cashfree_ondc',
    paymentclientid: 'ONDC_ID',
    paymentclientsecret: 'REDACTED',
    vendor: {
        optional1: null,
        optional2: null,
        optional3: '2022-09-01',
        apiUrl: 'https://sandbox.cashfree.com',
    },
};

const ECOMMERCE = {
    accessKey: 'ecommerce',
    paymentclientid: 'ECOM_ID',
    paymentclientsecret: 'REDACTED',
};

describe('pickCashfreeCredentials', () => {
    it('uses the ONDC merchant for an ONDC payment', () => {
        expect(pickCashfreeCredentials({ shared: SHARED, individual: ECOMMERCE, ondc: ONDC })).toEqual({
            clientId: 'ONDC_ID',
            clientSecret: 'REDACTED',
            baseUrl: 'https://sandbox.cashfree.com',
            version: '2022-09-01',
            merchant: 'cashfree_ondc',
        });
    });

    it('keeps the historical cascade for non-ONDC payments', () => {
        expect(pickCashfreeCredentials({ shared: SHARED, individual: ECOMMERCE })).toMatchObject({
            clientId: 'ECOM_ID',
            clientSecret: 'REDACTED',
            merchant: 'ecommerce',
        });
    });

    it('falls back to the shared vendor row when the service has no own credentials', () => {
        expect(pickCashfreeCredentials({ shared: SHARED, individual: { accessKey: 'x' } })).toMatchObject({
            clientId: 'SHARED_ID',
            clientSecret: 'REDACTED',
            merchant: 'cashfree_pg',
        });
    });

    it('reads ONDC credentials off the vendor row when the operator has none', () => {
        const ondcViaVendor = {
            accessKey: 'cashfree_ondc',
            vendor: { optional1: 'V_ID', optional2: 'V_SECRET', optional3: '2022-09-01', apiUrl: 'https://x' },
        };
        expect(pickCashfreeCredentials({ shared: SHARED, ondc: ondcViaVendor })).toMatchObject({
            clientId: 'V_ID',
            clientSecret: 'REDACTED',
            baseUrl: 'https://x',
        });
    });

    it('never mixes merchants — an ONDC baseUrl is never paired with shared credentials', () => {
        const result = pickCashfreeCredentials({ shared: SHARED, individual: ECOMMERCE, ondc: ONDC });
        expect(result.clientId).not.toBe(SHARED.vendor.optional1);
        expect(result.clientId).not.toBe(ECOMMERCE.paymentclientid);
    });

    // THE regression: the same payment resolved at create-order time and again at
    // /complete must produce identical credentials.
    it.each([
        ['ONDC payment', ONDC],
        ['non-ONDC payment', null],
    ])('resolves identically at create-order and at /complete for a %s', (_label, ondc) => {
        const atCreateOrder = pickCashfreeCredentials({ shared: SHARED, individual: ECOMMERCE, ondc });
        const atComplete = pickCashfreeCredentials({ shared: SHARED, individual: ECOMMERCE, ondc });
        expect(atComplete).toEqual(atCreateOrder);
    });
});

describe('hasCashfreeCredentials', () => {
    it('accepts an operator with its own credentials', () => {
        expect(hasCashfreeCredentials(ONDC)).toBe(true);
    });

    it('accepts an operator whose vendor row carries them', () => {
        expect(hasCashfreeCredentials({ vendor: { optional1: 'a', optional2: 'b' } })).toBe(true);
    });

    // An operator row with an apiUrl but no keys must be rejected outright,
    // otherwise its baseUrl would be used with another merchant's credentials.
    it('rejects a half-configured operator', () => {
        expect(hasCashfreeCredentials({ vendor: { apiUrl: 'https://x' } })).toBe(false);
        expect(hasCashfreeCredentials({ paymentclientid: 'a', vendor: {} })).toBe(false);
        expect(hasCashfreeCredentials(null)).toBe(false);
    });
});
