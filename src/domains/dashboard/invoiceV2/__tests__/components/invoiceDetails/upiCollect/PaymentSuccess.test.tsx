import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PaymentSuccess from '../../../../components/invoiceDetails/upiCollect/PaymentSuccess';

describe('PaymentSuccess', () => {
    it('renders success header and summary rows', () => {
        render(
            <PaymentSuccess
                successData={{ amount: '500', referenceId: 'TXN1', dateTime: 'Jan 1' }}
                onClose={vi.fn()}
            />
        );
        expect(screen.getByText('Payment Successful')).toBeInTheDocument();
        expect(screen.getByText('TXN1')).toBeInTheDocument();
        expect(screen.getByText('Jan 1')).toBeInTheDocument();
    });

    it('fires onClose when View Transactions clicked', () => {
        const onClose = vi.fn();
        render(
            <PaymentSuccess
                successData={{ amount: '500', referenceId: 'X', dateTime: 'Y' }}
                onClose={onClose}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: /View Transactions/i }));
        expect(onClose).toHaveBeenCalled();
    });
});
