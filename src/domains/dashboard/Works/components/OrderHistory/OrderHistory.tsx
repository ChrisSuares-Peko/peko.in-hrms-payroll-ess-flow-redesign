// OrderHistory.tsx
import React, { useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
// eslint-disable-next-line import/order
import { Input, Flex, Typography, DatePicker, Row } from 'antd';

// Update the path accordingly

import dayjs from 'dayjs';

import useDebounce from '@src/hooks/useDebounce';
import useScreenSize from '@src/hooks/useScreenSize';
import { removeEmoji } from '@utils/regex';

import HistoryTable from './HistoryTable';
import HistoryTableMobile from './HistoryTableMobile';

const OrderHistory: React.FC = () => {
    const { RangePicker } = DatePicker;
    const today = dayjs();
    const dateFormat = 'YYYY-MM-DD';
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthBefore = today.subtract(1, 'month'); // Subtract 1 month
    const oneMonthBeforeFormatted = oneMonthBefore.format('YYYY-MM-DD');
    const screen = useScreenSize();
    const [searchText, setSearchText] = React.useState<string>('');
    const [fromDate, setFromDate] = useState<string>(oneMonthBeforeFormatted);
    const [toDate, setToDate] = useState<string>(todayFormatted);
    const debouncedSearchText = useDebounce(searchText, 500);
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let filteredValue = e.target.value;
        filteredValue = filteredValue.replace(removeEmoji, '');
        setSearchText(filteredValue);
    };

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

    const handleFromChange = (date: dayjs.Dayjs | null) => {
        if (date) {
            setFromDate(date.format(dateFormat));
        }
    };

    const handleToChange = (date: dayjs.Dayjs | null) => {
        if (date) {
            setToDate(date.format(dateFormat));
        }
    };

    const disabledDate = (current: any): boolean =>
        // Can not select days after today
        current && current > dayjs().endOf('day');

    return (
        <Flex vertical gap={0}>
            <Row justify="space-between" className="" gutter={[10, 10]}>
                <Typography.Paragraph className="text-xl font-medium whitespace-nowrap">
                    Order History
                </Typography.Paragraph>
                <Flex
                    align="center"
                    gap={10}
                    vertical={!screen.md}
                    className={`${!screen.md && 'w-full'}`}
                >
                    {screen.md ? (
                        <RangePicker
                            onChange={handleDateChange}
                            format="YYYY-MM-DD"
                            value={[dayjs(fromDate), dayjs(toDate)]}
                            className="mr-2"
                            disabledDate={disabledDate}
                            allowClear={false}
                        />
                    ) : (
                        <Flex justify="space-between" className="" style={{ width: 'calc(100%)' }}>
                            <DatePicker
                                onChange={handleFromChange}
                                format={dateFormat}
                                defaultValue={dayjs(fromDate, dateFormat)}
                                disabledDate={disabledDate}
                                allowClear={false}
                            />
                            <SwapRightOutlined />
                            <DatePicker
                                onChange={handleToChange}
                                format={dateFormat}
                                defaultValue={dayjs(toDate, dateFormat)}
                                disabledDate={disabledDate}
                                allowClear={false}
                            />
                        </Flex>
                    )}
                    <Flex align="center" className={`${!screen.md && 'w-full'}`}>
                        <Input
                            placeholder="Search"
                            allowClear
                            suffix={<SearchOutlined />}
                            variant="outlined"
                            value={searchText}
                            onChange={handleSearchChange}
                        />
                        {/* <Button
                            icon={<SearchOutlined />}
                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                            onClick={() => setSearchText(searchTextInput)}
                        /> */}
                    </Flex>
                </Flex>
            </Row>
            {screen.xs ? (
                <HistoryTableMobile
                    searchText={debouncedSearchText}
                    fromDate={fromDate}
                    toDate={toDate}
                />
            ) : (
                <HistoryTable
                    searchText={debouncedSearchText}
                    fromDate={fromDate}
                    toDate={toDate}
                />
            )}
        </Flex>
    );
};

export default OrderHistory;
