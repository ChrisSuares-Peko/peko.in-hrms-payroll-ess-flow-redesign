import { describe, expect, it } from 'vitest';

import { MembershipRequest } from '../../../api/user/membershipApi';
import { stageFor } from '../../../hooks/user/useMembershipRequest';

const request = (overrides: Partial<MembershipRequest> = {}): MembershipRequest => ({
    id: '5',
    requestId: 'CCA-00000005',
    status: 'PENDING',
    requestedAt: '2026-10-14T06:00:00.000Z',
    decidedAt: null,
    decisionNote: null,
    ...overrides,
});

describe('stageFor', () => {
    it('offers the request screen when nothing has been asked for', () => {
        expect(stageFor(null, false)).toBe('request');
    });

    it('shows the submitted confirmation only on the submit itself', () => {
        expect(stageFor(request(), true)).toBe('submitted');
    });

    it('falls back to pending once the page is reloaded', () => {
        expect(stageFor(request(), false)).toBe('pending');
    });

    it('shows approved so the employee can start KYC', () => {
        expect(stageFor(request({ status: 'APPROVED' }), false)).toBe('approved');
    });

    it('shows rejected so the employee can resubmit', () => {
        expect(stageFor(request({ status: 'REJECTED' }), false)).toBe('rejected');
    });

    it('treats a cancelled request as no request at all', () => {
        expect(stageFor(request({ status: 'CANCELLED' }), false)).toBe('request');
    });

    it('prefers the just-submitted confirmation over a stale server status', () => {
        expect(stageFor(request({ status: 'PENDING' }), true)).toBe('submitted');
    });
});
