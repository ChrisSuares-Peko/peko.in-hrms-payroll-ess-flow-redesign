import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { getCompatibleDeviceList } from '@domains/dashboard/esim/api/index'; // Ensure the path is correct
import useGetCompatibleDevice from '@domains/dashboard/esim/hooks/useListCompatibleDevice'; // Ensure the path is correct
import { useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

// Correct the mock path for getCompatibleDeviceList
vi.mock('@domains/dashboard/esim/api/index', () => ({
    getCompatibleDeviceList: vi.fn(), // Mock the API function as a vi.fn()
}));

describe('useGetCompatibleDevice', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'user', id: '123' });
    });

    it('should fetch and set compatible device list successfully', async () => {
        const mockResponse = {
            deviceList: [
                {
                    deviceId: 'device123',
                    deviceName: 'iPhone 12',
                    compatible: true,
                },
            ],
        };

        (getCompatibleDeviceList as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useGetCompatibleDevice());

        // Initially, loading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the API call to complete
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getCompatibleDeviceList).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
        });

        // Check the API result is correctly set in the state
        expect(result.current.compatibleDeviceList).toEqual([
            {
                deviceId: 'device123',
                deviceName: 'iPhone 12',
                compatible: true,
            },
        ]);
    });

    it('should handle API failure and set loading to false', async () => {
        // Mock API failure (return false)
        (getCompatibleDeviceList as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useGetCompatibleDevice());

        // Initially, loading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the API call to complete
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getCompatibleDeviceList).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
        });

        // Check that compatibleDeviceList is undefined when the API fails
        expect(result.current.compatibleDeviceList).toBeUndefined();
    });

    it('should set loading state correctly during the API call', async () => {
        const mockResponse = {
            deviceList: [
                {
                    deviceId: 'device123',
                    deviceName: 'iPhone 12',
                    compatible: true,
                },
            ],
        };

        // Mock a slow API call (resolve after a delay)
        (getCompatibleDeviceList as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
        );

        const { result } = renderHook(() => useGetCompatibleDevice());

        // Initially, loading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the API call to complete and loading state to change
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Check that the data was set correctly after the API call
        expect(result.current.compatibleDeviceList).toEqual([
            {
                deviceId: 'device123',
                deviceName: 'iPhone 12',
                compatible: true,
            },
        ]);
    });
});
