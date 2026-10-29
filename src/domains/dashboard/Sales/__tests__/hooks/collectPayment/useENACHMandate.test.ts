import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import useENACHMandate from '../../../hooks/collectPayment/useENACHMandate';

vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');
    return {
        ...actual,
        message: {
            ...actual.message,
            success: vi.fn(),
        },
    };
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useENACHMandate', () => {
    it('proceedToAuthorisation toggles isSubmitting and returns a mandate URL', async () => {
        const { result } = renderHook(() => useENACHMandate());

        let returned: string;
        await act(async () => {
            returned = await result.current.proceedToAuthorisation({} as any);
        });

        expect(result.current.isSubmitting).toBe(false);
        expect(returned!).toMatch(/^https:\/\/peko\.in\/authorize\/mandate\/M/);
    });

    it('resendAuthLink shows antd success message and resets loading flag', async () => {
        const { message } = await import('antd');

        const { result } = renderHook(() => useENACHMandate());

        await act(async () => {
            await result.current.resendAuthLink();
        });

        expect(message.success).toHaveBeenCalledWith('Authorization link resent');
        expect(result.current.isResending).toBe(false);
    });

    it('cancelMandateSetup resolves and resets isCancelling', async () => {
        const { result } = renderHook(() => useENACHMandate());

        await act(async () => {
            await result.current.cancelMandateSetup();
        });

        expect(result.current.isCancelling).toBe(false);
    });
});
