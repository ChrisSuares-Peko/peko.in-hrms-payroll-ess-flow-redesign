'use strict';

const crypto = require('crypto');
const axios = require('axios');

const { CTRLPAY_LIMITS } = require('../../constants/ctrlPay');

class CtrlPayAuthError extends Error {
    constructor(message, { httpStatus = null, oauthError = null } = {}) {
        super(message);
        this.name = 'CtrlPayAuthError';
        this.httpStatus = httpStatus;
        this.oauthError = oauthError;
    }

    get invalidGrant() {
        return this.oauthError === 'invalid_grant';
    }
}

const base64Url = (buffer) => buffer.toString('base64url');

const createPkcePair = () => {
    const verifier = base64Url(crypto.randomBytes(48));
    const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());
    return { verifier, challenge };
};

const createOAuthState = () => base64Url(crypto.randomBytes(24));

const buildAuthorizeUrl = (config, { state, challenge }) => {
    const query = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: 'openid email phone profile',
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
    });
    return `${config.authDomain}/oauth2/authorize?${query.toString()}`;
};

const requestTokens = async (config, form) => {
    let response;
    try {
        response = await axios.post(`${config.authDomain}/oauth2/token`, new URLSearchParams(form).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: CTRLPAY_LIMITS.requestTimeoutMs,
            validateStatus: () => true,
        });
    } catch (error) {
        throw new CtrlPayAuthError(`Token endpoint unreachable: ${error.code || error.message}`);
    }
    const { status, data } = response;
    if (status !== 200 || !data || typeof data.id_token !== 'string') {
        throw new CtrlPayAuthError('Token endpoint rejected the request', {
            httpStatus: status,
            oauthError: typeof data?.error === 'string' ? data.error : null,
        });
    }
    return {
        idToken: data.id_token,
        refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : null,
        expiresIn: Number(data.expires_in) > 0 ? Number(data.expires_in) : null,
    };
};

const exchangeAuthorizationCode = (config, { code, verifier }) =>
    requestTokens(config, {
        grant_type: 'authorization_code',
        client_id: config.clientId,
        code,
        redirect_uri: config.redirectUri,
        code_verifier: verifier,
    });

const refreshIdToken = (config, refreshToken) =>
    requestTokens(config, {
        grant_type: 'refresh_token',
        client_id: config.clientId,
        refresh_token: refreshToken,
    });

const readIdTokenClaims = (idToken) => {
    const [, payload] = String(idToken).split('.');
    if (!payload) throw new CtrlPayAuthError('ID token is malformed');
    let claims;
    try {
        claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
        throw new CtrlPayAuthError('ID token payload is not JSON');
    }
    return {
        email: typeof claims.email === 'string' ? claims.email.toLowerCase() : null,
        subject: typeof claims.sub === 'string' ? claims.sub : null,
        expiresAt: Number(claims.exp) > 0 ? new Date(Number(claims.exp) * 1000) : null,
    };
};

const idTokenExpiry = (tokens) => {
    const fromClaims = readIdTokenClaims(tokens.idToken).expiresAt;
    if (fromClaims) return fromClaims;
    return tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : new Date();
};

module.exports = {
    CtrlPayAuthError,
    createPkcePair,
    createOAuthState,
    buildAuthorizeUrl,
    exchangeAuthorizationCode,
    refreshIdToken,
    readIdTokenClaims,
    idTokenExpiry,
};
