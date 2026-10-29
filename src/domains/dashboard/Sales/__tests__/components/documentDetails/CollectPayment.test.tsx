import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import CollectPayment from '../../../components/documentDetails/CollectPayment';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: { src: string }) => <span data-testid="svg" data-src={src} />,
}));

describe('CollectPayment', () => {
    it('renders DOMESTIC payment methods by default', () => {
        render(<CollectPayment onSelect={() => {}} />);

        expect(screen.getByText('Collect Payment')).toBeInTheDocument();
        expect(screen.getByText('Create Payment Link')).toBeInTheDocument();
        expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    });

    it('renders INTERNATIONAL methods when transactionType is INTERNATIONAL', () => {
        render(<CollectPayment transactionType="INTERNATIONAL" onSelect={() => {}} />);

        expect(screen.getByText('Virtual IBAN')).toBeInTheDocument();
        expect(screen.getByText('Currency Account')).toBeInTheDocument();
    });

    it('invokes onSelect with the method key when an enabled method is clicked', () => {
        const onSelect = vi.fn();
        render(<CollectPayment onSelect={onSelect} />);

        fireEvent.click(screen.getByText('Create Payment Link'));
        expect(onSelect).toHaveBeenCalledWith('payment-link');
    });

    it('does not invoke onSelect when a disabled method is clicked', () => {
        const onSelect = vi.fn();
        render(<CollectPayment transactionType="INTERNATIONAL" onSelect={onSelect} />);

        fireEvent.click(screen.getByText('Virtual IBAN'));
        expect(onSelect).not.toHaveBeenCalled();
    });
});
