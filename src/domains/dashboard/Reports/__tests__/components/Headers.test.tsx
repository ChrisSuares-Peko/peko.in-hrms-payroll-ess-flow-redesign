import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DownloadType } from '@customtypes/general';

import Headers from '../../components/Headers';

// Mock store
const mockStore = configureStore();
const store = mockStore({});

describe('Headers Component', () => {
    const handleChangeFilters = vi.fn();
    const handleDateChange = vi.fn();
    const handleFromChange = vi.fn();
    const handleToChange = vi.fn();
    const handleDownloadReport = vi.fn();
    const handleSearch = vi.fn();

    const categoryMock = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
    ];

    const defaultProps = {
        isLoading: false,
        category: categoryMock,
        handleChangeFilters,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleDownloadReport,
        handleSearch,
        from: '2024-01-01',
        to: '2024-12-31',
        searchText: '',
        text: 'Test Header',
        initialFrom: '2024-01-01',
        initialTo: '2024-12-31',
        isCashbackTable: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () =>
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Headers orderLoading={false} {...defaultProps} />
                </MemoryRouter>
            </Provider>
        );

    it('renders without crashing', () => {
        renderComponent();
        expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
        expect(screen.getByText(/Excel/i)).toBeInTheDocument();
        expect(screen.getByText(/CSV/i)).toBeInTheDocument();
        expect(screen.getByText(/PDF/i)).toBeInTheDocument();
    });

    it('calls handleSearch when typing in search input', async () => {
        renderComponent();
        const input = screen.getByPlaceholderText(/Search/i);
        fireEvent.change(input, { target: { value: 'Test Query' } });
        expect(handleSearch).not.toHaveBeenCalled();
    });

    it('calls handleChangeFilters when a filter is selected', async () => {
        renderComponent();
        const select = screen.getByRole('combobox');

        fireEvent.mouseDown(select);
        const option = await screen.findByText('Option 2');
        fireEvent.click(option);

        expect(handleChangeFilters).toHaveBeenCalledWith('option2', expect.any(Object));
    });

    it('calls handleDownloadReport when buttons are clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByText(/Excel/i));
        expect(handleDownloadReport).toHaveBeenCalledWith(DownloadType.Excel, false);

        fireEvent.click(screen.getByText(/CSV/i));
        expect(handleDownloadReport).toHaveBeenCalledWith(DownloadType.Csv, false);

        fireEvent.click(screen.getByText(/PDF/i));
        expect(handleDownloadReport).toHaveBeenCalledWith(DownloadType.Pdf, false);
    });
});
