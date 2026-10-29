import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import PaymentTimelineAndDetails from '../../../components/documentDetails/PaymentTimelineAndDetails';

const baseDoc: any = {
    id: 'd-1',
    documentNumber: 'INV-101',
    documentDate: '2026-01-01',
    name: 'Acme Corp',
    totalAmount: '500',
    paymentMode: 'UPI',
    status: 'PENDING',
    dueDate: '2026-01-15',
    notes: 'thanks',
    paymentDate: null,
};

const baseProps = {
    documentData: baseDoc,
    documentLabel: 'Invoice',
};

describe('PaymentTimelineAndDetails', () => {
    it('renders key info rows', () => {
        render(<PaymentTimelineAndDetails {...baseProps} />);

        expect(screen.getByText('Invoice Number')).toBeInTheDocument();
        expect(screen.getByText('INV-101')).toBeInTheDocument();
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('₹ 500.00')).toBeInTheDocument();
    });

    it('uses Sales Order Number label when documentLabel is Sales Order', () => {
        render(<PaymentTimelineAndDetails {...baseProps} documentLabel="Sales Order" />);

        expect(screen.getByText('Sales Order Number')).toBeInTheDocument();
    });

    it('renders Mark as Completed button when onMarkCompleted is provided and triggers it', () => {
        const onMarkCompleted = vi.fn();
        render(
            <PaymentTimelineAndDetails {...baseProps} onMarkCompleted={onMarkCompleted} />
        );

        const btn = screen.getByRole('button', { name: /mark as completed/i });
        fireEvent.click(btn);
        expect(onMarkCompleted).toHaveBeenCalled();
    });

    it('does not render Mark as Completed button when onMarkCompleted is omitted', () => {
        render(<PaymentTimelineAndDetails {...baseProps} />);

        expect(
            screen.queryByRole('button', { name: /mark as completed/i })
        ).not.toBeInTheDocument();
    });

    it('shows a loading placeholder when isLoading is true', () => {
        render(<PaymentTimelineAndDetails {...baseProps} isLoading />);
        expect(screen.queryByText('Invoice Number')).not.toBeInTheDocument();
    });
});
