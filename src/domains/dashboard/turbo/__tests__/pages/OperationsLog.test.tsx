import { render, screen, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import { describe, test, expect, vi } from 'vitest';

import OperationLog from '../../pages/OperationLog';

vi.mock('@src/hooks/useScreenSize', () => ({
  default: () => ({ xs: false }),
}));

const mockUpdateSearchText = vi.fn();

vi.mock('../../hooks/useDebounceSearch', () => ({
  __esModule: true,
  default: () => ({
    searchText: '',
    updateSearchText: mockUpdateSearchText,
  }),
}));

vi.mock('@src/hooks/store', () => ({
  useAppSelector: (fn: any) =>
    fn({
      reducer: {
        auth: {
          role: 'admin',
          id: '123',
        },
      },
    }),
  useAppDispatch: () => vi.fn(),
}));

vi.mock('../../hooks/useGetAllLogsApi', () => ({
  __esModule: true,
  default: () => ({
    logs: [
      {
        date: dayjs().toISOString(),
        actionType: 'ADD_VEHICLE',
        description: 'Vehicle ABC added',
        asset: 'ABC-123',
      },
      {
        date: dayjs().toISOString(),
        actionType: 'DELETE_DRIVER',
        description: 'Driver John removed',
        asset: 'John Doe',
      },
    ],
    count: 20, 
    isLoading: false,
  }),
}));

const mockHandlePageChange = vi.fn();

vi.mock('../../hooks/useFilter', () => ({
  default: () => ({
    handleSearch: vi.fn(),
    handlePageChange: mockHandlePageChange,
    handleDateChange: vi.fn(),
    handleFromChange: vi.fn(),
    handleToChange: vi.fn(),
  }),
}));

describe('OperationLog Component', () => {
  test('renders heading', () => {
    render(<OperationLog />);
    expect(screen.getByText('Operations Log')).toBeInTheDocument();
  });

  test('renders logs in table', () => {
    render(<OperationLog />);
    expect(screen.getByText(/Vehicle ABC added/)).toBeInTheDocument();
    expect(screen.getByText(/Driver John removed/)).toBeInTheDocument();
  });

  test('pagination change triggers handler', () => {
    render(<OperationLog />);
    fireEvent.click(screen.getByTitle('2')); 
    
    expect(mockHandlePageChange).toHaveBeenCalled();
  });
});
