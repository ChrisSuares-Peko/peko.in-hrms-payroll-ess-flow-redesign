import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getEInvoiceDashboardApi } from '../../../api/eInvoice';
import useEInvoiceDashboard from '../../../hooks/eInvoiceDashboard/useEInvoiceDashboard';

vi.mock('../../../api/eInvoice', () => ({
    getEInvoiceDashboardApi: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'admin' })),
}));

describe('useEInvoiceDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('maps api response into dashboard stats', async () => {
        (getEInvoiceDashboardApi as Mock).mockResolvedValue({
            totalCount: 10,
            activeCount: 7,
            activeTotalAmount: 250000,
            cancelledLast30: 1,
            eWaybillActiveCount: 3,
        });

        const { result } = renderHook(() => useEInvoiceDashboard());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.stats.totalIrns).toBe(10);
        expect(result.current.stats.activeIrns).toBe(7);
        expect(result.current.stats.cancelled).toBe(1);
        expect(result.current.stats.eWaybills).toBe(3);
        expect(result.current.stats.activeValueLabel).toContain('value');
    });

    it('keeps default stats when api returns null', async () => {
        (getEInvoiceDashboardApi as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useEInvoiceDashboard());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.stats.totalIrns).toBe(0);
        expect(result.current.stats.activeIrns).toBe(0);
        expect(result.current.stats.cancelled).toBe(0);
        expect(result.current.stats.eWaybills).toBe(0);
    });

    it('passes user credentials to the api', async () => {
        (getEInvoiceDashboardApi as Mock).mockResolvedValue(null);
        renderHook(() => useEInvoiceDashboard());
        await waitFor(() =>
            expect(getEInvoiceDashboardApi).toHaveBeenCalledWith({ userId: 'u1', userType: 'admin' })
        );
    });
});
