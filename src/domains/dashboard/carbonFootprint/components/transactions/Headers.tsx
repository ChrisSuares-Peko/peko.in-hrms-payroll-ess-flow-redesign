import React from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Col, Row, Input, DatePicker, Flex } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';

import useScreenSize from '@src/hooks/useScreenSize';

type Props = {
    isLoading: boolean;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    from: string;
    to: string;
    searchText: string;
    handleSearch: (e: any) => void;
};
const dateFormat = 'YYYY-MM-DD';
const disabledDate = (current: any) => current && current > moment().startOf('day');
const { RangePicker } = DatePicker;
const Headers = ({
    isLoading,
    handleDateChange,
    from,
    to,
    searchText,
    handleSearch,
    handleFromChange,
    handleToChange,
}: Props) => {
    const { md } = useScreenSize();
    return (
        <Row gutter={[20, 20]} justify="end">
            <Col xs={24} sm={12} md={10}>
                {md ? (
                    <RangePicker
                        disabledDate={disabledDate}
                        onChange={handleDateChange}
                        format={dateFormat}
                        defaultValue={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                        className="w-full"
                    />
                ) : (
                    <Flex className="w-full" justify="space-between" align="center">
                        <DatePicker
                            disabledDate={disabledDate}
                            onChange={handleFromChange}
                            format={dateFormat}
                            defaultValue={dayjs(from, dateFormat)}
                        />
                        <SwapRightOutlined />
                        <DatePicker
                            minDate={dayjs(from, dateFormat)}
                            disabledDate={disabledDate}
                            onChange={handleToChange}
                            format={dateFormat}
                            defaultValue={dayjs(to, dateFormat)}
                        />
                    </Flex>
                )}
            </Col>
            <Col xs={24} sm={12} md={8}>
                <Input
                    value={searchText}
                    placeholder="Search "
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    maxLength={100}
                    variant="outlined"
                />
            </Col>
        </Row>
    );
};

export default Headers;
