import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import ExportButtons from '../components/common/ExportButtons';
import useFeeDetails from '../hooks/useFeeDetails';
import useFeeDetailsExport from '../hooks/useFeeDetailsExport';
import FeeDetails from '../pages/FeeDetails';

vi.mock('../hooks/useFeeDetails', () => ({ default: vi.fn() }));
vi.mock('../hooks/useFeeDetailsExport', () => ({ default: vi.fn() }));
vi.mock('@src/domains/admin/reports/hooks/useVendors', () => ({
    default: () => ({ dropDownData: [] }),
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

const mockFeeDetails = (count: number, isLoading = false) =>
    (useFeeDetails as unknown as Mock).mockReturnValue({ isLoading, count, tableData: [] });

const mockExport = (exportingFormat: string | null = null) =>
    (useFeeDetailsExport as unknown as Mock).mockReturnValue({ exportingFormat, exportAs });

const renderPage = (feeType: 'commission' | 'platformFee' = 'commission') =>
    render(
        <MemoryRouter initialEntries={['/?from=2026-09-06&to=2026-10-06']}>
            <FeeDetails feeType={feeType} />
        </MemoryRouter>
    );

beforeEach(() => {
    vi.clearAllMocks();
    mockFeeDetails(12);
    mockExport();
});

describe('the export buttons', () => {
    it('offer Excel and PDF only', () => {
        render(<ExportButtons onExport={vi.fn()} loadingFormat={null} />);

        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeEnabled();
        expect(screen.queryByRole('button', { name: /CSV/ })).not.toBeInTheDocument();
    });

    it('ask for the format that was clicked', () => {
        const onExport = vi.fn();
        render(<ExportButtons onExport={onExport} loadingFormat={null} />);

        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        expect(onExport.mock.calls.map(call => call[0])).toEqual(['excel', 'pdf']);
    });

    it('lock every button while one file is being prepared, so two downloads never overlap', () => {
        render(<ExportButtons onExport={vi.fn()} loadingFormat="pdf" />);

        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
    });

    it('can be switched off entirely', () => {
        render(<ExportButtons onExport={vi.fn()} loadingFormat={null} disabled />);

        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
    });
});

describe('the Fee Details page export', () => {
    it('shows the buttons and exports in the format clicked', () => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        expect(exportAs).toHaveBeenCalledWith('pdf');
    });

    it('exports with the same filters the table is showing', () => {
        renderPage('platformFee');

        const tableFilters = (useFeeDetails as unknown as Mock).mock.calls.at(-1)?.[0];
        const [exportFilters, fileLabel] = (useFeeDetailsExport as unknown as Mock).mock.calls.at(
            -1
        )!;

        expect(exportFilters).toEqual({
            feeType: 'platformFee',
            searchText: tableFilters.searchText,
            from: '2026-09-06',
            to: '2026-10-06',
            vendorId: tableFilters.vendorId,
        });
        expect(tableFilters).toMatchObject({ from: '2026-09-06', to: '2026-10-06' });
        expect(fileLabel).toBe('Platform Fee Details');
    });

    it('names the commission file Commission Details', () => {
        renderPage('commission');

        expect((useFeeDetailsExport as unknown as Mock).mock.calls.at(-1)![1]).toBe(
            'Commission Details'
        );
    });

    it('disables the buttons when there is nothing to export', () => {
        mockFeeDetails(0);
        renderPage();

        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
    });

    it('disables the buttons while the table is still loading', () => {
        mockFeeDetails(12, true);
        renderPage();

        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
    });
});
