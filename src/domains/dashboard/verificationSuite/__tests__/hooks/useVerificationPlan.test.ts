import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getPurchaseHistory } from '../../../settings/api/subscription';
import useVerificationPlan from '../../hooks/useVerificationPlan';

vi.mock('../../../settings/api/subscription', () => ({
    getPurchaseHistory: vi.fn(),
}));

describe('useVerificationPlan Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('exposes currentGroupSubscription as the plan, without filtering by package name', async () => {
        (getPurchaseHistory as any).mockResolvedValue({
            currentGroupSubscription: { packageName: 'Some Other Package', status: 'ACTIVE' },
        });

        const { result } = renderHook(() => useVerificationPlan());

        await act(async () => {});

        expect(getPurchaseHistory).toHaveBeenCalledWith({
            page: 1,
            itemsPerPage: 1000,
            status: 'ACTIVE',
        });
        expect(result.current.plan).toEqual({
            packageName: 'Some Other Package',
            status: 'ACTIVE',
        });
        expect(result.current.loading).toBe(false);
    });

    it('sets plan to null when there is no current subscription', async () => {
        (getPurchaseHistory as any).mockResolvedValue({ currentGroupSubscription: null });

        const { result } = renderHook(() => useVerificationPlan());

        await act(async () => {});

        expect(result.current.plan).toBeNull();
    });

    it('leaves plan as null when the API call fails', async () => {
        (getPurchaseHistory as any).mockResolvedValue(false);

        const { result } = renderHook(() => useVerificationPlan());

        await act(async () => {});

        expect(result.current.plan).toBeNull();
        expect(result.current.loading).toBe(false);
    });
});
