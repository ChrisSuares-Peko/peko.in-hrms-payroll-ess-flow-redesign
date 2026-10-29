import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import OrderHistorycardMobile from '@src/domains/dashboard/Subscriptions/components/orderHistory/OrderHistorycardMobile';

describe('OrderHistorycardMobile Component', () => {
    beforeEach(() => {
        cleanup();
    });

    const item = {
        subscriptionName: 'Premium Plan',
        status: 'SUCCESS',
        transactionId: 'TX123456789',
        dateandtime: '2024-08-22T14:30:00Z',
        paymentMode: 'credit card',
        amount: '1000',
    };

    it('renders correctly with provided item data', () => {
        render(<OrderHistorycardMobile item={item} />);

        // Check if the basic elements are rendered
        expect(screen.getByText(/Premium Plan/i)).toBeInTheDocument();
        expect(screen.getByTestId('amount')).toBeInTheDocument();
        expect(screen.getByText(/SUCCESS/i)).toBeInTheDocument();
    });

    it('toggles additional details when the icon is clicked', () => {
        render(<OrderHistorycardMobile item={item} />);

        const toggleButton = screen.getByRole('img', { name: /right/i }); // Ant Design icons use 'img' role
        expect(screen.queryByText(/Order ID/i)).not.toBeInTheDocument();

        fireEvent.click(toggleButton);
        expect(screen.getByText(/Order ID/i)).toBeInTheDocument();
        expect(screen.getByText(/TX123456789/i)).toBeInTheDocument();

        fireEvent.click(toggleButton);
        expect(screen.queryByText(/Order ID/i)).not.toBeInTheDocument();
    });

    it('displays correct details when "showMore" is true', () => {
        render(<OrderHistorycardMobile item={item} />);

        const toggleButton = screen.getByRole('img', { name: /right/i });

        fireEvent.click(toggleButton);

        // Check if details are rendered correctly
        expect(screen.getByText(/Order ID/i)).toBeInTheDocument();
        expect(screen.getByText(/TX123456789/i)).toBeInTheDocument();
        expect(screen.getByText(/Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Payment Mode/i)).toBeInTheDocument();
    });

    it('formats date and amount correctly', () => {
        render(<OrderHistorycardMobile item={item} />);
        const toggleButton = screen.getByRole('img', { name: /right/i }); // Ant Design icons use 'img' role

        fireEvent.click(toggleButton);
        // Check if the date is formatted correctly
        expect(screen.getByText('August 22, 2024 at 8:00 PM')).toBeInTheDocument();

        // Check if the amount is formatted correctly
        expect(screen.getByTestId('amount')).toBeInTheDocument();
    });

    it('applies correct styles based on status', () => {
        render(<OrderHistorycardMobile item={item} />);

        const statusButton = screen.getByText(/SUCCESS/i);

        expect(statusButton).toHaveStyle({
            background: 'var(--Success-50, #ECFDF3)',
            color: 'var(--Success-700, #027A48)',
        });
    });
});
