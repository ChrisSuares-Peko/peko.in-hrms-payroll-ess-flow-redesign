import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SummaryRow from '../../../components/createInvoice/SummaryRow';

describe('SummaryRow', () => {
    it('renders label and formatted amount', () => {
        render(<SummaryRow label="Subtotal" amount="100" />);
        expect(screen.getByText('Subtotal')).toBeInTheDocument();
        expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    it('renders custom children when provided', () => {
        render(
            <SummaryRow label="Shipping">
                <input data-testid="ship-input" />
            </SummaryRow>
        );
        expect(screen.getByTestId('ship-input')).toBeInTheDocument();
    });
});
