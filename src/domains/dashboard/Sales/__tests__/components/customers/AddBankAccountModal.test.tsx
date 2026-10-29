import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import AddBankAccountModal from '../../../components/customers/AddBankAccountModal';
import useVerifyCustomerBank from '../../../hooks/customer/useVerifyCustomerBank';

vi.mock('../../../hooks/customer/useVerifyCustomerBank', () => ({
    default: vi.fn(),
}));
vi.mock('../../../forms/customer/AddBankAccountForm', () => ({
    default: () => <div data-testid="bank-form" />,
}));
vi.mock('../../../components/shared/LeftHeader', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));

const verifyBankAccount = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useVerifyCustomerBank as any).mockReturnValue({
        verifyBankAccount,
        isVerifying: false,
    });
});

describe('AddBankAccountModal', () => {
    it('renders Add title when no editingAccount', () => {
        render(<AddBankAccountModal open onClose={() => {}} onAdd={() => {}} />);

        expect(screen.getByText('Add Bank Account')).toBeInTheDocument();
        expect(screen.getByText('Enter your bank account details')).toBeInTheDocument();
        expect(screen.getByTestId('bank-form')).toBeInTheDocument();
    });

    it('renders Edit title when editingAccount provided', () => {
        const editingAccount: any = {
            accountHolderName: 'X',
            accountNumber: '1',
            ifscCode: 'HDFC0001234',
            swiftCode: '',
            iban: '',
        };
        render(
            <AddBankAccountModal
                open
                onClose={() => {}}
                onAdd={() => {}}
                editingAccount={editingAccount}
            />
        );

        expect(screen.getByText('Edit Bank Account')).toBeInTheDocument();
        expect(screen.getByText('Update your bank account details')).toBeInTheDocument();
    });

    it('Cancel button invokes onClose without verifying', () => {
        const onClose = vi.fn();
        render(<AddBankAccountModal open onClose={onClose} onAdd={() => {}} />);

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(onClose).toHaveBeenCalled();
        expect(verifyBankAccount).not.toHaveBeenCalled();
    });

    it('Verify & Add button submits form, calls onAdd then onClose on success', async () => {
        verifyBankAccount.mockResolvedValueOnce({
            accountHolderName: 'John',
            accountNumber: '1234567890',
            ifscCode: 'HDFC0001234',
            verifyToken: 'tok',
        });
        const onAdd = vi.fn();
        const onClose = vi.fn();

        render(
            <AddBankAccountModal
                open
                onClose={onClose}
                onAdd={onAdd}
                editingAccount={{
                    accountHolderName: 'John',
                    accountNumber: '1234567890',
                    ifscCode: 'HDFC0001234',
                    swiftCode: '',
                }}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /verify & add/i }));

        await waitFor(() => {
            expect(verifyBankAccount).toHaveBeenCalled();
            expect(onAdd).toHaveBeenCalledWith(
                expect.objectContaining({ verifyToken: 'tok' })
            );
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('does not call onAdd or onClose when verifyBankAccount returns null', async () => {
        verifyBankAccount.mockResolvedValueOnce(null);
        const onAdd = vi.fn();
        const onClose = vi.fn();

        render(
            <AddBankAccountModal
                open
                onClose={onClose}
                onAdd={onAdd}
                editingAccount={{
                    accountHolderName: 'John',
                    accountNumber: '1234567890',
                    ifscCode: 'HDFC0001234',
                    swiftCode: '',
                }}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /verify & add/i }));

        await waitFor(() => expect(verifyBankAccount).toHaveBeenCalled());
        expect(onAdd).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('shows loading spinner on Verify & Add when isVerifying', () => {
        (useVerifyCustomerBank as any).mockReturnValue({
            verifyBankAccount,
            isVerifying: true,
        });
        render(<AddBankAccountModal open onClose={() => {}} onAdd={() => {}} />);

        // antd loading button has class ant-btn-loading on the button element.
        const verifyBtn = screen.getByRole('button', { name: /verify & add/i });
        expect(verifyBtn.className).toContain('ant-btn-loading');
    });
});
