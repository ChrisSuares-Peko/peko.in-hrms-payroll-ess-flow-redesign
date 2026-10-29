import { Flex, Typography } from 'antd';

import { Tone, WcMetric } from '../../utils/insightsDashboardData';

const { Text } = Typography;

const TONE: Record<Tone, string> = {
    ink: 'text-ink',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
    muted: 'text-muted',
};

const WorkingCapitalMetric = ({ item }: { item: WcMetric }) => (
    <Flex
        vertical
        gap={2}
        className="h-full rounded-2xl border border-borderSubtle bg-surfaceGray p-5"
    >
        <Text className="text-xs font-medium uppercase tracking-wide text-muted">{item.label}</Text>
        <Flex align="baseline" gap={6}>
            <Text className={`text-2xl font-semibold ${TONE[item.tone]}`}>{item.value}</Text>
            <Text className="text-sm text-muted">{item.unit}</Text>
        </Flex>
        <Text className="text-sm font-medium text-ink">{item.title}</Text>
        <Text className="text-xs text-muted">{item.sub}</Text>
    </Flex>
);

export default WorkingCapitalMetric;
