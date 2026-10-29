import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DownloadType } from '@customtypes/general';

import HistoryHeader from '../../components/HistoryHeader';

describe('HistoryHeader Component', () => {
  const handleSearch = vi.fn();
  const handleChangeFilters = vi.fn();
  const handleDateChange = vi.fn();
  const handleFromChange = vi.fn();
  const handleToChange = vi.fn();
  const handleDownloadReport = vi.fn().mockResolvedValue(undefined);

  const defaultProps = {
    searchText: '',
    setSearchText: vi.fn(),
    handleSearch,
    handleChangeFilters,
    setOpenModal: vi.fn(),
    handleDownloadReport,
    handleDateChange,
    from: '2024-01-01',
    to: '2024-12-31',
    handleFromChange,
    handleToChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(<HistoryHeader {...defaultProps} />);

  it('renders the heading, download buttons and search input', () => {
    renderComponent();

    expect(screen.getByText('Verification History')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('calls handleSearch when typing in the search input', () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'PAN' } });

    expect(handleSearch).toHaveBeenCalled();
  });

  it('calls handleDownloadReport with the correct type for each button', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Excel'));
    await waitFor(() => expect(handleDownloadReport).toHaveBeenCalledWith(DownloadType.Excel));

    fireEvent.click(screen.getByText('CSV'));
    await waitFor(() => expect(handleDownloadReport).toHaveBeenCalledWith(DownloadType.Csv));

    fireEvent.click(screen.getByText('PDF'));
    await waitFor(() => expect(handleDownloadReport).toHaveBeenCalledWith(DownloadType.Pdf));
  });

  it('calls handleChangeFilters when a status filter option is selected', async () => {
    renderComponent();

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    const option = await screen.findByText('Valid');
    fireEvent.click(option);

    expect(handleChangeFilters).toHaveBeenCalledWith('VALID', expect.any(Object));
  });
});
