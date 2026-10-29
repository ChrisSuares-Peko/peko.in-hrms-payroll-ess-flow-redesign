import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getServiceList } from '../../api/index';
import { useConnectApi } from '../../hooks/useConnectApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getServiceList: vi.fn(),
}));

describe('useConnectApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock Redux store selector
        (useAppSelector as unknown as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'user' },
                },
            })
        );
    });

    it('fetches and sets connect services list correctly', async () => {
        const mockResponse = {
            data: [
                {
                    id: 1,
                    serviceProvider: 'Example Service 1',
                    logo: 'https://example.com/logo1.png',
                    tagline: 'Best service provider 1',
                    rewards: 'Special offer 1',
                },
                {
                    id: 2,
                    serviceProvider: 'Example Service 2',
                    logo: 'https://example.com/logo2.png',
                    tagline: 'Best service provider 2',
                    rewards: 'Special offer 2',
                },
            ],
        };

        (getServiceList as unknown as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useConnectApi());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            try {
                await getServiceList({
                    userId: 1,
                    userType: '',
                });
            } catch (error) {
                // API call failed
            }
        });

        expect(getServiceList).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
        });

        expect(result.current.data).toEqual([
            {
                id: 1,
                name: 'Example Service 1',
                image: 'https://example.com/logo1.png',
                tagline: 'Best service provider 1',
                offer: 'Special offer 1',
            },
            {
                id: 2,
                name: 'Example Service 2',
                image: 'https://example.com/logo2.png',
                tagline: 'Best service provider 2',
                offer: 'Special offer 2',
            },
        ]);

        expect(result.current.isLoading).toBe(false);
    });

    it('returns an empty array when API response is empty', async () => {
        (getServiceList as unknown as any).mockResolvedValue({ data: [] });

        const { result } = renderHook(() => useConnectApi());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            try {
                await getServiceList({
                    userId: 1,
                    userType: '',
                });
            } catch (error) {
                // API call failed
            }
        });

        expect(result.current.data).toEqual([]); // No services returned
        expect(result.current.isLoading).toBe(false);
    });

    it('handles API failure gracefully', async () => {
        (getServiceList as unknown as any).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useConnectApi());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            try {
                await getServiceList({
                    userId: 1,
                    userType: '',
                });
            } catch (error) {
                // API call failed
            }
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });
});
