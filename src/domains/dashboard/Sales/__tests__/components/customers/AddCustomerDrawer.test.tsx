import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import AddCustomerDrawer from '../../../components/customers/AddCustomerDrawer';
import useCustomerActions from '../../../hooks/customer/useCustomerActions';

vi.mock('../../../hooks/customer/useCustomerActions', () => ({
    default: vi.fn(),
}));
vi.mock('../../../hooks/useFormAutoFocus', () => ({
    useFormAutoFocus: vi.fn(() => ({
        handleFormSubmitWithAutoFocus: (handleSubmit: () => void) => handleSubmit(),
        setFormikRef: vi.fn(),
        formikRef: { current: null },
    })),
}));
vi.mock('../../../forms/customer/AddCustomerForm', () => ({
    default: () => <div data-testid="customer-form" />,
}));
vi.mock('../../../components/shared/LeftHeader', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));

const addCustomer = vi.fn();
const editCustomer = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useCustomerActions as any).mockReturnValue({
        addCustomer,
        editCustomer,
        isLoading: false,
    });
});

describe('AddCustomerDrawer', () => {
    it('renders Add header when no editingCustomer', () => {
        render(<AddCustomerDrawer open onClose={() => {}} />);

        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
        expect(
            screen.getByText('Enter customer details to create a new customer profile')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save customer/i })).toBeInTheDocument();
        expect(screen.getByTestId('customer-form')).toBeInTheDocument();
    });

    it('renders Edit header and Save Changes button when editingCustomer provided', () => {
        const editingCustomer: any = {
            id: 'c-1',
            name: 'Acme',
            phoneNumber: '999',
        };
        render(<AddCustomerDrawer open onClose={() => {}} editingCustomer={editingCustomer} />);

        expect(screen.getByText('Edit Customer')).toBeInTheDocument();
        expect(screen.getByText('Update the customer details below')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('Cancel button invokes onClose', () => {
        const onClose = vi.fn();
        render(<AddCustomerDrawer open onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(onClose).toHaveBeenCalled();
    });

    it('shows loading state on save button when isLoading', () => {
        (useCustomerActions as any).mockReturnValue({
            addCustomer,
            editCustomer,
            isLoading: true,
        });
        render(<AddCustomerDrawer open onClose={() => {}} />);

        const saveBtn = screen.getByRole('button', { name: /save customer/i });
        expect(saveBtn.className).toContain('ant-btn-loading');
    });

    it('uses editCustomer flow and closes on success when editing', async () => {
        editCustomer.mockResolvedValueOnce(true);
        const onClose = vi.fn();

        render(
            <AddCustomerDrawer
                open
                onClose={onClose}
                editingCustomer={
                    {
                        id: 'c-1',
                        name: 'Acme Co',
                        phoneNumber: '9999999999',
                        email: 'a@b.com',
                        primaryAddress: '123 Main Street',
                        primaryCity: 'Kochi',
                        primaryState: 'Kerala',
                        primaryPincode: '111111',
                        primaryCountry: 'India',
                    } as any
                }
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(editCustomer).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
        expect(addCustomer).not.toHaveBeenCalled();
    });
});
