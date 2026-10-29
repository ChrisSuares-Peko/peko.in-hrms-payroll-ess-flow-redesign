import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import VirtualAccounts from '../../../components/manageBankAccounts/VirtualAccounts';

describe('VirtualAccounts', () => {
    it('shows loading skeleton when isLoading', () => {
        const { container } = render(<VirtualAccounts accounts={[]} isLoading />);
        expect(container.querySelectorAll('.ant-skeleton').length).toBeGreaterThan(0);
    });

    it('shows empty state when no accounts', () => {
        render(<VirtualAccounts accounts={[]} isLoading={false} />);
        expect(screen.getByText('No accounts found')).toBeInTheDocument();
    });

    it('renders BankCard for each account', () => {
        const accounts = [
            {
                id: '1',
                name: 'Virt 1',
                bankName: 'B',
                accountNumber: '1',
                ifsc: 'I',
                swiftCode: '',
                iban: '',
                currency: 'INR',
                type: 'Domestic',
            },
        ];
        render(<VirtualAccounts accounts={accounts as any} isLoading={false} />);
        expect(screen.getByText('Virt 1')).toBeInTheDocument();
        expect(screen.getByText('Domestic')).toBeInTheDocument();
    });
});
