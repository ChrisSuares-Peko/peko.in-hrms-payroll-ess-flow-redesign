import React from 'react';

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { vi,test,expect,describe,beforeEach } from 'vitest';

import VehicleDetails from '../../components/addVehicle/VehicleDetails';
import useDeleteFleet from '../../hooks/deleteFleet';
import useAddDocApi from '../../hooks/useAddDocApi';





vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});





vi.mock('../../hooks/deleteFleet');
vi.mock('../../hooks/useAddDocApi');
vi.mock('@src/slices/apiSlice', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@src/slices/apiSlice');
  return {
    ...actual,
    showToast: vi.fn(),
    default: vi.fn(() => ({})),
  };
});


const mockStore = configureStore([]);

describe('VehicleDetails Component', () => {
  const mockDeleteApi = vi.fn(() => Promise.resolve(true));
  const mockAddDocApi = vi.fn(() => Promise.resolve(true));

  beforeEach(() => {
    (useDeleteFleet as any).mockReturnValue({ deleteApi: mockDeleteApi });
    (useAddDocApi as any).mockReturnValue({ addDocApi: mockAddDocApi, loading: false });
  });

  const verifyRcResponseMock = {
    vehicleNumber: 'KL 39 G 1234',
    model: 'Swift VXI',
    fuelType: 'Petrol',
    regAuthority: 'Ernakulam RTO',
    regDate: '2020-10-10',
    insuranceValidUpto: '2030-10-10',
    pucValidUpto: '2030-10-10',
    rawData: {
      rc_expiry_date: '2030-10-10',
      owner_count: 2,
      class: 'LMV',
      body_type: 'Sedan',
      vehicle_colour: 'Red',
      pucc_number: 'PUC123',
      vehicle_cylinders_no: '4',
      unladen_weight: '920 KG',
      wheelbase: '2450 MM',
      vehicle_seat_capacity: '5',
      owner_father_name: 'Ravi',
      permit_valid_upto: '2032-10-10',
      non_use_status: 'No',
    },
    ownerName: 'Arun',
    presentAddress: 'Kochi, Kerala',
    permanentAddress: 'Calicut, Kerala',
    rcStatus: 'ACTIVE',
    blacklistStatus: false,
  };

  const setup = (props = {}) =>
    render(
      <Provider store={mockStore({})}>
        <BrowserRouter>
          <VehicleDetails
            verifyRcResponse={verifyRcResponseMock}
            id="1"
            setRefresh={vi.fn()}
            inputParams={{}}
            {...props}
          />
        </BrowserRouter>
      </Provider>
    );

 test('renders vehicle number', () => {
  setup();
  const elements = screen.getAllByText('KL 39 G 1234');
  expect(elements.length).toBeGreaterThan(0);
});


  test('renders Registration & Tax section', () => {
    setup();
    expect(screen.getByText('Registration & Tax')).toBeInTheDocument();
  });

  test('shows delete button when id is present', () => {
    setup();
    expect(screen.getByRole('button', { name: /Delete Fleet/i })).toBeInTheDocument();
  });


});
