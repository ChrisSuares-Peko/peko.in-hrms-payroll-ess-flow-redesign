import { renderHook, act } from '@testing-library/react';
import { message } from 'antd';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import useENACHMandate from '../../../hooks/invoiceDetails/useENACHMandate';

vi.mock('antd', async () => {
    const actual: any = await vi.importActual('antd');
    return { ...actual, message: { success: vi.fn() } };
});

describe('useENACHMandate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('proceedToAuthorisation resolves with an auth url', async () => {
        const { result } = renderHook(() => useENACHMandate());
        const promise = result.current.proceedToAuthorisation({} as any);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });

        const url = await promise;
        expect(url).toMatch(/^https:\/\/peko\.in\/authorize\/mandate\//);
    });

    it('resendAuthLink triggers success message', async () => {
        const { result } = renderHook(() => useENACHMandate());
        const promise = result.current.resendAuthLink();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(800);
        });

        await promise;
        expect(message.success).toHaveBeenCalledWith('Authorization link resent');
    });

    it('cancelMandateSetup resolves after delay', async () => {
        const { result } = renderHook(() => useENACHMandate());
        const promise = result.current.cancelMandateSetup();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(500);
        });

        await expect(promise).resolves.toBeUndefined();
    });
});
