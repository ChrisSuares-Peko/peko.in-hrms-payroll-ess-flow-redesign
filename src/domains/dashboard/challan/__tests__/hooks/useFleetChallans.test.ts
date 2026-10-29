import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getFleetChallans } from '../../api/index';
import useFleetChallans from '../../hooks/useFleetChallans';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));
vi.mock('../../api/index', () => ({ getFleetChallans: vi.fn() }));

describe('useFleetChallans', () => {
    const role = 'CORPORATE';
    const id = 11;

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockImplementation((cb: (s: any) => any) =>
            cb({ reducer: { auth: { role, id } } })
        );
    });

    it('loads the fleet aggregate on mount and stores challans + summary', async () => {
        const summary = { totalOutstanding: 900, pending: 2, paid: 1, courtMatters: 0 };
        const challans = [{ challan_number: 'C1' }, { challan_number: 'C2' }];
        (getFleetChallans as Mock).mockResolvedValue({ challans, summary });

        const { result } = renderHook(() => useFleetChallans());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getFleetChallans).toHaveBeenCalledWith({ userId: id, userType: role });
        expect(result.current.challans).toEqual(challans);
        expect(result.current.summary).toEqual(summary);
        expect(mockDispatch).toHaveBeenCalled(); // cached into the challan slice
    });

    it('falls back to empty challans and a zero summary when the api fails', async () => {
        (getFleetChallans as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useFleetChallans());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.challans).toEqual([]);
        expect(result.current.summary).toEqual({
            totalOutstanding: 0,
            pending: 0,
            paid: 0,
            courtMatters: 0,
        });
    });
});
