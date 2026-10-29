import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import QuotationSelectionCard from '../../../components/createAgreement/QuotationSelectionCard';

describe('QuotationSelectionCard', () => {
    const quotation: any = {
        id: 'q-1',
        displayId: 'Q-101',
        customer: 'Acme',
        date: '01 Jan 2026',
        amount: 5000,
        subtotal: 4500,
        tax: 500,
        discount: 0,
        items: [
            { name: 'Service A', quantity: '2', unitPrice: '1000', netAmount: '2000' },
            { name: 'Service B', quantity: '1', unitPrice: '2500', netAmount: '2500' },
        ],
        status: 'PENDING',
    };

    it('renders summary header, customer, date and items', () => {
        render(<QuotationSelectionCard quotation={quotation} />);

        expect(screen.getByText('Quotation Summary')).toBeInTheDocument();
        expect(screen.getByText('Q-101')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('01 Jan 2026')).toBeInTheDocument();
        expect(screen.getByText('Service A')).toBeInTheDocument();
        expect(screen.getByText('Service B')).toBeInTheDocument();
    });

    it('renders subtotal, GST, discount, and total amounts', () => {
        render(<QuotationSelectionCard quotation={quotation} />);

        expect(screen.getByText('Subtotal')).toBeInTheDocument();
        expect(screen.getByText('₹4,500')).toBeInTheDocument();
        expect(screen.getByText('+ ₹500')).toBeInTheDocument();
        expect(screen.getByText('-₹0')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('₹5,000')).toBeInTheDocument();
    });

    it('omits items table when items array is empty', () => {
        render(<QuotationSelectionCard quotation={{ ...quotation, items: [] }} />);

        expect(screen.queryByText('Description')).not.toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
    });
});
