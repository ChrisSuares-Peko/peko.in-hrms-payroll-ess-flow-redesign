import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Row } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

type Props = {
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    searchText: string;
    from?: string;
    to?: string;
    handleDateChange: (dates: any, dateStrings: [string, string]) => void;
};

const PayoutOnboardingHeader = ({
    searchText,
    handleSearch,
    from,
    to,
    handleDateChange,
}: Props) => (
    <Row justify="end" className="w-full gap-5">
        <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
            <RangePicker
                value={from && to ? [dayjs(from), dayjs(to)] : undefined}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                allowClear
            />
            <Input
                value={searchText}
                placeholder="Search by corporate name or PAN"
                suffix={<SearchOutlined />}
                onChange={handleSearch}
                allowClear
                maxLength={100}
                className="md:w-72"
            />
        </Flex>
    </Row>
);

export default PayoutOnboardingHeader;
