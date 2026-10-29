import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { fetchRecurringList } from '../../../../api/recurring';
import { useRecurringList } from '../../../../hooks/recurring/list/useRecurringList';

vi.mock('../../../../api/recurring', () => ({
    fetchRecurringList: vi.fn(),
    updateRecurringStatus: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((x: unknown) => x),
}));

vi.mock('react-redux', () => ({
    useDispatch: () => vi.fn(),
}));

vi.mock('@src/hooks/useDebounceSearch', () => ({
    default: vi.fn((_setter: unknown) => ({ searchText: '', updateSearchText: vi.fn() })),
}));

const mockResponse = {
    rows: [],
    recordsTotal: 0,
    stats: { totalSchedule: 3, active: 2, revenueGenerated: 1000 },
};

describe('useRecurringList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches on mount, sets schedules and total', async () => {
        (fetchRecurringList as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useRecurringList());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.schedules).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('sets stats correctly', async () => {
        (fetchRecurringList as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useRecurringList());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.stats.totalSchedule).toBe(3);
        expect(result.current.stats.active).toBe(2);
        expect(result.current.stats.revenueGenerated).toBe(1000);
    });

    it('isLoading starts true, becomes false after fetch', async () => {
        (fetchRecurringList as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useRecurringList());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it('returns empty schedules when api returns null', async () => {
        (fetchRecurringList as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useRecurringList());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.schedules).toEqual([]);
    });
});
