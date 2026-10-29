import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import UpdatePaymentStatus from '../../../../components/collectPayment/recordManual/UpdatePaymentStatus';

vi.mock('../../../../components/shared/Invoicesummary', () => ({
    default: ({ title, customerName }: any) => (
        <div>
            <span>{title}</span>
            <span>{customerName}</span>
        </div>
    ),
}));
vi.mock('../../../../components/collectPayment/recordManual/RecordManually', () => ({
    default: () => <div data-testid="record" />,
}));

describe('UpdatePaymentStatus', () => {
    it('renders InvoiceSummary header and RecordManually form', () => {
        render(
            <UpdatePaymentStatus
                open
                editRow={{ customer: 'Acme', invoiceRef: 'INV-101', amount: 500 } as any}
                onClose={() => {}}
            />
        );

        expect(screen.getByText('Update Payment Status')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByTestId('record')).toBeInTheDocument();
    });
});
