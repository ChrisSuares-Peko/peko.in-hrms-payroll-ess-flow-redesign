import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import RecentInvoiceRow from '../../../components/dashboard/RecentInvoiceRow';

describe('RecentInvoiceRow', () => {
    it('renders name, date and amount', () => {
        render(<RecentInvoiceRow name="Arshid" date="1 Jan" amount={100} isCredit={false} />);
        expect(screen.getByText('Arshid')).toBeInTheDocument();
        expect(screen.getByText('1 Jan')).toBeInTheDocument();
        expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    it('uses debit color for outgoing amounts', () => {
        render(<RecentInvoiceRow name="x" date="d" amount={100} isCredit />);
        const amt = screen.getByText(/100/);
        expect(amt.className).toMatch(/E53E3E/);
    });
});
