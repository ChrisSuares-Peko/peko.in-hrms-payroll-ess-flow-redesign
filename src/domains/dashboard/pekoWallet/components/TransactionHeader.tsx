import React from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';

import { DownloadType } from '@customtypes/general';
import useScreenSize from '@src/hooks/useScreenSize';

const { RangePicker } = DatePicker;

const dateFormat = 'YYYY-MM-DD';
const disabledDate = (current: any) => current && current > moment().startOf('day');

type Props = {
    handleSearch?: (e: any) => void;
    handleChangeFilters?: (e: any) => void;
    setSearchText?: (e: any) => void;
    searchText?: string;
    setOpenModal?: (e: any) => void;
    downloadReport: (type: string) => void;
    handleDateChange: any;
    from: any;
    to: any;
    handleFromChange: any;
    handleToChange: any;
};

const TransactionHeader = ({
    searchText,
    setSearchText,
    handleSearch,
    handleChangeFilters,
    setOpenModal,
    downloadReport,
    handleDateChange,
    from,
    to,
    handleFromChange,
    handleToChange,
}: Props) => {
    const { xs } = useScreenSize();
    return (
        <Flex vertical>
            <Typography.Text className="flex-shrink-0 text-lg font-medium sm:text-xl">
                Transactions
            </Typography.Text>
            <Row justify="space-between" className="w-full gap-5 mt-7">
                <Flex className="flex justify-start gap-3">
                    <Button danger onClick={() => downloadReport(DownloadType.Excel)}>
                        Excel
                    </Button>
                    <Button danger onClick={() => downloadReport(DownloadType.Csv)}>
                        CSV
                    </Button>
                    <Button danger onClick={() => downloadReport(DownloadType.Pdf)}>
                        PDF
                    </Button>
                </Flex>
                <Flex gap={7} className="">
                    {!xs ? (
                        <RangePicker
                            onChange={handleDateChange}
                            format={dateFormat}
                            className="w-56 mb-5 sm:mb-auto sm:w-auto"
                            defaultValue={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                            disabledDate={disabledDate}
                            allowClear={false}
                        />
                    ) : (
                        <Flex
                            className="w-full mb-5 sm:mb-auto sm:w-auto"
                            justify="space-between"
                            align="center"
                        >
                            <DatePicker
                                disabledDate={disabledDate}
                                onChange={handleFromChange}
                                format={dateFormat}
                                defaultValue={dayjs(from, dateFormat)}
                            />
                            <SwapRightOutlined />
                            <DatePicker
                                disabledDate={disabledDate}
                                onChange={handleToChange}
                                format={dateFormat}
                                defaultValue={dayjs(to, dateFormat)}
                            />
                        </Flex>
                    )}

                    <Input
                        value={searchText}
                        placeholder="Search "
                        suffix={<SearchOutlined />}
                        onChange={handleSearch}
                        allowClear
                        type="text"
                        variant="outlined"
                        maxLength={100}
                        className="w-72"
                    />
                </Flex>
            </Row>
        </Flex>
    );
};
export default TransactionHeader;
