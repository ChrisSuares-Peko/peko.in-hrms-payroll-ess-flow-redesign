'use strict';

const { CTRLPAY_MESSAGES } = require('../constants/ctrlPay');
const {
    findCtrlPayConnection,
    findLinkedCtrlPayConnection,
    saveCtrlPayConnection,
    updateCtrlPayConnection,
} = require('../models/use-cases/ctrlPayConnection');
const ErrorResponse = require('../utils/error-response');
const { customLog } = require('../utils/loggerHelper');
const { getCtrlPayConfig } = require('../utils/ctrlPay/config');
const {
    buildAuthorizeUrl,
    createOAuthState,
    createPkcePair,
    exchangeAuthorizationCode,
    idTokenExpiry,
    readIdTokenClaims,
} = require('../utils/ctrlPay/oauth');
const { saveOAuthState, takeOAuthState } = require('../utils/ctrlPay/store');
const { sealToken } = require('../utils/ctrlPay/tokenCipher');
const { provisionApplication } = require('./ctrlPayApplication');

exports.startSignIn = async ({ user, logTraceId }) => {
    const config = await getCtrlPayConfig();
    const { verifier, challenge } = createPkcePair();
    const state = createOAuthState();
    await saveOAuthState(state, { corporateId: user.corporateId, userId: user.id, verifier });
    customLog(logTraceId, 'info', { action: 'ctrlpay:signInStarted', corporateId: user.corporateId }, 'VENDOR');
    return { authorizeUrl: buildAuthorizeUrl(config, { state, challenge }) };
};

const exchangeCode = (config, { code, verifier, corporateId, logTraceId }) =>
    exchangeAuthorizationCode(config, { code, verifier }).catch((error) => {
        customLog(logTraceId, 'error', {
            action: 'ctrlpay:codeExchangeFailed',
            corporateId,
            httpStatus: error.httpStatus ?? null,
            oauthError: error.oauthError ?? null,
            error: error.message,
        }, 'VENDOR');
        throw new ErrorResponse(CTRLPAY_MESSAGES.signInFailed, 400);
    });

exports.completeSignIn = async ({ user, code, state, logTraceId }) => {
    const config = await getCtrlPayConfig();
    const { corporateId } = user;
    const pending = await takeOAuthState(state);
    if (!pending) throw new ErrorResponse(CTRLPAY_MESSAGES.signInExpired, 400);
    if (String(pending.corporateId) !== String(corporateId) || String(pending.userId) !== String(user.id)) {
        customLog(logTraceId, 'error', { action: 'ctrlpay:signInStateMismatch', corporateId }, 'VENDOR');
        throw new ErrorResponse(CTRLPAY_MESSAGES.signInFailed, 403);
    }

    const tokens = await exchangeCode(config, { code, verifier: pending.verifier, corporateId, logTraceId });
    const claims = readIdTokenClaims(tokens.idToken);
    if (!claims.subject || !tokens.refreshToken) {
        customLog(logTraceId, 'error', {
            action: 'ctrlpay:signInIncomplete',
            corporateId,
            hasSubject: Boolean(claims.subject),
            hasRefreshToken: Boolean(tokens.refreshToken),
        }, 'VENDOR');
        throw new ErrorResponse(CTRLPAY_MESSAGES.signInFailed, 502);
    }

    if (await findLinkedCtrlPayConnection(claims.subject, corporateId)) {
        customLog(logTraceId, 'error', { action: 'ctrlpay:accountLinkedElsewhere', corporateId }, 'VENDOR');
        throw new ErrorResponse(CTRLPAY_MESSAGES.accountLinkedElsewhere, 409);
    }

    const previous = await findCtrlPayConnection(corporateId);
    const sameAccount = previous?.subject === claims.subject;
    await saveCtrlPayConnection(corporateId, {
        connectedBy: user.id,
        email: claims.email,
        subject: claims.subject,
        status: 'CONNECTED',
        idToken: sealToken(tokens.idToken, config.tokenKey),
        idTokenExpiresAt: idTokenExpiry(tokens),
        refreshToken: sealToken(tokens.refreshToken, config.tokenKey),
        ...(sameAccount
            ? {}
            : { pan: null, mobile: null, partnerCodeTaggedAt: null, walletLiveAt: null, dashboardEnteredAt: null }),
    });
    customLog(logTraceId, 'info', { action: 'ctrlpay:signInCompleted', corporateId, sameAccount }, 'VENDOR');

    await provisionApplication({ corporateId, logTraceId });
    return { connected: true };
};

exports.disconnect = async ({ user, logTraceId }) => {
    await updateCtrlPayConnection(user.corporateId, {
        status: 'DISCONNECTED',
        idToken: null,
        idTokenExpiresAt: null,
        refreshToken: null,
    });
    customLog(logTraceId, 'info', { action: 'ctrlpay:disconnected', corporateId: user.corporateId }, 'VENDOR');
    return { connected: false };
};
