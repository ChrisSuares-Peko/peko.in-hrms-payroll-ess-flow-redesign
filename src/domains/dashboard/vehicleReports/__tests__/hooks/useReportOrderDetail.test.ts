import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCarReportOrderDetail } from '../../api/index';
import useReportOrderDetail from '../../hooks/useReportOrderDetail';
import { reportOrderFixtures } from '../fixtures/reportOrders';

vi.mock('../../api/index', () => ({
    getCarReportOrderDetail: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({ reducer: { auth: { id: 147, role: 'corporate' } } }),
}));

const [, readyOrder, cancelledOrder] = reportOrderFixtures;

describe('useReportOrderDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('resolves a valuation order with its PDF link and tracker', async () => {
        (getCarReportOrderDetail as any).mockResolvedValue(readyOrder);

        const { result } = renderHook(() => useReportOrderDetail('CR-1054'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getCarReportOrderDetail).toHaveBeenCalledWith({
            userId: 147,
            userType: 'corporate',
            orderId: 'CR-1054',
        });
        expect(result.current.order?.valuation?.reportUrl).toContain('https://');
        expect(result.current.order?.steps).toHaveLength(3);
    });

    // The detail page renders the Fair Market Value card on `{order.valuation ? ...}`,
    // so an order without one must still resolve rather than error.
    it('resolves an order that carries no result yet', async () => {
        (getCarReportOrderDetail as any).mockResolvedValue(cancelledOrder);

        const { result } = renderHook(() => useReportOrderDetail('CR-1059'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.order?.status).toBe('Cancelled');
        expect(result.current.order?.valuation).toBeUndefined();
        expect(result.current.isError).toBe(false);
    });

    it('reports an error when the order cannot be fetched', async () => {
        (getCarReportOrderDetail as any).mockResolvedValue(false);

        const { result } = renderHook(() => useReportOrderDetail('CR-9999'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.order).toBeUndefined();
        expect(result.current.isError).toBe(true);
    });

    // The page redirects to the order list when there is no id, so a `true` here would
    // flash a skeleton on the way out.
    it('makes no request and never loads when no order id is supplied', async () => {
        const { result } = renderHook(() => useReportOrderDetail(null));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getCarReportOrderDetail).not.toHaveBeenCalled();
        expect(result.current.order).toBeUndefined();
    });
});
