import { beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'sso_entry_partner';

const load = async (partnerRedirectUrl: string) => {
    vi.resetModules();
    vi.doMock('@src/config-global', () => ({
        PARTNER_REDIRECT_URL: partnerRedirectUrl,
    }));
    return import('../ssoEntry');
};

beforeEach(() => {
    sessionStorage.clear();
});

describe('ssoEntry', () => {
    it('marks the SSO entry and take consumes it exactly once', async () => {
        const { markSsoEntry, takeSsoEntry } = await load('https://partner.example/exit');

        markSsoEntry();
        expect(sessionStorage.getItem(STORAGE_KEY)).toBe('1');

        expect(takeSsoEntry()).toBe(true);
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(takeSsoEntry()).toBe(false);
    });

    it('take returns false when nothing was marked', async () => {
        const { takeSsoEntry } = await load('https://partner.example/exit');
        expect(takeSsoEntry()).toBe(false);
    });

    it('clear removes the mark', async () => {
        const { markSsoEntry, clearSsoEntry, takeSsoEntry } = await load(
            'https://partner.example/exit'
        );

        markSsoEntry();
        clearSsoEntry();
        expect(takeSsoEntry()).toBe(false);
    });

    it('shouldReturnToPartner needs BOTH the autoLogin flag and a configured URL', async () => {
        const withUrl = await load('https://partner.example/exit');
        expect(withUrl.shouldReturnToPartner(true)).toBe(true);
        expect(withUrl.shouldReturnToPartner(false)).toBe(false);
        expect(withUrl.shouldReturnToPartner(undefined)).toBe(false);

        const withoutUrl = await load('');
        expect(withoutUrl.shouldReturnToPartner(true)).toBe(false);
    });
});
