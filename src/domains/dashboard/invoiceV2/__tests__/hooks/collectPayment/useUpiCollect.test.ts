import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import useUpiCollect from '../../../hooks/collectPayment/useUpiCollect';

describe('useUpiCollect (collectPayment)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should toggle loading and call onSuccess after timeout', async () => {
        const { result } = renderHook(() => useUpiCollect());
        const onSuccess = vi.fn();

        act(() => {
            result.current.markAsReceived('inv1', onSuccess);
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.isLoading).toBe(false);
        expect(onSuccess).toHaveBeenCalled();
    });
});
