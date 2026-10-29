import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AddCustomerDrawer from '../../../components/customers/AddCustomerDrawer';

vi.mock('../../../hooks/customer/useCustomerActions', () => ({
    default: () => ({ addCustomer: vi.fn(), editCustomer: vi.fn(), isLoading: false }),
}));

vi.mock('../../../forms/customer/AddCustomerForm', () => ({
    default: () => <div data-testid="customer-form" />,
}));

describe('AddCustomerDrawer', () => {
    it('renders Add title and Save Customer button', () => {
        render(<AddCustomerDrawer open onClose={vi.fn()} />);
        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save Customer/i })).toBeInTheDocument();
        expect(screen.getByTestId('customer-form')).toBeInTheDocument();
    });

    it('renders Edit title when editingCustomer is provided', () => {
        render(
            <AddCustomerDrawer
                open
                onClose={vi.fn()}
                editingCustomer={{ id: '1', name: 'Arshid' } as any}
            />
        );
        expect(screen.getByText('Edit Customer')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
        const onClose = vi.fn();
        render(<AddCustomerDrawer open onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onClose).toHaveBeenCalled();
    });
});
