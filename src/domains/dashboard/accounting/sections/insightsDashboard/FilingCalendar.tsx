import { Flex, Tag, Typography } from 'antd';

import { FilingCalendarData, FilingStatus } from '../../utils/insightsDashboardData';

const { Title, Text } = Typography;

const STATUS: Record<FilingStatus, { label: string; className: string }> = {
    due: { label: 'Due', className: '!border-warning !bg-warning-surface !text-warning' },
    filed: { label: 'Filed', className: '!border-success !bg-success-surface !text-success' },
    overdue: { label: 'Overdue', className: '!border-danger !bg-danger-surface !text-danger' },
};

const FilingCalendar = ({ data }: { data: FilingCalendarData }) => (
    <Flex
        vertical
        gap={4}
        className="h-full rounded-2xl border border-borderSubtle bg-white p-4 sm:p-6"
    >
        <Title level={5} className="!mb-0 !text-lg !font-semibold !text-ink">
            {data.title}
        </Title>
        <Text className="text-sm text-muted">{data.subtitle}</Text>

        <Flex vertical className="mt-2 max-h-[300px] overflow-y-auto pr-1">
            {data.items.length === 0 && (
                <Text className="py-3 text-sm text-muted">No returns to show</Text>
            )}
            {data.items.map(item => (
                <Flex
                    key={item.key}
                    align="center"
                    justify="space-between"
                    gap={12}
                    className="border-b border-borderSubtle py-3 last:border-b-0"
                >
                    <Flex vertical gap={2} className="min-w-0">
                        <Text className="text-sm font-medium text-ink">{item.title}</Text>
                        <Text className="text-xs text-muted">{item.subtitle}</Text>
                    </Flex>
                    <Tag className={`!m-0 shrink-0 !rounded-full ${STATUS[item.status].className}`}>
                        {STATUS[item.status].label}
                    </Tag>
                </Flex>
            ))}
        </Flex>
    </Flex>
);

export default FilingCalendar;
