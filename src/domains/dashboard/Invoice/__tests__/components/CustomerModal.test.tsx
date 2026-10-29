import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect, beforeEach, Mock } from 'vitest';

import CustomerModal from '../../components/customers/CustomerModal';
import { useCustomerAdd } from '../../hooks/useCustomerAdd';

vi.mock('../../hooks/useCustomerAdd', () => ({
    useCustomerAdd: vi.fn(),
}));

describe('CustomerModal Component', () => {
    const handleCancel = vi.fn();
    const setRefresh = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the modal correctly', () => {
        (useCustomerAdd as Mock).mockReturnValue({
            customerAdd: vi.fn(),
            customerUpdate: vi.fn(),
            isLoading: false,
        });

        render(<CustomerModal open handleCancel={handleCancel} setRefresh={setRefresh} />);

        expect(screen.getByText('Add Customer')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Customer Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Email ID')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Mobile Number')).toBeInTheDocument();
    });

    it('should prefill input fields when data is provided', () => {
        (useCustomerAdd as Mock).mockReturnValue({
            customerAdd: vi.fn(),
            customerUpdate: vi.fn(),
            isLoading: false,
        });

        render(
            <CustomerModal
                open
                handleCancel={handleCancel}
                setRefresh={setRefresh}
                data={{
                    id: 123,
                    name: 'John Doe',
                    email: 'john@example.com',
                    phoneNumber: '1234567890',
                    address: '123 Street, City',
                    trnNo: 'TRN12345',
                    createdAt: new Date().toISOString(),
                    credential: { username: 'sachin', name: 'some-credential' },
                }}
            />
        );

        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
        expect(screen.getByDisplayValue('123 Street, City')).toBeInTheDocument();
        expect(screen.getByDisplayValue('TRN12345')).toBeInTheDocument();
    });

    it('should call customerAdd when submitting a new customer', async () => {
        const customerAddMock = vi.fn().mockResolvedValue(true);
        (useCustomerAdd as Mock).mockReturnValue({
            customerAdd: customerAddMock,
            customerUpdate: vi.fn(),
            isLoading: false,
        });

        render(<CustomerModal open handleCancel={handleCancel} setRefresh={setRefresh} />);

        fireEvent.change(screen.getByPlaceholderText('Enter Customer Name'), {
            target: { value: 'New User' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter Email ID'), {
            target: { value: 'newuser@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter Mobile Number'), {
            target: { value: '9876543210' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter Address'), {
            target: { value: 'north street california' },
        });

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(customerAddMock).toHaveBeenCalledWith({
                name: 'New User',
                email: 'newuser@example.com',
                phoneNumber: '9876543210',
                address: 'north street california',
                credentialId: undefined,
                trnNo: undefined,
            });
            expect(setRefresh).toHaveBeenCalledWith(true);
            expect(handleCancel).toHaveBeenCalled();
        });
    });

    // it('should call customerUpdate when editing an existing customer', async () => {
    //     const customerUpdateMock = vi.fn().mockResolvedValue(true);
    //     (useCustomerAdd as Mock).mockReturnValue({
    //         customerAdd: vi.fn(),
    //         customerUpdate: customerUpdateMock,
    //         isLoading: false,
    //     });

    //     render(
    //         <CustomerModal
    //             open
    //             handleCancel={handleCancel}
    //             setRefresh={setRefresh}
    //             data={{
    //                 id: 123,
    //                 name: 'New User',
    //                 email: 'newuser@example.com',
    //                 phoneNumber: '9876543210',
    //                 address: 'north street california',
    //                 trnNo: 'TRN12345',
    //                 createdAt: new Date().toISOString(),
    //                 credential: { username: '12132344', name: 'somecredential' },
    //             }}
    //         />
    //     );

    //     fireEvent.change(screen.getByPlaceholderText('Enter Customer Name'), {
    //         target: { value: 'Updated User' },
    //     });
    //     fireEvent.click(screen.getByText('Submit'));
    //     screen.debug(undefined, 893493498);

    //     await waitFor(() => {
    //         expect(customerUpdateMock).toHaveBeenCalledWith({
    //             id: '123',
    //             name: 'Updated User',
    //             email: 'john@example.com',
    //             phoneNumber: '1234567890',
    //             address: '123 Street, City',
    //             trnNo: 'TRN12345',
    //         });
    //         expect(setRefresh).toHaveBeenCalledWith(true);
    //         expect(handleCancel).toHaveBeenCalled();
    //     });
    // });

    it('should show validation error when required fields are empty', async () => {
        (useCustomerAdd as Mock).mockReturnValue({
            customerAdd: vi.fn(),
            customerUpdate: vi.fn(),
            isLoading: false,
        });

        render(<CustomerModal open handleCancel={handleCancel} setRefresh={setRefresh} />);

        fireEvent.click(screen.getByText('Submit'));
        await waitFor(() => {
            expect(screen.getByText('Please enter the customer name')).toBeInTheDocument();
            expect(screen.getByText('Please enter the email ID')).toBeInTheDocument();
            expect(screen.getByText('Please enter the mobile number')).toBeInTheDocument();
        });
    });
});
