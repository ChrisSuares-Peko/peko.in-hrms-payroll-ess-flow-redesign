import { Flex, Typography } from 'antd';

import InsightSection from './InsightSection';
import { AttentionItem, AttentionTone } from '../../utils/insightsData';

const { Text } = Typography;

const TONE: Record<AttentionTone, { card: string; title: string }> = {
    warning: { card: 'border-warning-border bg-warning-surface', title: 'text-warning' },
    danger: { card: 'border-danger-border bg-danger-surface', title: 'text-danger' },
    neutral: { card: 'border-borderSubtle bg-surfaceGray', title: 'text-ink' },
};

interface AttentionRequiredProps {
    data: { title: string; items: AttentionItem[] };
}

const AttentionRequired = ({ data }: AttentionRequiredProps) => (
    <InsightSection title={data.title}>
        <Flex vertical gap={10}>
            {data.items.map(item => (
                <Flex
                    key={item.id}
                    vertical
                    gap={2}
                    className={`rounded-xl border px-4 py-3 ${TONE[item.tone].card}`}
                >
                    <Text className={`text-sm font-semibold ${TONE[item.tone].title}`}>
                        {item.title}
                    </Text>
                    <Text className="text-xs text-muted">{item.subtitle}</Text>
                </Flex>
            ))}
        </Flex>
    </InsightSection>
);

export default AttentionRequired;
