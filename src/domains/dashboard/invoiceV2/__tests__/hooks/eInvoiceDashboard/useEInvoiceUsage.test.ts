import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getEInvoiceUsageApi } from '../../../api/eInvoice';
import useEInvoiceUsage from '../../../hooks/eInvoiceDashboard/useEInvoiceUsage';

vi.mock('../../../api/eInvoice', () => ({ getEInvoiceUsageApi: vi.fn() }));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

const mockResponse = {
    used: 10,
    freeBaseLimit: 50,
    addonLimit: 0,
    maxLimit: 50,
    cycleStart: '2026-07-01',
    cycleEnd: '2026-07-31',
    currentPlanName: 'Basic',
    currentPlanBillingType: null,
    currentPlanAmountPaid: null,
    currentPlanStatus: null,
    lastEInvoiceCreatedAt: null,
};

describe('useEInvoiceUsage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('isLoading starts true, becomes false after fetch', async () => {
        (getEInvoiceUsageApi as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useEInvoiceUsage());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it('sets usage data correctly from response', async () => {
        (getEInvoiceUsageApi as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useEInvoiceUsage());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.usage.used).toBe(10);
        expect(result.current.usage.freeBaseLimit).toBe(50);
        expect(result.current.usage.maxLimit).toBe(50);
    });

    it('usage keeps defaults when api returns null', async () => {
        (getEInvoiceUsageApi as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useEInvoiceUsage());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.usage.used).toBe(0);
        expect(result.current.usage.freeBaseLimit).toBe(0);
    });

    it('refresh function re-triggers the fetch', async () => {
        (getEInvoiceUsageApi as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useEInvoiceUsage());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getEInvoiceUsageApi).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.refresh();
        });

        expect(getEInvoiceUsageApi).toHaveBeenCalledTimes(2);
    });
});
