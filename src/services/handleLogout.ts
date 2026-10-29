import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import { PARTNER_REDIRECT_URL, SERVER_URL } from '@src/config-global';
import { shouldReturnToPartner } from '@src/services/ssoEntry';
// eslint-disable-next-line import/no-cycle
import { persistor, RootState, store } from '@store/store';

import { updateRefreshToken } from './refreshToken';

let hasCleared = false;

export const clearData = () => {
    if (hasCleared) return;
    hasCleared = true;

    let autoLogin = !!(store.getState() as RootState)?.reducer?.auth?.autoLogin;
    if (!autoLogin) {
        try {
            const reduxStorageString = localStorage.getItem('persist:root');
            if (reduxStorageString) {
                autoLogin = !!JSON.parse(JSON.parse(reduxStorageString).auth)?.autoLogin;
            }
        } catch {
            autoLogin = false;
        }
    }

    try {
        persistor.pause();
        persistor.flush();
        persistor.purge();
    } catch (error) {
        console.error('Error clearing persisted store:', error);
    }

    // Clear all localStorage items related to auth
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (
                key &&
                (key.startsWith('persist:') || key.includes('auth') || key.includes('token'))
            ) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error(`Error removing ${key}:`, e);
            }
        });
    } catch (error) {
        console.error('Error clearing localStorage:', error);
        // If localStorage is corrupted, try to clear everything
        try {
            localStorage.clear();
        } catch (clearError) {
            console.error('Error clearing all localStorage:', clearError);
        }
    }

    // Clear sessionStorage
    try {
        sessionStorage.clear();
    } catch (error) {
        console.error('Error clearing sessionStorage:', error);
    }

    // avoid auto redirecting to prev page after logging in again
    window.location.href = shouldReturnToPartner(autoLogin) ? PARTNER_REDIRECT_URL : '/';
};

const decodeExp = (jwt?: string): number | null => {
    if (!jwt) return null;
    try {
        return jwtDecode(jwt).exp ?? null;
    } catch {
        return null;
    }
};

export const handleLogout = async () => {
    const authChannel = new BroadcastChannel('authChannel');

    if ((window as any).fcWidget) {
        try {
            (window as any).fcWidget.destroy();
        } catch (error) {
            console.error('Error destroying fcWidget:', error);
        }
    }
    if (typeof Moengage?.track_event === 'function') {
        Moengage.track_event('user_logout');
    }
    if (typeof Moengage?.destroy_session === 'function') {
        Moengage.destroy_session();
    }

    let authData: {
        token?: string;
        refreshToken?: string;
        sessionId?: string;
        sessionUUID?: string;
    } = {};
    try {
        const reduxStorageString = localStorage.getItem('persist:root');
        if (reduxStorageString) {
            const reduxStorage = JSON.parse(reduxStorageString);
            if (reduxStorage?.auth) {
                authData = JSON.parse(reduxStorage.auth);
            }
        }
    } catch (error) {
        console.error('Error parsing localStorage auth data:', error);
        // corrupted/absent storage (e.g. already purged by another tab) —
        // still broadcast and clear below
    }

    try {
        let { token, sessionId, sessionUUID } = authData;
        const now = Date.now() / 1000;
        const tokenExp = decodeExp(token);
        const refreshExp = decodeExp(authData.refreshToken);

        if (tokenExp !== null && tokenExp < now && refreshExp !== null && refreshExp > now) {
            const { data, status } = await updateRefreshToken();
            if (status === 200) {
                token = data?.data?.token ?? token;
                sessionId = data?.data?.sessionId ?? sessionId;
                sessionUUID = data?.data?.sessionUUID ?? sessionUUID;
            }
        }

        if (token && sessionId) {
            await axios.post(
                `${SERVER_URL}/user/logout`,
                {},
                {
                    headers: {
                        authorization: `Bearer ${token}`,
                        sessionid: sessionId,
                        ...(sessionUUID ? { sessionuuid: sessionUUID } : {}),
                    },
                }
            );
        }
    } catch (error) {
        console.error('Logout API call failed:', error);
        // best-effort server-side logout; local cleanup happens regardless
    }

    // Always send logout message and clear data
    authChannel.postMessage('logout');
    clearData();
};

export const triggerSessionExpired = () => {
    if (window.location.pathname === '/session-expired') return;
    window.location.href = '/session-expired';
};
