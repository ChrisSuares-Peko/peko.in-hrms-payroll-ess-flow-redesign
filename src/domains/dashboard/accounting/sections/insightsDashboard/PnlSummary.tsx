import { Divider, Flex, Typography } from 'antd';

import { PnlRow, PnlSummaryData } from '../../utils/insightsDashboardData';

const { Title, Text } = Typography;

const valueTone = (tone: PnlRow['tone']) => (tone === 'success' ? 'text-success' : 'text-danger');

const PnlSummary = ({ data }: { data: PnlSummaryData }) => (
    <Flex
        vertical
        gap={4}
        className="h-full rounded-2xl border border-borderSubtle bg-white p-4 sm:p-6"
    >
        <Title level={5} className="!mb-0 !text-lg !font-semibold !text-ink">
            {data.title}
        </Title>
        <Text className="text-sm text-muted">{data.subtitle}</Text>

        <Flex vertical gap={14} className="mt-4">
            {data.rows.map(row => (
                <Flex key={row.label} align="center" justify="space-between" gap={12}>
                    <Text className="text-sm text-bodyText">{row.label}</Text>
                    <Text className={`text-sm font-medium ${valueTone(row.tone)}`}>
                        {row.value}
                    </Text>
                </Flex>
            ))}

            <Divider className="!my-1 !border-borderSubtle" />

            <Flex align="center" justify="space-between" gap={12}>
                <Text className="text-base font-semibold text-ink">{data.total.label}</Text>
                <Text className={`text-base font-semibold ${valueTone(data.total.tone)}`}>
                    {data.total.value}
                </Text>
            </Flex>

            {data.footer && (
                <>
                    <Divider className="!my-1 !border-borderSubtle" />
                    <Flex align="center" justify="space-between" gap={12}>
                        <Text className="text-sm text-bodyText">{data.footer.label}</Text>
                        <Text className="text-sm font-semibold text-ink">{data.footer.value}</Text>
                    </Flex>
                </>
            )}
        </Flex>
    </Flex>
);

export default PnlSummary;
