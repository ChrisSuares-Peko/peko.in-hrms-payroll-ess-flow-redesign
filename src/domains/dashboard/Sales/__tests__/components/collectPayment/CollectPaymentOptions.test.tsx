import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import CollectPaymentOptions from '../../../components/collectPayment/CollectPaymentOptions';
import { COLLECT_PAYMENT_OPTIONS } from '../../../constants/collectPayment';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <span data-testid="svg" data-src={src} />,
}));

describe('CollectPaymentOptions', () => {
    it('renders one row per configured option', () => {
        render(<CollectPaymentOptions onSelect={() => {}} />);

        COLLECT_PAYMENT_OPTIONS.forEach(opt => {
            expect(screen.getByText(opt.title)).toBeInTheDocument();
        });
    });

    it('triggers onSelect with the option id when a row is clicked', () => {
        const onSelect = vi.fn();
        render(<CollectPaymentOptions onSelect={onSelect} />);

        const first = COLLECT_PAYMENT_OPTIONS[0];
        fireEvent.click(screen.getByText(first.title));
        expect(onSelect).toHaveBeenCalledWith(first.id);
    });
});
