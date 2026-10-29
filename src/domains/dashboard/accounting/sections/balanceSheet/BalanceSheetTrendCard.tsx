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
    ASSET_COLOR,
    balanceSheetTrend,
    BsTrendPoint,
    EQUITY_COLOR,
    LIABILITY_COLOR,
} from '../../utils/balanceSheetData';
import { capitalizeFirst, lakhTooltip } from '../../utils/reportFormat';
import ChartRangeToggle from '../profitLoss/ChartRangeToggle';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

const legendItems: { label: string; color: string }[] = [
    { label: 'Assets', color: ASSET_COLOR },
    { label: 'Liabilities', color: LIABILITY_COLOR },
    { label: 'Equity', color: EQUITY_COLOR },
];

interface BalanceSheetTrendCardProps {
    monthly: BsTrendPoint[];
    quarterly: BsTrendPoint[];
}

const BalanceSheetTrendCard = ({ monthly, quarterly }: BalanceSheetTrendCardProps) => {
    const [range, setRange] = useState<'monthly' | 'quarterly'>('monthly');
    const data = range === 'monthly' ? monthly : quarterly;

    return (
        <SectionCard
            title={balanceSheetTrend.title}
            subtitle={balanceSheetTrend.subtitle}
            action={<ChartRangeToggle value={range} onChange={setRange} />}
        >
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
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
                            dataKey="assets"
                            stroke={ASSET_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="liabilities"
                            stroke={LIABILITY_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="equity"
                            stroke={EQUITY_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <Flex align="center" justify="center" gap={24} className="w-full flex-wrap">
                {legendItems.map(item => (
                    <Flex key={item.label} align="center" gap={8}>
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <Text className="text-xs text-slate-500">{item.label}</Text>
                    </Flex>
                ))}
            </Flex>
        </SectionCard>
    );
};

export default BalanceSheetTrendCard;
