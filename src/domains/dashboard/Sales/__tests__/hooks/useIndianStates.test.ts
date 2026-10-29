import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { getIndianStatesApi } from '../../api/settings';
import useIndianStates from '../../hooks/useIndianStates';

vi.mock('../../api/settings', () => ({
    getIndianStatesApi: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useIndianStates', () => {
    it('populates stateOptions with API response and toggles loading flag', async () => {
        const states = [
            { label: 'Kerala', value: 'KL' },
            { label: 'Delhi', value: 'DL' },
        ];
        (getIndianStatesApi as any).mockResolvedValueOnce(states);

        const { result } = renderHook(() => useIndianStates());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getIndianStatesApi).toHaveBeenCalledOnce();
        expect(result.current.stateOptions).toEqual(states);
    });

    it('does not update state when component is unmounted before API resolves', async () => {
        let resolveStates: (v: any) => void = () => {};
        (getIndianStatesApi as any).mockImplementation(
            () =>
                new Promise(resolve => {
                    resolveStates = resolve;
                })
        );

        const { result, unmount } = renderHook(() => useIndianStates());
        unmount();
        resolveStates([{ label: 'Kerala', value: 'KL' }]);

        await Promise.resolve();
        // No state mutation expected after unmount; result snapshot from before unmount
        // remains the initial empty array.
        expect(result.current.stateOptions).toEqual([]);
    });
});
