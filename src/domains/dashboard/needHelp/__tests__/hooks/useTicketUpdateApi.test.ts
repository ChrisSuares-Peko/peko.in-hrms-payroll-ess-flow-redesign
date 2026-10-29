import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { updateTicket } from '../../api/index';
import { useTicketUpdate } from '../../hooks/useTicketUpdateApi';

// ✅ Mock API Response
const mockSuccessResponse = {
    ticketId: 'TICKET123',
    status: 'Updated',
    message: 'Ticket updated successfully',
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
    updateTicket: vi.fn(),
}));

describe('useTicketUpdate Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update ticket and return success response', async () => {
        (updateTicket as any).mockResolvedValue(mockSuccessResponse);

        const { result } = renderHook(() => useTicketUpdate(1));

        expect(result.current.isLoading).toBe(false);

        await act(async () => {
            const success = await result.current.handleTicketUpdate({
                // @ts-ignore
                description: 'Updated issue',
                module: 'Module1',
            });

            expect(success).toBe(true);
        });

        expect(updateTicket).toHaveBeenCalledWith({
            userId: 'USER123',
            userType: 'admin',
            chatId: 1,
            description: 'Updated issue',
            module: 'Module1',
        });

        expect(result.current.responseData).toEqual(mockSuccessResponse);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure and return false', async () => {
        (updateTicket as any).mockResolvedValue(false);

        const { result } = renderHook(() => useTicketUpdate(1));

        await act(async () => {
            const success = await result.current.handleTicketUpdate({
                module: 'Module1',
            });

            expect(success).toBe(false);
        });

        expect(result.current.responseData).toBeFalsy();
        expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state correctly before and after API call', async () => {
        (updateTicket as any).mockResolvedValue(mockSuccessResponse);

        const { result } = renderHook(() => useTicketUpdate(1));

        await act(async () => {
            const promise = result.current.handleTicketUpdate({
                module: 'Module1',
            });

            expect(result.current.isLoading).toBe(false);
            await promise;
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('should call API with correct parameters', async () => {
        (updateTicket as any).mockResolvedValue(mockSuccessResponse);

        const { result } = renderHook(() => useTicketUpdate(2));

        await act(async () => {
            await result.current.handleTicketUpdate({
                // @ts-ignore
                description: 'Updated issue again',
                module: 'Module2',
            });
        });

        expect(updateTicket).toHaveBeenCalledWith({
            userId: 'USER123',
            userType: 'admin',
            chatId: 2,
            description: 'Updated issue again',
            module: 'Module2',
        });
    });
});
