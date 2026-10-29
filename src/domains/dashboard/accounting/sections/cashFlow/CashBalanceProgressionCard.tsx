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

import { balanceProgression, CfBalancePoint } from '../../utils/cashFlowData';
import { capitalizeFirst, lakhTooltip } from '../../utils/reportFormat';
import ChartRangeToggle from '../profitLoss/ChartRangeToggle';
import SectionCard from '../profitLoss/SectionCard';

type Range = 'monthly' | 'quarterly';

interface CashBalanceProgressionCardProps {
    monthly: CfBalancePoint[];
    quarterly: CfBalancePoint[];
}

const CashBalanceProgressionCard = ({ monthly, quarterly }: CashBalanceProgressionCardProps) => {
    const [range, setRange] = useState<Range>('monthly');

    const data: CfBalancePoint[] = range === 'monthly' ? monthly : quarterly;

    return (
        <SectionCard
            title={balanceProgression.title}
            subtitle={balanceProgression.subtitle}
            action={<ChartRangeToggle value={range} onChange={setRange} />}
        >
            <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="cfBalanceGradient" x1={0} y1={0} x2={0} y2={1}>
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
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
                            dataKey="balance"
                            stroke="#3B82F6"
                            strokeWidth={2.5}
                            fill="url(#cfBalanceGradient)"
                            dot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </SectionCard>
    );
};

export default CashBalanceProgressionCard;
