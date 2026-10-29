import { beforeEach, describe, expect, it } from 'vitest';

import {
    clearPendingIdpToken,
    peekPendingIdpToken,
    savePendingIdpToken,
    takePendingIdpToken,
} from '../idpPendingRequest';

const STORAGE_KEY = 'idp_pending_request';

const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const makeToken = (payload: object) => `${encode({ alg: 'none' })}.${encode(payload)}.sig`;

const futureExp = Math.floor(Date.now() / 1000) + 3600;
const pastExp = Math.floor(Date.now() / 1000) - 60;

beforeEach(() => {
    sessionStorage.clear();
});

describe('idpPendingRequest', () => {
    it('saves a token bounded by its own exp and peeks it non-destructively', () => {
        const token = makeToken({ exp: futureExp, client_id: 'abc' });
        savePendingIdpToken(token);

        expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)).toEqual({
            token,
            exp: futureExp,
        });
        expect(peekPendingIdpToken()).toBe(token);
        expect(peekPendingIdpToken()).toBe(token);
    });

    it('take returns the token exactly once', () => {
        const token = makeToken({ exp: futureExp });
        savePendingIdpToken(token);

        expect(takePendingIdpToken()).toBe(token);
        expect(takePendingIdpToken()).toBeNull();
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('refuses a token without exp', () => {
        savePendingIdpToken(makeToken({ client_id: 'abc' }));

        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(peekPendingIdpToken()).toBeNull();
    });

    it('ignores a malformed token instead of throwing', () => {
        expect(() => savePendingIdpToken('not-a-jwt')).not.toThrow();
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('treats an expired parked request as absent and clears it', () => {
        savePendingIdpToken(makeToken({ exp: pastExp }));
        expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();

        expect(peekPendingIdpToken()).toBeNull();
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('clear removes whatever is stored', () => {
        savePendingIdpToken(makeToken({ exp: futureExp }));
        clearPendingIdpToken();

        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(takePendingIdpToken()).toBeNull();
    });

    it('returns null on corrupted storage content', () => {
        sessionStorage.setItem(STORAGE_KEY, '{not json');
        expect(peekPendingIdpToken()).toBeNull();
    });
});
