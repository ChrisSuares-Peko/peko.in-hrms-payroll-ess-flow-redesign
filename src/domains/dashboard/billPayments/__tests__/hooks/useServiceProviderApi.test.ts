import { renderHook, cleanup, waitFor } from '@testing-library/react';
import { vi, describe, it, Mock, expect, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getServiceProvider } from '../../api';
import useServiceProviderApi from '../../hooks/useServiceProviderApi';

const mockDispatch = vi.fn();

vi.mock('../../api', () => ({
    getServiceProvider: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));
const mockGetServiceProvider = getServiceProvider as Mock;
const mockUseAppSelector = useAppSelector as Mock;
describe('useServiceProviderApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        mockUseAppSelector.mockReturnValue({ role: 'admin', id: '123' });
    });

    it('should initialize with loading state', () => {
        const { result } = renderHook(() => useServiceProviderApi('testCategory'));
        expect(result.current.isLoading).toBe(true);
        expect(result.current.serviceProviderData).toBeUndefined();
    });

    it('should fetch service providers and update state', async () => {
        const mockResponse = {
            billersArray: [
                {
                    billerId: '1',
                    billerName: 'Provider One',
                    billerInputParams: {
                        paramInfo: [{ param: 'value' }],
                    },
                },
            ],
        };

        mockGetServiceProvider.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useServiceProviderApi('testCategory'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.serviceProviderData).toEqual([
                {
                    value: '1',
                    label: 'Provider One',
                    customerParams: [{ param: 'value' }],
                },
            ]);
        });
    });

    it('should handle API failure gracefully', async () => {
        mockGetServiceProvider.mockResolvedValue(false);

        const { result } = renderHook(() => useServiceProviderApi('testCategory'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.serviceProviderData).toBeUndefined();
        });
    });

    it('should not call API if categoryName is missing', () => {
        renderHook(() => useServiceProviderApi());
        expect(getServiceProvider).not.toHaveBeenCalled();
    });
});
