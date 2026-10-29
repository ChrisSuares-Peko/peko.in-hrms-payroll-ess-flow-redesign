/* eslint-disable @typescript-eslint/no-unused-vars */
import { act } from 'react';

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as storeHooks from '@src/hooks/store';

import { getServiceProvider } from '../../api';
import useServiceProviderApi from '../../hooks/useServiceProviderApi';

// Mocking the necessary imports
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api', () => ({
    getServiceProvider: vi.fn(),
}));

describe('useServiceProviderApi hook', () => {
    const mockCategoryName = 'category1';
    const mockRole = 'user';
    const mockId = '123';
    const mockResponse = {
        billersArray: [
            {
                id: '1',
                name: 'Provider 1',
                customerParams: [],
                billerInputParams: [
                    {
                        paramInfo: {
                            paramName: 'string',
                            dataType: 'string',
                            isOptional: false,
                            minLength: 1,
                            maxLength: 5,
                            regEx: 'string',
                            visibility: true,
                        },
                    },
                ],
            },
            {
                id: '2',
                name: 'Provider 2',
                customerParams: [],
                billerInputParams: [
                    {
                        paramInfo: {
                            paramName: 'string',
                            dataType: 'string',
                            isOptional: false,
                            minLength: 1,
                            maxLength: 5,
                            regEx: 'string',
                            visibility: true,
                        },
                    },
                ],
            },
        ],
    };

    beforeEach(() => {
        // Mock the useAppSelector hook to return fake role and id
        (storeHooks.useAppSelector as any).mockReturnValue({ role: mockRole, id: mockId });
    });

    it('should return correct service provider data and loading state', async () => {
        // Mock the API response
        (getServiceProvider as any).mockResolvedValue(mockResponse);

        // Render the hook
        const { result } = renderHook(() => useServiceProviderApi(mockCategoryName));

        // Check if loading state is true initially
        expect(result.current.isLoading).toBe(true);

        // Wait for the async call to complete
        await act(async () => {
            // Ensure the hook has finished loading
        });

        // Check if service provider data is set correctly. A missing/non-array paramInfo yields an
        // empty customerParams (the [undefined] placeholder is filtered out to avoid a render crash).
        const expectedProvider = {
            value: '',
            label: '',
            customerParams: [],
            billerFetchRequiremet: '',
            billerFetchRequirement: '',
            billerSupportBillValidation: '',
            billerAdhoc: '',
        };
        expect(result.current.serviceProviderData).toEqual([expectedProvider, expectedProvider]);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle empty response from API', async () => {
        // Mock the API response as false (empty data)
        (getServiceProvider as any).mockResolvedValue(false);

        const { result } = renderHook(() => useServiceProviderApi(mockCategoryName));

        // Check if loading state is true initially
        expect(result.current.isLoading).toBe(true);

        // Wait for the async call to complete
        await act(async () => {
            // Ensure the hook has finished loading
        });

        // Check if service provider data is undefined when no data is returned
        expect(result.current.serviceProviderData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('should call getServiceProvider with correct parameters', async () => {
        // Mock the API response
        (getServiceProvider as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useServiceProviderApi(mockCategoryName));

        // Wait for the async call to complete
        await act(async () => {
            // Ensure the hook has finished loading
        });

        // Check that the getServiceProvider was called with the expected parameters
        expect(getServiceProvider).toHaveBeenCalledWith({
            userId: mockId,
            userType: mockRole,
            categoryName: mockCategoryName,
        });
    });

    it('should handle loading state correctly', async () => {
        // Mock the API response
        (getServiceProvider as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useServiceProviderApi(mockCategoryName));

        // Check loading state is true when fetch starts
        expect(result.current.isLoading).toBe(true);

        // Wait for the async call to complete
        await act(async () => {
            // Ensure the hook has finished loading
        });

        // Check loading state is false after fetch is done
        expect(result.current.isLoading).toBe(false);
    });
});
