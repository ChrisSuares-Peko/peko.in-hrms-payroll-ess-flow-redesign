import { Flex, Typography } from 'antd';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { dashboardColors, MonthlyBarChartData } from '../../utils/insightsDashboardData';

const { Title, Text } = Typography;

const MonthlyBarChart = ({ data }: { data: MonthlyBarChartData }) => {
    const formatTick = (value: number) => {
        if (data.unit === 'percent') return `${value.toFixed(0)}%`;
        return value === 0 ? '₹0' : `₹${value.toFixed(1)}L`;
    };

    return (
        <Flex
            vertical
            gap={4}
            className="h-full rounded-2xl border border-borderSubtle bg-white p-4 sm:p-6"
        >
            <Title level={5} className="!mb-0 !text-lg !font-semibold !text-ink">
                {data.title}
            </Title>
            <Text className="text-sm text-muted">{data.subtitle}</Text>

            <div className="mt-4 w-full">
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                        data={data.points}
                        barCategoryGap="28%"
                        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                    >
                        <CartesianGrid
                            vertical={false}
                            stroke={dashboardColors.grid}
                            strokeDasharray="4 4"
                        />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            dy={6}
                            tick={{ fontSize: 11, fill: dashboardColors.axis }}
                        />
                        <YAxis
                            ticks={data.ticks}
                            domain={[0, data.ticks[data.ticks.length - 1]]}
                            axisLine={false}
                            tickLine={false}
                            width={42}
                            tickFormatter={formatTick}
                            tick={{ fontSize: 11, fill: dashboardColors.axis }}
                        />
                        <Bar dataKey="value" fill={data.color} radius={[4, 4, 0, 0]} barSize={14} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Flex>
    );
};

export default MonthlyBarChart;
