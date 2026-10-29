import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getServiceDetails } from '../../api/index';
import useServiceDetailApi from '../../hooks/useServiceDetailApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getServiceDetails: vi.fn(),
}));

describe('useServiceDetailApi Hook', () => {
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

    it('fetches service details successfully', async () => {
        const mockResponse = {
            data: {
                id: 101,
                serviceProvider: 'Example Service',
                tagline: 'Best in the market',
                address: '123 Service Street',
                category: 'IT Services',
                description: 'This is a test service provider.',
                offerings: 'Special offers available',
                services: ['Consulting', 'Development'],
                email: 'service@example.com',
                website: 'www.example.com',
                mobileNo: '9876543210',
                rewards: '10% discount',
                logo: 'https://example.com/logo.png',
            },
        };

        (getServiceDetails as unknown as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useServiceDetailApi('101'));

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(getServiceDetails).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
            serviceID: '101',
        });

        expect(result.current.data).toEqual(mockResponse.data);
        expect(result.current.isLoading).toBe(false);
    });

    it('handles API failure and redirects to connect page', async () => {
        (getServiceDetails as unknown as any).mockResolvedValue(false);

        const { result } = renderHook(() => useServiceDetailApi('101'));

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(getServiceDetails).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
            serviceID: '101',
        });

        expect(result.current.data).toBeUndefined();
        expect(mockNavigate).toHaveBeenCalledWith('/marketplace');
        expect(result.current.isLoading).toBe(false);
    });

    it('does not call API if connectID is undefined', async () => {
        const { result } = renderHook(() => useServiceDetailApi(undefined));

        await act(async () => {});

        expect(getServiceDetails).not.toHaveBeenCalled();
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });
});
