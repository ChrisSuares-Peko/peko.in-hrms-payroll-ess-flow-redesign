import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { stateOptions } from '../../api/index';
import useGeneralApi from '../../hooks/useGeneralApi';

vi.mock('../../api/index', () => ({
    stateOptions: vi.fn(), // Making sure stateOptions is a mock function
}));

const mockStateOptions = stateOptions as Mock; // Type casting to Mock for TypeScript type safety

describe('useGeneralApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks(); // Clearing mocks between tests
    });

    it('should have initial state', () => {
        const { result } = renderHook(() => useGeneralApi());
        expect(result.current.stateData).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });

    it('should fetch state data successfully', async () => {
        const mockResponse = {
            states: [
                { label: 'California', value: 'CA' },
                { label: 'Texas', value: 'TX' },
            ],
        };
        mockStateOptions.mockResolvedValueOnce(mockResponse); // Mocking resolved value

        const { result } = renderHook(() => useGeneralApi());

        await waitFor(() => {
            expect(result.current.stateData).toEqual(mockResponse.states);
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('should handle API failure gracefully', async () => {
        mockStateOptions.mockResolvedValueOnce(false); // Mocking failure response

        const { result } = renderHook(() => useGeneralApi());

        await waitFor(() => {
            expect(result.current.stateData).toBeUndefined();
            expect(result.current.isLoading).toBe(false);
        });
    });
});
