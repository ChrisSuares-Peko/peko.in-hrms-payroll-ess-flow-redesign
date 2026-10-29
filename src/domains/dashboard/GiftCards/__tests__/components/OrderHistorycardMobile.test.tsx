import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { formattedDateTime } from '@utils/dateFormat';
import formatString from '@utils/wordFormat';

import OrderHistorycardMobile from '../../components/OrderHistorycardMobile';

describe('OrderHistorycardMobile Component', () => {
    const mockItem = {
        txnId: 'TXN123',
        date: '2024-02-07T12:00:00Z',
        paymentMode: 'UPI',
        status: 'SUCCESS',
        giftCardName: 'Amazon Gift Card',
        amount: '500',
        orderType: 'Buy for Self',
        quantity: 1,
    };

    it('renders the component correctly', () => {
        render(<OrderHistorycardMobile item={mockItem} />);

        expect(screen.getByText(/amazon gift card/i)).toBeInTheDocument();
        expect(screen.getByText(/order id:/i)).toBeInTheDocument();
        expect(screen.getByText(/date/i)).toBeInTheDocument();
        expect(screen.getByText(/paymentmode/i)).toBeInTheDocument();
        expect(screen.getByText(/amount:/i)).toBeInTheDocument();
    });

    it('displays order details correctly', () => {
        render(<OrderHistorycardMobile item={mockItem} />);

        expect(screen.getByText(/txn123/i)).toBeInTheDocument();
        expect(screen.getByText(/₹\s*500\.00/)).toBeInTheDocument();
        expect(screen.getByText(formatString(mockItem.paymentMode))).toBeInTheDocument();
        expect(screen.getByText(formatString(mockItem.status))).toBeInTheDocument();
    });

    it('formats and displays the date correctly', () => {
        render(<OrderHistorycardMobile item={mockItem} />);

        expect(screen.getByText(formattedDateTime(new Date(mockItem.date)))).toBeInTheDocument();
    });

    it('applies correct styles for success and failure status', () => {
        const { rerender } = render(
            <OrderHistorycardMobile item={{ ...mockItem, status: 'SUCCESS' }} />
        );
        expect(screen.getByText(/success/i)).toHaveClass('text-green-400 border-green-400');

        rerender(<OrderHistorycardMobile item={{ ...mockItem, status: 'FAILURE' }} />);
        expect(screen.getByText(/failure/i)).toHaveClass('text-red-400 border-red-400');
    });
});
