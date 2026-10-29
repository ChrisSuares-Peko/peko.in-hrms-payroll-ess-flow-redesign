import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import OverviewTab from '../../../components/payments/OverviewTab';
import usePaymentDashboard from '../../../hooks/payments/usePaymentDashboard';

vi.mock('../../../hooks/payments/usePaymentDashboard', () => ({
    default: vi.fn(),
}));
vi.mock('../../../components/payments/DueThisWeekDrawer', () => ({
    default: () => null,
}));
vi.mock('../../../components/shared/StatCard', () => ({
    default: ({ value, label }: any) => (
        <div data-testid="stat-card">
            <span>{value}</span>
            <span>{label}</span>
        </div>
    ),
}));
vi.mock('../../../components/shared/RankingPanel', () => ({
    default: ({ title }: any) => <div data-testid="ranking-panel">{title}</div>,
}));
vi.mock('../../../components/payments/overview/RevenueCollectionHealth', () => ({
    default: () => <div data-testid="revenue-health" />,
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('OverviewTab', () => {
    it('renders four stat cards, the revenue health card and three ranking panels', () => {
        (usePaymentDashboard as any).mockReturnValue({
            overView: {
                totalReceived: 1000,
                outstanding: 500,
                outstandingCount: 5,
                overdue: 200,
                overdueCount: 2,
                thisMonth: 800,
                vsLastMonthReceived: 10,
                vsLastMonthThisMonth: -5,
                collectionHealth: {
                    collectedPercent: 60,
                    outstandingPercent: 30,
                    overduePercent: 10,
                },
            },
            dueData: [],
            topCustomers: [],
            recentActivity: [],
        });

        render(<OverviewTab />);

        expect(screen.getAllByTestId('stat-card')).toHaveLength(4);
        expect(screen.getByText('Total Received')).toBeInTheDocument();
        expect(screen.getByText('Outstanding')).toBeInTheDocument();
        expect(screen.getByText('Overdue')).toBeInTheDocument();
        expect(screen.getByText('Received This Month')).toBeInTheDocument();
        expect(screen.getByTestId('revenue-health')).toBeInTheDocument();

        const panels = screen.getAllByTestId('ranking-panel').map(p => p.textContent);
        expect(panels).toContain('Payments Due This Week');
        expect(panels).toContain('Top Paying Customers');
        expect(panels).toContain('Recent Payment Activity');
    });

    it('shows em-dash placeholders when overView is null', () => {
        (usePaymentDashboard as any).mockReturnValue({
            overView: null,
            dueData: [],
            topCustomers: [],
            recentActivity: [],
        });

        render(<OverviewTab />);

        // Each of the 4 cards shows '—' for value when overView is null.
        const dashes = screen.getAllByText('—');
        expect(dashes).toHaveLength(4);
    });
});
