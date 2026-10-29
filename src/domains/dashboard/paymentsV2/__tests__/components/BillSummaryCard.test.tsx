import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import BillSummaryCard from '../../components/BillSummaryCard';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: (state: any) => unknown) =>
        selector({ reducer: { payment: { billSummary: [], paymentSummary: [] }, auth: {} } }),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ xs: false }),
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

const rows = [
    { key: 'Service name', value: 'Mobile Postpaid' },
    { key: 'Amount', value: '124.00', isInput: false },
];

const renderCard = (creditBalance: number | null) =>
    render(
        <BillSummaryCard
            title="Recharge Summary"
            billSummary={rows}
            minimumAmount={1}
            maximumAmount={1000000}
            creditBalance={creditBalance}
            setIsCashbackChecked={vi.fn()}
            isLoading={false}
            removeCoupon={vi.fn()}
        />
    );

describe('BillSummaryCard with a credit balance', () => {
    it('tags the Amount row as Credit and shows the credit as a positive amount', () => {
        renderCard(124);
        const tag = screen.getByText('Credit');
        const valueCell = tag.parentElement as HTMLElement;
        expect(valueCell.textContent).toBe('Credit₹ 124.00');
        expect(valueCell.textContent).not.toContain('-');
        expect(valueCell.closest('div')?.textContent).toContain('Amount');
    });

    it('does not tag any other row', () => {
        renderCard(124);
        expect(screen.getAllByText('Credit')).toHaveLength(1);
        expect(screen.getByText('Mobile Postpaid').parentElement?.textContent).toBe('Mobile Postpaid');
    });

    it('shows the info banner with the credit in bold and the no-payment-due line', () => {
        renderCard(124);
        const banner = screen.getByRole('status');
        expect(banner.textContent).toBe(
            'Your account has a credit balance of ₹124.00. No payment is due at this time.'
        );
        const amount = screen.getByText('₹124.00');
        expect(amount.className).toContain('font-semibold');
        expect(banner).toContainElement(amount);
    });

    it('keeps the existing min/max hint', () => {
        renderCard(124);
        expect(
            screen.getByText(
                (_, element) =>
                    element?.tagName === 'P' &&
                    element.textContent === 'Min: ₹ 1.00 and Max: ₹ 10,00,000.00'
            )
        ).toBeInTheDocument();
    });
});

describe('BillSummaryCard without a credit balance', () => {
    it('renders neither the Credit tag nor the banner', () => {
        renderCard(null);
        expect(screen.queryByText('Credit')).not.toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByText('₹ 124.00')).toBeInTheDocument();
    });
});
