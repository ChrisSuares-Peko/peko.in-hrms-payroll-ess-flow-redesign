import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CustomTooltipMonthlyData from '../../components/CustomTooltipMonthlyData';
import DashHeader from '../../components/DashHeader';
import TodaysData from '../../components/TodaysData';
import { todaysDatas, totalDatas } from '../../types/types';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <span data-testid="svg" data-src={src} />,
}));

const totals: totalDatas = {
    totalRevenue: '987654.00',
    totalCorporates: 11,
    totalCustomers: 12,
    totalVendors: 13,
    totalTransactions: 14,
    totalCashback: '123456.78',
    activeUsers: 15,
    activeUsersTillDate: 16,
    activeCustomers: 17,
    activeCustomersTillDate: 18,
};

const today: todaysDatas = {
    todaysCorporateUsers: 2,
    todaysRevenue: '4500.00',
    todaysCashback: '25.50',
    todaysTransactions: 3,
};

const cardFor = (title: string) => screen.getByText(title).parentElement as HTMLElement;

describe('admin dashboard commission wording', () => {
    it('shows the all-time commission excluding GST in rupees', () => {
        render(<DashHeader totalData={totals} isLoading={false} />);

        expect(cardFor('Commission (excl. GST)')).toHaveTextContent('₹ 1,23,456.78');
        expect(screen.queryByText(/cashback/i)).not.toBeInTheDocument();
    });

    it("shows today's commission excluding GST in rupees", () => {
        render(<TodaysData todayData={today} isLoading={false} />);

        expect(cardFor('Commission (excl. GST)')).toHaveTextContent('₹ 25.50');
        expect(screen.queryByText(/cashback/i)).not.toBeInTheDocument();
    });

    it("names the chart's second bar as commission excluding GST", () => {
        render(<CustomTooltipMonthlyData active payload={[{ value: 3 }, { value: 40.25 }]} />);

        expect(screen.getByText('Transactions : 3')).toBeInTheDocument();
        expect(screen.getByText('Commission (excl. GST) : ₹ 40.25')).toBeInTheDocument();
        expect(screen.queryByText(/cashback/i)).not.toBeInTheDocument();
    });
});
