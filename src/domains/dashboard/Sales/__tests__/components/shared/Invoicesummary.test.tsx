import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import Invoicesummary from '../../../components/shared/Invoicesummary';

vi.mock('../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));

describe('Invoicesummary', () => {
    it('renders title, customer, invoice number and amount', () => {
        render(
            <Invoicesummary
                title="Collect Payment"
                description="Receive money from customer"
                customerName="Acme"
                invoiceNo="INV-101"
                amount={1234}
            />
        );

        expect(screen.getByText('Collect Payment')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('INV-101')).toBeInTheDocument();
        expect(screen.getByText('₹1,234')).toBeInTheDocument();
    });

    it('renders amount as string when passed as such', () => {
        render(
            <Invoicesummary
                title="t"
                description="d"
                customerName="A"
                invoiceNo="X"
                amount="500.50"
            />
        );

        expect(screen.getByText('₹500.50')).toBeInTheDocument();
    });
});
