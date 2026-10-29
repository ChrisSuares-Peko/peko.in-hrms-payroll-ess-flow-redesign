import { Flex, Typography } from 'antd';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { dashboardColors, ProfitTrendData } from '../../utils/insightsDashboardData';

const { Title, Text } = Typography;

const formatTick = (value: number) => (value === 0 ? '₹0' : `₹${value.toFixed(1)}L`);

const ProfitTrendChart = ({ data }: { data: ProfitTrendData }) => {
    // Data-driven Y max so real values never clip (was a fixed lakh range).
    const maxTick = data.ticks.length ? data.ticks[data.ticks.length - 1] : 0;
    const domainMax = data.points.reduce((mx, p) => Math.max(mx, p.gross, p.net), maxTick);

    return (
        <Flex
            vertical
            gap={4}
            className="rounded-2xl border border-borderSubtle bg-white p-4 sm:p-6"
        >
            <Flex gap={12} wrap="wrap" align="flex-start" justify="space-between">
                <Flex vertical gap={2} className="min-w-0">
                    <Title level={5} className="!mb-0 !text-lg !font-semibold !text-ink">
                        {data.title}
                    </Title>
                    <Text className="text-sm text-muted">{data.subtitle}</Text>
                </Flex>
                <Flex align="center" gap={16} className="shrink-0">
                    <Flex align="center" gap={6}>
                        <span className="h-1 w-6 rounded-full bg-success" />
                        {/* "gross" series carries Revenue — true gross profit needs a COGS split. */}
                        <Text className="text-xs text-bodyText">Revenue</Text>
                    </Flex>
                    <Flex align="center" gap={6}>
                        <span className="h-1 w-6 rounded-full bg-danger" />
                        <Text className="text-xs text-bodyText">Net profit</Text>
                    </Flex>
                </Flex>
            </Flex>

            <div className="mt-4 w-full">
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                        data={data.points}
                        margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
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
                            domain={[0, domainMax]}
                            axisLine={false}
                            tickLine={false}
                            width={46}
                            tickFormatter={formatTick}
                            tick={{ fontSize: 11, fill: dashboardColors.axis }}
                        />
                        <Line
                            type="monotone"
                            dataKey="gross"
                            stroke={dashboardColors.revenueGrowth}
                            strokeWidth={2.5}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="net"
                            stroke={dashboardColors.profitMargin}
                            strokeWidth={2.5}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Flex>
    );
};

export default ProfitTrendChart;
