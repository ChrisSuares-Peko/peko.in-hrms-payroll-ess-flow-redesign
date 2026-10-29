import { Flex, Typography } from 'antd';
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

import { BarLineChartData, dashboardColors } from '../../utils/insightsDashboardData';

const { Title, Text } = Typography;

const formatTick = (value: number) => (value === 0 ? '₹0' : `₹${value.toFixed(1)}L`);

interface AxisTickProps {
    x: number;
    y: number;
    payload: { value: string | number };
}

const BarLineChart = ({ data }: { data: BarLineChartData }) => {
    const barSize = data.points.length > 6 ? 11 : 22;

    const renderTwoLineTick = ({ x, y, payload }: AxisTickProps) => {
        const point = data.points.find(p => p[data.xKey] === payload.value);
        const sub = data.xSubKey && point ? point[data.xSubKey] : undefined;
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={14}
                    textAnchor="middle"
                    fontSize={11}
                    fill={dashboardColors.axis}
                >
                    {payload.value}
                </text>
                {sub && (
                    <text
                        x={0}
                        y={0}
                        dy={28}
                        textAnchor="middle"
                        fontSize={10}
                        fill={dashboardColors.axis}
                    >
                        {sub}
                    </text>
                )}
            </g>
        );
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
                <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart
                        data={data.points}
                        barGap={3}
                        barCategoryGap="22%"
                        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                    >
                        <CartesianGrid
                            vertical={false}
                            stroke={dashboardColors.grid}
                            strokeDasharray="4 4"
                        />
                        <XAxis
                            dataKey={data.xKey}
                            axisLine={false}
                            tickLine={false}
                            dy={data.xSubKey ? 0 : 6}
                            height={data.xSubKey ? 42 : 30}
                            tick={
                                data.xSubKey
                                    ? renderTwoLineTick
                                    : { fontSize: 11, fill: dashboardColors.axis }
                            }
                        />
                        <YAxis
                            ticks={data.ticks}
                            domain={[0, data.ticks[data.ticks.length - 1]]}
                            axisLine={false}
                            tickLine={false}
                            width={46}
                            tickFormatter={formatTick}
                            tick={{ fontSize: 11, fill: dashboardColors.axis }}
                        />
                        {data.bars.map(bar => (
                            <Bar
                                key={bar.dataKey}
                                dataKey={bar.dataKey}
                                fill={bar.color}
                                radius={[3, 3, 0, 0]}
                                barSize={barSize}
                            />
                        ))}
                        <Line
                            type="monotone"
                            dataKey={data.line.dataKey}
                            stroke={data.line.color}
                            strokeWidth={2}
                            dot={{ r: 3, fill: data.line.color, strokeWidth: 0 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Flex>
    );
};

export default BarLineChart;
