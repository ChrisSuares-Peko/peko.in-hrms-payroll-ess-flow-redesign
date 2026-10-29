import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { cancellationCharge } from '@domains/dashboard/Hotels/Api';
import useCancellationApi from '@domains/dashboard/Hotels/hooks/useCancellationApi';
import { useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('@domains/dashboard/Hotels/Api', () => ({
    cancellationCharge: vi.fn(),
}));

describe('useCancellationApi', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'user', id: '123' });
    });

    it('should handle cancellation charges successfully and return data', async () => {
        const mockResponse: any = {
            status: 'success',
            charges: [
                { chargeId: '1', amount: 100 },
                { chargeId: '2', amount: 200 },
            ],
        };
        (cancellationCharge as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useCancellationApi());

        const data = await act(async () =>
            result.current.cancellation('booking123', 'conversation456')
        );

        expect(cancellationCharge).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            conversationId: 'conversation456',
            bookingReferenceId: 'booking123',
        });
        expect(data).toEqual(mockResponse);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure gracefully and return false', async () => {
        (cancellationCharge as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useCancellationApi());

        const data = await act(async () =>
            result.current.cancellation('booking123', 'conversation456')
        );

        expect(cancellationCharge).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            conversationId: 'conversation456',
            bookingReferenceId: 'booking123',
        });
        expect(data).toBe(false);
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to true while the API call is in progress', async () => {
        (cancellationCharge as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve(true), 100))
        );

        const { result } = renderHook(() => useCancellationApi());

        act(() => {
            result.current.cancellation('booking123', 'conversation456');
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            // Wait for the mock API to resolve
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to false after the API call regardless of success or failure', async () => {
        (cancellationCharge as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useCancellationApi());

        await act(async () => {
            await result.current.cancellation('booking123', 'conversation456');
        });

        expect(result.current.isLoading).toBe(false);
    });
});
