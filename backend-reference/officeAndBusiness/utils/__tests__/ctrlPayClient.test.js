const crypto = require('crypto');
const axios = require('axios');

jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../cacheDataMethods', () => ({
    client: { set: jest.fn().mockResolvedValue('OK'), del: jest.fn().mockResolvedValue(1) },
}));
jest.mock('../../models/use-cases/ctrlPayConnection', () => ({
    findCtrlPayConnection: jest.fn(),
    updateCtrlPayConnection: jest.fn(),
}));
jest.mock('../ctrlPay/oauth', () => ({
    ...jest.requireActual('../ctrlPay/oauth'),
    refreshIdToken: jest.fn(),
}));
jest.mock('../checkAndFetchServiceDetails', () => ({ findServiceOperatorByAccessKey: jest.fn() }));

const { findServiceOperatorByAccessKey } = require('../checkAndFetchServiceDetails');
const { customLog } = require('../loggerHelper');
const { findCtrlPayConnection, updateCtrlPayConnection } = require('../../models/use-cases/ctrlPayConnection');
const { CtrlPayAuthError, refreshIdToken } = require('../ctrlPay/oauth');
const { CtrlPayError, createCtrlPaySession } = require('../ctrlPay/client');
const { sealPayload } = require('../ctrlPay/envelope');
const { openToken, sealToken } = require('../ctrlPay/tokenCipher');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const TOKEN_KEY = 'cd'.repeat(32);
const tokenKey = Buffer.from(TOKEN_KEY, 'hex');
const BASE_URL = 'https://uat.ctrlpay.example';
const ORIGINAL_ENV = { ...process.env };

const idToken = (label, expiresInSeconds = 3600) =>
    [
        'header',
        Buffer.from(JSON.stringify({ sub: 'sub-1', exp: Math.floor(Date.now() / 1000) + expiresInSeconds })).toString(
            'base64url'
        ),
        label,
    ].join('.');

const connection = (overrides = {}) => ({
    corporateId: 77,
    status: 'CONNECTED',
    idToken: sealToken(idToken('sigCurrentX1'), tokenKey),
    idTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
    refreshToken: sealToken('refresh-token', tokenKey),
    ...overrides,
});

const openRequest = (body) => {
    const key = crypto.privateDecrypt(
        { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
        Buffer.from(body.encrypted_key, 'base64')
    );
    const nonce = Buffer.from(body.nonce, 'base64');
    const raw = Buffer.from(body.ciphertext, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAuthTag(raw.subarray(raw.length - 16));
    const params = JSON.parse(Buffer.concat([decipher.update(raw.subarray(0, raw.length - 16)), decipher.final()]));
    return { key, nonce, params };
};

const encryptedReply = (status, message) => (url, body) => {
    const { key, nonce } = openRequest(body);
    return Promise.resolve({
        status,
        data: { message: { ciphertext: sealPayload({ message }, key, nonce).toString('base64') } },
    });
};

beforeEach(() => {
    jest.clearAllMocks();
    process.env.CTRLPAY_TOKEN_ENCRYPTION_KEY = TOKEN_KEY;
    findServiceOperatorByAccessKey.mockResolvedValue({
        vendor: {
            apiUrl: BASE_URL,
            optional1: 'peko-client',
            optional2: 'https://auth.uat.ctrlpay.example',
            optional3: publicKey.export({ type: 'spki', format: 'pem' }),
            optional4: 'https://app.peko.example/ctrlpay/callback',
            optional5: 'PEKO01',
        },
    });
    findCtrlPayConnection.mockResolvedValue(connection());
});

afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
});

describe('CTRLPay client', () => {
    it('encrypts the request, sends the ID token and decrypts the reply', async () => {
        axios.post.mockImplementation(encryptedReply(200, { status: 'CKYC_BULK_PENDING' }));

        const session = await createCtrlPaySession({ corporateId: 77, logTraceId: 'trace' });
        const result = await session.call('onboarding.ckyc_search_pan_and_mobile', {
            pan: 'AAFCV4821K',
            mobile: '9820012345',
        });

        expect(result).toEqual({ httpStatus: 200, payload: { status: 'CKYC_BULK_PENDING' } });
        const [url, body, options] = axios.post.mock.calls[0];
        expect(url).toBe(`${BASE_URL}/api/method/boomerang_frappe_service.gateway.onboarding.ckyc_search_pan_and_mobile`);
        expect(options.headers.Authorization).toMatch(/^Bearer header\.[A-Za-z0-9_-]+\.sigCurrentX1$/);
        expect(Object.keys(body).sort()).toEqual(['ciphertext', 'encrypted_key', 'nonce']);
        expect(openRequest(body).params).toEqual({ pan: 'AAFCV4821K', mobile: '9820012345' });
    });

    it('reads plaintext payloads such as the UPI ID', async () => {
        axios.post.mockResolvedValue({ status: 200, data: { message: 'vanta.logistics@ctrlpay' } });

        const session = await createCtrlPaySession({ corporateId: 77 });

        expect(await session.call('onboarding.get_vpa')).toEqual({ httpStatus: 200, payload: 'vanta.logistics@ctrlpay' });
    });

    it('refreshes once and retries once on a 401, storing the new token sealed', async () => {
        axios.post
            .mockResolvedValueOnce({ status: 401, data: { message: 'Unauthorized' } })
            .mockImplementationOnce(encryptedReply(200, { status: 'SUCCESS' }));
        refreshIdToken.mockResolvedValue({ idToken: idToken('sigFreshX2'), refreshToken: null, expiresIn: 3600 });

        const session = await createCtrlPaySession({ corporateId: 77 });
        const result = await session.call('user.get_customer_name');

        expect(result.httpStatus).toBe(200);
        expect(refreshIdToken).toHaveBeenCalledWith(expect.anything(), 'refresh-token');
        expect(axios.post.mock.calls[1][2].headers.Authorization).toMatch(/\.sigFreshX2$/);
        const [, stored] = updateCtrlPayConnection.mock.calls[0];
        expect(stored.idToken).not.toContain('sigFreshX2');
        expect(openToken(stored.idToken, tokenKey)).toMatch(/\.sigFreshX2$/);
        expect(stored).not.toHaveProperty('refreshToken');
    });

    it('asks for a new sign-in when the retry is still unauthorised', async () => {
        axios.post.mockResolvedValue({ status: 401, data: { message: 'Unauthorized' } });
        refreshIdToken.mockResolvedValue({ idToken: idToken('sigFreshX2'), refreshToken: null, expiresIn: 3600 });

        const session = await createCtrlPaySession({ corporateId: 77 });
        const error = await session.call('user.get_customer_name').catch((caught) => caught);

        expect(error).toBeInstanceOf(CtrlPayError);
        expect(error.kind).toBe('RECONNECT_REQUIRED');
        expect(axios.post).toHaveBeenCalledTimes(2);
        expect(updateCtrlPayConnection).toHaveBeenLastCalledWith(77, expect.objectContaining({
            status: 'RECONNECT_REQUIRED',
            refreshToken: null,
        }));
    });

    it('refreshes before calling when the ID token is about to expire', async () => {
        findCtrlPayConnection.mockResolvedValue(connection({ idTokenExpiresAt: new Date(Date.now() + 10 * 1000) }));
        refreshIdToken.mockResolvedValue({ idToken: idToken('sigFreshX2'), refreshToken: 'rotated', expiresIn: 3600 });
        axios.post.mockImplementation(encryptedReply(200, { status: 'SUCCESS' }));

        const session = await createCtrlPaySession({ corporateId: 77 });
        await Promise.all([session.call('user.get_customer_name'), session.call('onboarding.get_vpa')]);

        expect(refreshIdToken).toHaveBeenCalledTimes(1);
        expect(openToken(updateCtrlPayConnection.mock.calls[0][1].refreshToken, tokenKey)).toBe('rotated');
    });

    it('asks for a new sign-in when the refresh token is rejected', async () => {
        findCtrlPayConnection.mockResolvedValue(connection({ idTokenExpiresAt: new Date(Date.now() - 1000) }));
        refreshIdToken.mockRejectedValue(
            new CtrlPayAuthError('rejected', { httpStatus: 400, oauthError: 'invalid_grant' })
        );

        const session = await createCtrlPaySession({ corporateId: 77 });

        await expect(session.call('user.get_customer_name')).rejects.toMatchObject({ kind: 'RECONNECT_REQUIRED' });
        expect(axios.post).not.toHaveBeenCalled();
        expect(updateCtrlPayConnection).toHaveBeenCalledWith(77, expect.objectContaining({ status: 'RECONNECT_REQUIRED' }));
    });

    it('retries an idempotent read on 503 but never a write', async () => {
        axios.post
            .mockResolvedValueOnce({ status: 503, data: { message: { status: 'ERROR' } } })
            .mockImplementationOnce(encryptedReply(200, { status: 'SUCCESS', balance_in_paise: 100 }));

        const session = await createCtrlPaySession({ corporateId: 77 });
        const read = await session.call('spending_transaction.get_account_balance', {}, { idempotent: true });
        expect(read.payload.balance_in_paise).toBe(100);

        axios.post.mockReset();
        axios.post.mockResolvedValue({ status: 503, data: { message: { status: 'ERROR' } } });
        await expect(session.call('onboarding.ckyc_search_pan_and_mobile', {})).rejects.toMatchObject({
            kind: 'UNAVAILABLE',
        });
        expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('treats a network failure as unavailable', async () => {
        axios.post.mockRejectedValue(Object.assign(new Error('timeout'), { code: 'ECONNABORTED' }));

        const session = await createCtrlPaySession({ corporateId: 77 });

        await expect(session.call('onboarding.submit_for_verification')).rejects.toMatchObject({ kind: 'UNAVAILABLE' });
    });

    it('refuses to start without a live connection', async () => {
        findCtrlPayConnection.mockResolvedValue(null);
        await expect(createCtrlPaySession({ corporateId: 77 })).rejects.toMatchObject({ kind: 'NOT_CONNECTED' });

        findCtrlPayConnection.mockResolvedValue(connection({ status: 'RECONNECT_REQUIRED', refreshToken: null }));
        await expect(createCtrlPaySession({ corporateId: 77 })).rejects.toMatchObject({ kind: 'RECONNECT_REQUIRED' });
    });

    it('never logs tokens, keys or the request parameters', async () => {
        axios.post
            .mockResolvedValueOnce({ status: 401, data: { message: 'Unauthorized' } })
            .mockImplementationOnce(encryptedReply(409, { status: 'DUPLICATE_PAN', message: 'a***@example.com' }));
        refreshIdToken.mockResolvedValue({ idToken: idToken('sigFreshX2'), refreshToken: null, expiresIn: 3600 });

        const session = await createCtrlPaySession({ corporateId: 77, logTraceId: 'trace' });
        await session.call('onboarding.ckyc_search_pan_and_mobile', { pan: 'AAFCV4821K', mobile: '9820012345' });

        const logged = JSON.stringify(customLog.mock.calls);
        expect(logged).not.toMatch(/sigFreshX2|sigCurrentX1|refresh-token|AAFCV4821K|9820012345/);
        expect(logged).toContain('ctrlpay:call');
    });
});
