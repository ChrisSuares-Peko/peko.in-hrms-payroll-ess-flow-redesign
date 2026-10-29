/* eslint-disable react/button-has-type */
import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import DocModal from '../../components/documents/DocModal';

vi.mock('@components/atomic/inputs/SelectInput', () => ({
  default: () => <div data-testid="select-input" />,
}));
vi.mock('@components/atomic/inputs/DatePickerInput', () => ({
  default: () => <div data-testid="date-picker-input" />,
}));
vi.mock('@components/atomic/inputs/FileUploadInput', () => ({
  default: () => <div data-testid="file-upload-input" />,
}));


vi.mock('@src/slices/apiSlice', () => ({
  showToast: (payload: any) => ({ type: 'toast/show', payload }),
}));

vi.mock('@components/molecular/modals/CustomModalWithForm', () => ({
  default: ({ children, modalTitle, handleFormSubmit }: any) => (
    <div>
      <h1>{modalTitle}</h1>
      {children}
      <button onClick={() => handleFormSubmit({ type: 'Fitness', expiryDate: '2025-01-01' })}>
        Submit
      </button>
    </div>
  ),
}));

describe('DocModal Component', () => {
  let store: any;
  const createDocMock = vi.fn();

  beforeEach(() => {
   
    store = configureStore({
      reducer: {},
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
    });
    vi.clearAllMocks();
  });

  const setup = (props = {}) =>
    render(
      <Provider store={store}>
        <DocModal
          open
          handleCancel={vi.fn()}
          vehicleId="123"
          createDoc={createDocMock}
          {...props}
        />
      </Provider>
    );

  it('renders modal with form fields', () => {
    setup();

    expect(screen.getByText('Document Management')).toBeInTheDocument();
    expect(screen.getByTestId('select-input')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
    expect(screen.getByTestId('file-upload-input')).toBeInTheDocument();
  });

  it('calls createDoc and dispatches success toast on successful submit', async () => {
    createDocMock.mockResolvedValue({ status: true, message: 'Document Created' });

    const dispatchSpy = vi.spyOn(store, 'dispatch');

    setup();

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(createDocMock).toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalledWith({
        type: 'toast/show',
        payload: { description: 'Document Created ', variant: 'success' },
      });
    });
  });

  it('calls createDoc and dispatches error toast on failed submit', async () => {
    createDocMock.mockResolvedValue({ status: false, message: 'Failed to upload' });

    const dispatchSpy = vi.spyOn(store, 'dispatch');

    setup();

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(createDocMock).toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalledWith({
        type: 'toast/show',
        payload: { description: 'Failed to upload', variant: 'error' },
      });
    });
  });
});
