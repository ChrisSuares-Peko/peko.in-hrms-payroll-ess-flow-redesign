import React from 'react';

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import ManageFleet from '../../pages/ManageFleet';



vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    Select: ({ children, ...props }: any) => (
      <select {...props}>{children}</select>
    ),
  };
});

const mockStore = configureStore([]);
let store: any;

const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

const mockNavigate = vi.fn();
vi.mock('react-redux', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});


vi.mock('../../hooks/useGetAllDrivers', () => ({
  default: () => ({
    drivers: [
      { driverId: '1', name: 'John Doe' },
      { driverId: '2', name: 'Jane Smith' },
    ],
  }),
}));

vi.mock('../../hooks/useManageFleet', () => ({
  default: () => ({
    fleet: [
      { id: 'veh1', vehicleNumber: 'KA01AB1234', model: 'Maruti Swift', fuelType: 'Petrol', rcStatus: 'ACTIVE', assignments: [] },
    ],
    count: 1,
    isLoading: false,
    assignApi: vi.fn(),
    deleteApi: vi.fn(),
    downloadReport: vi.fn(),
    setRefresh: vi.fn(),
  }),
}));

vi.mock('@src/hooks/useDebounceSearch', () => ({
  default: () => ({
    searchText: '',
    updateSearchText: vi.fn(),
  }),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
  default: () => ({ xs: false }),
}));

vi.mock('../../hooks/useFilter', () => ({
  default: () => ({
    handleSearch: vi.fn(),
    handlePageChange: vi.fn(),
  }),
}));

beforeEach(() => {
  store = mockStore({});
  mockDispatch.mockClear();
  mockNavigate.mockClear();
});

describe('ManageFleet Component', () => {
  test('renders heading', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ManageFleet />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Manage Fleet')).toBeInTheDocument();
    expect(screen.getByText('Manage your vehicles and assign drivers')).toBeInTheDocument();
  });

  test('renders table with data', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ManageFleet />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('KA01AB1234')).toBeInTheDocument();
  });

 
});
