import { useState } from 'react';

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { expenseTrendTitle, TREND_COLOR, TrendPoint } from '../../utils/expenseStatementData';
import { capitalizeFirst, lakhTooltip } from '../../utils/reportFormat';
import ChartRangeToggle from '../profitLoss/ChartRangeToggle';
import ReportCardState from '../profitLoss/ReportCardState';
import SectionCard from '../profitLoss/SectionCard';

type Range = 'monthly' | 'quarterly';

interface ExpenseTrendCardProps {
    monthly: TrendPoint[];
    quarterly: TrendPoint[];
    title?: string;
    loading?: boolean;
}

const ExpenseTrendCard = ({
    monthly,
    quarterly,
    title = expenseTrendTitle,
    loading,
}: ExpenseTrendCardProps) => {
    const [range, setRange] = useState<Range>('monthly');

    const data: TrendPoint[] = range === 'monthly' ? monthly : quarterly;

    if (loading || (monthly.length === 0 && quarterly.length === 0)) {
        return (
            <SectionCard title={title}>
                <ReportCardState loading={loading} />
            </SectionCard>
        );
    }

    return (
        <SectionCard title={title} action={<ChartRangeToggle value={range} onChange={setRange} />}>
            <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="expenseTrendGradient" x1={0} y1={0} x2={0} y2={1}>
                                <stop offset="5%" stopColor={TREND_COLOR} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={TREND_COLOR} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F5" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: '#94A3B8' }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={8}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#94A3B8' }}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                            tickFormatter={(v: number) => `₹${v}L`}
                        />
                        <Tooltip
                            formatter={(value: number, name: string | number) => [
                                lakhTooltip(value),
                                capitalizeFirst(name),
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={TREND_COLOR}
                            strokeWidth={2.5}
                            fill="url(#expenseTrendGradient)"
                            dot={{ r: 3, fill: TREND_COLOR, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </SectionCard>
    );
};

export default ExpenseTrendCard;
