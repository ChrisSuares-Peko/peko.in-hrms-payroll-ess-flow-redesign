import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import RecentDocumentRow from '../../../components/dashboard/RecentDocumentRow';

describe('RecentDocumentRow', () => {
    it('renders name, date and formatted amount', () => {
        render(<RecentDocumentRow invoiceNumber="INV-001" documentType="INVOICE" name="Acme Corp" date="03:49 PM · 02 Feb 2026" amount={40612} />);

        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('03:49 PM · 02 Feb 2026')).toBeInTheDocument();
        expect(screen.getByText('₹ 40,612.00')).toBeInTheDocument();
    });

    it('formats decimal amounts to two digits', () => {
        render(<RecentDocumentRow invoiceNumber="INV-002" documentType="INVOICE" name="X" date="d" amount={1234.5} />);

        expect(screen.getByText('₹ 1,234.50')).toBeInTheDocument();
    });

    it('formats negative amounts with leading minus and rupee', () => {
        render(<RecentDocumentRow invoiceNumber="INV-003" documentType="QUOTATION" name="X" date="d" amount={-2500} />);

        expect(screen.getByText('-₹ 2,500.00')).toBeInTheDocument();
    });

    it('formats zero amount', () => {
        render(<RecentDocumentRow invoiceNumber="INV-004" documentType="SALES_ORDER" name="X" date="d" amount={0} />);

        expect(screen.getByText('₹ 0.00')).toBeInTheDocument();
    });
});
