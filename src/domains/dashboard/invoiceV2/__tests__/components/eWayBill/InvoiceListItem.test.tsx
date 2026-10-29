import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InvoiceListItem from '../../../components/eWaybill/InvoiceListItem';
import { EligibleInvoice } from '../../../types/eWaybill';

const invoice: EligibleInvoice = {
    id: 'i-1',
    invoiceNo: 'INV001',
    buyerName: 'Acme',
    amount: '₹1,000',
    date: '2026-05-01',
    irn: 'irn-1',
};

describe('InvoiceListItem', () => {
    it('renders invoice number, buyer and amount', () => {
        render(<InvoiceListItem invoice={invoice} />);
        expect(screen.getByText('INV001')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('₹1,000 · 2026-05-01')).toBeInTheDocument();
    });

    it('fires onClick when clicked', () => {
        const onClick = vi.fn();
        render(<InvoiceListItem invoice={invoice} onClick={onClick} />);
        fireEvent.click(screen.getByText('INV001'));
        expect(onClick).toHaveBeenCalled();
    });

    it('applies selected border when isSelected', () => {
        const { container } = render(<InvoiceListItem invoice={invoice} isSelected />);
        expect((container.firstChild as HTMLElement).className).toContain('border-[#FF4F4F]');
    });

    it('has role=button only when onClick provided', () => {
        const { rerender } = render(<InvoiceListItem invoice={invoice} />);
        expect(screen.queryByRole('button')).toBeNull();
        rerender(<InvoiceListItem invoice={invoice} onClick={vi.fn()} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
});
