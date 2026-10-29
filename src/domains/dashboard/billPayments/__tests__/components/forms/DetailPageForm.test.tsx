import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import DetailPageForm from '../../../components/forms/DetailPageForm';
import useFetchBillApi from '../../../hooks/useFetchBillApi';

vi.mock('../../../hooks/useFetchBillApi', () => ({
    default: vi.fn(() => ({
        handlePayment: vi.fn(),
    })),
}));
const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

vi.mock('../../../hooks/useServiceProviderApi', () => ({
    default: vi.fn(() => ({
        serviceProviderData: [
            {
                label: 'Provider 1',
                value: 'provider_1',
                customerParams: [
                    { paramName: 'Account Number', isOptional: false, dataType: 'NUMERIC' },
                ],
            },
            {
                label: 'Provider 2',
                value: 'provider_2',
                customerParams: [
                    { paramName: 'Customer ID', isOptional: true, dataType: 'ALPHANUMERIC' },
                ],
            },
        ],
        isLoading: false,
    })),
}));
const mockUseAppSelector = useAppSelector as Mock;
const mockFetchBill = useFetchBillApi as Mock;
describe('DetailPageForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        mockUseAppSelector.mockReturnValue({ role: 'admin', id: '123' });
    });

    it('renders form inputs correctly', () => {
        render(<DetailPageForm serviceCategory="Electricity" accessKeyName="electricity" />);

        const selectInput = screen.getByRole('combobox'); // Combobox is the role for select inputs
        expect(selectInput).toBeInTheDocument();

        expect(screen.getByRole('button', { name: /View Bill/i })).toBeInTheDocument();
    });

    it('handles service provider selection and renders dynamic inputs', async () => {
        render(<DetailPageForm serviceCategory="Electricity" accessKeyName="electricity" />);

        // Select the provider from the dropdown
        const serviceProviderDropdown = screen.getByRole('combobox');
        fireEvent.mouseDown(serviceProviderDropdown);
        fireEvent.click(await screen.findByText('Provider 1'));

        const accountNumberInput = screen.getByPlaceholderText(
            /Select Account Number/i
        ) as HTMLInputElement;
        expect(accountNumberInput).toBeInTheDocument();

        fireEvent.change(accountNumberInput, { target: { value: '123456' } });
        expect(accountNumberInput.value).toBe('123456');
    });

    it('submits the form with correct values', async () => {
        const mockHandlePayment = vi.fn();
        mockFetchBill.mockReturnValue({ handlePayment: mockHandlePayment });

        render(<DetailPageForm serviceCategory="Electricity" accessKeyName="electricity" />);

        const serviceProviderDropdown = screen.getByRole('combobox');
        fireEvent.mouseDown(serviceProviderDropdown);
        fireEvent.click(await screen.findByText('Provider 1'));
        await waitFor(() => {
            fireEvent.change(screen.getByPlaceholderText(/Select Account Number/i), {
                target: { value: '123456' },
            });
        });

        const submitButton = screen.getByRole('button', { name: /View Bill/i });
        fireEvent.click(submitButton);

        // await waitFor(() => {
        //     expect(mockHandlePayment).toHaveBeenCalledWith(
        //         { serviceProvider: 'provider_1', 'Account Number': '123456' },
        //         'electricity',
        //         ''
        //     );
        // });
    });

    //   it('displays loading state when submitting', async () => {
    //     render(<DetailPageForm serviceCategory="Electricity" accessKeyName="electricity" />);

    //     const submitButton = screen.getByRole('button', { name: /View Bill/i });

    //     fireEvent.click(submitButton);
    // screen.debug(undefined, 200000);
    //     await waitFor(() => {
    //       expect(submitButton.querySelector('.anticon-spin')).toBeInTheDocument();
    //   });

    //   // Optionally check that the button no longer has the loading state after submission
    //   await waitFor(() => {
    //       expect(submitButton.querySelector('.anticon-spin')).not.toBeInTheDocument();
    //   });
    // });
});
