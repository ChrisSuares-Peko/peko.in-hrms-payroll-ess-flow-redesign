import { CalendarOutlined } from '@ant-design/icons';
import { Flex, Select, Typography } from 'antd';

import { getMonthOptions, MONTH_NAMES, SELECT_STYLE } from '../../pages/ims/imsUtils';
import { FINANCIAL_YEARS } from '../../utils/data';

interface Props {
    selectedFY: string;
    selectedMonth: number;
    onFYChange: (fy: string) => void;
    onMonthChange: (month: number) => void;
}

const PeriodBar = ({ selectedFY, selectedMonth, onFYChange, onMonthChange }: Props) => {
    const fyStart = selectedFY ? parseInt(selectedFY.split('-')[0], 10) : new Date().getFullYear();
    const calYear = selectedMonth >= 4 ? fyStart : fyStart + 1;
    const periodLabel = `${MONTH_NAMES[selectedMonth - 1]} ${calYear}`;

    return (
        <Flex
            align="center"
            justify="space-between"
            wrap="wrap"
            gap={8}
            className="bg-white border border-[#cbd5e1] rounded-[14px] px-4 sm:px-6 py-[14px]"
        >
            <Flex gap={10} align="center" wrap="wrap">
                <CalendarOutlined style={{ fontSize: 16, color: '#475569' }} />
                <Typography.Text
                    className="text-xs font-medium whitespace-nowrap"
                    style={{ color: '#475569' }}
                >
                    Period
                </Typography.Text>
                <Flex gap={8} wrap="wrap">
                    <Select
                        value={selectedFY}
                        onChange={onFYChange}
                        options={FINANCIAL_YEARS.map(fy => ({ value: fy, label: `FY ${fy}` }))}
                        style={{ ...SELECT_STYLE, minWidth: 110 }}
                        variant="outlined"
                    />
                    <Select
                        value={selectedMonth}
                        onChange={onMonthChange}
                        options={getMonthOptions()}
                        style={{ ...SELECT_STYLE, minWidth: 120 }}
                        variant="outlined"
                    />
                </Flex>
            </Flex>
            <Typography.Text className="text-xs font-medium" style={{ color: '#475569' }}>
                Showing data for {periodLabel}
            </Typography.Text>
        </Flex>
    );
};

export default PeriodBar;
