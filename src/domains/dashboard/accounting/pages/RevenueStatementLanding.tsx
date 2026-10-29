import { useMemo, useState } from 'react';

import { Flex } from 'antd';
import dayjs from 'dayjs';

import {
    useReportExport,
    useReportSummary,
    useReportTransactions,
} from '../hooks/useReportSummary';
import TransactionsCard, { ReportTxnRow } from '../sections/expenseStatement/TransactionsCard';
import CategoryDistributionCard from '../sections/revenue/CategoryDistributionCard';
import RevenueHeader from '../sections/revenue/RevenueHeader';
import RevenueTrendCard from '../sections/revenue/RevenueTrendCard';
import TopCustomersCard from '../sections/revenue/TopCustomersCard';
import { FULL_YEAR, currentFyStart } from '../utils/reportFilters';
import {
    formatCompact,
    formatRupee,
    monthlyTrend,
    pctOf,
    quarterlyTrend,
    reportColor,
} from '../utils/reportFormat';

const RevenueStatementLanding = () => {
    const [fy, setFy] = useState(currentFyStart());
    const [period, setPeriod] = useState(FULL_YEAR);

    // fy alone → full financial year; fy + month → single calendar month within the FY.
    const month = period === FULL_YEAR ? undefined : Number(period);

    const { summary, loading } = useReportSummary({ fy, month });
    const { rows: txns, loading: txnsLoading } = useReportTransactions('Income', { fy, month });
    const { exporting, exportReport } = useReportExport('Income', { fy, month });

    const incomeTotal = summary?.totals.income ?? 0;

    const categoryData = useMemo(() => {
        const total = summary?.totals.income ?? 0;
        const slices = (summary?.byCategory.income ?? []).map((c, i) => ({
            key: c.category,
            label: c.category,
            color: reportColor(i),
            display: formatCompact(c.total),
            percent: pctOf(c.total, total),
        }));
        return {
            title: 'Category Distribution',
            centerLabel: 'Total Revenue',
            centerValue: formatCompact(total),
            slices,
        };
    }, [summary]);

    const categoryColor = useMemo(
        () => new Map(categoryData.slices.map(s => [s.label, s.color])),
        [categoryData]
    );

    const trendData = useMemo(
        () => ({
            title: 'Revenue Trend',
            color: '#3B82F6',
            monthly: monthlyTrend(summary?.monthly ?? [], 'income').map(m => ({
                period: m.label,
                value: m.value,
            })),
            quarterly: quarterlyTrend(summary?.monthly ?? [], 'income').map(q => ({
                period: q.label,
                value: q.value,
            })),
        }),
        [summary]
    );

    const customersData = useMemo(() => {
        const list = summary?.topParties.income ?? [];
        const max = Math.max(...list.map(p => p.total), 1);
        return {
            title: 'Top Customers by Revenue',
            customers: list.map((p, i) => ({
                key: p.party,
                name: p.party,
                display: formatRupee(p.total),
                percent: Math.round((p.total / max) * 100),
                color: reportColor(i),
            })),
            legend: [],
        };
    }, [summary]);

    const tableRows: ReportTxnRow[] = useMemo(
        () =>
            txns.map(t => ({
                date: dayjs(t.date).format('MMM DD'),
                party: t.description,
                category: t.category || 'Uncategorized',
                color: categoryColor.get(t.category || 'Uncategorized') ?? reportColor(0),
                amount: t.amount,
                reference: `#${t.id}`,
            })),
        [txns, categoryColor]
    );

    return (
        <Flex vertical gap={24} className="px-2 py-5">
            <RevenueHeader
                fy={fy}
                period={period}
                onFyChange={setFy}
                onPeriodChange={setPeriod}
                onExport={() => exportReport('Revenue Statement.xlsx')}
                exporting={exporting}
            />

            <TransactionsCard
                title="Revenue"
                partyLabel="Customer"
                rows={tableRows}
                total={incomeTotal}
                loading={txnsLoading}
            />

            <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-2">
                <CategoryDistributionCard data={categoryData} loading={loading} />
                <RevenueTrendCard data={trendData} loading={loading} />
                <TopCustomersCard data={customersData} loading={loading} />
            </div>
        </Flex>
    );
};

export default RevenueStatementLanding;
