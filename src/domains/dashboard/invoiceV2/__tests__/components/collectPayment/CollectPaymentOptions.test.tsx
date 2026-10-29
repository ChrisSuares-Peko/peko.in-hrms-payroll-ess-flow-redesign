import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CollectPaymentOptions from '../../../components/collectPayment/CollectPaymentOptions';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="rsvg" />,
}));

vi.mock('../../../constants/collectPayment', () => ({
    COLLECT_PAYMENT_OPTIONS: [
        {
            id: 'send-link',
            title: 'Send Payment Link',
            description: 'Share via SMS or WhatsApp',
            icon: '/x.svg',
            iconBg: 'bg-red-50',
        },
        {
            id: 'upi',
            title: 'UPI Collect',
            description: 'Request payment instantly',
            icon: '/y.svg',
            iconBg: 'bg-green-50',
        },
    ],
}));

describe('CollectPaymentOptions', () => {
    it('renders each option title and description', () => {
        render(<CollectPaymentOptions onSelect={vi.fn()} />);
        expect(screen.getByText('Send Payment Link')).toBeInTheDocument();
        expect(screen.getByText('UPI Collect')).toBeInTheDocument();
    });

    it('fires onSelect with the option id when clicked', () => {
        const onSelect = vi.fn();
        render(<CollectPaymentOptions onSelect={onSelect} />);
        fireEvent.click(screen.getByText('UPI Collect'));
        expect(onSelect).toHaveBeenCalledWith('upi');
    });

    it('shows loading icon and blocks click for the loading option', () => {
        const onSelect = vi.fn();
        const { container } = render(
            <CollectPaymentOptions onSelect={onSelect} loadingStep="send-link" />
        );
        expect(container.querySelector('.anticon-loading')).toBeTruthy();
        fireEvent.click(screen.getByText('Send Payment Link'));
        expect(onSelect).not.toHaveBeenCalled();
    });
});
