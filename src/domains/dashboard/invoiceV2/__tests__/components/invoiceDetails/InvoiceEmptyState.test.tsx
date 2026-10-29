import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import InvoiceEmptyState from '../../../components/invoiceDetails/InvoiceEmptyState';

describe('InvoiceEmptyState', () => {
    it('renders empty title and helper text', () => {
        render(<InvoiceEmptyState />);
        expect(screen.getByText('No Invoice Available')).toBeInTheDocument();
        expect(
            screen.getByText('Invoice details will appear here once generated.')
        ).toBeInTheDocument();
    });
});
