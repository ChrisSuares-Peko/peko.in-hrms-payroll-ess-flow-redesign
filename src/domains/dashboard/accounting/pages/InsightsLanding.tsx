import { useMemo, useState } from 'react';

import { Empty, Flex, Spin } from 'antd';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    useAccountingInsights,
    useAccountsPayable,
    useAccountsReceivable,
    useBusinessHealth,
    useCashFlowOverview,
    useReportSummary,
} from '../hooks/useReportSummary';
import CashFlowTab from '../sections/insightsDashboard/CashFlowTab';
import ExpenseTab from '../sections/insightsDashboard/ExpenseTab';
import InsightsPageHeader from '../sections/insightsDashboard/InsightsPageHeader';
import InsightsTabs from '../sections/insightsDashboard/InsightsTabs';
import OverviewTab from '../sections/insightsDashboard/OverviewTab';
import ProfitabilityTab from '../sections/insightsDashboard/ProfitabilityTab';
import RevenueTab from '../sections/insightsDashboard/RevenueTab';
import TaxGstTab from '../sections/insightsDashboard/TaxGstTab';
import WorkingCapitalTab from '../sections/insightsDashboard/WorkingCapitalTab';
import { setReportFinancialYear } from '../slices/reportFiltersSlice';
import { InsightsTabKey } from '../utils/insightsDashboardData';
import { toExpenseView } from '../utils/insightsExpenseViewModel';
import { downloadInsightsCsv } from '../utils/insightsExport';
import { toOverviewView } from '../utils/insightsOverviewViewModel';
import { toProfitabilityView } from '../utils/insightsProfitabilityViewModel';
import { toRevenueView } from '../utils/insightsRevenueViewModel';
import { fyPeriodToRange } from '../utils/reportFilters';

const InsightsLanding = () => {
    const dispatch = useAppDispatch();
    const { financialYear, period } = useAppSelector(
        state => state.reducer.accountingReportFilters
    );
    const { from, to } = fyPeriodToRange(financialYear, period);
    // Prior equivalent period (same months, one year back) → powers the YoY deltas on the KPI cards.
    const priorFrom = dayjs(from).subtract(1, 'year').format('YYYY-MM-DD');
    const priorTo = dayjs(to).subtract(1, 'year').format('YYYY-MM-DD');

    // Overview/Revenue/Expense/Profitability share these hooks, which must run unconditionally
    // (rules-of-hooks). Cash Flow, Tax & GST and Working Capital fetch their own data when opened.
    const { insights, loading: insightsLoading } = useAccountingInsights(from, to);
    const { ar } = useAccountsReceivable({ from, to });
    const { accountsPayable } = useAccountsPayable({ from, to });
    const { cashFlowOverview } = useCashFlowOverview({ from, to });
    const { summary: priorSummary } = useReportSummary({ from: priorFrom, to: priorTo });
    const { health, loading: healthLoading } = useBusinessHealth(from, to);

    const [activeTab, setActiveTab] = useState<InsightsTabKey>('overview');

    // AR + prior-period resolve independently of insights; once each arrives this recomputes and the
    // AR KPI / YoY deltas fill in.
    const overview = useMemo(
        () =>
            insights
                ? toOverviewView(insights, ar, priorSummary, cashFlowOverview, accountsPayable)
                : null,
        [insights, ar, priorSummary, cashFlowOverview, accountsPayable]
    );
    const revenueView = useMemo(() => (insights ? toRevenueView(insights) : null), [insights]);
    const expenseView = useMemo(() => (insights ? toExpenseView(insights) : null), [insights]);
    const profitabilityView = useMemo(
        () => (insights ? toProfitabilityView(insights) : null),
        [insights]
    );

    const loadingBlock = (
        <Flex align="center" justify="center" className="min-h-[300px]">
            <Spin />
        </Flex>
    );
    const emptyBlock = (label: string) => (
        <Flex align="center" justify="center" className="min-h-[300px]">
            <Empty description={label} />
        </Flex>
    );

    // Export the active tab's real data as CSV (FY-scoped). No-op until insights have loaded.
    const handleExport = () => {
        if (!insights) return;
        downloadInsightsCsv(activeTab, { financialYear, insights, ar, health });
    };

    const renderTab = () => {
        if (activeTab === 'overview') {
            if (insightsLoading) return loadingBlock;
            if (!overview) return emptyBlock('No insights data');
            return (
                <OverviewTab
                    primaryKpis={overview.primaryKpis}
                    secondaryKpis={overview.secondaryKpis}
                    revenueVsExpenses={overview.revenueVsExpenses}
                    businessHealth={health}
                    businessHealthLoading={healthLoading}
                />
            );
        }
        if (activeTab === 'revenue') {
            if (insightsLoading) return loadingBlock;
            if (!revenueView) return emptyBlock('No revenue data');
            return (
                <RevenueTab
                    trend={revenueView.trend}
                    streams={revenueView.streams}
                    topCustomers={revenueView.topCustomers}
                />
            );
        }
        if (activeTab === 'expense') {
            if (insightsLoading) return loadingBlock;
            if (!expenseView) return emptyBlock('No expense data');
            return (
                <ExpenseTab
                    trend={expenseView.trend}
                    categories={expenseView.categories}
                    topVendors={expenseView.topVendors}
                />
            );
        }
        if (activeTab === 'profitability') {
            if (insightsLoading) return loadingBlock;
            if (!profitabilityView) return emptyBlock('No profitability data');
            return (
                <ProfitabilityTab
                    profitTrend={profitabilityView.profitTrend}
                    netMargin={profitabilityView.netMargin}
                    pnl={profitabilityView.pnl}
                />
            );
        }
        if (activeTab === 'cash-flow') return <CashFlowTab from={from} to={to} />;
        if (activeTab === 'tax-gst') return <TaxGstTab from={from} to={to} />;
        return <WorkingCapitalTab from={from} to={to} />;
    };

    return (
        <Flex vertical gap={24} className="px-2 py-5">
            <InsightsPageHeader
                activeFy={financialYear}
                onFyChange={fy => dispatch(setReportFinancialYear(fy))}
                onExport={handleExport}
            />
            <InsightsTabs active={activeTab} onChange={setActiveTab} />
            {renderTab()}
        </Flex>
    );
};

export default InsightsLanding;
