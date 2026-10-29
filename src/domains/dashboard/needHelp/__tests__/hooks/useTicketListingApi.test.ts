import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ticketListing } from '../../api/index';
import { useTicketListingApi } from '../../hooks/useTicketListingApi';

// ✅ Mock API Response
const mockSuccessResponse = {
    total: 2,
    data: [
        {
            createdAt: '2024-02-15T10:00:00Z',
            id: 1,
            ticketId: 'TICKET123',
            module: 'Module 1',
            description: 'Test Ticket 1',
            status: 'Open',
            issueType: 'Bug',
        },
        {
            createdAt: '2024-02-16T12:00:00Z',
            id: 2,
            ticketId: 'TICKET124',
            module: 'Module 2',
            description: 'Test Ticket 2',
            status: 'Closed',
            issueType: 'Feature Request',
        },
    ],
};

// ✅ Mock Redux Hook
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({
        role: 'admin',
        id: 'USER123',
    })),
}));

// ✅ Mock API Call
vi.mock('../../api/index', () => ({
    ticketListing: vi.fn(),
}));

describe('useTicketListingApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch ticket data and update state', async () => {
        (ticketListing as any).mockResolvedValue(mockSuccessResponse);

        const { result } = renderHook(() =>
            useTicketListingApi('2024-02-01', '2024-02-28', 1, 'all')
        );

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await result.current.getTicketList();
        });

        expect(ticketListing).toHaveBeenCalledWith({
            userId: 'USER123',
            userType: 'admin',
            fromDate: '2024-02-01',
            toDate: '2024-02-28',
            page: 1,
            module: 'all',
        });

        expect(result.current.data.length).toBe(2);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure gracefully', async () => {
        (ticketListing as any).mockResolvedValue(false);

        const { result } = renderHook(() =>
            useTicketListingApi('2024-02-01', '2024-02-28', 1, 'all')
        );

        await act(async () => {
            await result.current.getTicketList();
        });

        expect(ticketListing).toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual([]);
    });

    it('should correctly delete a ticket from state', async () => {
        (ticketListing as any).mockResolvedValue(mockSuccessResponse);

        const { result } = renderHook(() =>
            useTicketListingApi('2024-02-01', '2024-02-28', 1, 'all')
        );

        await act(async () => {
            await result.current.getTicketList();
        });

        expect(result.current.data.length).toBe(2);

        await act(async () => {
            await result.current.handleDelete(1);
        });

        expect(result.current.data.length).toBe(2);
        expect(result.current.data[0].ticketId).toBe('TICKET123');
    });

    it('should handle an empty response correctly', async () => {
        (ticketListing as any).mockResolvedValue({ total: 0, data: [] });

        const { result } = renderHook(() =>
            useTicketListingApi('2024-02-01', '2024-02-28', 1, 'all')
        );

        await act(async () => {
            await result.current.getTicketList();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual([]);
    });

    it('should call API with the correct parameters', async () => {
        (ticketListing as any).mockResolvedValue(mockSuccessResponse);

        const { result } = renderHook(() =>
            useTicketListingApi('2024-02-01', '2024-02-28', 2, 'Module1')
        );

        await act(async () => {
            await result.current.getTicketList();
        });

        expect(ticketListing).toHaveBeenCalledWith({
            userId: 'USER123',
            userType: 'admin',
            fromDate: '2024-02-01',
            toDate: '2024-02-28',
            page: 2,
            module: 'Module1',
        });
    });
});
