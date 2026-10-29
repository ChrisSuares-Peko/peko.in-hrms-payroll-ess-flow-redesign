import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DomesticAccounts from '../../../components/manageBankAccounts/DomesticAccounts';

const hookReturn: any = {
    accounts: [],
    isLoading: false,
    addDomesticAccount: vi.fn(),
    editDomesticAccount: vi.fn(),
    deleteDomesticAccount: vi.fn(),
    setAsPrimary: vi.fn(),
    sendOtpForBankAccount: vi.fn().mockResolvedValue(true),
};

vi.mock('../../../hooks/manageBankAccounts/useDomesticAccounts', () => ({
    default: () => hookReturn,
}));

vi.mock('../../../components/manageBankAccounts/AddDomesticAccount', () => ({
    default: () => <div data-testid="add-form" />,
}));

vi.mock('@components/molecular/modals/OtpModal', () => ({
    default: () => null,
}));

vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    default: () => null,
}));

describe('DomesticAccounts', () => {
    it('renders Add button and empty state when no accounts', () => {
        hookReturn.accounts = [];
        hookReturn.isLoading = false;
        render(<DomesticAccounts />);
        expect(screen.getByRole('button', { name: /Add Domestic Account/i })).toBeInTheDocument();
        expect(screen.getByText('No accounts found')).toBeInTheDocument();
    });

    it('switches to AddDomesticAccount view when Add is clicked', () => {
        hookReturn.accounts = [];
        render(<DomesticAccounts />);
        fireEvent.click(screen.getByRole('button', { name: /Add Domestic Account/i }));
        expect(screen.getByTestId('add-form')).toBeInTheDocument();
    });

    it('renders accounts list with primary tag', () => {
        hookReturn.accounts = [
            {
                id: 1,
                accountHolderName: 'Arshid',
                bankName: 'HDFC',
                accountNumber: '1234',
                ifscCode: 'IFSC001',
                accountType: 'Savings',
                bankBranch: 'BLR',
                default: 1,
            },
        ];
        render(<DomesticAccounts />);
        expect(screen.getByText('Arshid')).toBeInTheDocument();
        expect(screen.getByText('Primary')).toBeInTheDocument();
    });
});
