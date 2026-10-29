const crypto = require('crypto');
const axios = require('axios');

jest.mock('axios', () => ({ post: jest.fn() }));

const {
    CtrlPayAuthError,
    buildAuthorizeUrl,
    createPkcePair,
    exchangeAuthorizationCode,
    idTokenExpiry,
    readIdTokenClaims,
    refreshIdToken,
} = require('../ctrlPay/oauth');

const config = {
    authDomain: 'https://auth.uat.ctrlpay.example',
    clientId: 'peko-client',
    redirectUri: 'https://app.peko.example/ctrlpay/callback',
};

const idTokenWith = (claims) =>
    ['header', Buffer.from(JSON.stringify(claims)).toString('base64url'), 'signature'].join('.');

beforeEach(() => {
    axios.post.mockReset();
});

describe('CTRLPay OAuth', () => {
    it('derives the S256 challenge from a high-entropy verifier', () => {
        const { verifier, challenge } = createPkcePair();

        expect(verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
        expect(challenge).toBe(crypto.createHash('sha256').update(verifier).digest('base64url'));
    });

    it('builds the authorize URL the guide describes', () => {
        const url = new URL(buildAuthorizeUrl(config, { state: 'state-value-123456', challenge: 'challenge' }));

        expect(`${url.origin}${url.pathname}`).toBe('https://auth.uat.ctrlpay.example/oauth2/authorize');
        expect(Object.fromEntries(url.searchParams)).toEqual({
            response_type: 'code',
            client_id: 'peko-client',
            redirect_uri: 'https://app.peko.example/ctrlpay/callback',
            scope: 'openid email phone profile',
            state: 'state-value-123456',
            code_challenge: 'challenge',
            code_challenge_method: 'S256',
        });
        expect(url.search).toContain('scope=openid+email+phone+profile');
    });

    it('exchanges the code with the verifier and returns the ID token', async () => {
        axios.post.mockResolvedValue({
            status: 200,
            data: { id_token: 'id.token.value', refresh_token: 'refresh', access_token: 'access', expires_in: 3600 },
        });

        const tokens = await exchangeAuthorizationCode(config, { code: 'auth-code', verifier: 'verifier' });

        expect(tokens).toEqual({ idToken: 'id.token.value', refreshToken: 'refresh', expiresIn: 3600 });
        const [url, form, options] = axios.post.mock.calls[0];
        expect(url).toBe('https://auth.uat.ctrlpay.example/oauth2/token');
        expect(Object.fromEntries(new URLSearchParams(form))).toEqual({
            grant_type: 'authorization_code',
            client_id: 'peko-client',
            code: 'auth-code',
            redirect_uri: 'https://app.peko.example/ctrlpay/callback',
            code_verifier: 'verifier',
        });
        expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    });

    it('keeps no refresh token when the refresh grant does not rotate it', async () => {
        axios.post.mockResolvedValue({ status: 200, data: { id_token: 'next.id.token', expires_in: 3600 } });

        const tokens = await refreshIdToken(config, 'stored-refresh');

        expect(tokens.refreshToken).toBeNull();
        expect(Object.fromEntries(new URLSearchParams(axios.post.mock.calls[0][1]))).toEqual({
            grant_type: 'refresh_token',
            client_id: 'peko-client',
            refresh_token: 'stored-refresh',
        });
    });

    it('reports a rejected grant without leaking the response body', async () => {
        axios.post.mockResolvedValue({ status: 400, data: { error: 'invalid_grant', error_description: 'expired' } });

        const error = await refreshIdToken(config, 'stale').catch((caught) => caught);

        expect(error).toBeInstanceOf(CtrlPayAuthError);
        expect(error.invalidGrant).toBe(true);
        expect(error.httpStatus).toBe(400);
        expect(error.message).not.toContain('expired');
    });

    it('treats an unreachable token endpoint as an auth error', async () => {
        axios.post.mockRejectedValue(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }));

        await expect(refreshIdToken(config, 'stale')).rejects.toBeInstanceOf(CtrlPayAuthError);
    });

    it('reads the identity claims and the expiry from the ID token', () => {
        const exp = Math.floor(Date.UTC(2026, 9, 22, 12, 0, 0) / 1000);
        const idToken = idTokenWith({ sub: 'user-sub', email: 'Admin@Vanta.example', exp });

        expect(readIdTokenClaims(idToken)).toEqual({
            subject: 'user-sub',
            email: 'admin@vanta.example',
            expiresAt: new Date(exp * 1000),
        });
        expect(idTokenExpiry({ idToken, expiresIn: 60 })).toEqual(new Date(exp * 1000));
        expect(() => readIdTokenClaims('not-a-jwt')).toThrow(CtrlPayAuthError);
    });
});
