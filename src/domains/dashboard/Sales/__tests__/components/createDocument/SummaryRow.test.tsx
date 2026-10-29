import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import SummaryRow from '../../../components/createDocument/SummaryRow';

describe('SummaryRow', () => {
    it('renders label only when amount and children are absent', () => {
        render(<SummaryRow label="Subtotal" />);

        expect(screen.getByText('Subtotal')).toBeInTheDocument();
        // No formatAmount text should appear.
        expect(screen.queryByText(/₹/)).not.toBeInTheDocument();
    });

    it('renders formatted amount when amount prop is provided', () => {
        render(<SummaryRow label="Subtotal" amount="1500.5" />);

        expect(screen.getByText('Subtotal')).toBeInTheDocument();
        expect(screen.getByText('₹ 1,500.50')).toBeInTheDocument();
    });

    it('renders children alongside the label', () => {
        render(
            <SummaryRow label="Shipping Cost">
                <input data-testid="shipping-input" />
            </SummaryRow>
        );

        expect(screen.getByText('Shipping Cost')).toBeInTheDocument();
        expect(screen.getByTestId('shipping-input')).toBeInTheDocument();
    });
});
