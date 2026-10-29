import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setPrivacyModalVisible } from '@src/domains/auth/slices/loginSlice';
import { showToast } from '@src/slices/apiSlice';
import { TAB_ID } from '@src/utils/tabId';

const dispatch = vi.fn();
const mockHandleLogout = vi.fn(() => Promise.resolve());
let mockAuth: Record<string, unknown> = {};

vi.mock('@store/store', () => ({
    store: {
        dispatch: (action: unknown) => dispatch(action),
        getState: () => ({ reducer: { auth: mockAuth } }),
    },
}));
vi.mock('../handleLogout', () => ({ handleLogout: () => mockHandleLogout() }));
vi.mock('../refreshToken', () => ({ updateRefreshToken: vi.fn() }));

// eslint-disable-next-line import/first
import { ApiClient } from '../config';
// eslint-disable-next-line import/first
import { PERMISSION_DENIED_MESSAGE, RESPONSE_CODE } from '../responseCodes';

/**
 * The response interceptor is a single app-wide branch on `responseCode`. Every screen inherits it, so the
 * mapping is asserted here rather than being re-tested per feature.
 */
const onRejected = (
    ApiClient.interceptors.response as unknown as {
        handlers: { rejected: (error: unknown) => Promise<unknown> }[];
    }
).handlers[0].rejected;

const reject = async (data: unknown) => {
    const error = { response: { data } };
    await expect(onRejected(error)).rejects.toBe(error);
    return error;
};

beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = {};
});

const onRequest = (
    ApiClient.interceptors.request as unknown as {
        handlers: {
            fulfilled: (config: unknown) => Promise<{ headers: Record<string, string> }>;
        }[];
    }
).handlers[0].fulfilled;

// Unsigned JWT expiring `expInSeconds` from now; jwtDecode only reads the payload.
const jwt = (expInSeconds: number) =>
    `x.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expInSeconds }))}.x`;

describe('ApiClient request interceptor', () => {
    it('attaches auth headers while the token is valid', async () => {
        mockAuth = { token: jwt(600), refreshToken: jwt(3600), sessionId: 's1' };

        const config = await onRequest({ url: '/x', headers: {} });

        expect(config.headers.Authorization).toBe(`Bearer ${mockAuth.token}`);
        expect(mockHandleLogout).not.toHaveBeenCalled();
    });

    it('sends the id of this tab with every request, with or without a login', async () => {
        mockAuth = { token: jwt(600), refreshToken: jwt(3600), sessionId: 's1' };
        const loggedIn = await onRequest({ url: '/x', headers: {} });

        expect(loggedIn.headers['x-tab-id']).toBe(TAB_ID);
        expect(TAB_ID).toMatch(/^[0-9a-f-]{36}$/);
    });

    describe('Accounting Portal marker', () => {
        const headerOn = async (path: string) => {
            window.history.pushState({}, '', path);
            mockAuth = { token: jwt(600), refreshToken: jwt(3600), sessionId: 's1' };
            const config = await onRequest({ url: '/x', headers: {} });
            return config.headers['x-app-source'];
        };

        afterEach(() => window.history.pushState({}, '', '/'));

        it.each(['/system-user/accounting', '/system-user/accounting/vendors/12/transactions'])(
            'tells the server a request made on %s came from the Accounting Portal',
            async path => {
                expect(await headerOn(path)).toBe('accounting-portal');
            }
        );

        it.each([
            '/system-user/settings/accounting-approvals',
            '/system-user/accounting-approvals',
        ])('leaves the Admin Panel page %s unmarked', async path => {
            expect(await headerOn(path)).toBeUndefined();
        });
    });

    // Session timeout: both tokens are dead. Without a logout here the page was left on a white screen.
    it('logs out once the session has timed out', async () => {
        mockAuth = { token: jwt(-60), refreshToken: jwt(-30), sessionId: 's1' };

        await onRequest({ url: '/x', headers: {} });

        expect(mockHandleLogout).toHaveBeenCalledTimes(1);
    });
});

describe('ApiClient response interceptor', () => {
    it('logs out on an invalid token', async () => {
        await reject({ responseCode: RESPONSE_CODE.INVALID_TOKEN, message: 'nope' });

        expect(mockHandleLogout).toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('opens the privacy modal for the privacy-policy code', async () => {
        await reject({ responseCode: RESPONSE_CODE.PRIVACY_POLICY, message: 'accept it' });

        expect(dispatch).toHaveBeenCalledWith(setPrivacyModalVisible(true));
    });

    it('stays silent for the caller-handled code', async () => {
        await reject({ responseCode: RESPONSE_CODE.SILENT, message: 'handled upstream' });

        expect(dispatch).not.toHaveBeenCalled();
        expect(mockHandleLogout).not.toHaveBeenCalled();
    });

    // A permission refusal is not a fault: it gets its own code so the user is told they lack rights instead of
    // reading "Something went wrong" and retrying an action that can never succeed.
    describe('permission refusals (007)', () => {
        it('surfaces the server reason as a warning, not an error', async () => {
            await reject({
                responseCode: RESPONSE_CODE.FORBIDDEN,
                message: 'Your own requests are decided by your corporate admin.',
            });

            expect(dispatch).toHaveBeenCalledWith(
                showToast({
                    description: 'Your own requests are decided by your corporate admin.',
                    variant: 'warning',
                })
            );
        });

        it('falls back to the generic permission line when the server sent no message', async () => {
            await reject({ responseCode: RESPONSE_CODE.FORBIDDEN, message: '' });

            expect(dispatch).toHaveBeenCalledWith(
                showToast({ description: PERMISSION_DENIED_MESSAGE, variant: 'warning' })
            );
        });

        it('does not log the user out or redirect', async () => {
            await reject({ responseCode: RESPONSE_CODE.FORBIDDEN, message: 'no' });

            expect(mockHandleLogout).not.toHaveBeenCalled();
        });
    });

    it('toasts the server message as an error for any other code', async () => {
        await reject({ responseCode: '001', message: 'Card limit exceeded.' });

        expect(dispatch).toHaveBeenCalledWith(
            showToast({ description: 'Card limit exceeded.', variant: 'error' })
        );
    });

    // A network failure or a cancelled request carries no payload. Reading `data.message` used to throw here,
    // replacing the caller's error with a TypeError; it must pass the original error straight through.
    it('passes an error with no response payload through untouched', async () => {
        const error = { message: 'Network Error' };

        await expect(onRejected(error)).rejects.toBe(error);
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockHandleLogout).not.toHaveBeenCalled();
    });
});
