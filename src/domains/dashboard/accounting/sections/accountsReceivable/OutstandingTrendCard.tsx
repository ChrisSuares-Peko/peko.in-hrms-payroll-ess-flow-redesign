import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { outstandingTrendTitle, TrendPoint, TREND_COLOR } from '../../utils/accountsReceivableData';
import { capitalizeFirst, lakhTooltip } from '../../utils/reportFormat';
import SectionCard from '../profitLoss/SectionCard';

interface OutstandingTrendCardProps {
    trend: TrendPoint[];
}

const OutstandingTrendCard = ({ trend }: OutstandingTrendCardProps) => (
    <SectionCard title={outstandingTrendTitle}>
        <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trend}>
                    <defs>
                        <linearGradient id="arTrendGradient" x1={0} y1={0} x2={0} y2={1}>
                            <stop offset="5%" stopColor={TREND_COLOR} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={TREND_COLOR} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F5" />
                    <XAxis
                        dataKey="month"
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
                        fill="url(#arTrendGradient)"
                        dot={{ r: 3, fill: TREND_COLOR, strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </SectionCard>
);

export default OutstandingTrendCard;
