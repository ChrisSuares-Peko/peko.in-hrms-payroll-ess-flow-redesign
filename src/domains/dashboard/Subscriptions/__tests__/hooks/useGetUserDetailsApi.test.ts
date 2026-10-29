import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, beforeEach, test, vi, expect, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getUserDetails } from '../../api/index';
import GetUserDetails from '../../hooks/useGetUserDetailsApi';
import { userDetailsResponse } from '../../types/types';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getUserDetails: vi.fn(),
}));

describe('GetUserDetails Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock implementation for useAppSelector
        (useAppSelector as Mock).mockImplementation(callback =>
            callback({
                reducer: {
                    auth: { role: 'user', id: '123' },
                },
            })
        );
    });
    const mockUserData: userDetailsResponse = {
        addressId: 123,
        addressLine1: '',
        addressLine2: '',
        userName: '',
        userEmail: '',
        userCountry: '',
        mobileNo: '7879',
    };
    test('should initialize with undefined userDetails and isLoading true', () => {
        const { result } = renderHook(() => GetUserDetails());

        expect(result.current.userData).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });

    test('should update userDetails and set isLoading to false when getUserDetails returns data', async () => {
        (getUserDetails as Mock).mockResolvedValue(mockUserData);

        const { result } = renderHook(() => GetUserDetails());

        // Wait for useEffect to run and update state
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Verify updated state
        expect(result.current.userData).toEqual(mockUserData);
        expect(result.current.isLoading).toBe(false);
    });

    test('should set isLoading to false when getUserDetails returns false', async () => {
        (getUserDetails as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => GetUserDetails());

        // Wait for useEffect to run and update state
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Verify state remains unchanged with isLoading set to false
        expect(result.current.userData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    test('should set isLoading to false and return no data on network error', async () => {
        // Mock getUserDetails to throw an error
        (getUserDetails as Mock).mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => GetUserDetails());

        // Wait for the async operation to complete
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.userData).toBeUndefined();
        });
    });

    test('should correctly transition isLoading state during API call', async () => {
        (getUserDetails as Mock).mockResolvedValue(mockUserData);

        const { result } = renderHook(() => GetUserDetails());

        expect(result.current.isLoading).toBe(true);

        // Wait for the state to update after the API call
        await waitFor(() => {
            // After the API call, loading should be false and userData should be populated
            expect(result.current.isLoading).toBe(false);
            expect(result.current.userData).toEqual(mockUserData);
        });
    });
});
