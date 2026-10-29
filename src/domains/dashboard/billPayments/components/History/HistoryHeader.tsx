import React from 'react';

import { SwapRightOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';

import useScreenSize from '@src/hooks/useScreenSize';

const { RangePicker } = DatePicker;
const dateFormat = 'YYYY-MM-DD';
const disabledDate = (current: any) => current && current > moment().startOf('day');

interface modalProps {
    searchText: string;
    handleDateChange: any;
    handleSearch: any;
    from: any;
    to: any;
    handleToChange: any;
    handleFromChange: any;
}
const HistoryHeader = ({
    searchText,
    handleSearch,
    handleDateChange,
    from,
    to,
    handleToChange,
    handleFromChange,
}: modalProps) => {
    const { xs } = useScreenSize();

    return (
        <Flex vertical>
            {/* <Typography.Text className="font-medium text-lg sm:text-xl">
                Complaint Tracking
            </Typography.Text> */}
            <Flex wrap="wrap" justify="end" className="mb-3 sm:mb-5" gap={20}>
                <Flex wrap="wrap" gap="small" justify="space-between">
                    {!xs ? (
                        <RangePicker
                            allowClear={false}
                            onChange={handleDateChange}
                            format={dateFormat}
                            className="w-full mb-5 sm:mb-auto sm:w-auto"
                            defaultValue={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                            disabledDate={disabledDate}
                        />
                    ) : (
                        <Flex
                            className="w-full mb-5 sm:mb-auto sm:w-auto"
                            justify="space-between"
                            align="center"
                        >
                            <DatePicker
                                allowClear={false}
                                disabledDate={disabledDate}
                                onChange={handleFromChange}
                                format={dateFormat}
                                defaultValue={dayjs(from, dateFormat)}
                            />
                            <SwapRightOutlined />
                            <DatePicker
                                allowClear={false}
                                disabledDate={disabledDate}
                                onChange={handleToChange}
                                format={dateFormat}
                                defaultValue={dayjs(to, dateFormat)}
                            />
                        </Flex>
                    )}
                    <Input
                        value={searchText}
                        placeholder="Search"
                        onChange={handleSearch}
                        allowClear
                        type="text"
                        className="w-full sm:w-[200px] md:w-[300px]"
                        // maxLength={100}
                    />
                </Flex>
            </Flex>
        </Flex>
    );
};

export default HistoryHeader;
