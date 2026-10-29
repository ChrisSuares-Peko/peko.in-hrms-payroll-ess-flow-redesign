import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import BankAccountCard from '../../../components/customers/BankAccountCard';

describe('BankAccountCard', () => {
    const account = {
        accountHolderName: 'Arshid',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0000001',
        swiftCode: '',
        iban: '',
    };

    it('renders account and IFSC info', () => {
        render(<BankAccountCard account={account} onEdit={vi.fn()} />);
        expect(screen.getByText(/Account Number:1234567890/)).toBeInTheDocument();
        expect(screen.getByText(/IFSC Code:HDFC0000001/)).toBeInTheDocument();
    });

    it('fires onEdit when edit button clicked', () => {
        const onEdit = vi.fn();
        const { container } = render(<BankAccountCard account={account} onEdit={onEdit} />);
        const editBtn = container.querySelector('.anticon-edit')?.closest('button');
        fireEvent.click(editBtn!);
        expect(onEdit).toHaveBeenCalled();
    });

    it('renders remove button only when onRemove prop provided', () => {
        const onRemove = vi.fn();
        const { container, rerender } = render(
            <BankAccountCard account={account} onEdit={vi.fn()} onRemove={onRemove} />
        );
        expect(container.querySelector('.anticon-delete')).toBeTruthy();

        rerender(<BankAccountCard account={account} onEdit={vi.fn()} />);
        expect(container.querySelector('.anticon-delete')).toBeNull();
    });
});
