import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import getInvoiceColumns from '../../utils/table_column/invoiceColumns';

vi.mock('../../utils/helperFunctions', () => ({
    formatCurrencyAmount: vi.fn((amount, currency) => `${currency} ${amount}`),
    formatDate: vi.fn((d) => d),
    toTitleCase: vi.fn((s) => s),
}));

vi.mock('../../assets/icons/invoiceList/mark-as-paid.svg', () => ({ default: 'mark-as-paid.svg' }));
vi.mock('../../assets/icons/invoiceList/view.svg', () => ({ default: 'view.svg' }));
vi.mock('../../assets/icons/recurring.svg', () => ({ default: 'recurring.svg' }));
vi.mock('../../constants/style', () => ({ STATUS_STYLE: {} }));

describe('getInvoiceColumns', () => {
    let cols: ReturnType<typeof getInvoiceColumns>;

    beforeEach(() => {
        vi.clearAllMocks();
        cols = getInvoiceColumns(vi.fn(), vi.fn(), vi.fn());
    });

    const invoiceIdCol = () => cols[0] as any;
    const totalAmountCol = () => cols[3] as any;
    const amountDueCol = () => cols[4] as any;

    it('renders prefix + invoiceNumber when prefix is set', () => {
        const renderFn = invoiceIdCol().render;
        const element = renderFn('001', { prefix: 'INV', invoiceNumber: '001' });
        render(element);
        expect(screen.getByText('INV001')).toBeInTheDocument();
    });

    it('renders just invoiceNumber when prefix is empty or null', () => {
        const renderFn = invoiceIdCol().render;
        const element = renderFn('001', { prefix: null, invoiceNumber: '001' });
        render(element);
        expect(screen.getByText('001')).toBeInTheDocument();
    });

    it('Total Amount column has title "Total Amount" and width 180', () => {
        const col = totalAmountCol();
        expect(col.title).toBe('Total Amount');
        expect(col.width).toBe(180);
    });

    it('Amount Due column has title "Amount Due" and width 180', () => {
        const col = amountDueCol();
        expect(col.title).toBe('Amount Due');
        expect(col.width).toBe(180);
    });

    it('Amount Due renders with red color #ef4444', () => {
        const renderFn = amountDueCol().render;
        const element = renderFn('500', { currency: 'INR', amountDue: '500' });
        const { container } = render(element);
        const el = container.firstChild as HTMLElement;
        expect(el).toBeTruthy();
        expect(el?.style?.color).toBe('rgb(239, 68, 68)');
    });
});
