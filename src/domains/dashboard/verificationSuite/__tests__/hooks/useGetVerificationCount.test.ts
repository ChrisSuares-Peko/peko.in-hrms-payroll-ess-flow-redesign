import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getVerificationCount } from '../../api';
import useGetVerificationCount from '../../hooks/useGetVerificationCount';

vi.mock('../../api', () => ({
    getVerificationCount: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { id: '123', role: 'corporate' },
            },
        }),
}));

describe('useGetVerificationCount Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches count data on mount', async () => {
        (getVerificationCount as any).mockResolvedValue({ usedLimit: 4, maxLimit: 10 });

        const { result } = renderHook(() => useGetVerificationCount());

        await act(async () => {});

        expect(getVerificationCount).toHaveBeenCalledWith({ userId: '123', userType: 'corporate' });
        expect(result.current.countData).toEqual({ usedLimit: 4, maxLimit: 10 });
        expect(result.current.loading).toBe(false);
    });

    it('refetches when refresh is called', async () => {
        (getVerificationCount as any).mockResolvedValueOnce({ usedLimit: 4, maxLimit: 10 });

        const { result } = renderHook(() => useGetVerificationCount());
        await act(async () => {});

        (getVerificationCount as any).mockResolvedValueOnce({ usedLimit: 5, maxLimit: 10 });
        await act(async () => {
            await result.current.refresh();
        });

        expect(getVerificationCount).toHaveBeenCalledTimes(2);
        expect(result.current.countData).toEqual({ usedLimit: 5, maxLimit: 10 });
    });
});
