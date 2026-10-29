import { Flex, Typography } from 'antd';

import InsightSection from './InsightSection';
import { SummaryRow } from '../../utils/insightsData';

const { Text } = Typography;

const TONE: Record<SummaryRow['tone'], { row: string; text: string }> = {
    success: { row: 'bg-success-surface', text: 'text-success' },
    danger: { row: 'bg-danger-surface', text: 'text-danger' },
};

interface MonthSummaryProps {
    data: { title: string; rows: SummaryRow[] };
}

const MonthSummary = ({ data }: MonthSummaryProps) => (
    <InsightSection title={data.title}>
        <Flex vertical gap={8}>
            {data.rows.map(row => (
                <Flex
                    key={row.label}
                    align="center"
                    justify="space-between"
                    className={`rounded-xl px-3 py-2.5 ${TONE[row.tone].row}`}
                >
                    <Text className={`text-sm ${TONE[row.tone].text}`}>{row.label}</Text>
                    <Text className={`text-sm font-semibold ${TONE[row.tone].text}`}>
                        {row.value}
                    </Text>
                </Flex>
            ))}
        </Flex>
    </InsightSection>
);

export default MonthSummary;
