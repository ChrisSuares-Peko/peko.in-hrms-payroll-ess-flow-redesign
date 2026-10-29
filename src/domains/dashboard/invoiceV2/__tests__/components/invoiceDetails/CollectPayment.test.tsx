import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CollectPayment from '../../../components/invoiceDetails/CollectPayment';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="rsvg" />,
}));

vi.mock('../../../constants/invoiceDetails', () => ({
    DOMESTIC_METHODS: [
        { key: 'payment-link', label: 'Create Payment Link', iconBg: 'bg-red-50', icon: '/x.svg' },
        { key: 'bank', label: 'Bank Transfer', iconBg: 'bg-amber-50', icon: '/y.svg' },
    ],
    INTERNATIONAL_METHODS: [
        {
            key: 'virtual-iban',
            label: 'Virtual IBAN',
            iconBg: 'bg-red-50',
            icon: '/g.svg',
            disabled: true,
        },
    ],
}));

describe('CollectPayment (invoiceDetails)', () => {
    it('renders domestic methods by default', () => {
        render(<CollectPayment onSelect={vi.fn()} />);
        expect(screen.getByText('Collect Payment')).toBeInTheDocument();
        expect(screen.getByText('Create Payment Link')).toBeInTheDocument();
        expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    });

    it('renders international methods when invoiceType is INTERNATIONAL', () => {
        render(<CollectPayment invoiceType="INTERNATIONAL" onSelect={vi.fn()} />);
        expect(screen.getByText('Virtual IBAN')).toBeInTheDocument();
        expect(screen.queryByText('Bank Transfer')).not.toBeInTheDocument();
    });

    it('calls onSelect with method key when a card is clicked', () => {
        const onSelect = vi.fn();
        render(<CollectPayment onSelect={onSelect} />);
        fireEvent.click(screen.getByText('Bank Transfer'));
        expect(onSelect).toHaveBeenCalledWith('bank');
    });

    it('shows loading icon for the loading method', () => {
        const { container } = render(<CollectPayment onSelect={vi.fn()} loadingMethod="bank" />);
        expect(container.querySelector('.anticon-loading')).toBeTruthy();
    });
});
