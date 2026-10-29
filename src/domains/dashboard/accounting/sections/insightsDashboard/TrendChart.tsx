import { useState } from 'react';

import { Button, Flex, Typography } from 'antd';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { dashboardColors, TrendChartData } from '../../utils/insightsDashboardData';

const { Title, Text } = Typography;

const formatTick = (value: number) => (value === 0 ? '₹0' : `₹${value.toFixed(1)}L`);

const TrendChart = ({ data }: { data: TrendChartData }) => {
    const [mode, setMode] = useState<'monthly' | 'quarterly'>('monthly');
    const points = mode === 'quarterly' && data.quarterly ? data.quarterly : data.monthly;
    // Data-driven Y max: cover the largest point and the top tick so values never clip
    // (the previous hard-coded domain assumed a fixed lakh range).
    const maxTick = data.ticks.length ? data.ticks[data.ticks.length - 1] : 0;
    const domainMax = points.reduce((mx, p) => Math.max(mx, p.value), maxTick);

    return (
        <Flex
            vertical
            gap={4}
            className="h-full rounded-2xl border border-borderSubtle bg-white p-4 sm:p-6"
        >
            <Flex gap={12} wrap="wrap" align="flex-start" justify="space-between">
                <Flex vertical gap={2} className="min-w-0">
                    <Title level={5} className="!mb-0 !text-lg !font-semibold !text-ink">
                        {data.title}
                    </Title>
                    <Text className="text-sm text-muted">{data.subtitle}</Text>
                </Flex>
                {data.quarterly && (
                    <Flex align="center" gap={8} className="shrink-0">
                        {(['monthly', 'quarterly'] as const).map(key => {
                            const isActive = mode === key;
                            return (
                                <Button
                                    key={key}
                                    type={isActive ? 'primary' : 'default'}
                                    danger={isActive}
                                    onClick={() => setMode(key)}
                                    className={
                                        isActive ? '!font-medium' : '!font-medium !text-bodyText'
                                    }
                                >
                                    {key === 'monthly' ? 'Monthly' : 'Quarterly'}
                                </Button>
                            );
                        })}
                    </Flex>
                )}
            </Flex>

            <div className="mt-4 w-full">
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid
                            vertical={false}
                            stroke={dashboardColors.grid}
                            strokeDasharray="4 4"
                        />
                        <XAxis
                            dataKey="period"
                            axisLine={false}
                            tickLine={false}
                            dy={6}
                            tick={{ fontSize: 11, fill: dashboardColors.axis }}
                        />
                        <YAxis
                            ticks={data.ticks}
                            domain={[0, domainMax]}
                            axisLine={false}
                            tickLine={false}
                            width={46}
                            tickFormatter={formatTick}
                            tick={{ fontSize: 11, fill: dashboardColors.axis }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={data.color}
                            strokeWidth={2.5}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Flex>
    );
};

export default TrendChart;
