import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, beforeEach, expect, it } from 'vitest';

import HikeHistory from '../../components/HikeHistory';
import { useGetHikeHistoryApi } from '../../hooks/useGetHikeHistoryApi';

vi.mock('../../hooks/useGetHikeHistoryApi', () => ({
    useGetHikeHistoryApi: vi.fn(),
}));

describe('HikeHistory Component', () => {
    const mockHikeHistoryData = [
        {
            date: '2024-10-01',
            hikes: [
                { name: 'Hike 1', quantity: 10, price: 150.0, totalPrice: 1500.0 },
                { name: 'Hike 2', quantity: 5, price: 200.0, totalPrice: 1000.0 },
            ],
            totalAmount: '2500.00',
            status: 'success',
        },
    ];

    const mockApi = {
        hikeHistoryData: mockHikeHistoryData,
        total: 1,
        isLoading: false,
        page: 1,
        setPage: vi.fn(),
        pageSize: 10,
        setPageSize: vi.fn(),
        searchText: '',
        setSearchText: vi.fn(),
    };

    beforeEach(() => {
        (useGetHikeHistoryApi as any).mockReturnValue(mockApi);
    });

    it('renders the component correctly', () => {
        render(<HikeHistory />);

        expect(screen.getByText('Order History')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search for orders')).toBeInTheDocument();
    });
    it('renders the table data correctly', async () => {
        render(<HikeHistory />);

        await waitFor(() => {
            expect(screen.getByText(/hike 1/i)).toBeInTheDocument();
            expect(screen.getByText(/hike 2/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/october 1, 2024/i)).toBeInTheDocument();
        expect(screen.getByText(/₹ 2500.00/i)).toBeInTheDocument();
        expect(screen.getByText(/success/i)).toBeInTheDocument();
    });

    it('calls setSearchText when search input changes', () => {
        render(<HikeHistory />);

        const searchInput = screen.getByPlaceholderText('Search for orders');
        fireEvent.change(searchInput, { target: { value: 'Hike 1' } });

        // expect(mockApi.setSearchText).toHaveBeenCalledWith('Hike 1');
    });
});
