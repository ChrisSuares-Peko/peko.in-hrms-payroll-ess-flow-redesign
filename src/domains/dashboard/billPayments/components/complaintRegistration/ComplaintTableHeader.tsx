import React, { useEffect, useState } from 'react';

import { SwapRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Typography } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { removeEmoji } from '@utils/regex';

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
const ComplaintTableHeader = ({
    searchText,
    handleSearch,
    handleDateChange,
    from,
    to,
    handleToChange,
    handleFromChange,
}: modalProps) => {
    const Navigate = useNavigate();
    const { xs } = useScreenSize();
    const [localSearchText, setLocalSearchText] = useState(searchText);
    useEffect(() => {
        if (localSearchText === '') {
            handleSearch({ target: { value: '' } });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localSearchText]);
    return (
        <Flex vertical>
            {/* <Typography.Text className="font-medium text-lg sm:text-xl">
                Complaint Tracking
            </Typography.Text> */}
            <Flex wrap="wrap" justify="space-between" className="" gap={20}>
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
                        value={localSearchText}
                        placeholder="Search"
                        onChange={e => setLocalSearchText(e.target.value.replace(removeEmoji, ''))}
                        allowClear
                        type="text"
                        className="w-full sm:w-[200px] md:w-[300px] lg:w-[300px]"
                        maxLength={100}
                    />
                    <Button
                        className="border-bgOrange2"
                        onClick={() => handleSearch({ target: { value: localSearchText } })}
                    >
                        <Typography.Text className="text-bgOrange2">Search</Typography.Text>
                    </Button>
                </Flex>
                <Button
                    type="primary"
                    size="middle"
                    className="w-full sm:w-auto"
                    onClick={() => Navigate(paths.billPayments.ComplaintRegister)}
                    danger
                >
                    Raise a Complaint
                </Button>
            </Flex>
        </Flex>
    );
};

export default ComplaintTableHeader;
