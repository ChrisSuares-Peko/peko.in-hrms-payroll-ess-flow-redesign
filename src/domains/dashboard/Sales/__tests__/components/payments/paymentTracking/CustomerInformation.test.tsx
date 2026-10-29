import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import CustomerInformation from '../../../../components/payments/paymentTracking/CustomerInformation';

vi.mock('../../../../components/shared/ReceiptRow', () => ({
    default: ({ label, value }: any) => (
        <div data-testid="receipt-row">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    ),
}));

describe('CustomerInformation', () => {
    it('renders dashes when data is null', () => {
        render(<CustomerInformation data={null} />);

        expect(screen.getByText('Customer Information')).toBeInTheDocument();
        expect(screen.getByText('--')).toBeInTheDocument();
        // Hyphen value rendered for missing fields.
        expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    });

    it('renders customer details and initials', () => {
        const data: any = {
            customerName: 'Acme Corp',
            customerPhone: '999',
            customerEmail: 'a@b.com',
            customerGst: 'GST123',
            customerAddress: 'Line 1',
            customerPincode: '111111',
            customerCountry: 'IN',
        };
        render(<CustomerInformation data={data} />);

        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('AC')).toBeInTheDocument();
        expect(screen.getByText('a@b.com')).toBeInTheDocument();
        expect(screen.getByText('GST123')).toBeInTheDocument();
    });
});
