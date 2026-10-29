import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getIndianStatesApi } from '../../api/settings';
import useIndianStates from '../../hooks/useIndianStates';

vi.mock('../../api/settings', () => ({
    getIndianStatesApi: vi.fn(),
}));

describe('useIndianStates', () => {
    const mockStates = [
        { value: 'KA', label: 'Karnataka' },
        { value: 'MH', label: 'Maharashtra' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch states and update state options', async () => {
        (getIndianStatesApi as Mock).mockResolvedValue(mockStates);

        const { result } = renderHook(() => useIndianStates());

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(getIndianStatesApi).toHaveBeenCalledTimes(1);
        expect(result.current.stateOptions).toEqual(mockStates);
    });

    it('should handle empty response gracefully', async () => {
        (getIndianStatesApi as Mock).mockResolvedValue([]);

        const { result } = renderHook(() => useIndianStates());

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(result.current.stateOptions).toEqual([]);
    });
});
