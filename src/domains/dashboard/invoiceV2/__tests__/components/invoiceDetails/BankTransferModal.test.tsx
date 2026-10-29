import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import BankTransferModal from '../../../components/invoiceDetails/BankTransferModal';

vi.mock('../../../constants/invoiceDetails', () => ({
    TRANSFER_METHODS: [{ name: 'NEFT', description: 'National Electronic Funds Transfer' }],
}));

describe('BankTransferModal', () => {
    const details: any = {
        id: 1,
        accountHolderName: 'Arshid',
        accountNumber: '1234567890',
        bankName: 'HDFC',
        ifscCode: 'HDFC0001',
        bankBranch: 'Kozhikode',
        accountType: 'Savings',
        default: 1,
    };

    it('shows empty state when details is null', () => {
        render(<BankTransferModal open onCancel={vi.fn()} details={null} onAddBankAccount={vi.fn()} />);
        expect(screen.getByText('No Bank Account Added')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Add Bank Account/i })).toBeInTheDocument();
    });

    it('renders bank rows when details are present', () => {
        render(<BankTransferModal open onCancel={vi.fn()} details={details} onAddBankAccount={vi.fn()} />);
        expect(screen.getByText('Bank Transfer Details')).toBeInTheDocument();
        expect(screen.getByText('1234567890')).toBeInTheDocument();
        expect(screen.getByText('HDFC')).toBeInTheDocument();
    });

    it('renders Copy and Share action buttons', () => {
        render(<BankTransferModal open onCancel={vi.fn()} details={details} onAddBankAccount={vi.fn()} />);
        expect(screen.getByRole('button', { name: /Copy all Details/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Share via WhatsApp/i })).toBeInTheDocument();
    });
});
