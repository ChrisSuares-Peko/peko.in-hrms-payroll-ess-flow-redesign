import { WarningFilled } from '@ant-design/icons';
import { Flex, Progress, Typography } from 'antd';

import InsightSection from './InsightSection';
import { insightColors } from '../../utils/insightsData';

const { Text } = Typography;

interface CategorizedHealthProps {
    data: { title: string; percent: number; fraction: string; detail: string; note: string };
}

const CategorizedHealth = ({ data }: CategorizedHealthProps) => (
    <InsightSection title={data.title}>
        <Flex align="center" gap={16}>
            <Progress
                type="circle"
                percent={data.percent}
                size={76}
                strokeColor={insightColors.income}
                trailColor={insightColors.track}
                format={percent => (
                    <span className="text-sm font-semibold text-ink">{percent}%</span>
                )}
            />
            <Flex vertical gap={4} className="min-w-0">
                <Text className="text-lg font-semibold text-ink">{data.fraction}</Text>
                <Text className="text-xs text-muted">{data.detail}</Text>
                {data.note && (
                    <Flex align="center" gap={6} className="text-warning">
                        <WarningFilled className="text-xs" />
                        <Text className="text-xs font-medium text-warning">{data.note}</Text>
                    </Flex>
                )}
            </Flex>
        </Flex>
    </InsightSection>
);

export default CategorizedHealth;
