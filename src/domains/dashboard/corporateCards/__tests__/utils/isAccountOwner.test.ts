import { describe, it, expect } from 'vitest';

import { isAccountOwner } from '../../utils/activeRole';

describe('isAccountOwner', () => {
    it('is true for the corporate session', () => {
        expect(isAccountOwner('corporate')).toBe(true);
    });

    /**
     * The sub-corporate arm is gone rather than relaxed: the server's CARD_SESSION_ROLES admits CORPORATE and
     * USER only, so a CORPORATE_SUB_USER session is refused by every card route and never reaches this.
     */
    it('is false for any other role', () => {
        expect(isAccountOwner('user')).toBe(false);
        expect(isAccountOwner('corporate_sub_user')).toBe(false);
        expect(isAccountOwner('system_user')).toBe(false);
        expect(isAccountOwner(undefined)).toBe(false);
        expect(isAccountOwner(null)).toBe(false);
    });

    // The role reaches Redux lowercased by /user/login; the backend's own casing must not pass.
    it('does not accept the backend spelling of the role', () => {
        expect(isAccountOwner('CORPORATE')).toBe(false);
    });
});
