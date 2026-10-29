import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { postConnectRequest } from '../../api/index';
import useConnectionRequest from '../../hooks/useConnectionRequest';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    postConnectRequest: vi.fn(),
}));

describe('useConnectionRequest Hook', () => {
    let mockNavigate: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock the navigate function
        mockNavigate = vi.fn();
        (useNavigate as unknown as any).mockReturnValue(mockNavigate);

        // Mock Redux state selector
        (useAppSelector as unknown as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'user' },
                },
            })
        );
    });

    it('submits connection request successfully and navigates to success page', async () => {
        const mockResponse = { requestId: '123', message: 'Request submitted successfully' };
        (postConnectRequest as unknown as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useConnectionRequest());

        await act(async () => {
            await result.current.handleConnectionRequest({
                connectId: 101,
                name: 'Test User',
                email: 'test@example.com',
                mobile: '1234567890',
                preferredMode: 'EMAIL',
                requirement: 'Looking for consultation',
            });
        });

        expect(postConnectRequest).toHaveBeenCalledWith({
            connectId: 101,
            name: 'Test User',
            email: 'test@example.com',
            mobile: '1234567890',
            preferredMode: 'EMAIL',
            requirement: 'Looking for consultation',
            credentialId: 1,
            userType: 'user',
        });

        expect(mockNavigate).toHaveBeenCalledWith('/marketplace/success', {
            state: { data: mockResponse },
        });
    });

    it('navigates to failed page on API failure', async () => {
        (postConnectRequest as unknown as any).mockResolvedValue(false);

        const { result } = renderHook(() => useConnectionRequest());

        await act(async () => {
            await result.current.handleConnectionRequest({
                connectId: 102,
                name: 'Failed User',
                email: 'fail@example.com',
                mobile: '9876543210',
                preferredMode: 'MOBILE',
                requirement: 'Failed attempt',
            });
        });

        expect(postConnectRequest).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/marketplace/failed');
    });

    it('handles API exception and navigates to failed page', async () => {
        (postConnectRequest as unknown as any).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useConnectionRequest());

        await act(async () => {
            await result.current.handleConnectionRequest({
                connectId: 103,
                name: 'Error User',
                email: 'error@example.com',
                mobile: '1111111111',
                preferredMode: 'EMAIL',
                requirement: 'Error case',
            });
        });

        expect(postConnectRequest).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/marketplace/failed');
    });
});
