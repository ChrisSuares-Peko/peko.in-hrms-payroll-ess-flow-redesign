import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { fetchReminderDashboard } from '../../../api/reminder';
import { useReminderData } from '../../../hooks/reminders/useReminderData';

vi.mock('../../../api/reminder', () => ({ fetchReminderDashboard: vi.fn() }));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

const baseFilters = {
    page: 1,
    itemsPerPage: 10,
    status: '',
    searchText: '',
    sort: 'DESC' as const,
    sortField: 'createdAt',
    startDate: '',
    endDate: '',
};

const mockResponse = {
    rows: [],
    recordsTotal: 0,
    stats: { pending: 2, completed: 1, cancelled: 0 },
};

describe('useReminderData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('isLoading starts true then becomes false after fetch', async () => {
        (fetchReminderDashboard as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useReminderData(baseFilters));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it('sets stats correctly from response', async () => {
        (fetchReminderDashboard as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useReminderData(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.stats.pending).toBe(2);
        expect(result.current.stats.completed).toBe(1);
        expect(result.current.stats.cancelled).toBe(0);
    });

    it('returns empty reminders array when api returns []', async () => {
        (fetchReminderDashboard as Mock).mockResolvedValue({ ...mockResponse, rows: [] });

        const { result } = renderHook(() => useReminderData(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.reminders).toEqual([]);
    });

    it('keeps initial state when api returns null', async () => {
        (fetchReminderDashboard as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useReminderData(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.reminders).toEqual([]);
        expect(result.current.stats).toEqual({ pending: 0, completed: 0, cancelled: 0 });
    });
});
