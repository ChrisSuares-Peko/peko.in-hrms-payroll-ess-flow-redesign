import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PaymentReceived from '../../../components/collectPayment/PaymentReceived';

describe('PaymentReceived', () => {
    const invoice: any = { invoiceNumber: 'INV-1', amountDue: '500' };

    it('renders the title and amount-marked-as-received text', () => {
        render(<PaymentReceived invoice={invoice} onClose={vi.fn()} title="Payment Received" />);
        expect(screen.getByText('Payment Received')).toBeInTheDocument();
        expect(screen.getByText(/INV-1/)).toBeInTheDocument();
    });

    it('fires onClose when Done is clicked', () => {
        const onClose = vi.fn();
        render(<PaymentReceived invoice={invoice} onClose={onClose} title="x" />);
        fireEvent.click(screen.getByRole('button', { name: /Done/i }));
        expect(onClose).toHaveBeenCalled();
    });
});
