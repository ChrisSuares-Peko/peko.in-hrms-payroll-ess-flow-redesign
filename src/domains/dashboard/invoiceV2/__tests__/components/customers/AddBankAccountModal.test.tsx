import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AddBankAccountModal from '../../../components/customers/AddBankAccountModal';

vi.mock('../../../hooks/customer/useVerifyCustomerBank', () => ({
    default: () => ({ verifyBankAccount: vi.fn(), isVerifying: false }),
}));

vi.mock('../../../forms/customer/AddBankAccountForm', () => ({
    default: () => <div data-testid="bank-form" />,
}));

describe('AddBankAccountModal', () => {
    it('renders Add title and form when open without editing account', () => {
        render(<AddBankAccountModal open onClose={vi.fn()} onAdd={vi.fn()} />);
        expect(screen.getByText('Add Bank Account')).toBeInTheDocument();
        expect(screen.getByTestId('bank-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Verify & Add/i })).toBeInTheDocument();
    });

    it('renders Edit title when editingAccount is provided', () => {
        render(
            <AddBankAccountModal
                open
                onClose={vi.fn()}
                onAdd={vi.fn()}
                editingAccount={{
                    accountHolderName: 'A',
                    accountNumber: '1',
                    ifscCode: 'IFSC',
                    swiftCode: '',
                }}
            />
        );
        expect(screen.getByText('Edit Bank Account')).toBeInTheDocument();
    });
});
