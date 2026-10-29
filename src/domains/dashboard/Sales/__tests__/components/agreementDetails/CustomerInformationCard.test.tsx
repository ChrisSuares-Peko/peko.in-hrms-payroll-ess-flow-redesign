import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import CustomerInformationCard from '../../../components/agreementDetails/CustomerInformationCard';

vi.mock('../../../components/shared/ReceiptRow', () => ({
    default: ({ label, value }: any) => (
        <div data-testid="receipt-row">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    ),
}));

describe('CustomerInformationCard', () => {
    it('renders customer initials, name, email, phone', () => {
        render(
            <CustomerInformationCard
                customerName="Acme Corp"
                email="hi@acme.com"
                phone="9999999999"
            />
        );

        expect(screen.getByText('Customer Information')).toBeInTheDocument();
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        // toInitials("Acme Corp") → "AC".
        expect(screen.getByText('AC')).toBeInTheDocument();
        expect(screen.getByText('hi@acme.com')).toBeInTheDocument();
        expect(screen.getByText('9999999999')).toBeInTheDocument();
    });

    it('renders gstin and address rows when provided', () => {
        render(
            <CustomerInformationCard
                customerName="A B"
                email="x@y"
                phone="111"
                gstin="GST123"
                address="Line 1\nLine 2"
            />
        );

        expect(screen.getByText('GSTIN')).toBeInTheDocument();
        expect(screen.getByText('GST123')).toBeInTheDocument();
        expect(screen.getByText('Address')).toBeInTheDocument();
    });

    it('omits gstin and address rows when not provided', () => {
        render(
            <CustomerInformationCard customerName="A B" email="x@y" phone="111" />
        );

        expect(screen.queryByText('GSTIN')).not.toBeInTheDocument();
        expect(screen.queryByText('Address')).not.toBeInTheDocument();
    });
});
