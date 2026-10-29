import { PARTNER_REDIRECT_URL } from '@src/config-global';

const STORAGE_KEY = 'sso_entry_partner';

export const markSsoEntry = () => {
    try {
        sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
        // Storage blocked (private mode) — the session just behaves as a normal login.
    }
};

export const clearSsoEntry = () => {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // Nothing to clear.
    }
};

export const takeSsoEntry = (): boolean => {
    try {
        const marked = sessionStorage.getItem(STORAGE_KEY) === '1';
        if (marked) clearSsoEntry();
        return marked;
    } catch {
        return false;
    }
};

export const shouldReturnToPartner = (autoLogin?: boolean): boolean =>
    !!autoLogin && !!PARTNER_REDIRECT_URL;
