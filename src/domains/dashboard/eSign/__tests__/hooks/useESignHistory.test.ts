import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { OrderHistoryApi } from '../../api';
import useESignHistory from '../../hooks/useESignHistory';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api', () => ({
    OrderHistoryApi: vi.fn(), // Ensure it's properly mocked
}));

describe('useESignHistory Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock Redux store selector
        (useAppSelector as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'user' },
                },
            })
        );
    });

    it('should fetch and set order history data correctly', async () => {
        const mockResponse: any = {
            rows: [
                { id: 101, name: 'Document A', createdAt: '2024-02-13' },
                { id: 102, name: 'Document B', createdAt: '2024-02-12' },
            ],
            recordsTotal: 2,
        };

        (OrderHistoryApi as any).mockImplementation(() => Promise.resolve(mockResponse));

        const { result } = renderHook(() =>
            useESignHistory({ searchText: '', pageSize: 10, page: 1, from: '', to: '' })
        );

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(OrderHistoryApi).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
            searchText: '',
            pageSize: 10,
            page: 1,
        });

        expect(result.current.tableData).toEqual(mockResponse.rows);
        expect(result.current.count).toBe(2);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure and set loading state correctly', async () => {
        (OrderHistoryApi as any).mockImplementation(() => Promise.resolve(false));

        const { result } = renderHook(() =>
            useESignHistory({ searchText: '', pageSize: 10, page: 1, from: '', to: '' })
        );

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(result.current.tableData).toBeUndefined();
        expect(result.current.count).toBe(1);
        expect(result.current.isLoading).toBe(false);
    });

    it('should refresh data when setRefresh is called', async () => {
        const mockResponse: any = {
            rows: [{ id: 103, name: 'Document C', createdAt: '2024-02-10' }],
            recordsTotal: 1,
        };

        (OrderHistoryApi as any).mockImplementation(() => Promise.resolve(mockResponse));

        const { result } = renderHook(() =>
            useESignHistory({ searchText: '', pageSize: 10, page: 1, from: '', to: '' })
        );

        await act(async () => {});

        expect(result.current.tableData).toEqual(mockResponse.rows);

        (OrderHistoryApi as any).mockImplementation(() =>
            Promise.resolve({
                rows: [{ id: 104, name: 'Document D', createdAt: '2024-02-11' }],
                recordsTotal: 1,
            })
        );

        await act(async () => {
            result.current.setRefresh(true);
        });

        expect(result.current.tableData).toEqual([
            { id: 104, name: 'Document D', createdAt: '2024-02-11' },
        ]);
    });
});
