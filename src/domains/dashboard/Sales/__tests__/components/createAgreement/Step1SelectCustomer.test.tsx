import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import Step1SelectCustomer from '../../../components/createAgreement/Step1SelectCustomer';
import useCustomers from '../../../hooks/agreement/useCustomers';

vi.mock('../../../hooks/agreement/useCustomers', () => ({
    default: vi.fn(),
}));
vi.mock('@src/hooks/useDebounce', () => ({
    default: (v: any) => v,
}));
vi.mock('../../../components/customers/AddCustomerDrawer', () => ({
    default: ({ open }: any) => (open ? <div data-testid="add-customer-drawer" /> : null),
}));
vi.mock('../../../components/createAgreement/CustomerSelectionCard', () => ({
    default: ({ customer }: any) => (
        <div data-testid="customer-selection-card">{customer.name}</div>
    ),
}));
vi.mock('../../../components/createAgreement/SelectionCardSkeleton', () => ({
    default: () => <div data-testid="skeleton" />,
}));

const refetch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Step1SelectCustomer', () => {
    it('renders skeleton while customers are loading', () => {
        (useCustomers as any).mockReturnValue({
            customers: [],
            isLoading: true,
            refetch,
        });
        render(<Step1SelectCustomer selectedId="" onSelectCustomer={() => {}} />);

        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('shows empty state when no customers and not loading', () => {
        (useCustomers as any).mockReturnValue({
            customers: [],
            isLoading: false,
            refetch,
        });
        render(<Step1SelectCustomer selectedId="" onSelectCustomer={() => {}} />);

        expect(screen.getByText('No customers found')).toBeInTheDocument();
    });

    it('renders customers and calls onSelectCustomer when a row is clicked', () => {
        (useCustomers as any).mockReturnValue({
            customers: [
                {
                    id: '1',
                    name: 'Acme Corp',
                    email: 'a@b.com',
                    phoneNumber: '111',
                    primaryAddress: 'L1',
                    primaryCity: 'KL',
                    primaryState: 'KL',
                    primaryPincode: '111111',
                    status: 'Active',
                },
            ],
            isLoading: false,
            refetch,
        });
        const onSelectCustomer = vi.fn();
        render(<Step1SelectCustomer selectedId="" onSelectCustomer={onSelectCustomer} />);

        fireEvent.click(screen.getByText('Acme Corp'));
        expect(onSelectCustomer).toHaveBeenCalledWith('1', expect.objectContaining({ id: '1' }));
    });

    it('shows the selected customer detail card when selectedId matches', () => {
        (useCustomers as any).mockReturnValue({
            customers: [
                {
                    id: '1',
                    name: 'Acme Corp',
                    email: 'a@b.com',
                    phoneNumber: '111',
                    status: 'Active',
                },
            ],
            isLoading: false,
            refetch,
        });
        render(<Step1SelectCustomer selectedId="1" onSelectCustomer={() => {}} />);

        expect(screen.getByTestId('customer-selection-card')).toBeInTheDocument();
    });

    it('opens AddCustomerDrawer when Add new customer button is clicked', () => {
        (useCustomers as any).mockReturnValue({
            customers: [],
            isLoading: false,
            refetch,
        });
        render(<Step1SelectCustomer selectedId="" onSelectCustomer={() => {}} />);

        fireEvent.click(screen.getByRole('button', { name: /add new customer/i }));
        expect(screen.getByTestId('add-customer-drawer')).toBeInTheDocument();
    });
});
