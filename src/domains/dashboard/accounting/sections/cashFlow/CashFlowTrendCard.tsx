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

import {
    cashFlowTrend,
    CfTrendPoint,
    FINANCING_COLOR,
    INVESTING_COLOR,
    OPERATING_COLOR,
} from '../../utils/cashFlowData';
import { TrendRange } from '../../utils/profitLossData';
import { capitalizeFirst, lakhTooltip } from '../../utils/reportFormat';
import ChartRangeToggle from '../profitLoss/ChartRangeToggle';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface LegendItem {
    label: string;
    color: string;
}

const legendItems: LegendItem[] = [
    { label: 'Operating', color: OPERATING_COLOR },
    { label: 'Investing', color: INVESTING_COLOR },
    { label: 'Financing', color: FINANCING_COLOR },
];

interface CashFlowTrendCardProps {
    monthly: CfTrendPoint[];
    quarterly: CfTrendPoint[];
}

const CashFlowTrendCard = ({ monthly, quarterly }: CashFlowTrendCardProps) => {
    const [range, setRange] = useState<TrendRange>('monthly');
    const data = range === 'monthly' ? monthly : quarterly;

    return (
        <SectionCard
            title={cashFlowTrend.title}
            subtitle={cashFlowTrend.subtitle}
            action={<ChartRangeToggle value={range} onChange={setRange} />}
        >
            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={data}>
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
                            width={44}
                            tickFormatter={v => `₹${v}L`}
                        />
                        <Tooltip
                            formatter={(value: number, name: string | number) => [
                                lakhTooltip(value),
                                capitalizeFirst(name),
                            ]}
                        />
                        <Line
                            dataKey="operating"
                            stroke={OPERATING_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                            type="monotone"
                        />
                        <Line
                            dataKey="investing"
                            stroke={INVESTING_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                            type="monotone"
                        />
                        <Line
                            dataKey="financing"
                            stroke={FINANCING_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                            type="monotone"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <Flex justify="center" align="center" gap={16} wrap="wrap" className="w-full">
                {legendItems.map(item => (
                    <Flex key={item.label} align="center" gap={6} className="min-w-0">
                        <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <Text className="text-xs text-slate-500">{item.label}</Text>
                    </Flex>
                ))}
            </Flex>
        </SectionCard>
    );
};

export default CashFlowTrendCard;
