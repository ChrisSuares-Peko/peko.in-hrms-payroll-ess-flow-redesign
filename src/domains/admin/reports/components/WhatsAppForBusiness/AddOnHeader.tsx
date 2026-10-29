import React from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Flex, Input, Row, Button, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';

import { DownloadType, DropDown } from '@customtypes/general';
import useScreenSize from '@src/hooks/useScreenSize';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleCategoryFilters: (val: string) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    statusData: DropDown | undefined;
    from: string;
    to: string;
    downloadReport: (type: string) => void;
};
const disabledDate = (current: any) => current && current > dayjs().endOf('day');
const dateFormat = 'YYYY-MM-DD';
const AddOnHeader = ({
    searchText,
    handleSearch,
    from,
    to,
    statusData,
    handleDateChange,
    handleFromChange,
    handleCategoryFilters,
    handleToChange,
    downloadReport,
}: Props) => {
    const { xs } = useScreenSize();
    return (
        <Row justify="space-between" className="w-full gap-5">
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

            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                {statusData && (
                    <Select
                        allowClear
                        showSearch
                        className="min-w-32"
                        options={statusData}
                        placeholder="Select status"
                        loading={statusData.length < 0}
                        onChange={handleCategoryFilters}
                        defaultActiveFirstOption={false}
                        filterOption={false}
                    />
                )}
                {xs ? (
                    <Flex className="w-full sm:w-fit" justify="space-between" align="center">
                        <DatePicker
                            onChange={handleFromChange}
                            format={dateFormat}
                            defaultValue={dayjs(from, dateFormat)}
                            disabledDate={disabledDate}
                        />
                        <SwapRightOutlined />
                        <DatePicker
                            onChange={handleToChange}
                            format={dateFormat}
                            defaultValue={dayjs(to, dateFormat)}
                            disabledDate={disabledDate}
                        />
                    </Flex>
                ) : (
                    <DatePicker.RangePicker
                        onChange={handleDateChange}
                        format={dateFormat}
                        value={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                        className="w-fit"
                        disabledDate={disabledDate}
                    />
                )}
                <Input
                    value={searchText}
                    placeholder="Search"
                    className="w-fit"
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
        </Row>
    );
};

export default AddOnHeader;
