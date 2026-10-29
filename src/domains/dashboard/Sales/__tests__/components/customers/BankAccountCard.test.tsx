import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import BankAccountCard from '../../../components/customers/BankAccountCard';

vi.mock('../../../assets/icons/customers/bank.svg', () => ({ default: 'bank.svg' }));

describe('BankAccountCard', () => {
    const baseAccount: any = {
        accountHolderName: 'John',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
    };

    it('resolves bank name from IFSC prefix when known', () => {
        render(<BankAccountCard account={baseAccount} onEdit={() => {}} />);

        expect(screen.getByText('HDFC Bank')).toBeInTheDocument();
        expect(screen.getByText(/1234567890/)).toBeInTheDocument();
        expect(screen.getByText(/HDFC0001234/)).toBeInTheDocument();
    });

    it('falls back to "{prefix} Bank" when IFSC prefix is unknown', () => {
        render(
            <BankAccountCard
                account={{ ...baseAccount, ifscCode: 'ZZZZ0001234' }}
                onEdit={() => {}}
            />
        );

        expect(screen.getByText('ZZZZ Bank')).toBeInTheDocument();
    });

    it('triggers onEdit when the edit button is clicked', () => {
        const onEdit = vi.fn();
        render(<BankAccountCard account={baseAccount} onEdit={onEdit} />);

        // The first button is edit, second (if rendered) is remove.
        fireEvent.click(screen.getAllByRole('button')[0]);
        expect(onEdit).toHaveBeenCalled();
    });

    it('renders remove button only when onRemove is provided', () => {
        const { rerender } = render(
            <BankAccountCard account={baseAccount} onEdit={() => {}} />
        );
        expect(screen.getAllByRole('button')).toHaveLength(1);

        const onRemove = vi.fn();
        rerender(
            <BankAccountCard account={baseAccount} onEdit={() => {}} onRemove={onRemove} />
        );
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);

        fireEvent.click(buttons[1]);
        expect(onRemove).toHaveBeenCalled();
    });
});
