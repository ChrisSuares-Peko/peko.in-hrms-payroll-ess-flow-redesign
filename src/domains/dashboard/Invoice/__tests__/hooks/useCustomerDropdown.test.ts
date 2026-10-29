import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { findAll } from '../../api/index';
import { useCustomerDropdown } from '../../hooks/useCustomerDropdown';

// Mock API response
vi.mock('../../api/index', () => ({
    findAll: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({
        id: 'user123',
        role: 'admin',
    })),
}));

describe('useCustomerDropdown', () => {
    const mockData = {
        customerDetails: [
            { id: '1', name: 'Customer 1' },
            { id: '2', name: 'Customer 2' },
        ],
    };
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('should fetch customer data and update state', async () => {
        (findAll as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useCustomerDropdown('Test'));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {});

        expect(result.current.isLoading).toBe(false);
        expect(result.current.tableData).toEqual(mockData.customerDetails);
    });

    it('should set loading to false when API call fails', async () => {
        (findAll as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useCustomerDropdown('Test'));

        await waitFor(() => {});

        expect(result.current.isLoading).toBe(false);
        expect(result.current.tableData).toEqual([]);
    });

    it('should refetch data when searchText changes', async () => {
        (findAll as Mock).mockResolvedValue(mockData);

        const { rerender } = renderHook(
            ({ searchText }) => useCustomerDropdown(searchText),
            { initialProps: { searchText: 'Initial' } }
        );

        await waitFor(() => {});
        expect(findAll).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            searchText: 'Initial',
        });

        rerender({ searchText: 'Updated' });

        await waitFor(() => {});
        expect(findAll).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            searchText: 'Updated',
        });
    });

    it('should refresh when setRefresh is called', async () => {
        (findAll as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useCustomerDropdown(''));

        await waitFor(() => {});
        expect(result.current.tableData).toEqual(mockData.customerDetails);

        act(() => {
            result.current.setRefresh(true);
        });

        await waitFor(() => {});
        expect(findAll).toHaveBeenCalledTimes(3);
    });
});
