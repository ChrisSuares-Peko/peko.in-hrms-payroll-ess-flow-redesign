import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import BankCard from '../../../components/manageBankAccounts/BankCard';

describe('BankCard', () => {
    it('renders name, fields, badge and actions', () => {
        render(
            <BankCard
                name="HDFC Bank"
                badge={<span data-testid="badge">Primary</span>}
                actions={
                    <button type="button" data-testid="actions">
                        Edit
                    </button>
                }
                fields={[
                    { label: 'Bank Name', value: 'HDFC' },
                    { label: 'Account Number', value: '1234' },
                ]}
            />
        );

        expect(screen.getByText('HDFC Bank')).toBeInTheDocument();
        expect(screen.getByTestId('badge')).toBeInTheDocument();
        expect(screen.getByTestId('actions')).toBeInTheDocument();
        expect(screen.getByText('HDFC')).toBeInTheDocument();
        expect(screen.getByText('1234')).toBeInTheDocument();
    });
});
