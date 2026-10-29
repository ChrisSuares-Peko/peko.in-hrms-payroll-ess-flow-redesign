import { useMemo, useState } from 'react';

import { Col, Flex, Row } from 'antd';

import {
    useProfitAndLoss,
    useProfitLossComparison,
    useProfitLossExport,
    useReportSummary,
} from '../hooks/useReportSummary';
import DetailedPnlCard from '../sections/profitLoss/DetailedPnlCard';
import ExpenseBreakdownCard from '../sections/profitLoss/ExpenseBreakdownCard';
import NetProfitTrendCard from '../sections/profitLoss/NetProfitTrendCard';
import PnlHeader from '../sections/profitLoss/PnlHeader';
import PnlSummaryCard from '../sections/profitLoss/PnlSummaryCard';
import RevenueByCustomerCard from '../sections/profitLoss/RevenueByCustomerCard';
import RevenueExpenseTrendCard from '../sections/profitLoss/RevenueExpenseTrendCard';
import {
    buildStatementSections,
    CustomerRevenue,
    ExpenseSlice,
    NetProfitPoint,
    SummaryRow,
    TrendPoint,
} from '../utils/profitLossData';
import { FULL_YEAR, currentFyStart } from '../utils/reportFilters';
import {
    fiscalQuarterLabel,
    formatCompact,
    formatPct,
    formatRupee,
    monthLabel,
    pctOf,
    reportColor,
    toLakhs,
} from '../utils/reportFormat';

const ProfitLossLanding = () => {
    const [fy, setFy] = useState(currentFyStart());
    const [period, setPeriod] = useState(FULL_YEAR);

    // fy alone → full financial year; fy + month → single calendar month within the FY.
    const month = period === FULL_YEAR ? undefined : Number(period);
    const { summary, loading } = useReportSummary({ fy, month });
    const { pnl, loading: pnlLoading } = useProfitAndLoss({ fy, month });
    const { comparing, downloadComparison } = useProfitLossComparison(fy);
    const { exporting, exportPdf } = useProfitLossExport({ fy, month });

    const detailedSections = useMemo(() => (pnl ? buildStatementSections(pnl) : []), [pnl]);

    const income = summary?.totals.income ?? 0;
    const expense = summary?.totals.expense ?? 0;
    const net = income - expense;

    const pnlData = useMemo(() => {
        const p = summary?.pnl;

        if (p) {
            const rows: SummaryRow[] = [
                {
                    label: 'Total Revenue',
                    value: formatCompact(p.totalRevenue),
                    emphasis: 'warning',
                },
                {
                    label: 'Cost of Goods Sold',
                    note: formatPct(p.costOfGoodsSold.pctOfRevenue),
                    value: `-${formatCompact(p.costOfGoodsSold.amount)}`,
                },
                { label: 'Gross Profit', value: formatCompact(p.grossProfit), emphasis: 'subtotal' },
                {
                    label: 'Operating Expenses',
                    note: formatPct(p.operatingExpenses.pctOfRevenue),
                    value: `-${formatCompact(p.operatingExpenses.amount)}`,
                },
                {
                    label: 'Operating Profit',
                    value: formatCompact(p.operatingProfit),
                    emphasis: 'subtotal',
                },
                {
                    label: 'Other Income',
                    note: formatPct(p.otherIncome.pctOfRevenue),
                    value: formatCompact(p.otherIncome.amount),
                },
                {
                    label: 'Other Expenses',
                    note: formatPct(p.otherExpenses.pctOfRevenue),
                    value: `-${formatCompact(p.otherExpenses.amount)}`,
                },
                { label: 'Net Profit', value: formatCompact(p.netProfit), emphasis: 'success' },
            ];
            return {
                title: 'P&L Summary',
                rows,
                margins: [
                    { label: 'Gross Margin', value: formatPct(p.margins.grossMargin) },
                    { label: 'Operating Margin', value: formatPct(p.margins.operatingMargin) },
                    { label: 'Net Margin', value: formatPct(p.margins.netMargin) },
                    { label: 'Expense Ratio', value: formatPct(p.margins.expenseRatio) },
                ],
            };
        }

        const rows: SummaryRow[] = [
            { label: 'Total Revenue', value: formatRupee(income) },
            { label: 'Total Expenses', value: `-${formatRupee(expense)}` },
            { label: 'Net Profit', value: formatRupee(net), emphasis: 'success' },
        ];
        return {
            title: 'P&L Summary',
            rows,
            margins: [{ label: 'Net Margin', value: `${pctOf(net, income)}%` }],
        };
    }, [summary, income, expense, net]);

    const months = useMemo(() => summary?.monthly ?? [], [summary]);

    const trendMonthly: TrendPoint[] = useMemo(
        () =>
            months.map(m => ({
                label: monthLabel(m.month),
                revenue: toLakhs(m.income),
                expenses: toLakhs(m.expense),
            })),
        [months]
    );

    const trendQuarterly: TrendPoint[] = useMemo(() => {
        const map = new Map<string, TrendPoint>();
        months.forEach(m => {
            const q = fiscalQuarterLabel(m.month);
            const cur = map.get(q) || { label: q, revenue: 0, expenses: 0 };
            cur.revenue += m.income;
            cur.expenses += m.expense;
            map.set(q, cur);
        });
        return [...map.values()].map(v => ({
            label: v.label,
            revenue: toLakhs(v.revenue),
            expenses: toLakhs(v.expenses),
        }));
    }, [months]);

    const expenseSlices: ExpenseSlice[] = useMemo(
        () =>
            (summary?.byCategory.expense ?? []).map((c, i) => ({
                label: c.category,
                value: c.total,
                color: reportColor(i),
                display: formatRupee(c.total),
                pct: `${pctOf(c.total, expense)}%`,
            })),
        [summary, expense]
    );

    const expenseBreakdownData = useMemo(
        () => ({
            title: 'Expense Breakdown',
            centerLabel: 'Total Expenses',
            centerValue: formatCompact(expense),
            slices: expenseSlices,
        }),
        [expense, expenseSlices]
    );

    const revenueCustomers: CustomerRevenue[] = useMemo(
        () =>
            (summary?.topParties.income ?? []).map(p => ({
                name: p.party,
                pct: income > 0 ? Number(((p.total / income) * 100).toFixed(1)) : 0,
                display: formatCompact(p.total),
            })),
        [summary, income]
    );

    const netProfitPoints: NetProfitPoint[] = useMemo(
        () =>
            months.map(m => ({ label: monthLabel(m.month), value: toLakhs(m.income - m.expense) })),
        [months]
    );

    return (
        <Flex vertical gap={24} className="px-2 py-5">
            <PnlHeader
                fy={fy}
                period={period}
                onFyChange={setFy}
                onPeriodChange={setPeriod}
                onCompare={downloadComparison}
                comparing={comparing}
                onExport={exportPdf}
                exporting={exporting}
            />

            <Row gutter={[24, 24]} className="w-full">
                <Col xs={24} xl={15}>
                    <Flex vertical gap={24} className="w-full">
                        <RevenueExpenseTrendCard
                            monthly={trendMonthly}
                            quarterly={trendQuarterly}
                            loading={loading}
                        />
                        <DetailedPnlCard sections={detailedSections} loading={pnlLoading} />
                    </Flex>
                </Col>
                <Col xs={24} xl={9}>
                    <Flex vertical gap={24} className="w-full">
                        <PnlSummaryCard data={pnlData} />
                        <ExpenseBreakdownCard data={expenseBreakdownData} loading={loading} />
                        <RevenueByCustomerCard customers={revenueCustomers} />
                        <NetProfitTrendCard points={netProfitPoints} loading={loading} />
                    </Flex>
                </Col>
            </Row>
        </Flex>
    );
};

export default ProfitLossLanding;
