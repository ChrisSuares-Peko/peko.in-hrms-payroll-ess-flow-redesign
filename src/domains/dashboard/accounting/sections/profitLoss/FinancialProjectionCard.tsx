import { useState } from 'react';

import { Flex, Typography } from 'antd';
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceArea,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import ChartRangeToggle from './ChartRangeToggle';
import SectionCard from './SectionCard';
import {
    cardTitles,
    EXPENSE_COLOR,
    projectionData,
    projectionForecastStart,
    projectionForecastStartQuarterly,
    projectionQuarterly,
    projectionSubtitle,
    REVENUE_COLOR,
    TrendRange,
} from '../../utils/profitLossData';
import { capitalizeFirst, lakhTooltip } from '../../utils/reportFormat';

const { Text } = Typography;

const FinancialProjectionCard = () => {
    const [range, setRange] = useState<TrendRange>('monthly');

    const data = range === 'monthly' ? projectionData : projectionQuarterly;
    const forecastStart =
        range === 'monthly' ? projectionForecastStart : projectionForecastStartQuarterly;
    const forecastEnd = data[data.length - 1].label;

    return (
        <SectionCard
            title={cardTitles.projection}
            subtitle={projectionSubtitle}
            action={<ChartRangeToggle value={range} onChange={setRange} />}
        >
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F5" />
                        <ReferenceArea
                            x1={forecastStart}
                            x2={forecastEnd}
                            fill="#EEF2FF"
                            fillOpacity={0.6}
                        />
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
                                typeof value === 'number' && Number.isFinite(value)
                                    ? lakhTooltip(value)
                                    : value,
                                capitalizeFirst(name),
                            ]}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenueActual"
                            name="Revenue"
                            stroke={REVENUE_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                            connectNulls
                        />
                        <Line
                            type="monotone"
                            dataKey="expensesActual"
                            name="Expenses"
                            stroke={EXPENSE_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                            connectNulls
                        />
                        <Line
                            type="monotone"
                            dataKey="revenueForecast"
                            name="Revenue (Forecast)"
                            stroke={REVENUE_COLOR}
                            strokeDasharray="5 5"
                            strokeWidth={2.5}
                            dot={false}
                            connectNulls
                        />
                        <Line
                            type="monotone"
                            dataKey="expensesForecast"
                            name="Expenses (Forecast)"
                            stroke={EXPENSE_COLOR}
                            strokeDasharray="5 5"
                            strokeWidth={2.5}
                            dot={false}
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <Flex gap={16} align="center" justify="center" className="w-full">
                <Flex gap={6} align="center">
                    <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: REVENUE_COLOR }}
                    />
                    <Text className="text-xs text-slate-500">Revenue</Text>
                </Flex>
                <Flex gap={6} align="center">
                    <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: EXPENSE_COLOR }}
                    />
                    <Text className="text-xs text-slate-500">Expenses</Text>
                </Flex>
                <Flex gap={6} align="center">
                    <span className="inline-block w-5 border-t-2 border-dashed border-slate-400" />
                    <Text className="text-xs text-slate-500">Forecast</Text>
                </Flex>
            </Flex>
        </SectionCard>
    );
};

export default FinancialProjectionCard;
