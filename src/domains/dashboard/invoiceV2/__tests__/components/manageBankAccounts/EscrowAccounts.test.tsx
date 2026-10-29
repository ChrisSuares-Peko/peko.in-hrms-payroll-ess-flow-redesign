import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import EscrowAccounts from '../../../components/manageBankAccounts/EscrowAccounts';

const escrowAccountsMock = vi.fn();

vi.mock('../../../hooks/manageBankAccounts/useEscrowAccounts', () => ({
    default: () => escrowAccountsMock(),
}));

describe('EscrowAccounts', () => {
    it('renders loading skeleton when isLoading', () => {
        escrowAccountsMock.mockReturnValue({ accounts: [], isLoading: true });
        const { container } = render(<EscrowAccounts />);
        expect(container.querySelectorAll('.ant-skeleton').length).toBeGreaterThan(0);
    });

    it('renders empty state when no accounts', () => {
        escrowAccountsMock.mockReturnValue({ accounts: [], isLoading: false });
        render(<EscrowAccounts />);
        expect(screen.getByText('No accounts found')).toBeInTheDocument();
    });

    it('renders account cards when accounts exist', () => {
        escrowAccountsMock.mockReturnValue({
            accounts: [
                {
                    id: '1',
                    name: 'Escrow One',
                    bankName: 'X',
                    accountNumber: '1',
                    swiftCode: 'S',
                    currency: 'USD',
                },
            ],
            isLoading: false,
        });
        render(<EscrowAccounts />);
        expect(screen.getByText('Escrow One')).toBeInTheDocument();
    });
});
