/* eslint-disable react/button-has-type */
import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, beforeEach, it, expect } from 'vitest';

import ProfileCards from '../../components/driverProfile/ProfileCards';

// ---------- MOCKS ----------
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
  default: ({ isOpen, handleCancel, handleSubmit }: any) =>
    isOpen ? (
      <div data-testid="confirmation-modal">
        <button onClick={handleCancel}>Cancel</button>
        <button onClick={handleSubmit}>Confirm</button>
      </div>
    ) : null,
}));

vi.mock('react-svg', () => ({
  ReactSVG: ({ src }: any) => <div data-testid="react-svg">{src}</div>,
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual: any = await importOriginal(); 
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const driverItem = {
  id: 'D001',
  name: 'John Doe',
  dlNumber: 'DL123456',
  verificationStatus: 'VALID',
  rawData: {
    dl_validity: {
      non_transport: { from: '2020-01-01', to: '2030-01-01' },
    },
    details_of_driving_licence: {
      address_list: [
        { split_address: { country: ['India', 'Delhi'], state: [['Karnataka']] } },
      ],
    },
  },
  assignments: [{ fleet: { vehicleNumber: 'MH01AB1234' } }],
};

describe('ProfileCards Component', () => {
  let setModalDataMock: any;
  let setOpenConfirmationModalMock: any;
  let handleDeleteMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    setModalDataMock = vi.fn();
    setOpenConfirmationModalMock = vi.fn();
    handleDeleteMock = vi.fn();
  });

  const setup = (props = {}) =>
    render(
      <BrowserRouter>
        <ProfileCards
          item={driverItem}
          setModalData={setModalDataMock}
          openConfirmationModal={false}
          setOpenConfirmationModal={setOpenConfirmationModalMock}
          handleDelete={handleDeleteMock}
          {...props}
        />
      </BrowserRouter>
    );

  it('renders driver basic info', () => {
    setup();

    expect(screen.getByText(driverItem.name)).toBeInTheDocument();
    expect(screen.getByText(driverItem.dlNumber)).toBeInTheDocument();
    expect(screen.getByText('DL Status')).toBeInTheDocument();
    expect(screen.getByText('DL Number')).toBeInTheDocument();
    expect(screen.getByTestId('react-svg')).toBeInTheDocument();
  });

  it('renders Delete and View buttons', () => {
    setup();

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('calls setModalData and opens confirmation modal on Delete click', () => {
    setup();

    fireEvent.click(screen.getByText('Delete'));
    expect(setModalDataMock).toHaveBeenCalledWith(driverItem);
    expect(setOpenConfirmationModalMock).toHaveBeenCalledWith(true);
  });

  it('renders confirmation modal when openConfirmationModal is true', () => {
    render(
      <BrowserRouter>
        <ProfileCards
          item={driverItem}
          setModalData={setModalDataMock}
          openConfirmationModal
          setOpenConfirmationModal={setOpenConfirmationModalMock}
          handleDelete={handleDeleteMock}
        />
      </BrowserRouter>
    );

    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('calls handleDelete when confirming in modal', () => {
    render(
      <BrowserRouter>
        <ProfileCards
          item={driverItem}
          setModalData={setModalDataMock}
          openConfirmationModal
          setOpenConfirmationModal={setOpenConfirmationModalMock}
          handleDelete={handleDeleteMock}
        />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Confirm'));
    expect(handleDeleteMock).toHaveBeenCalled();
  });

  it('calls setOpenConfirmationModal(false) when cancelling in modal', () => {
    render(
      <BrowserRouter>
        <ProfileCards
          item={driverItem}
          setModalData={setModalDataMock}
          openConfirmationModal
          setOpenConfirmationModal={setOpenConfirmationModalMock}
          handleDelete={handleDeleteMock}
        />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(setOpenConfirmationModalMock).toHaveBeenCalledWith(false);
  });
});
