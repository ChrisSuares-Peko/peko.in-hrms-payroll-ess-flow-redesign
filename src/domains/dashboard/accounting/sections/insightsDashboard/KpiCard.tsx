import { CaretUpFilled } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { KpiCardItem, Tone } from '../../utils/insightsDashboardData';

const { Text } = Typography;

const TONE: Record<Tone, string> = {
    ink: 'text-ink',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
    muted: 'text-muted',
};

const KpiCard = ({ item }: { item: KpiCardItem }) => (
    <Flex
        vertical
        gap={6}
        className="h-full rounded-2xl border border-borderSubtle bg-white p-5"
    >
        <Text className="text-xs font-medium uppercase tracking-wide text-muted">{item.label}</Text>
        <Text className={`text-xl font-semibold ${TONE[item.valueTone ?? 'ink']}`}>
            {item.value}
        </Text>
        <Text className="text-xs text-muted">{item.sub}</Text>
        {item.tail && (
            <Flex align="center" gap={4}>
                {item.tail.arrow && (
                    <CaretUpFilled className={`text-[10px] ${TONE[item.tail.tone ?? 'muted']}`} />
                )}
                <Text className={`text-xs font-medium ${TONE[item.tail.tone ?? 'muted']}`}>
                    {item.tail.text}
                </Text>
            </Flex>
        )}
    </Flex>
);

export default KpiCard;
