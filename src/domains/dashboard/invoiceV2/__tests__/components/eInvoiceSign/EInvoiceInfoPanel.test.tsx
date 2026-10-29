import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import EInvoiceInfoPanel from '../../../components/eInvoiceSign/EInvoiceInfoPanel';
import { E_INVOICE_FEATURES } from '../../../constants/eInvoicingSign';

describe('EInvoiceInfoPanel', () => {
    it('renders the E-Invoice Portal heading and hero copy', () => {
        render(<EInvoiceInfoPanel />);
        expect(screen.getByText('E-Invoice Portal')).toBeInTheDocument();
        expect(screen.getByText('What is E-Invoice?')).toBeInTheDocument();
        expect(screen.getByText(/Every invoice, registered in/)).toBeInTheDocument();
    });

    it('renders all feature cards from constants', () => {
        render(<EInvoiceInfoPanel />);
        E_INVOICE_FEATURES.forEach(feature => {
            expect(screen.getByText(feature.title)).toBeInTheDocument();
        });
    });
});
