import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { getKycStatus } from '../../api/user/kycApi';
import { useOwnerKycRefresh } from '../../hooks/admin/useOwnerKycRefresh';
import { Member } from '../../utils/types';

vi.mock('../../api/user/kycApi', () => ({ getKycStatus: vi.fn() }));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (fn: (s: unknown) => unknown) =>
        fn({ reducer: { auth: { role: 'corporate', id: 42 } } }),
}));

const member = (over: Partial<Member> = {}) =>
    ({
        key: '99',
        name: 'Ravi Member',
        email: 'ravi@peko.in',
        role: 'Employee',
        cards: 0,
        accountStatus: 'Active',
        kycStatus: 'Not started',
        joined: '2026-01-01',
        ...over,
    }) as Member;

const owner = (over: Partial<Member> = {}) =>
    member({ key: '500', name: 'Asha Owner', role: 'Admin', isAccountOwner: true, ...over });

const completed = { data: { kyc: { isCompleted: true } } };

beforeEach(() => {
    vi.clearAllMocks();
    (getKycStatus as unknown as Mock).mockResolvedValue(completed);
});

describe('useOwnerKycRefresh', () => {
    it('asks the issuer when the owner row is not yet Completed', async () => {
        renderHook(() => useOwnerKycRefresh([owner({ kycStatus: 'Pending' })]));

        await waitFor(() => expect(getKycStatus).toHaveBeenCalledWith('corporate', 42));
    });

    it('signals a refresh once the issuer reports completion', async () => {
        const { result } = renderHook(() => useOwnerKycRefresh([owner({ kycStatus: 'Pending' })]));

        await waitFor(() => expect(result.current.refreshed).toBe(1));
    });

    // Refetching on an unchanged status would loop: the refetch re-renders the hook with the same rows.
    it('does not signal a refresh when the status has not moved', async () => {
        (getKycStatus as unknown as Mock).mockResolvedValue({
            data: { kyc: { isCompleted: false } },
        });

        const { result } = renderHook(() => useOwnerKycRefresh([owner({ kycStatus: 'Pending' })]));

        await waitFor(() => expect(getKycStatus).toHaveBeenCalled());
        expect(result.current.refreshed).toBe(0);
    });

    it('asks nothing when the owner row is already Completed', () => {
        renderHook(() => useOwnerKycRefresh([owner({ kycStatus: 'Completed' })]));

        expect(getKycStatus).not.toHaveBeenCalled();
    });

    // The endpoint reads the CALLER's own KYC. A page with no owner row has nothing to refresh, and a member's
    // status is not ours to poll.
    it('asks nothing when there is no owner row on the page', () => {
        renderHook(() => useOwnerKycRefresh([member({ kycStatus: 'Pending' })]));

        expect(getKycStatus).not.toHaveBeenCalled();
    });

    it('asks only once per mount, however often it re-renders', async () => {
        const { rerender } = renderHook(() =>
            useOwnerKycRefresh([owner({ kycStatus: 'Pending' })])
        );

        await waitFor(() => expect(getKycStatus).toHaveBeenCalledTimes(1));
        rerender();
        rerender();
        expect(getKycStatus).toHaveBeenCalledTimes(1);
    });

    it('leaves the table alone when the call fails', async () => {
        (getKycStatus as unknown as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useOwnerKycRefresh([owner({ kycStatus: 'Pending' })]));

        await waitFor(() => expect(getKycStatus).toHaveBeenCalled());
        expect(result.current.refreshed).toBe(0);
    });
});
