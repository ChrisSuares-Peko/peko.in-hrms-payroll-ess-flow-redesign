import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, Mock } from 'vitest';

vi.mock('@src/services/indianStates', () => ({ getIndianStates: vi.fn() }));

const STATES = [
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Odisha', value: 'Odisha' },
];

const load = async () => {
    vi.resetModules();
    const service = await import('@src/services/indianStates');
    const useIndianStates = (await import('../useIndianStates')).default;
    return { useIndianStates, getIndianStates: service.getIndianStates as Mock };
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useIndianStates', () => {
    it('serves the states the endpoint returned', async () => {
        const { useIndianStates, getIndianStates } = await load();
        getIndianStates.mockResolvedValue(STATES);

        const { result } = renderHook(() => useIndianStates());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.stateOptions).toEqual(STATES);
        expect(getIndianStates).toHaveBeenCalledOnce();
    });

    it('starts empty rather than guessing at a list of its own', async () => {
        const { useIndianStates, getIndianStates } = await load();
        getIndianStates.mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useIndianStates());

        expect(result.current.stateOptions).toEqual([]);
        expect(result.current.isLoading).toBe(true);
    });

    /**
     * Three screens in Corporate Cards alone mount a state select, and the KYB form mounts two at once.
     */
    it('fetches once however many callers ask', async () => {
        const { useIndianStates, getIndianStates } = await load();
        getIndianStates.mockResolvedValue(STATES);

        const first = renderHook(() => useIndianStates());
        renderHook(() => useIndianStates());
        await waitFor(() => expect(first.result.current.isLoading).toBe(false));

        const later = renderHook(() => useIndianStates());
        await waitFor(() => expect(later.result.current.stateOptions).toEqual(STATES));

        expect(getIndianStates).toHaveBeenCalledOnce();
    });

    // getIndianStates answers a failure with [], so caching it would leave the select empty for the session.
    it('retries after a failed fetch instead of caching the empty list', async () => {
        const { useIndianStates, getIndianStates } = await load();
        getIndianStates.mockResolvedValueOnce([]).mockResolvedValueOnce(STATES);

        const failed = renderHook(() => useIndianStates());
        await waitFor(() => expect(failed.result.current.isLoading).toBe(false));
        expect(failed.result.current.stateOptions).toEqual([]);

        const retried = renderHook(() => useIndianStates());
        await waitFor(() => expect(retried.result.current.stateOptions).toEqual(STATES));

        expect(getIndianStates).toHaveBeenCalledTimes(2);
    });
});
