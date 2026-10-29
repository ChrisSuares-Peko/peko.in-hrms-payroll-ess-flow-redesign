import { Button, Flex, Select, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import { useAppSelector } from '@src/hooks/store';

import exportIcon from '../../assets/export.svg';
import { expenseStatementHeader } from '../../utils/expenseStatementData';
import { FULL_YEAR, FY_OPTIONS, MONTH_PERIOD_OPTIONS, fyLabel } from '../../utils/reportFilters';

const { Title, Text } = Typography;

interface ExpenseHeaderProps {
    fy: number;
    period: string;
    onFyChange: (fy: number) => void;
    onPeriodChange: (period: string) => void;
    onExport?: () => void;
    exporting?: boolean;
}

const ExpenseHeader = ({
    fy,
    period,
    onFyChange,
    onPeriodChange,
    onExport,
    exporting,
}: ExpenseHeaderProps) => {
    const user = useAppSelector(state => state.reducer.user.user);

    const companyName = user?.companyName?.trim();
    const periodLabel =
        period === FULL_YEAR
            ? 'Full year'
            : MONTH_PERIOD_OPTIONS.find(o => o.value === period)?.label;
    const subtitle = [companyName, `${periodLabel} — ${fyLabel(fy)}`].filter(Boolean).join(' · ');

    return (
        <Flex gap={16} className="w-full flex-col xl:flex-row xl:items-start xl:justify-between">
            <Flex vertical gap={6} className="min-w-0">
                <Title level={3} className="!mb-0 !text-xl !font-semibold !text-ink md:!text-xl">
                    {expenseStatementHeader.title}
                </Title>
                <Text className="text-sm text-slate-400 md:text-base">{subtitle}</Text>
            </Flex>

            <Flex gap={12} className="flex-wrap items-center">
                <Select
                    value={fy}
                    onChange={onFyChange}
                    options={FY_OPTIONS}
                    className="h-11 w-full sm:w-auto sm:min-w-[10rem] [&_.ant-select-selector]:!h-11 [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-borderStrong"
                />

                <Select
                    value={period}
                    onChange={onPeriodChange}
                    options={MONTH_PERIOD_OPTIONS}
                    className="h-11 w-full sm:w-auto sm:min-w-[12rem] [&_.ant-select-selector]:!h-11 [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-borderStrong"
                />

                <Button
                    onClick={onExport}
                    loading={exporting}
                    icon={<ReactSVG src={exportIcon} className="inline-flex [&_svg]:size-5" />}
                    className="h-11 !border-borderStrong !text-bodyText"
                >
                    {expenseStatementHeader.exportLabel}
                </Button>
            </Flex>
        </Flex>
    );
};

export default ExpenseHeader;
