import { renderHook, act } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getAllTransaction, getFileBufferReport } from '../../api';
import useHistoryApi from '../../hooks/useHistoryApi';

vi.mock('../../api', () => ({
    getAllTransaction: vi.fn(),
    getFileBufferReport: vi.fn(),
}));

vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { id: '123', role: 'corporate' },
            },
        }),
}));

const baseFilters = {
    searchText: '',
    status: 'ALL',
    sort: 'DESC',
    page: 1,
    itemsPerPage: 10,
    filter: '',
    from: '2026-06-22',
    to: '2026-07-22',
    sortField: '',
};

describe('useHistoryApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('maps the flat records/total response onto history and count', async () => {
        (getAllTransaction as any).mockResolvedValue({
            records: [{ id: 1 }, { id: 2 }],
            total: 2,
        });

        const { result } = renderHook(() => useHistoryApi(baseFilters));

        await act(async () => {});

        expect(getAllTransaction).toHaveBeenCalledWith(
            expect.objectContaining({ userId: '123', userType: 'corporate' })
        );
        expect(result.current.history).toEqual([{ id: 1 }, { id: 2 }]);
        expect(result.current.count).toBe(2);
        expect(result.current.isLoading).toBe(false);
    });

    it('falls back to an empty list and zero count when the API call fails', async () => {
        (getAllTransaction as any).mockResolvedValue(false);

        const { result } = renderHook(() => useHistoryApi(baseFilters));

        await act(async () => {});

        expect(result.current.history).toEqual([]);
        expect(result.current.count).toBe(1);
    });

    it('downloads the report as a CSV blob via file-saver', async () => {
        (getAllTransaction as any).mockResolvedValue({ records: [], total: 0 });
        (getFileBufferReport as any).mockResolvedValue({
            buffer: { data: [1, 2, 3] },
            fileType: 'text/csv',
        });

        const { result } = renderHook(() => useHistoryApi(baseFilters));
        await act(async () => {});

        await act(async () => {
            await result.current.downloadReport('csv');
        });

        expect(getFileBufferReport).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'csv', userId: '123', userType: 'corporate' })
        );
        expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'Verification Report.csv');
    });
});
