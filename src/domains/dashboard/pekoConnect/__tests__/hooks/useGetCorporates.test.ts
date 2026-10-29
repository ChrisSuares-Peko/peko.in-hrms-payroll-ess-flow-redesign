import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, Mock } from 'vitest';

import { getCorporates } from '../../api/index';
import { useGetCorporates } from '../../hooks/useGetCorporates';

// Mock API Response
vi.mock('../../api/index', () => ({
    getCorporates: vi.fn(),
}));

describe('useGetCorporates', () => {
    it('should return empty corporates when searchText is empty or less than 3 characters', async () => {
        const { result } = renderHook(() => useGetCorporates({ searchText: '' }));

        expect(result.current.corporates).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('should call API and update corporates when searchText is valid', async () => {
        // Mock API response
        const mockData = {
            result: [
                { id: '123', name: 'Company A', credential: { username: 'corpA' } },
                { id: '456', name: 'Company B', credential: { username: 'corpB' } },
            ],
        };
        (getCorporates as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useGetCorporates({ searchText: 'Com' }));

        await waitFor(() => expect(getCorporates).toHaveBeenCalledWith({ searchText: 'Com' }));

        expect(result.current.corporates).toEqual([
            { value: '123', label: 'Company A - corpA' },
            { value: '456', label: 'Company B - corpB' },
        ]);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API errors and return empty corporates', async () => {
        (getCorporates as Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useGetCorporates({ searchText: 'Error' }));

        await waitFor(() => expect(getCorporates).toHaveBeenCalledWith({ searchText: 'Error' }));
        expect(result.current.corporates).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state correctly during API call', async () => {
        (getCorporates as Mock).mockResolvedValue({ result: [] });

        const { result } = renderHook(() => useGetCorporates({ searchText: 'Test' }));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it('should allow manual refresh using refresh function', async () => {
        const mockData = {
            result: [{ id: '999', name: 'Company C', credential: { username: 'corpC' } }],
        };
        (getCorporates as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useGetCorporates({ searchText: 'Corp' }));

        await act(async () => {
            await result.current.refresh();
        });

        expect(getCorporates).toHaveBeenCalledWith({ searchText: 'Corp' });
        expect(result.current.corporates).toEqual([{ value: '999', label: 'Company C - corpC' }]);
    });
});
