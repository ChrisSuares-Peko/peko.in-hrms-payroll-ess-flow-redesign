import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { downloadTicket } from '@domains/dashboard/Hotels/Api';
import useTicketDownloadApi from '@domains/dashboard/Hotels/hooks/useDownloadTicketApi';
import { useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('@domains/dashboard/Hotels/Api', () => ({
    downloadTicket: vi.fn(),
}));

describe('useTicketDownloadApi', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'user', id: '123' });
    });

    it('should download the ticket successfully', async () => {
        const mockResponse = { ticketUrl: 'http://example.com/ticket.pdf' };
        (downloadTicket as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useTicketDownloadApi());

        const data = await act(async () => result.current.download(456));

        expect(downloadTicket).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            orderId: 456,
        });
        expect(data).toEqual(mockResponse);
    });

    it('should handle download failure gracefully', async () => {
        (downloadTicket as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useTicketDownloadApi());

        const data = await act(async () => result.current.download(456));

        expect(downloadTicket).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            orderId: 456,
        });
        expect(data).toBeNull();
    });

    it('should maintain the isLoading state', async () => {
        const { result } = renderHook(() => useTicketDownloadApi());

        act(() => {
            expect(result.current.isLoading).toBe(true);
        });
    });
});
