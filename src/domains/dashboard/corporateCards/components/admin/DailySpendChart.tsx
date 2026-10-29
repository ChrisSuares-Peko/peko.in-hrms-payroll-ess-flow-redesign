import { Skeleton, Typography } from 'antd';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import spentIcon from '../../assets/icons/spentIcon.svg';
import { DAILY_SPEND_CHART_COLOR, formatAmountAsK } from '../../utils/data';
import { DailySpendPoint } from '../../utils/types';
import SectionCard from '../common/SectionCard';

const { Text } = Typography;

interface DailySpendChartProps {
    data: DailySpendPoint[];
    total: string;
    /** Summary data is still loading — show a placeholder instead of the "no data" empty state. */
    loading?: boolean;
}

const hasData = (data: DailySpendPoint[]) => data.some(d => d.value > 0);

/** Admin "Daily Spend" panel — responsive recharts bar chart of last-30-days card spend. */
const DailySpendChart = ({ data, total, loading }: DailySpendChartProps) => {
    const action = (
        <span className="rounded-full bg-savingsTagLightBg px-3 py-1 text-xs font-medium text-savingsTagLightText">
            {total} this month
        </span>
    );

    if (loading) {
        return (
            <SectionCard
                title="Daily Spend"
                subtitle="Last 30 days · card transactions"
                action={action}
            >
                <Skeleton active paragraph={{ rows: 6 }} />
            </SectionCard>
        );
    }

    return (
        <SectionCard
            title="Daily Spend"
            subtitle="Last 30 days · card transactions"
            action={action}
        >
            {hasData(data) ? (
                <div className="h-60 w-full xl:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#F0F2F5"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11, fill: '#94A3B8' }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                                minTickGap={16}
                            />
                            <YAxis
                                tickFormatter={formatAmountAsK}
                                tick={{ fontSize: 11, fill: '#94A3B8' }}
                                axisLine={false}
                                tickLine={false}
                                width={48}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,79,79,0.06)' }}
                                formatter={(value: number) => [formatAmountAsK(value), 'Spend']}
                                contentStyle={{
                                    borderRadius: 12,
                                    border: '1px solid #E6EAF0',
                                    fontSize: 12,
                                }}
                            />
                            <Bar
                                dataKey="value"
                                fill={DAILY_SPEND_CHART_COLOR}
                                radius={[4, 4, 0, 0]}
                                maxBarSize={18}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-listBg">
                        <img src={spentIcon} alt="" className="h-7 w-7" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Text className="text-base font-bold text-textHeadings">
                            No data available
                        </Text>
                        <Text className="max-w-[220px] text-sm text-textBody">
                            No data available for daily spends
                        </Text>
                    </div>
                </div>
            )}
        </SectionCard>
    );
};

export default DailySpendChart;
