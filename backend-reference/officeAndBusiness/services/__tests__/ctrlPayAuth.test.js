const crypto = require('crypto');

jest.mock('../../utils/cacheDataMethods', () => ({ client: {}, getValue: jest.fn(), setValue: jest.fn(), deleteValue: jest.fn() }));
jest.mock('../../utils/ctrlPay/store', () => ({ saveOAuthState: jest.fn(), takeOAuthState: jest.fn() }));
jest.mock('../../utils/ctrlPay/config', () => ({ getCtrlPayConfig: jest.fn() }));
jest.mock('../../utils/ctrlPay/oauth', () => ({
    ...jest.requireActual('../../utils/ctrlPay/oauth'),
    exchangeAuthorizationCode: jest.fn(),
}));
jest.mock('../ctrlPayApplication', () => ({ provisionApplication: jest.fn() }));
jest.mock('../../models/use-cases/ctrlPayConnection', () => ({
    findCtrlPayConnection: jest.fn(),
    findLinkedCtrlPayConnection: jest.fn(),
    saveCtrlPayConnection: jest.fn(),
    updateCtrlPayConnection: jest.fn(),
}));

const { CTRLPAY_MESSAGES } = require('../../constants/ctrlPay');
const {
    findCtrlPayConnection,
    findLinkedCtrlPayConnection,
    saveCtrlPayConnection,
    updateCtrlPayConnection,
} = require('../../models/use-cases/ctrlPayConnection');
const { getCtrlPayConfig } = require('../../utils/ctrlPay/config');
const { CtrlPayAuthError, exchangeAuthorizationCode } = require('../../utils/ctrlPay/oauth');
const { saveOAuthState, takeOAuthState } = require('../../utils/ctrlPay/store');
const { openToken } = require('../../utils/ctrlPay/tokenCipher');
const { provisionApplication } = require('../ctrlPayApplication');
const auth = require('../ctrlPayAuth');

const tokenKey = crypto.randomBytes(32);
const user = { id: 501, corporateId: 77 };
const idToken = ['header', Buffer.from(JSON.stringify({ sub: 'sub-1', email: 'Admin@Vanta.example', exp: 4102444800 })).toString('base64url'), 'sig'].join('.');

beforeEach(() => {
    jest.clearAllMocks();
    getCtrlPayConfig.mockResolvedValue({
        authDomain: 'https://auth.uat.ctrlpay.example',
        clientId: 'peko-client',
        redirectUri: 'https://app.peko.example/ctrlpay/callback',
        tokenKey,
    });
    takeOAuthState.mockResolvedValue({ corporateId: 77, userId: 501, verifier: 'verifier' });
    exchangeAuthorizationCode.mockResolvedValue({ idToken, refreshToken: 'refresh-token', expiresIn: 3600 });
    findLinkedCtrlPayConnection.mockResolvedValue(null);
    findCtrlPayConnection.mockResolvedValue(null);
});

describe('CTRLPay sign-in', () => {
    it('binds the PKCE verifier and state to this session', async () => {
        const { authorizeUrl } = await auth.startSignIn({ user });

        const url = new URL(authorizeUrl);
        const [state, record] = saveOAuthState.mock.calls[0];
        expect(url.searchParams.get('state')).toBe(state);
        expect(record).toMatchObject({ corporateId: 77, userId: 501 });
        expect(url.searchParams.get('code_challenge')).toBe(
            crypto.createHash('sha256').update(record.verifier).digest('base64url')
        );
    });

    it('rejects an unknown or expired state', async () => {
        takeOAuthState.mockResolvedValue(null);

        await expect(auth.completeSignIn({ user, code: 'code', state: 'state' })).rejects.toMatchObject({
            message: CTRLPAY_MESSAGES.signInExpired,
            status_code: 400,
        });
        expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    });

    it('rejects a callback started by another session', async () => {
        takeOAuthState.mockResolvedValue({ corporateId: 12, userId: 99, verifier: 'verifier' });

        await expect(auth.completeSignIn({ user, code: 'code', state: 'state' })).rejects.toMatchObject({
            status_code: 403,
        });
        expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    });

    it('refuses a CTRLPay account already linked to another Peko account', async () => {
        findLinkedCtrlPayConnection.mockResolvedValue({ corporateId: 12, status: 'CONNECTED' });

        await expect(auth.completeSignIn({ user, code: 'code', state: 'state' })).rejects.toMatchObject({
            message: CTRLPAY_MESSAGES.accountLinkedElsewhere,
            status_code: 409,
        });
        expect(saveCtrlPayConnection).not.toHaveBeenCalled();
    });

    it('maps a failed code exchange to the Peko message', async () => {
        exchangeAuthorizationCode.mockRejectedValue(new CtrlPayAuthError('rejected', { httpStatus: 400, oauthError: 'invalid_grant' }));

        await expect(auth.completeSignIn({ user, code: 'code', state: 'state' })).rejects.toMatchObject({
            message: CTRLPAY_MESSAGES.signInFailed,
            status_code: 400,
        });
    });

    it('stores the tokens sealed and provisions the CTRLPay application', async () => {
        expect(await auth.completeSignIn({ user, code: 'code', state: 'state' })).toEqual({ connected: true });

        const [corporateId, saved] = saveCtrlPayConnection.mock.calls[0];
        expect(corporateId).toBe(77);
        expect(saved).toMatchObject({
            connectedBy: 501,
            email: 'admin@vanta.example',
            subject: 'sub-1',
            status: 'CONNECTED',
            walletLiveAt: null,
            dashboardEnteredAt: null,
        });
        expect(saved.idToken).not.toContain('header');
        expect(openToken(saved.idToken, tokenKey)).toBe(idToken);
        expect(openToken(saved.refreshToken, tokenKey)).toBe('refresh-token');
        expect(exchangeAuthorizationCode).toHaveBeenCalledWith(expect.anything(), { code: 'code', verifier: 'verifier' });
        expect(provisionApplication).toHaveBeenCalledWith({ corporateId: 77, logTraceId: undefined });
    });

    it('keeps the wallet history when the same CTRLPay account signs in again', async () => {
        findCtrlPayConnection.mockResolvedValue({ corporateId: 77, subject: 'sub-1' });

        await auth.completeSignIn({ user, code: 'code', state: 'state' });

        expect(saveCtrlPayConnection.mock.calls[0][1]).not.toHaveProperty('walletLiveAt');
    });

    it('forgets the tokens on disconnect', async () => {
        await auth.disconnect({ user });

        expect(updateCtrlPayConnection).toHaveBeenCalledWith(77, {
            status: 'DISCONNECTED',
            idToken: null,
            idTokenExpiresAt: null,
            refreshToken: null,
        });
    });
});
