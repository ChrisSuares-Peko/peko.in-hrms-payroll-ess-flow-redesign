/* eslint-disable @typescript-eslint/dot-notation */
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import { ErrorGenericResponse } from '@customtypes/general';
import { SERVER_URL } from '@src/config-global';
import { loginSuccess, setPrivacyModalVisible } from '@src/domains/auth/slices/loginSlice';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { TAB_ID } from '@src/utils/tabId';
// eslint-disable-next-line import/no-cycle
import { RootState, store } from '@store/store';

import { handleLogout } from './handleLogout';
import { updateRefreshToken } from './refreshToken';
import { PERMISSION_DENIED_MESSAGE, RESPONSE_CODE } from './responseCodes';

declare module 'axios' {
    interface AxiosRequestConfig {
        skipErrorToast?: boolean;
    }
}

export const ApiClient = axios.create({
    baseURL: SERVER_URL,
    // timeout: 15000,
    signal: new AbortController().signal,
});

// Tells the server a request came from the Accounting Portal, for the configuration audit trail.
const isAccountingPortal = () => {
    const { pathname } = window.location;
    return (
        pathname === paths.systemUser.accounting ||
        pathname.startsWith(`${paths.systemUser.accounting}/`)
    );
};

ApiClient.interceptors.request.use(
    async config => {
        const originalRequest = config.url;
        const currentDateAndTime = new Date().getTime() / 1000;

        if (isAccountingPortal()) {
            config.headers['x-app-source'] = 'accounting-portal';
        }

        // Which tab the request came from: the backend keeps its saved price lists per tab.
        config.headers['x-tab-id'] = TAB_ID;

        const { refreshToken, token, sessionId, sessionUUID, id, username, role, isAuthenticated } =
            (store.getState() as RootState).reducer.auth;

        let decodedToken: { exp?: number } | undefined;
        let decodedRefreshToken: { exp?: number } | undefined;
        try {
            decodedToken = token ? jwtDecode<{ exp?: number }>(token) : undefined;
            decodedRefreshToken = refreshToken
                ? jwtDecode<{ exp?: number }>(refreshToken)
                : undefined;
        } catch {
            decodedToken = undefined;
            decodedRefreshToken = undefined;
        }

        if (
            token &&
            originalRequest !== '/user/refresh-token' &&
            (decodedToken?.exp ?? 0) > currentDateAndTime &&
            sessionId
        ) {
            config.headers['Authorization'] = `Bearer ${token}`;
            config.headers['sessionid'] = sessionId;
            if (sessionUUID) {
                config.headers['sessionuuid'] = sessionUUID;
            }
        } else if (
            refreshToken &&
            (decodedToken?.exp ?? 0) < currentDateAndTime &&
            (decodedRefreshToken?.exp ?? 0) > currentDateAndTime
        ) {
            try {
                const response = await updateRefreshToken();
                const { data, status } = response;

                if (status === 200) {
                    const renewedUUID = data?.data?.sessionUUID || sessionUUID;
                    store.dispatch(
                        loginSuccess({
                            username,
                            id,
                            role,
                            isAuthenticated,
                            token: data?.data?.token,
                            refreshToken: data?.data?.refreshToken,
                            sessionId: data?.data?.sessionId,
                            ...(data?.data?.oauth_refreshToken
                                ? { oauth_refreshToken: data.data.oauth_refreshToken }
                                : {}),
                            ...(renewedUUID ? { sessionUUID: renewedUUID } : {}),
                        })
                    );
                    config.headers['Authorization'] = `Bearer ${data?.data?.token}`;
                    config.headers['sessionid'] = data?.data?.sessionId;
                    if (renewedUUID) {
                        config.headers['sessionuuid'] = renewedUUID;
                    }
                }
            } catch (error) {
                await handleLogout();
            }
        } else {
            await handleLogout();
        }

        return config;
    },
    error => Promise.reject(error)
);

ApiClient.interceptors.response.use(
    response => {
        const { data } = response;
        return data;
    },
    error => {
        const data: ErrorGenericResponse | undefined = error?.response?.data;
        // No server payload at all — a network failure or a cancelled request. There is no responseCode to
        // interpret, so hand the error straight back. (Reading `data.message` here used to throw a TypeError,
        // which replaced the caller's error with a useless one; this keeps the same silence without the crash.)
        if (!data) {
            return Promise.reject(error);
        }
        if (data.message === 'invalid token' || data.responseCode === RESPONSE_CODE.INVALID_TOKEN) {
            handleLogout();
        } else if (data.responseCode === RESPONSE_CODE.NOT_FOUND) {
            window.location.href = '/404';
        } else if (data.responseCode === RESPONSE_CODE.PRIVACY_POLICY) {
            store.dispatch(setPrivacyModalVisible(true));
        } else if (data.responseCode === RESPONSE_CODE.FORBIDDEN) {
            // A rights problem, not a fault. Warning rather than error so it reads as "you can't do this"
            // instead of "something broke", and the server's own wording wins when it has a specific reason.
            store.dispatch(
                showToast({
                    description: data.message || PERMISSION_DENIED_MESSAGE,
                    variant: 'warning',
                })
            );
        } else if (data.responseCode !== RESPONSE_CODE.SILENT) {
            const suppressToast = error?.config?.headers?.['x-suppress-error-toast'] === 'true';
            if (!suppressToast) {
                store.dispatch(
                    showToast({
                        description: data.message || 'Something went wrong. Please try again.',
                        variant: 'error',
                    })
                );
            }
        }
        return Promise.reject(error);
    }
);
