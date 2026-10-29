import { describe, expect, it } from 'vitest';

import reducer, { setServices } from '../servicesSlice';

/**
 * "The fetch failed" and "this account has no services" are different facts, and collapsing them is what
 * rendered a 403 — or an unaccepted privacy policy — as "Sorry, you do not have permission to access this
 * page". CorporateAccessGuard is entitled to refuse on the second and must never refuse on the first.
 */
const initial = reducer(undefined, { type: '@@INIT' });

describe('servicesSlice', () => {
    it('starts with nothing fetched and no failure', () => {
        expect(initial.services).toBeNull();
        expect(initial.servicesLoadFailed).toBe(false);
    });

    it('records a genuinely empty entitlement as a success, not a failure', () => {
        const next = reducer(
            initial,
            setServices({ services: { data: [] }, servicesLoadFailed: false })
        );

        expect(next.services?.data).toEqual([]);
        expect(next.servicesLoadFailed).toBe(false);
    });

    it('records a failed fetch as a failure, so an empty list is not read as an entitlement', () => {
        const next = reducer(
            initial,
            setServices({ services: { data: [] }, servicesLoadFailed: true })
        );

        expect(next.servicesLoadFailed).toBe(true);
    });

    // A retry that succeeds has to clear the flag, or the guard shows the skeleton forever.
    it('clears the failure once a later fetch succeeds', () => {
        const failed = reducer(
            initial,
            setServices({ services: { data: [] }, servicesLoadFailed: true })
        );

        const recovered = reducer(
            failed,
            setServices({
                services: { data: [{ label: 'Corporate Cards', hasAccess: true }] } as never,
                servicesLoadFailed: false,
            })
        );

        expect(recovered.servicesLoadFailed).toBe(false);
        expect(recovered.services?.data).toHaveLength(1);
    });
});
