import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useCardOnboardingState } from '../../../hooks/user/useCardOnboardingState';

const mockDispatch = vi.fn();
let state: Record<string, unknown>;

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: (selector: (s: unknown) => unknown) => selector({ reducer: state }),
}));
vi.mock('../../../api/user/membershipApi', () => ({ getCardOnboardingState: vi.fn() }));
vi.mock('../../../slices/corporateCardsSlice', () => ({
    setCardKybComplete: (payload: boolean | null) => ({ type: 'setCardKybComplete', payload }),
}));

const { getCardOnboardingState } = await import('../../../api/user/membershipApi');

const membership = (label: string) => ({
    label,
    hasAccess: true,
    role: 'Employee',
    status: 'ACTIVE',
    ref: null,
});

const session = (over: Record<string, unknown> = {}, cardKybComplete: boolean | null = null) => {
    state = {
        auth: {
            role: 'user',
            id: 11,
            employeeProfileId: 900,
            serviceMemberships: [membership('Payroll')],
            ...over,
        },
        corporateCards: { cardKybComplete },
    };
};

const dispatched = () =>
    mockDispatch.mock.calls
        .map(([action]) => action)
        .find(action => action.type === 'setCardKybComplete');

beforeEach(() => {
    vi.clearAllMocks();
    session();
});

describe('useCardOnboardingState', () => {
    it('asks once for a payroll-only employee and lands the answer in redux', async () => {
        (getCardOnboardingState as Mock).mockResolvedValue({ kybComplete: true });
        renderHook(() => useCardOnboardingState());

        await waitFor(() =>
            expect(dispatched()).toEqual({
                type: 'setCardKybComplete',
                payload: true,
            })
        );
        expect(getCardOnboardingState).toHaveBeenCalledWith('user', 11);
    });

    it('records a negative answer rather than leaving it unknown', async () => {
        (getCardOnboardingState as Mock).mockResolvedValue({ kybComplete: false });
        renderHook(() => useCardOnboardingState());

        await waitFor(() => expect(dispatched()?.payload).toBe(false));
    });

    // The endpoint answers a boolean or nothing at all; a failed call must not read as "complete".
    it('treats an unreachable endpoint as not complete', async () => {
        (getCardOnboardingState as Mock).mockResolvedValue(false);
        renderHook(() => useCardOnboardingState());

        await waitFor(() => expect(dispatched()?.payload).toBe(false));
    });

    it('does not ask for an employee who already holds the membership', () => {
        session({ serviceMemberships: [membership('Payroll'), membership('Corporate Cards')] });
        renderHook(() => useCardOnboardingState());

        expect(getCardOnboardingState).not.toHaveBeenCalled();
    });

    it('does not ask for a corporate or system session', () => {
        session({ role: 'corporate' });
        renderHook(() => useCardOnboardingState());
        session({ role: 'system_user' });
        renderHook(() => useCardOnboardingState());

        expect(getCardOnboardingState).not.toHaveBeenCalled();
    });

    it('does not ask again once the answer is in redux', () => {
        session({}, false);
        renderHook(() => useCardOnboardingState());

        expect(getCardOnboardingState).not.toHaveBeenCalled();
    });
});
