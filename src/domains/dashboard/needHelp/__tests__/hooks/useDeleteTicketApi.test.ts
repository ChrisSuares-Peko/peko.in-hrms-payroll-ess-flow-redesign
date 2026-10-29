import { renderHook, act } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { deleteTicket } from '../../api/index';
import { useDeleteTicketApi } from '../../hooks/useTicketDeleteApi';

// ✅ Mock API Response
const mockSuccessResponse = {
    status: true,
    data: { id: 'TICKET123', message: 'Ticket deleted successfully' },
};

// ✅ Mock Redux Dispatch
vi.mock('react-redux', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useDispatch: vi.fn(() => vi.fn()),
    };
});

// ✅ Mock API Call
vi.mock('../../api/index', () => ({
    deleteTicket: vi.fn(),
}));

// ✅ Mock Redux Action
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

// ✅ Mock useAppSelector
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({
        role: 'admin',
        id: 'USER123',
    })),
}));

describe('useDeleteTicketApi Hook', () => {
    let dispatchMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        dispatchMock = vi.fn();
        (useDispatch as any).mockReturnValue(dispatchMock); // ✅ Ensures useDispatch is properly mocked
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useDeleteTicketApi(123));

        expect(result.current.loading).toBe(true);
    });

    it('should delete a ticket and update state', async () => {
        (deleteTicket as any).mockResolvedValue(mockSuccessResponse);

        const { result } = renderHook(() => useDeleteTicketApi(123));

        await act(async () => {
            await result.current.deleteTicketData();
        });

        expect(deleteTicket).toHaveBeenCalledWith({
            userId: 'USER123',
            userType: 'admin',
            ticketId: 123,
        });

        expect(result.current.loading).toBe(false);
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({
                description: 'Ticket deleted successfully',
                variant: 'success',
            })
        );
    });

    it('should handle API failure correctly', async () => {
        (deleteTicket as any).mockResolvedValue(false);

        const { result } = renderHook(() => useDeleteTicketApi(123));

        await act(async () => {
            await result.current.deleteTicketData();
        });

        expect(deleteTicket).toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
        expect(dispatchMock).not.toHaveBeenCalled();
    });

    // ✅ NEW TEST CASE 2: Ensures toast message appears on success
    it('should dispatch toast message on successful ticket deletion', async () => {
        (deleteTicket as any).mockResolvedValue(mockSuccessResponse);

        const { result } = renderHook(() => useDeleteTicketApi(123));

        await act(async () => {
            await result.current.deleteTicketData();
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({
                description: 'Ticket deleted successfully',
                variant: 'success',
            })
        );
    });
});
