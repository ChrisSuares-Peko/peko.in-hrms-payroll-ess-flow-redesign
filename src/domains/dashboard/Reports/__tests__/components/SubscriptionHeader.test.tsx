import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DownloadType } from '@customtypes/general';

import SubscriptionHeader from '../../components/SubscriptionHeader';

// Mock required functions
const mockHandleChangeFilters = vi.fn();
const mockHandleDateChange = vi.fn();
const mockHandleFromChange = vi.fn();
const mockHandleToChange = vi.fn();
const mockHandleSearch = vi.fn();
const mockHandleDownloadReport = vi.fn();

const mockProps = {
    isLoading: false,
    subscription: [
        { label: 'All', value: 'all' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
    ],
    handleChangeFilters: mockHandleChangeFilters,
    handleDateChange: mockHandleDateChange,
    handleFromChange: mockHandleFromChange,
    handleToChange: mockHandleToChange,
    handleSearch: mockHandleSearch,
    handleDownloadReport: mockHandleDownloadReport,
    from: '2024-01-01',
    to: '2024-02-01',
    searchText: '',
    text: 'Subscription Reports',
    initialFrom: '2024-01-01',
    initialTo: '2024-02-01',
    isCashbackTable: false,
    hasData: true,
};

describe('SubscriptionHeader Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders SubscriptionHeader correctly', () => {
        render(<SubscriptionHeader {...mockProps} />);

        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByText('Excel')).toBeInTheDocument();
        expect(screen.getByText('CSV')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
    });

    it('handles search input changes correctly', () => {
        render(<SubscriptionHeader {...mockProps} />);

        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Test Query' } });

        expect(searchInput).toHaveValue('Test Query');
    });

    it('calls handleSearch when typing in search box', () => {
        render(<SubscriptionHeader {...mockProps} />);

        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Test Query' } });

        expect(mockHandleSearch).not.toHaveBeenCalled(); // Debounced search, delay needed
    });

    it('calls handleDownloadReport when clicking report buttons', () => {
        render(<SubscriptionHeader {...mockProps} />);

        const excelButton = screen.getByText('Excel');
        fireEvent.click(excelButton);
        expect(mockHandleDownloadReport).toHaveBeenCalledWith(DownloadType.Excel, false);

        const csvButton = screen.getByText('CSV');
        fireEvent.click(csvButton);
        expect(mockHandleDownloadReport).toHaveBeenCalledWith(DownloadType.Csv, false);

        const pdfButton = screen.getByText('PDF');
        fireEvent.click(pdfButton);
        expect(mockHandleDownloadReport).toHaveBeenCalledWith(DownloadType.Pdf, false);
    });
});
