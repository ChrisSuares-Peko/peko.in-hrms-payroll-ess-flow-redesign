import { describe, expect, it, vi } from 'vitest';

import { UserRole } from '@customtypes/general';
import { isSocialProfileIncomplete } from '@domains/auth/hooks/useSocialLogin';

vi.mock('@domains/auth/hooks/useCompleteLogin', () => ({ default: () => ({}) }));
vi.mock('@domains/auth/api', () => ({ oidcLogin: vi.fn() }));

const complete = {
    role: UserRole.CORPORATE,
    name: 'Acme Pvt Ltd',
    contactPersonName: 'Asha Rao',
    mobileNo: '9876543210',
    email: 'asha@acme.in',
};

describe('isSocialProfileIncomplete', () => {
    it('is complete when every required field is present', () => {
        expect(isSocialProfileIncomplete(complete)).toBe(false);
    });

    it('does not gate on email', () => {
        expect(isSocialProfileIncomplete({ ...complete, email: undefined })).toBe(false);
    });

    it.each(['name', 'contactPersonName', 'mobileNo'] as const)('still requires %s', field => {
        expect(isSocialProfileIncomplete({ ...complete, [field]: undefined })).toBe(true);
    });

    it('never gates SYSTEM users', () => {
        expect(isSocialProfileIncomplete({ role: UserRole.SYSTEM, email: undefined })).toBe(false);
    });

    it('treats absent data as incomplete', () => {
        expect(isSocialProfileIncomplete(null)).toBe(true);
        expect(isSocialProfileIncomplete(undefined)).toBe(true);
    });
});
