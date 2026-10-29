import { Badge, Flex } from 'antd';
import { Bar, BarChart, ResponsiveContainer, XAxis } from 'recharts';

import InsightSection from './InsightSection';
import { insightColors } from '../../utils/insightsData';

interface TrendPoint {
    label: string;
    income: number;
    expense: number;
}
interface WeeklyTrendChartProps {
    data: { title: string; points: TrendPoint[] };
}

const WeeklyTrendChart = ({ data }: WeeklyTrendChartProps) => (
    <InsightSection title={data.title}>
        <Flex vertical gap={12}>
            <ResponsiveContainer width="100%" height={96}>
                <BarChart data={data.points} barGap={2} barCategoryGap="30%">
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: insightColors.muted }}
                        dy={4}
                    />
                    <Bar dataKey="expense" fill={insightColors.expense} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="income" fill={insightColors.income} radius={[3, 3, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            <Flex align="center" gap={24}>
                <Badge color={insightColors.expense} text="Expense" />
                <Badge color={insightColors.income} text="Income" />
            </Flex>
        </Flex>
    </InsightSection>
);

export default WeeklyTrendChart;
