import { Button, Flex, Typography } from 'antd';

import InsightSection from './InsightSection';
import { Vendor } from '../../utils/insightsData';

const { Text } = Typography;

interface RecurringExpensesProps {
    data: {
        title: string;
        monthly: string;
        monthlyNote: string;
        items: Vendor[];
        moreLabel: string;
    };
}

const RecurringExpenses = ({ data }: RecurringExpensesProps) => (
    <InsightSection title={data.title}>
        <Flex
            vertical
            gap={12}
            className="rounded-xl border border-borderSubtle bg-surfaceGray p-4"
        >
            <Flex vertical>
                <Text className="text-base font-semibold text-ink">{data.monthly}</Text>
                <Text className="text-xs text-muted">{data.monthlyNote}</Text>
            </Flex>
            <Flex vertical gap={8}>
                {data.items.map(item => (
                    <Flex key={item.id} align="center" justify="space-between" gap={8}>
                        <Text className="truncate text-sm text-bodyText">{item.name}</Text>
                        <Text className="shrink-0 text-sm font-medium text-ink">{item.value}</Text>
                    </Flex>
                ))}
            </Flex>
            {data.moreLabel && (
                <Button
                    type="link"
                    className="!h-auto !justify-start !p-0 !text-xs !font-medium !text-danger hover:!opacity-80"
                >
                    {data.moreLabel}
                </Button>
            )}
        </Flex>
    </InsightSection>
);

export default RecurringExpenses;
