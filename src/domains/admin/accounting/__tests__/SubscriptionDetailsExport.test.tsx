import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import useSubscriptionDetails from '../hooks/useSubscriptionDetails';
import useSubscriptionDetailsExport from '../hooks/useSubscriptionDetailsExport';
import SubscriptionDetails from '../pages/SubscriptionDetails';

vi.mock('../hooks/useSubscriptionDetails', () => ({ default: vi.fn() }));
vi.mock('../hooks/useSubscriptionDetailsExport', () => ({ default: vi.fn() }));
vi.mock('@src/domains/admin/users/hooks/usePartnersForCorporate', () => ({
    default: () => ({ partnerData: [] }),
}));
vi.mock('@src/domains/admin/reports/hooks/useDownloadOrderDocument', () => ({
    useDownloadOrderDocument: () => ({ loadingKey: null, downloadDocument: vi.fn() }),
}));

const realGetComputedStyle = window.getComputedStyle.bind(window);
beforeAll(() => {
    window.getComputedStyle = ((element: Element) =>
        realGetComputedStyle(element)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

const exportAs = vi.fn();

const renderPage = (url = '/?from=2026-10-01&to=2026-10-06') =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <SubscriptionDetails />
        </MemoryRouter>
    );

beforeEach(() => {
    vi.clearAllMocks();
    (useSubscriptionDetails as unknown as Mock).mockReturnValue({
        isLoading: false,
        count: 5,
        tableData: [],
    });
    (useSubscriptionDetailsExport as unknown as Mock).mockReturnValue({
        exportingFormat: null,
        exportAs,
    });
});

describe('the Subscription Details page export', () => {
    it('offers Excel and PDF and exports in the format clicked', () => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        expect(exportAs.mock.calls.map(call => call[0])).toEqual(['excel', 'pdf']);
        expect(screen.queryByRole('button', { name: /CSV/ })).not.toBeInTheDocument();
    });

    it('exports with the same filters the table is showing', () => {
        renderPage();

        const tableFilters = (useSubscriptionDetails as unknown as Mock).mock.calls.at(-1)?.[0];
        const exportFilters = (useSubscriptionDetailsExport as unknown as Mock).mock.calls.at(
            -1
        )?.[0];

        expect(exportFilters).toEqual({
            searchText: tableFilters.searchText,
            from: '2026-10-01',
            to: '2026-10-06',
            partnerId: tableFilters.partnerId,
            billingType: tableFilters.billingType,
        });
    });

    it('carries the billing type a dashboard card opened the page with', () => {
        renderPage('/?from=2026-10-01&to=2026-10-06&billingType=ANNUALLY');

        expect(
            (useSubscriptionDetailsExport as unknown as Mock).mock.calls.at(-1)?.[0]
        ).toMatchObject({
            billingType: 'ANNUALLY',
        });
    });

    it('disables the buttons when there is nothing to export', () => {
        (useSubscriptionDetails as unknown as Mock).mockReturnValue({
            isLoading: false,
            count: 0,
            tableData: [],
        });
        renderPage();

        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
    });
});
