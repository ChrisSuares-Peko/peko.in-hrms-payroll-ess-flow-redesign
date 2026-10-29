import { UploadOutlined } from '@ant-design/icons';
import { Button, Flex, Select, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { insightsPage } from '../../utils/insightsDashboardData';
import { FY_OPTIONS } from '../../utils/reportFilters';

const { Title, Text } = Typography;

// Last 10 financial years as string labels ("FY 2025-26"), matching the redux filter value.
const fyOptions = FY_OPTIONS.map(o => ({ value: o.label, label: o.label }));

interface InsightsPageHeaderProps {
    activeFy: string;
    onFyChange: (fy: string) => void;
    onExport?: () => void;
}

const InsightsPageHeader = ({ activeFy, onFyChange, onExport }: InsightsPageHeaderProps) => {
    const user = useAppSelector(state => state.reducer.user.user);

    const companyName = user?.companyName?.trim();
    const subtitle = [companyName, activeFy].filter(Boolean).join(' · ');

    return (
        <Flex
            gap={16}
            wrap="wrap"
            align="flex-start"
            justify="space-between"
            className="flex-col md:flex-row md:items-center"
        >
            <Flex vertical gap={4} className="min-w-0">
                <Title level={3} className="!mb-0 !text-xl !font-semibold !text-ink md:!text-2xl">
                    {insightsPage.title}
                </Title>
                <Text className="text-sm text-muted md:text-base">{subtitle}</Text>
            </Flex>

            <Flex align="center" gap={12} wrap="wrap" className="shrink-0">
                <Select
                    value={activeFy}
                    onChange={onFyChange}
                    options={fyOptions}
                    className="h-10 w-full sm:w-auto sm:min-w-[10rem] [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-borderStrong"
                />
                <Button
                    size="large"
                    icon={<UploadOutlined />}
                    onClick={onExport}
                    className="!text-bodyText"
                >
                    {insightsPage.exportLabel}
                </Button>
            </Flex>
        </Flex>
    );
};

export default InsightsPageHeader;
