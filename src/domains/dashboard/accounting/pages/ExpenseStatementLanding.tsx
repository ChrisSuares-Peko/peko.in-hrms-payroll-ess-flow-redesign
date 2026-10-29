import { useMemo, useState } from 'react';

import { Flex } from 'antd';
import dayjs from 'dayjs';

import {
    useReportExport,
    useReportSummary,
    useReportTransactions,
} from '../hooks/useReportSummary';
import CategoryDistributionCard from '../sections/expenseStatement/CategoryDistributionCard';
import ExpenseHeader from '../sections/expenseStatement/ExpenseHeader';
import ExpenseTrendCard from '../sections/expenseStatement/ExpenseTrendCard';
import TopVendorsCard from '../sections/expenseStatement/TopVendorsCard';
import TransactionsCard, { ReportTxnRow } from '../sections/expenseStatement/TransactionsCard';
import { FULL_YEAR, currentFyStart } from '../utils/reportFilters';
import {
    formatCompact,
    formatRupee,
    monthlyTrend,
    pctOf,
    quarterlyTrend,
    reportColor,
} from '../utils/reportFormat';

const ExpenseStatementLanding = () => {
    const [fy, setFy] = useState(currentFyStart());
    const [period, setPeriod] = useState(FULL_YEAR);

    // fy alone → full financial year; fy + month → single calendar month within the FY.
    const month = period === FULL_YEAR ? undefined : Number(period);

    const { summary, loading } = useReportSummary({ fy, month });
    const { rows: txns, loading: txnsLoading } = useReportTransactions('Expense', { fy, month });
    const { exporting, exportReport } = useReportExport('Expense', { fy, month });

    const expenseTotal = summary?.totals.expense ?? 0;

    const slices = useMemo(() => {
        const total = summary?.totals.expense ?? 0;
        return (summary?.byCategory.expense ?? []).map((c, i) => ({
            key: c.category,
            label: c.category,
            color: reportColor(i),
            amount: c.total,
            pct: pctOf(c.total, total),
            display: formatRupee(c.total),
        }));
    }, [summary]);

    const categoryColor = useMemo(() => new Map(slices.map(s => [s.label, s.color])), [slices]);

    const monthly = useMemo(() => monthlyTrend(summary?.monthly ?? [], 'expense'), [summary]);
    const quarterly = useMemo(() => quarterlyTrend(summary?.monthly ?? [], 'expense'), [summary]);

    const vendors = useMemo(() => {
        const list = summary?.topParties.expense ?? [];
        const max = Math.max(...list.map(p => p.total), 1);
        return list.map((p, i) => ({
            vendor: p.party,
            amount: p.total,
            display: formatRupee(p.total),
            pct: Math.round((p.total / max) * 100),
            categoryKey: '',
            color: reportColor(i),
        }));
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
            <ExpenseHeader
                fy={fy}
                period={period}
                onFyChange={setFy}
                onPeriodChange={setPeriod}
                onExport={() => exportReport('Expense Statement.xlsx')}
                exporting={exporting}
            />

            <TransactionsCard
                partyLabel="Vendor"
                rows={tableRows}
                total={expenseTotal}
                loading={txnsLoading}
            />

            <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-2">
                <CategoryDistributionCard
                    slices={slices}
                    centerValue={formatCompact(expenseTotal)}
                    centerLabel="Total Spend"
                    loading={loading}
                />
                <ExpenseTrendCard monthly={monthly} quarterly={quarterly} loading={loading} />
                <TopVendorsCard vendors={vendors} loading={loading} />
            </div>
        </Flex>
    );
};

export default ExpenseStatementLanding;
