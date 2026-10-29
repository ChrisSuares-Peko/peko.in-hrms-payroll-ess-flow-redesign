import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import BankTransferModal from '../../../components/collectPayment/BankTransferModal';

vi.mock('../../../utils/helperFunctions', async () => {
    const actual: any = await vi.importActual('../../../utils/helperFunctions');
    return { ...actual, copyBankDetails: vi.fn(), shareViaWhatsApp: vi.fn() };
});
vi.mock('../../../components/shared/CopyableRow', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));
vi.mock('../../../components/shared/InfoCard', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));

const bankDetails: any = {
    id: 1,
    accountHolderName: 'Acme',
    accountNumber: '1234',
    bankName: 'HDFC',
    ifscCode: 'HDFC0001234',
    accountType: 'savings',
    default: 1,
    status: 1,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('BankTransferModal', () => {
    it('renders empty state when details is null', () => {
        render(
            <BankTransferModal open onCancel={() => {}} details={null} onAddBankAccount={vi.fn()} />
        );
        expect(screen.getByText('No Bank Account Added')).toBeInTheDocument();
    });

    it('renders bank rows once details are provided', () => {
        render(
            <BankTransferModal
                open
                onCancel={() => {}}
                details={bankDetails}
                onAddBankAccount={vi.fn()}
            />
        );
        expect(screen.getByText('Account Name')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('HDFC0001234')).toBeInTheDocument();
    });

    it('triggers copy when "Copy all Details" clicked', async () => {
        const helpers = await import('../../../utils/helperFunctions');
        render(
            <BankTransferModal
                open
                onCancel={() => {}}
                details={bankDetails}
                onAddBankAccount={vi.fn()}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: /copy all details/i }));
        expect(helpers.copyBankDetails).toHaveBeenCalled();
    });

    it('triggers WhatsApp share when share button clicked', async () => {
        const helpers = await import('../../../utils/helperFunctions');
        render(
            <BankTransferModal
                open
                onCancel={() => {}}
                details={bankDetails}
                onAddBankAccount={vi.fn()}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: /share via whatsapp/i }));
        expect(helpers.shareViaWhatsApp).toHaveBeenCalled();
    });
});
