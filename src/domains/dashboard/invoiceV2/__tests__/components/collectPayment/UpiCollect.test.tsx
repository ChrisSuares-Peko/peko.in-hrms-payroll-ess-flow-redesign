import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import UpiCollect from '../../../components/collectPayment/UpiCollect';

const markAsReceived = vi.fn();

vi.mock('../../../hooks/collectPayment/useUpiCollect', () => ({
    default: () => ({ markAsReceived, isLoading: false }),
}));

describe('UpiCollect (collectPayment)', () => {
    const invoice: any = {
        id: '1',
        invoiceNumber: 'INV-1',
        amountDue: '500',
    };

    it('renders the UPI ID, amount and invoice reference', () => {
        render(<UpiCollect invoice={invoice} onSuccess={vi.fn()} />);
        expect(screen.getByText('SCAN TO PAY')).toBeInTheDocument();
        expect(screen.getByDisplayValue('payments@yourcompany')).toBeInTheDocument();
        expect(screen.getByText(/INV-1/)).toBeInTheDocument();
    });

    it('calls markAsReceived with id and onSuccess on click', () => {
        const onSuccess = vi.fn();
        render(<UpiCollect invoice={invoice} onSuccess={onSuccess} />);
        fireEvent.click(screen.getByRole('button', { name: /Mark as Received/i }));
        expect(markAsReceived).toHaveBeenCalledWith('1', onSuccess);
    });
});
