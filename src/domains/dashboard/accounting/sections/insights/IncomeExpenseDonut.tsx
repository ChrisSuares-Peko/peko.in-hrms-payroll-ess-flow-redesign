import { Badge, Flex, Typography } from 'antd';
import { Cell, Pie, PieChart } from 'recharts';

import InsightSection from './InsightSection';

const { Text } = Typography;

interface DonutSegment {
    key: string;
    label: string;
    percent: number;
    color: string;
}
interface IncomeExpenseDonutProps {
    data: { title: string; net: string; segments: DonutSegment[] };
}

const IncomeExpenseDonut = ({ data }: IncomeExpenseDonutProps) => {
    const chart = data.segments.map(seg => ({
        name: seg.label,
        value: seg.percent,
        color: seg.color,
    }));

    return (
        <InsightSection title={data.title}>
            <Flex vertical align="center" gap={14}>
                <div className="relative">
                    <PieChart width={128} height={128}>
                        <Pie
                            data={chart}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={46}
                            outerRadius={62}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={2}
                            stroke="none"
                        >
                            {chart.map(entry => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                    <Flex
                        align="center"
                        justify="center"
                        className="pointer-events-none absolute inset-0"
                    >
                        <Text className="text-base font-semibold text-ink">{data.net}</Text>
                    </Flex>
                </div>
                <Flex align="center" gap={24} wrap="wrap" justify="center">
                    {data.segments.map(seg => (
                        <Badge
                            key={seg.key}
                            color={seg.color}
                            text={
                                <Text className="text-xs text-bodyText">
                                    {seg.label} {seg.percent}%
                                </Text>
                            }
                        />
                    ))}
                </Flex>
            </Flex>
        </InsightSection>
    );
};

export default IncomeExpenseDonut;
