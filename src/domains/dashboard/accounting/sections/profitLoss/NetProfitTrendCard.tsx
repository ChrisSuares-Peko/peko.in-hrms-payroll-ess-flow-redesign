import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import ReportCardState from './ReportCardState';
import SectionCard from './SectionCard';
import { cardTitles, NetProfitPoint, NET_PROFIT_COLOR } from '../../utils/profitLossData';
import { capitalizeFirst, lakhTooltip } from '../../utils/reportFormat';

interface NetProfitTrendCardProps {
    points: NetProfitPoint[];
    loading?: boolean;
}

const NetProfitTrendCard = ({ points, loading }: NetProfitTrendCardProps) => {
    if (loading || points.length === 0) {
        return (
            <SectionCard title={cardTitles.netProfitTrend}>
                <ReportCardState loading={loading} />
            </SectionCard>
        );
    }

    return (
        <SectionCard title={cardTitles.netProfitTrend}>
            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={points}>
                        <defs>
                            <linearGradient id="pnlNetProfitGradient" x1={0} y1={0} x2={0} y2={1}>
                                <stop offset="5%" stopColor={NET_PROFIT_COLOR} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={NET_PROFIT_COLOR} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F5" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10, fill: '#94A3B8' }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={8}
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
                        <Area
                            type="monotone"
                            dataKey="value"
                            name="Net Profit"
                            stroke={NET_PROFIT_COLOR}
                            strokeWidth={2.5}
                            fill="url(#pnlNetProfitGradient)"
                            dot={{ r: 3, fill: NET_PROFIT_COLOR, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </SectionCard>
    );
};

export default NetProfitTrendCard;
