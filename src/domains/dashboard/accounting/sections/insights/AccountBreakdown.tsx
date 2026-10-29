import { Flex, Progress, Typography } from 'antd';

import InsightSection from './InsightSection';
import { AccountStat, insightColors } from '../../utils/insightsData';

const { Text } = Typography;

interface AccountBreakdownProps {
    data: { title: string; items: AccountStat[] };
}

const AccountBreakdown = ({ data }: AccountBreakdownProps) => (
    <InsightSection title={data.title}>
        <Flex vertical gap={16}>
            {data.items.map(account => (
                <Flex key={account.id} vertical gap={6}>
                    <Flex align="center" justify="space-between" gap={8}>
                        <Text className="text-sm font-medium text-ink">{account.name}</Text>
                        <Text className="text-xs text-muted">{account.inPercent}% in</Text>
                    </Flex>
                    <Progress
                        percent={account.inPercent}
                        showInfo={false}
                        strokeColor={insightColors.income}
                        trailColor={insightColors.dangerTrail}
                        strokeWidth={8}
                        className="!mb-0"
                    />
                    <Flex align="center" justify="space-between" gap={8}>
                        <Text className="text-xs font-medium text-success">{account.inValue}</Text>
                        <Text className="text-xs font-medium text-danger">{account.outValue}</Text>
                    </Flex>
                </Flex>
            ))}
        </Flex>
    </InsightSection>
);

export default AccountBreakdown;
