import { Flex, Progress, Tag, Typography } from 'antd';

import { insightColors } from '../../utils/insightsData';

const { Text } = Typography;

interface StatBarProps {
    label: string;
    value: string;

    percent: number;

    badge?: string;

    sublabel?: string;
    strokeColor?: string;
}

const StatBar = ({
    label,
    value,
    percent,
    badge,
    sublabel,
    strokeColor = insightColors.expense,
}: StatBarProps) => (
    <Flex vertical gap={2}>
        <Flex align="center" justify="space-between" gap={8}>
            <Flex align="center" gap={6} className="min-w-0">
                <Text className="truncate text-sm text-bodyText">{label}</Text>
                {badge && (
                    <Tag className="!m-0 shrink-0 !rounded-md !border-0 !bg-surfaceGray !px-1.5 !py-0 !text-[11px] !font-medium !text-muted">
                        {badge}
                    </Tag>
                )}
            </Flex>
            <Text className="shrink-0 text-sm font-semibold text-ink">{value}</Text>
        </Flex>
        <Progress
            percent={percent}
            showInfo={false}
            strokeColor={strokeColor}
            trailColor={insightColors.track}
            strokeWidth={6}
            className="!mb-0"
        />
        {sublabel && <Text className="text-xs text-muted">{sublabel}</Text>}
    </Flex>
);

export default StatBar;
