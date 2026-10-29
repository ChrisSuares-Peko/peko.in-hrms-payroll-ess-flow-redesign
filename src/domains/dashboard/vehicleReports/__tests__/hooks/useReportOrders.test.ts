import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getCarReportOrders } from '../../api/index';
import useReportOrders from '../../hooks/useReportOrders';
import { reportOrderFixtures } from '../fixtures/reportOrders';

vi.mock('../../api/index', () => ({
    getCarReportOrders: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({ reducer: { auth: { id: 147, role: 'corporate' } } }),
}));

const ok = (orders = reportOrderFixtures) => ({ orders, count: orders.length });

const renderReady = async () => {
    const view = renderHook(() => useReportOrders());
    await waitFor(() => expect(view.result.current.isLoading).toBe(false));
    return view;
};

describe('useReportOrders', () => {
    it('fetches the first page for the signed-in corporate on mount', async () => {
        (getCarReportOrders as any).mockResolvedValue(ok());

        const { result } = await renderReady();

        expect(getCarReportOrders).toHaveBeenCalledWith({
            userId: 147,
            userType: 'corporate',
            searchText: '',
            from: '',
            to: '',
            page: 1,
            itemsPerPage: 10,
        });
        expect(result.current.rows).toEqual(reportOrderFixtures);
        expect(result.current.count).toBe(reportOrderFixtures.length);
        expect(result.current.isError).toBe(false);
    });

    // Filtering is the server's job now — the hook must forward, not filter.
    it('sends the search text to the server rather than filtering locally', async () => {
        (getCarReportOrders as any).mockResolvedValue(ok());
        const { result } = await renderReady();

        act(() => result.current.handleSearch('CR-1050'));

        await waitFor(() =>
            expect(getCarReportOrders).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'CR-1050' })
            )
        );
    });

    it('sends the date range to the server', async () => {
        (getCarReportOrders as any).mockResolvedValue(ok());
        const { result } = await renderReady();

        act(() => result.current.handleDateChange('2026-07-01', '2026-07-22'));

        await waitFor(() =>
            expect(getCarReportOrders).toHaveBeenLastCalledWith(
                expect.objectContaining({ from: '2026-07-01', to: '2026-07-22' })
            )
        );
    });

    it('requests the page the user asked for', async () => {
        (getCarReportOrders as any).mockResolvedValue(ok());
        const { result } = await renderReady();

        act(() => result.current.handlePageChange(3));

        await waitFor(() =>
            expect(getCarReportOrders).toHaveBeenLastCalledWith(
                expect.objectContaining({ page: 3 })
            )
        );
    });

    // Otherwise a search from page 3 lands on an empty page 3 of the new result set.
    it('returns to the first page whenever the filter changes', async () => {
        (getCarReportOrders as any).mockResolvedValue(ok());
        const { result } = await renderReady();

        act(() => result.current.handlePageChange(3));
        await waitFor(() => expect(result.current.filter.page).toBe(3));

        act(() => result.current.handleSearch('Seltos'));
        await waitFor(() => expect(result.current.filter.page).toBe(1));

        act(() => result.current.handlePageChange(2));
        await waitFor(() => expect(result.current.filter.page).toBe(2));

        act(() => result.current.handleDateChange('2026-07-01', '2026-07-22'));
        await waitFor(() => expect(result.current.filter.page).toBe(1));
    });

    // A failed request is not an empty order history — the page shows a retry instead
    // of "you have never bought a report".
    it('flags an error rather than reporting an empty history', async () => {
        (getCarReportOrders as any).mockResolvedValue(false);

        const { result } = await renderReady();

        expect(result.current.isError).toBe(true);
        expect(result.current.rows).toEqual([]);
        expect(result.current.count).toBe(0);
    });

    it('clears the error once a retry succeeds', async () => {
        (getCarReportOrders as any).mockResolvedValueOnce(false);
        const { result } = await renderReady();
        expect(result.current.isError).toBe(true);

        (getCarReportOrders as any).mockResolvedValueOnce(ok());
        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.isError).toBe(false);
        expect(result.current.rows).toEqual(reportOrderFixtures);
    });
});
