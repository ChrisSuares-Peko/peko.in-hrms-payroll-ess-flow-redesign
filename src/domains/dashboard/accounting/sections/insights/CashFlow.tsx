import { Flex, Typography } from 'antd';
import { Bar, BarChart, Cell, ResponsiveContainer } from 'recharts';

import InsightSection from './InsightSection';
import { CashFlowBar, insightColors } from '../../utils/insightsData';

const { Text } = Typography;

interface CashFlowProps {
    data: { title: string; status: string; detail: string; bars: CashFlowBar[] };
}

const CashFlow = ({ data }: CashFlowProps) => (
    <InsightSection title={data.title}>
        <Flex
            vertical
            gap={12}
            className="rounded-xl border border-success-border bg-success-surface p-4"
        >
            <Flex vertical>
                <Text className="text-sm font-semibold text-success">{data.status}</Text>
                <Text className="text-xs text-muted">{data.detail}</Text>
            </Flex>
            <ResponsiveContainer width="100%" height={48}>
                <BarChart data={data.bars} barCategoryGap="28%">
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {data.bars.map((bar, index) => (
                            <Cell
                                key={index}
                                fill={bar.positive ? insightColors.income : insightColors.expense}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Flex>
    </InsightSection>
);

export default CashFlow;
