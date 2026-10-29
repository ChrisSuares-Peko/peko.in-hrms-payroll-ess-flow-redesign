import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AddDomesticAccount from '../../../components/manageBankAccounts/AddDomesticAccount';

vi.mock('../../../forms/AddDomesticAccountForm', () => ({
    default: () => <div data-testid="add-dom-form" />,
}));

vi.mock('@components/molecular/modals/OtpModal', () => ({
    default: () => null,
}));

describe('AddDomesticAccount', () => {
    it('renders Add title and Add Account button when no defaults', () => {
        render(<AddDomesticAccount onCancel={vi.fn()} onSubmit={vi.fn()} isLoading={false} />);
        expect(screen.getByText('Add Domestic Account')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Add Account/i })).toBeInTheDocument();
        expect(screen.getByTestId('add-dom-form')).toBeInTheDocument();
    });

    it('renders Edit title when defaultValues provided', () => {
        render(
            <AddDomesticAccount
                onCancel={vi.fn()}
                onSubmit={vi.fn()}
                isLoading={false}
                defaultValues={
                    {
                        id: 1,
                        accountHolderName: 'A',
                        bankName: 'B',
                        accountNumber: '1',
                        ifscCode: 'IFSC',
                        accountType: 'Savings',
                        bankBranch: 'X',
                    } as any
                }
            />
        );
        expect(screen.getByText('Edit Domestic Account')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    });

    it('fires onCancel when Cancel button clicked', () => {
        const onCancel = vi.fn();
        render(<AddDomesticAccount onCancel={onCancel} onSubmit={vi.fn()} isLoading={false} />);
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onCancel).toHaveBeenCalled();
    });
});
