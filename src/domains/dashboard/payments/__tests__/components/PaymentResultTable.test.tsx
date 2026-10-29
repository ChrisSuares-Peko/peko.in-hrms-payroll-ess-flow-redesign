import { render, screen } from '@testing-library/react';
import Moment from 'moment';
import { describe, test, expect } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import PaymentResultTable from '../../components/PaymentResultTable';

const mockPaymentData = {
    transactionDate: '2024-02-12T12:34:56Z',
    corporateTxnId: 'TXN123456',
    serviceProvider: 'PayPal',
    amount: '1500',
    paymentMode: 'Credit Card',
    amountInINR: 1490,
    couponDiscount: 10,
};

describe('PaymentResultTable Component', () => {
    test('renders correctly with valid paymentData', () => {
        render(<PaymentResultTable paymentData={mockPaymentData} />);

        expect(screen.getByText('Transaction ID')).toBeInTheDocument();
        expect(screen.getByText(mockPaymentData.corporateTxnId)).toBeInTheDocument();
        expect(screen.getByText('Service')).toBeInTheDocument();
        expect(screen.getByText(mockPaymentData.serviceProvider)).toBeInTheDocument();
    });

    test('formats date correctly', () => {
        render(<PaymentResultTable paymentData={mockPaymentData} />);
        const formattedDate = Moment(mockPaymentData.transactionDate).format(
            'MMMM DD YYYY hh:mm:ss a'
        );
        expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    test('formats amount correctly', () => {
        render(<PaymentResultTable paymentData={mockPaymentData} />);
        const formattedAmount = `₹ ${formatNumberWithLocalString(mockPaymentData.amount)}`;
        expect(screen.getByText(formattedAmount)).toBeInTheDocument();
    });

    test('renders empty values gracefully when paymentData is missing', () => {
        render(<PaymentResultTable paymentData={{}} />);
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Transaction ID')).toBeInTheDocument();
    });
});
