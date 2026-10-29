const crypto = require('crypto');

jest.mock('../../utils/ctrlPay/client', () => ({
    ...jest.requireActual('../../utils/ctrlPay/client'),
    createCtrlPaySession: jest.fn(),
}));
jest.mock('../../utils/cacheDataMethods', () => ({ client: {}, getValue: jest.fn(), setValue: jest.fn(), deleteValue: jest.fn() }));
jest.mock('../../utils/ctrlPay/store', () => ({
    ckycResendsUsed: jest.fn().mockResolvedValue(0),
    recordCkycResend: jest.fn().mockResolvedValue(1),
    clearCkycResends: jest.fn(),
    claimPhoneOtpSlot: jest.fn().mockResolvedValue(true),
    releasePhoneOtpSlot: jest.fn(),
    recordPhoneOtpSent: jest.fn(),
    phoneOtpSentAt: jest.fn().mockResolvedValue(null),
    clearPhoneOtp: jest.fn(),
}));
jest.mock('../../models/use-cases/ctrlPayConnection', () => ({
    findCtrlPayConnection: jest.fn(),
    updateCtrlPayConnection: jest.fn(),
}));

const { CTRLPAY_MESSAGES } = require('../../constants/ctrlPay');
const { findCtrlPayConnection, updateCtrlPayConnection } = require('../../models/use-cases/ctrlPayConnection');
const { createCtrlPaySession } = require('../../utils/ctrlPay/client');
const store = require('../../utils/ctrlPay/store');
const { openToken, sealToken } = require('../../utils/ctrlPay/tokenCipher');
const onboarding = require('../ctrlPayOnboarding');

const tokenKey = crypto.randomBytes(32);
const user = { id: 501, corporateId: 77, role: 'CORPORATE', mobileNo: '+91 98200 12345' };

const connected = (overrides = {}) => ({
    corporateId: 77,
    status: 'CONNECTED',
    email: 'admin@vanta.example',
    partnerCodeTaggedAt: new Date(),
    walletLiveAt: null,
    dashboardEnteredAt: null,
    ...overrides,
});

const sessionWith = (...replies) => {
    const call = jest.fn();
    replies.forEach((reply) => call.mockResolvedValueOnce(reply));
    const session = { call, connection: connected(), config: { tokenKey, partnerCode: 'PEKO01' } };
    createCtrlPaySession.mockResolvedValue(session);
    return session;
};

const reply = (httpStatus, payload) => ({ httpStatus, payload });

beforeEach(() => {
    jest.clearAllMocks();
    findCtrlPayConnection.mockResolvedValue(connected());
});

describe('CTRLPay onboarding status', () => {
    it('reports a business that has not signed in to CTRLPay without calling it', async () => {
        findCtrlPayConnection.mockResolvedValue(null);

        const status = await onboarding.getStatus({ user });

        expect(status).toEqual({
            defaultMobile: '9820012345',
            connected: false,
            reconnectRequired: false,
            account: null,
            application: null,
        });
        expect(createCtrlPaySession).not.toHaveBeenCalled();
    });

    it('asks for a fresh sign-in when the stored session has ended', async () => {
        findCtrlPayConnection.mockResolvedValue(connected({ status: 'RECONNECT_REQUIRED' }));

        expect(await onboarding.getStatus({ user })).toMatchObject({
            connected: false,
            reconnectRequired: true,
            account: { email: 'admin@vanta.example' },
        });
    });

    it('tags the partner code while the application is new', async () => {
        findCtrlPayConnection.mockResolvedValue(connected({ partnerCodeTaggedAt: null }));
        const session = sessionWith(
            reply(200, { status: 'EMAIL_ID_VERIFIED', role: 'Admin' }),
            reply(200, { status: 'SUCCESS', message: 'Valid partner code' })
        );

        const status = await onboarding.getStatus({ user });

        expect(status.application.status).toBe('EMAIL_ID_VERIFIED');
        expect(session.call).toHaveBeenLastCalledWith('onboarding.validate_partner_code', { partner_code: 'PEKO01' });
        expect(updateCtrlPayConnection).toHaveBeenCalledWith(77, { partnerCodeTaggedAt: expect.any(Date) });
    });

    it('stamps the live date and reads the UPI ID for the live screen', async () => {
        sessionWith(
            reply(200, { status: 'WALLET_CREATED', customer_name: 'VANTA LOGISTICS PRIVATE LIMITED' }),
            reply(200, 'vanta.logistics@ctrlpay')
        );

        const status = await onboarding.getStatus({ user });

        expect(status).toMatchObject({
            dashboardEntered: false,
            vpa: 'vanta.logistics@ctrlpay',
            application: { status: 'WALLET_CREATED', customerName: 'VANTA LOGISTICS PRIVATE LIMITED' },
        });
        expect(updateCtrlPayConnection).toHaveBeenCalledWith(77, { walletLiveAt: expect.any(Date) });
    });

    it('opens the dashboard once the live screen has been passed', async () => {
        findCtrlPayConnection.mockResolvedValue(connected({ walletLiveAt: new Date(), dashboardEnteredAt: new Date() }));
        const session = sessionWith(reply(200, { status: 'WALLET_CREATED' }));

        const status = await onboarding.getStatus({ user });

        expect(status).toMatchObject({ dashboardEntered: true, vpa: null });
        expect(session.call).toHaveBeenCalledTimes(1);
    });

    it('maps a locked account and a blocked user to their own statuses', async () => {
        sessionWith(reply(403, { status: 'ACCOUNT_BLOCKED', message: 'blocked' }));
        expect((await onboarding.getStatus({ user })).application.status).toBe('ACCOUNT_BLOCKED');

        sessionWith(reply(200, { status: 'ERROR', message: 'You have been blocked!' }));
        expect((await onboarding.getStatus({ user })).application.status).toBe('USER_BLOCKED');
    });

    it('names the searched mobile number, masked, while the phone check is pending', async () => {
        const session = sessionWith(reply(200, { status: 'VERIFY_PHONE' }));
        session.connection.mobile = sealToken('9820012345', tokenKey);

        expect(await onboarding.getStatus({ user })).toMatchObject({ verificationMobile: 'XXXXXX2345' });
    });

    it('reports the CKYC resends left on the proprietor code step', async () => {
        store.ckycResendsUsed.mockResolvedValueOnce(1);
        sessionWith(reply(200, { status: 'CKYC_PENDING_OTP_SENT' }));

        expect((await onboarding.getStatus({ user })).ckycResendsLeft).toBe(1);
    });
});

describe('CTRLPay consent and PAN search', () => {
    it('returns the consent text with its identifier', async () => {
        sessionWith(
            reply(200, {
                status: 'SUCCESS',
                consent_master_name: 'CST20260101EXMP',
                consent_text: 'I consent ...',
                force_re_consent: true,
            })
        );

        expect(await onboarding.getConsent({ user })).toEqual({
            masterName: 'CST20260101EXMP',
            text: 'I consent ...',
            forceReConsent: true,
        });
    });

    it('says CTRLPay is unavailable when no consent is configured', async () => {
        sessionWith(reply(503, { status: 'ERROR', message: 'No active consent text configured' }));

        await expect(onboarding.getConsent({ user })).rejects.toMatchObject({
            message: CTRLPAY_MESSAGES.unavailable,
            status_code: 503,
        });
    });

    it('remembers the searched PAN and mobile sealed, and returns the next status', async () => {
        sessionWith(reply(200, { status: 'CKYC_BULK_PENDING', message: 'Name as per PAN: ...' }));

        const result = await onboarding.searchPan({ user, pan: 'AAFCV4821K', mobile: '9820012345' });

        expect(result).toEqual({ status: 'CKYC_BULK_PENDING' });
        const [, stored] = updateCtrlPayConnection.mock.calls[0];
        expect(openToken(stored.pan, tokenKey)).toBe('AAFCV4821K');
        expect(openToken(stored.mobile, tokenKey)).toBe('9820012345');
        expect(store.clearCkycResends).toHaveBeenCalledWith(77, undefined);
    });

    it('treats a duplicate PAN and the search limit as states, not errors', async () => {
        sessionWith(reply(409, { status: 'DUPLICATE_PAN', message: 'please login with a***@example.com' }));
        expect(await onboarding.searchPan({ user, pan: 'AAFCV4090K', mobile: '9820012345' })).toEqual({
            status: 'DUPLICATE_PAN',
        });

        sessionWith(reply(429, { status: 'CKYC_BULK_PENDING', message: 'Maximum PAN search limit reached.' }));
        expect(await onboarding.searchPan({ user, pan: 'AAFCV4290K', mobile: '9820012345' })).toEqual({
            status: 'CKYC_BULK_PENDING',
            searchLimitReached: true,
        });
    });

    it('answers with Peko wording, never the vendor message', async () => {
        sessionWith(reply(400, { status: 'ERROR', message: 'Please register your consent before proceeding.' }));

        await expect(onboarding.searchPan({ user, pan: 'AAFCV4821K', mobile: '9820012345' })).rejects.toMatchObject({
            message: CTRLPAY_MESSAGES.consentMissing,
            status_code: 400,
        });
    });
});

describe('CTRLPay codes', () => {
    it('maps a wrong CKYC code to the Peko message and a capped one to the document fallback', async () => {
        sessionWith(reply(400, { status: 'CKYC_PENDING_INVALID_OTP', message: 'Invalid OTP.' }));
        await expect(onboarding.verifyCkycOtp({ user, otp: '000000' })).rejects.toMatchObject({
            message: CTRLPAY_MESSAGES.ckycInvalidOtp,
        });

        sessionWith(reply(429, { status: 'CKYC_BULK_PENDING' }));
        expect(await onboarding.verifyCkycOtp({ user, otp: '000000' })).toEqual({
            status: 'CKYC_BULK_PENDING',
            attemptsExhausted: true,
        });
    });

    it('stops offering resends after two without calling CTRLPay', async () => {
        store.ckycResendsUsed.mockResolvedValueOnce(2);

        await expect(onboarding.resendCkycOtp({ user })).rejects.toMatchObject({ status_code: 429 });
        expect(createCtrlPaySession).not.toHaveBeenCalled();
    });

    it('resends with an empty code and counts the resend', async () => {
        const session = sessionWith(reply(200, { status: 'CKYC_PENDING_OTP_SENT' }));

        expect(await onboarding.resendCkycOtp({ user })).toEqual({ status: 'CKYC_PENDING_OTP_SENT', resendsLeft: 1 });
        expect(session.call).toHaveBeenCalledWith('onboarding.ckyc_validate_otp', { otp: '' });
    });

    it('holds back an impatient phone-code resend', async () => {
        store.claimPhoneOtpSlot.mockResolvedValueOnce(false);

        await expect(onboarding.sendPhoneOtp({ user })).rejects.toMatchObject({
            message: CTRLPAY_MESSAGES.phoneOtpCooldown,
            status_code: 429,
        });
        expect(createCtrlPaySession).not.toHaveBeenCalled();
    });

    it('records the phone code and frees the slot when CTRLPay refuses for the stage', async () => {
        sessionWith(reply(200, { status: 'SUCCESS' }));
        expect(await onboarding.sendPhoneOtp({ user })).toMatchObject({ cooldownSeconds: 30 });
        expect(store.recordPhoneOtpSent).toHaveBeenCalled();

        sessionWith(reply(400, { status: 'ERROR', message: 'not awaiting phone verification' }));
        await expect(onboarding.sendPhoneOtp({ user })).rejects.toMatchObject({ status_code: 409 });
        expect(store.releasePhoneOtpSlot).toHaveBeenCalled();
    });

    it('opens the dashboard only for a live wallet', async () => {
        sessionWith(reply(200, { status: 'NEW_DEVICE_DETECTED' }));
        await expect(onboarding.enterDashboard({ user })).rejects.toMatchObject({ status_code: 409 });

        sessionWith(reply(200, { status: 'WALLET_CREATED' }));
        expect(await onboarding.enterDashboard({ user })).toEqual({ dashboardEntered: true });
        expect(updateCtrlPayConnection).toHaveBeenCalledWith(77, {
            dashboardEnteredAt: expect.any(Date),
            walletLiveAt: expect.any(Date),
        });
    });
});
