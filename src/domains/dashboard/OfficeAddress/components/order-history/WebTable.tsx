import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Input, Flex, Typography, DatePicker } from 'antd';
import dayjs from 'dayjs';

import useDebounce from '@src/hooks/useDebounce';

import HistoryTable from './HistoryTable';

const OrderHistory: React.FC = () => {
    const [searchTextInput, setSearchTextInput] = React.useState('');
    const debouncedSearchText = useDebounce(searchTextInput, 500);
    const { RangePicker } = DatePicker;
    const todayFormatted = dayjs().format('YYYY-MM-DD');
    const oneMonthBefore = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
    const [fromDate, setFromDate] = useState<string>(oneMonthBefore);
    const [toDate, setToDate] = useState<string>(todayFormatted);

    const handleDateChange = (
        dates: any,
        dateStrings: [string, string]
    ) => {
        if (dates && dates[0] && dates[1]) {
            setFromDate(dates[0].format('YYYY-MM-DD'));
            setToDate(dates[1].format('YYYY-MM-DD'));
        } else {
            setFromDate(
                new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
            );
            setToDate(new Date().toISOString().substring(0, 10));
        }
    };

    return (
        <Flex vertical gap={10}>
            <Flex justify="space-between" align="center" className=" w-full">
                <Typography.Paragraph className={`text-xl  font-medium `}>
                    Order History
                </Typography.Paragraph>
                <Flex align="center" className="w-[45%]" gap={10}>
                    <RangePicker
                        onChange={(dates, dateStrings) => handleDateChange(dates, dateStrings)}
                        format="YYYY-MM-DD"
                        value={[dayjs(fromDate), dayjs(toDate)]}
                        className="mr-2 w-1/2"
                        disabledDate={current => current && current > dayjs().endOf('day')}
                    />

                    <Input
                        suffix={<SearchOutlined />}
                        allowClear
                        placeholder="Search"
                        className="w-1/2"
                        style={{
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                        }}
                        value={searchTextInput}
                        onChange={e => setSearchTextInput(e.target.value)}
                    />
                </Flex>
            </Flex>
            <HistoryTable searchText={debouncedSearchText} fromDate={fromDate} toDate={toDate} />
        </Flex>
    );
};

export default OrderHistory;
