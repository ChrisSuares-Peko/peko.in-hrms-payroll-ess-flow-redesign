import { useState } from 'react';

import { Flex, Typography } from 'antd';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import ChartRangeToggle from './ChartRangeToggle';
import ReportCardState from './ReportCardState';
import SectionCard from './SectionCard';
import {
    cardTitles,
    EXPENSE_COLOR,
    REVENUE_COLOR,
    TrendPoint,
    TrendRange,
} from '../../utils/profitLossData';
import { capitalizeFirst, lakhTooltip } from '../../utils/reportFormat';

const { Text } = Typography;

interface RevenueExpenseTrendCardProps {
    monthly: TrendPoint[];
    quarterly: TrendPoint[];
    loading?: boolean;
}

const RevenueExpenseTrendCard = ({ monthly, quarterly, loading }: RevenueExpenseTrendCardProps) => {
    const [range, setRange] = useState<TrendRange>('monthly');
    const data = range === 'monthly' ? monthly : quarterly;

    if (loading || (monthly.length === 0 && quarterly.length === 0)) {
        return (
            <SectionCard title={cardTitles.revenueExpenseTrend}>
                <ReportCardState loading={loading} />
            </SectionCard>
        );
    }

    return (
        <SectionCard
            title={cardTitles.revenueExpenseTrend}
            action={<ChartRangeToggle value={range} onChange={setRange} />}
        >
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F5" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: '#94A3B8' }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={12}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#94A3B8' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={v => `₹${v}L`}
                            width={48}
                        />
                        <Tooltip
                            formatter={(value: number, name: string | number) => [
                                lakhTooltip(value),
                                capitalizeFirst(name),
                            ]}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke={REVENUE_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="expenses"
                            stroke={EXPENSE_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <Flex align="center" justify="center" gap={24} className="w-full">
                <Flex align="center" gap={8}>
                    <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: REVENUE_COLOR }}
                    />
                    <Text className="text-xs text-slate-500">Revenue</Text>
                </Flex>
                <Flex align="center" gap={8}>
                    <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: EXPENSE_COLOR }}
                    />
                    <Text className="text-xs text-slate-500">Expenses</Text>
                </Flex>
            </Flex>
        </SectionCard>
    );
};

export default RevenueExpenseTrendCard;
