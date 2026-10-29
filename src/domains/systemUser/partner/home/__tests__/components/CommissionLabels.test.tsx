import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Charts from '../../components/Charts';
import CustomTooltipMonthlyData from '../../components/CustomTooltipMonthlyData';
import CustomTooltipMonthlySharesData from '../../components/CustomTooltipMonthlySharesData';
import DashHeader from '../../components/DashHeader';
import TodaysHeader from '../../components/TodaysHeader';
import { DashboardDetails } from '../../types/types';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <span data-testid="svg" data-src={src} />,
}));

vi.mock('../../hooks/useGetStatistics', () => ({
    default: () => ({ isLoading: false, chartData: { allCorporates: [], monthlyStatistics: [] } }),
}));

const details: DashboardDetails = {
    totalTransactions: 40,
    totalRevenue: 900000,
    totalCashback: 10000,
    todaysRevenue: 4500,
    todaysCashback: 250,
    todaysTransactions: 3,
    totalCorporateUsers: 21,
    activeUsers: 22,
    todaysCorporateUsers: 1,
    todaysActiveUsers: 2,
    totalNetworkShare: 2000,
    todaysNetworkShare: 50,
};

const cardFor = (title: string) => screen.getByText(title).parentElement as HTMLElement;

describe('partner dashboard commission wording', () => {
    it('shows the overall commission and system share excluding GST, both in rupees', () => {
        render(<DashHeader dashboardData={details} isLoading={false} />);

        expect(cardFor('Total Commission (excl. GST)')).toHaveTextContent('₹ 10,000');
        expect(cardFor('System Share (excl. GST)')).toHaveTextContent('₹ 2,000');
    });

    it("shows today's commission and system share excluding GST, both in rupees", () => {
        render(<TodaysHeader dashboardData={details} isLoading={false} />);

        expect(cardFor('Total Commission (excl. GST)')).toHaveTextContent('₹ 250.00');
        expect(cardFor('System Share (excl. GST)')).toHaveTextContent('₹ 50.00');
    });

    it('names the transaction chart line as commission excluding GST', () => {
        render(<CustomTooltipMonthlyData active payload={[{ value: 2 }, { value: 100 }]} />);

        expect(screen.getByText('Commission (excl. GST) : ₹ 100.00')).toBeInTheDocument();
    });

    it('names the system share chart and its line excluding GST', () => {
        render(<Charts />);
        expect(screen.getByText('System Share (excl. GST)')).toBeInTheDocument();

        render(<CustomTooltipMonthlySharesData active payload={[{ value: 20 }]} />);
        expect(screen.getByText('System Share (excl. GST) : ₹ 20.00')).toBeInTheDocument();
    });
});
