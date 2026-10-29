import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InvoiceSelectionPanel from '../../../components/eWaybill/InvoiceSelectionPanel';
import { EligibleInvoice } from '../../../types/eWaybill';

const invoices: EligibleInvoice[] = [
    {
        id: 'i-1',
        invoiceNo: 'INV001',
        buyerName: 'Acme',
        amount: '₹1,000',
        date: '2026-05-01',
        irn: 'irn-1',
    },
];

const baseProps = {
    eligibleInvoices: invoices,
    recordsTotal: 1,
    activeWaybills: [],
    searchText: '',
    isLoading: false,
    hasMore: false,
    onSelect: vi.fn(),
    onLoadMore: vi.fn(),
};

describe('InvoiceSelectionPanel', () => {
    it('renders header with total count', () => {
        render(<InvoiceSelectionPanel {...baseProps} />);
        expect(screen.getByText('Select Invoice')).toBeInTheDocument();
        expect(screen.getByText('(1 eligible)')).toBeInTheDocument();
    });

    it('renders the search input when onSearchChange is provided', () => {
        const onSearchChange = vi.fn();
        render(<InvoiceSelectionPanel {...baseProps} onSearchChange={onSearchChange} />);
        const input = screen.getByPlaceholderText('Search Invoices');
        fireEvent.change(input, { target: { value: 'abc' } });
        expect(onSearchChange).toHaveBeenCalled();
    });

    it('omits the search input when onSearchChange is not provided', () => {
        render(<InvoiceSelectionPanel {...baseProps} />);
        expect(screen.queryByPlaceholderText('Search Invoices')).toBeNull();
    });

    it('shows empty-state copy when no invoices and not loading', () => {
        render(<InvoiceSelectionPanel {...baseProps} eligibleInvoices={[]} recordsTotal={0} />);
        expect(screen.getByText('No active e-invoices found')).toBeInTheDocument();
    });

    it('fires onSelect with invoice when an item is clicked', () => {
        const onSelect = vi.fn();
        render(<InvoiceSelectionPanel {...baseProps} onSelect={onSelect} />);
        fireEvent.click(screen.getByText('INV001'));
        expect(onSelect).toHaveBeenCalledWith(invoices[0]);
    });

    it('calls onLoadMore when scrolled near bottom with hasMore=true', () => {
        const onLoadMore = vi.fn();
        const { container } = render(
            <InvoiceSelectionPanel {...baseProps} hasMore onLoadMore={onLoadMore} />
        );
        const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 200, configurable: true });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 150, configurable: true });
        Object.defineProperty(scrollContainer, 'scrollTop', { value: 100, configurable: true });
        fireEvent.scroll(scrollContainer);
        expect(onLoadMore).toHaveBeenCalled();
    });
});
