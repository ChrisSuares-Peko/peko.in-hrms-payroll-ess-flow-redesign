import { renderHook, act } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { ticketRaise } from '../../api/index';
import useTicketCreate from '../../hooks/useTicketCreate';

const mockSuccessResponse = {
    status: true,
    data: { id: 'TICKET123', message: 'Ticket created successfully' },
};

vi.mock('react-redux', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useDispatch: vi.fn(() => vi.fn()),
    };
});

vi.mock('../../api/index', () => ({
    ticketRaise: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({
        role: 'admin',
        id: 'USER123',
    })),
}));

describe('useTicketCreate Hook', () => {
    let dispatchMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        dispatchMock = vi.fn();
        (useDispatch as any).mockReturnValue(dispatchMock); // ✅ Ensure useDispatch is properly mocked
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useTicketCreate());

        expect(result.current.responseData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('should create a ticket and update state', async () => {
        (ticketRaise as any).mockResolvedValue(mockSuccessResponse);

        const { result } = renderHook(() => useTicketCreate());

        await act(async () =>
            result.current.handleTicketCreation({
                description: 'Test',
                userId: 0,
                userType: '',
                issueType: '',
                module: '',
                screenshot: '',
                screenshotImageFormat: '',
            })
        );

        expect(ticketRaise).toHaveBeenCalledWith({
            description: 'Test',
            userId: 'USER123',
            userType: 'admin',
            issueType: '',
            module: '',
            screenshot: '',
            screenshotImageFormat: '',
        });

        expect(result.current.responseData).toEqual(mockSuccessResponse.data);
        expect(result.current.isLoading).toBe(false);
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({
                description: 'Ticket created successfully',
                variant: 'success',
            })
        );
    });

    it('should handle API failure correctly', async () => {
        (ticketRaise as any).mockResolvedValue(false);

        const { result } = renderHook(() => useTicketCreate());

        await act(async () =>
            result.current.handleTicketCreation({
                description: 'Test',
                userId: 0,
                userType: '',
                issueType: '',
                module: '',
                screenshot: '',
                screenshotImageFormat: '',
            })
        );

        expect(ticketRaise).toHaveBeenCalled();
        expect(result.current.responseData).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
        expect(dispatchMock).not.toHaveBeenCalled();
    });

    it('should not call API again if a ticket is already created', async () => {
        (ticketRaise as any).mockResolvedValue(mockSuccessResponse);

        const { result, rerender } = renderHook(() => useTicketCreate());

        await act(async () => {
            await result.current.handleTicketCreation({
                description: 'Test',
                userId: 0,
                userType: '',
                issueType: '',
                module: '',
                screenshot: '',
                screenshotImageFormat: '',
            });
        });

        expect(ticketRaise).toHaveBeenCalledTimes(1);

        // Rerender the hook
        rerender();

        expect(ticketRaise).toHaveBeenCalledTimes(1);
    });

    it('should dispatch toast message on successful ticket creation', async () => {
        (ticketRaise as any).mockResolvedValue(mockSuccessResponse);

        const { result } = renderHook(() => useTicketCreate());

        await act(async () => {
            await result.current.handleTicketCreation({
                description: 'Test',
                userId: 0,
                userType: '',
                issueType: '',
                module: '',
                screenshot: '',
                screenshotImageFormat: '',
            });
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({
                description: 'Ticket created successfully',
                variant: 'success',
            })
        );
    });
});
