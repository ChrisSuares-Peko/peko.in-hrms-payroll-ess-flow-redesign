import React, { useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Input, Flex, Typography, Grid, DatePicker } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';

import HistoryTable from './HistoryTable';
import useFilter from '../../hooks/useFilter';
import { filterState } from '../../types/orderHistory';

const OrderHistory: React.FC = () => {
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthBefore = today.subtract(1, 'month'); // Subtract 1 month
    const oneMonthBeforeFormatted = oneMonthBefore.format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        from: oneMonthBeforeFormatted,
        to: todayFormatted,
    };
    const dateFormat = 'YYYY-MM-DD';
    const [filter, setFilter] = useState<filterState>(initialValues);
    const disabledDate = (current: any) => current && current > moment().startOf('day');
    const { handleSearch, handlePageChange, handleDateChange, handleFromChange, handleToChange } =
        useFilter({
            setFilter,
            initalStartDate: initialValues.from,
            initalEndDate: initialValues.to,
        });

    return (
        <Flex vertical gap={10}>
            {screens.xs ? (
                <>
                    <Typography.Paragraph className="w-full py-5 text-lg font-medium">
                        Order History
                    </Typography.Paragraph>
                    <Flex justify="space-between" className="mb-2">
                        <DatePicker
                            onChange={handleFromChange}
                            format={dateFormat}
                            defaultValue={dayjs(filter.from, dateFormat)}
                            disabledDate={disabledDate}
                        />
                        <SwapRightOutlined />
                        <DatePicker
                            onChange={handleToChange}
                            format={dateFormat}
                            defaultValue={dayjs(filter.to, dateFormat)}
                            disabledDate={disabledDate}
                        />
                    </Flex>
                    <Flex align="center" className="mb-3">
                        <Input
                            placeholder="Search"
                            value={filter.searchText}
                            onChange={handleSearch}
                            suffix={<SearchOutlined />}
                        />
                    </Flex>
                </>
            ) : (
                <Flex justify="space-between" align="center">
                    <Typography.Paragraph className="text-lg font-medium">
                        Order History
                    </Typography.Paragraph>
                    <Flex align="center">
                        <DatePicker.RangePicker
                            onChange={handleDateChange}
                            format="YYYY-MM-DD"
                            value={[dayjs(filter.from, dateFormat), dayjs(filter.to, dateFormat)]}
                            className="mr-3"
                            disabledDate={current => current && current > dayjs().endOf('day')}
                        />
                        <Input
                            placeholder="Search"
                            allowClear
                            suffix={<SearchOutlined />}
                            variant="outlined"
                            style={{ width: 230 }}
                            value={filter.searchText}
                            onChange={handleSearch}
                        />
                    </Flex>
                </Flex>
            )}
            <HistoryTable filters={filter} handlePageChange={handlePageChange} />
        </Flex>
    );
};

export default OrderHistory;
