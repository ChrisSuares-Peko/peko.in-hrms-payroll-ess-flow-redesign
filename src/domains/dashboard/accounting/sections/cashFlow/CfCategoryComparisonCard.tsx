import { Col, Flex, Row, Typography } from 'antd';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { categoryComparison, CfCategory } from '../../utils/cashFlowData';
import { capitalizeFirst, lakhTooltip } from '../../utils/reportFormat';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface CfCategoryComparisonCardProps {
    items: CfCategory[];
}

const CfCategoryComparisonCard = ({ items }: CfCategoryComparisonCardProps) => (
    <SectionCard title={categoryComparison.title} subtitle={categoryComparison.subtitle}>
        <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height={220}>
                <BarChart layout="vertical" data={items} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF1F5" />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `₹${v}L`}
                    />
                    <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fontSize: 12, fill: '#475569' }}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                    />
                    <Tooltip
                        formatter={(value: number, name: string | number) => [
                            lakhTooltip(value),
                            capitalizeFirst(name),
                        ]}
                    />
                    <ReferenceLine x={0} stroke="#CBD5E1" />
                    <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={22}>
                        {items.map(i => (
                            <Cell key={i.label} fill={i.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
        <Row gutter={[12, 12]}>
            {items.map(i => (
                <Col xs={8} key={i.label}>
                    <Flex vertical align="center" gap={1} className="min-w-0">
                        <Text className="text-xs text-slate-400 break-words">{i.label}</Text>
                        <Text
                            className="text-sm font-semibold whitespace-nowrap"
                            style={{ color: i.color }}
                        >
                            {i.display}
                        </Text>
                    </Flex>
                </Col>
            ))}
        </Row>
    </SectionCard>
);

export default CfCategoryComparisonCard;
