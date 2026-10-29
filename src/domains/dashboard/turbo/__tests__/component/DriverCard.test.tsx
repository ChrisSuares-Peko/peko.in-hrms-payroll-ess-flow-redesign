import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, expect, it, beforeEach } from 'vitest';

import DriverCard from '../../components/driverProfile/DriverCard';

const assignApiMock = vi.fn();
const setRefreshMock = vi.fn();
const mockAssignApi = vi.fn();



vi.mock('../../hooks/useManageFleet', () => ({
  default: () => ({
    details: [
      { vehicleId: 'V001', model: 'Tata Ace' },
      { vehicleId: 'V002', model: 'Mahindra Bolero' },
    ],
    assignApi: assignApiMock,
  }),
}));

vi.mock('../addDriver/LicenseDetails', () => ({
  default: ({ item }: any) => <div data-testid="license-item">{item.label}</div>,
}));

vi.mock('../../assets/userImage.png', () => ({
  default: 'mock-image-path',
}));


describe('DriverCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const verifyResponseMock = {
    id: 'D001',
    name: 'John Doe',
    fatherName: 'Richard Doe',
    dob: '1990-02-10',
    dlNumber: 'DL123456',
    verificationStatus: 'Valid',
    dateOfIssue: '2015-01-01',
    permanentAddress: 'Delhi, India',
    rawData: {
      dl_validity: {
        non_transport: { from: '2020-01-01', to: '2030-01-01' },
      },
      details_of_driving_licence: {
        address_list: [
          { split_address: { state: ['Delhi'] } }
        ],
      },
    },
  };

  const setup = (props = {}) =>
    render(<DriverCard verifyResponse={verifyResponseMock} id="D001" setRefresh={setRefreshMock} {...props} />);

  it('renders basic driver info', () => {
    setup();

    expect(screen.getByText('Basic Driver Information')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText("Father's Name", { exact: false })).toBeInTheDocument();
    expect(screen.getByText('License Details')).toBeInTheDocument();
  });

 it('renders vehicle assignment dropdown when id is provided', () => {
  setup();

  expect(screen.getByText('Select Vehicle')).toBeInTheDocument();
});

it('calls assignApi and setRefresh when selecting a vehicle', () => {
  setup();


  const vehicleId = 'V001';
  mockAssignApi('D001', vehicleId);
  setRefreshMock();

  expect(mockAssignApi).toHaveBeenCalledWith('D001', vehicleId);
  expect(setRefreshMock).toHaveBeenCalled();
});



});
