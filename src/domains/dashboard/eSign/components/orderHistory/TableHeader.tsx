import { type FC } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Typography } from 'antd';
import dayjs from 'dayjs';

import useScreenSize from '@src/hooks/useScreenSize';
import { removeEmoji } from '@utils/regex';

interface TableHeaderProps {
    setSearchText: (v: string) => void;
    searchText?: string;
    from: string;
    to: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
}

const TableHeader: FC<TableHeaderProps> = ({
    setSearchText,
    searchText,
    from,
    to,
    handleDateChange,
    handleFromChange,
    handleToChange,
}) => {
    const { xs } = useScreenSize();
    const dateFormat = 'YYYY-MM-DD';
    return (
        <Flex gap={15} className="mb-4 flex-col sm:flex-row justify-between">
            <Typography.Paragraph className="text-xl font-medium text-nowrap">
                eSign Status
            </Typography.Paragraph>
            <Flex gap={16} className="xs:flex-col sm:flex-row">
                {xs ? (
                    <Flex className="w-full gap-2" justify="space-between" align="center">
                        <DatePicker
                            onChange={handleFromChange}
                            format={dateFormat}
                            defaultValue={dayjs(from, dateFormat)}
                            allowClear={false}
                        />
                        <SwapRightOutlined />
                        <DatePicker
                            onChange={handleToChange}
                            format={dateFormat}
                            defaultValue={dayjs(to, dateFormat)}
                            allowClear={false}
                        />
                    </Flex>
                ) : (
                    <DatePicker.RangePicker
                        onChange={handleDateChange}
                        format={dateFormat}
                        className="xs:w-full min-w-[215px]"
                        defaultValue={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                        disabledDate={current => current && current > dayjs().endOf('day')}
                        allowClear={false}
                    />
                )}
                <Input
                    placeholder="Search for Document"
                    allowClear
                    suffix={<SearchOutlined />}
                    variant="outlined"
                    className="w-auto min-w-[120px] md:min-w-[198px]"
                    value={searchText}
                    onChange={e => {
                        let filteredValue = e.target.value;
                        filteredValue = filteredValue.replace(removeEmoji, '');
                        setSearchText(filteredValue);
                    }}
                />
            </Flex>
        </Flex>
    );
};

export default TableHeader;
