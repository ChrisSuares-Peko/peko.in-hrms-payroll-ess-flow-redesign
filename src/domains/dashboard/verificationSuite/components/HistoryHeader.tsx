import React, { useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Select, Typography } from 'antd';
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

    handleDateChange?: any;
    from: any;
    to: any;
    handleFromChange?: any;
    handleToChange?: any;
    handleDownloadReport: (type: string) => void;
};

const HistoryHeader = ({
    searchText,
    setSearchText,
    handleSearch,
    handleChangeFilters,
    setOpenModal,
    handleDownloadReport,
    handleDateChange,
    from,
    to,
    handleFromChange,
    handleToChange,
}: Props) => {
    const { xs } = useScreenSize();
    const [downloadLoadingType, setDownloadLoadingType] = useState<string | null>(null);
    const filterOptions = [
        { label: 'All', value: 'ALL' },
        { label: 'Valid', value: 'VALID' },
        { label: 'Invalid', value: 'INVALID' },
    ];
    return (
        <Flex vertical>
            <Typography.Text className="flex-shrink-0 text-lg font-medium sm:text-xl">
                Verification History
            </Typography.Text>
            <Flex className="flex-col xl:flex-row justify-between mt-10 gap-5">
                {/* Left side: Buttons */}
                <Flex className="gap-3 flex-wrap">
                    {/* <Button danger onClick={() => handleDownloadReport(DownloadType.Excel)}>
      Excel
    </Button>
    <Button danger onClick={() => handleDownloadReport(DownloadType.Csv)}>
      CSV
    </Button>
    <Button danger onClick={() => handleDownloadReport(DownloadType.Pdf)}>
      PDF
    </Button> */}
                    <Button
                        danger
                        loading={downloadLoadingType === DownloadType.Excel}
                        disabled={
                            downloadLoadingType !== null &&
                            downloadLoadingType !== DownloadType.Excel
                        }
                        onClick={async () => {
                            setDownloadLoadingType(DownloadType.Excel);
                            await handleDownloadReport(DownloadType.Excel);
                            setDownloadLoadingType(null);
                        }}
                    >
                        Excel
                    </Button>

                    <Button
                        danger
                        loading={downloadLoadingType === DownloadType.Csv}
                        disabled={
                            downloadLoadingType !== null && downloadLoadingType !== DownloadType.Csv
                        }
                        onClick={async () => {
                            setDownloadLoadingType(DownloadType.Csv);
                            await handleDownloadReport(DownloadType.Csv);
                            setDownloadLoadingType(null);
                        }}
                    >
                        CSV
                    </Button>

                    <Button
                        danger
                        loading={downloadLoadingType === DownloadType.Pdf}
                        disabled={
                            downloadLoadingType !== null && downloadLoadingType !== DownloadType.Pdf
                        }
                        onClick={async () => {
                            setDownloadLoadingType(DownloadType.Pdf);
                            await handleDownloadReport(DownloadType.Pdf);
                            setDownloadLoadingType(null);
                        }}
                    >
                        PDF
                    </Button>
                </Flex>

                {/* Right side: Filters */}
                <Flex className="flex-col md:flex-row gap-2 md:items-center w-full md:w-auto">
                    <Select
                        placeholder="Status"
                        defaultValue="ALL"
                        options={filterOptions}
                        className="w-full md:w-44"
                        onChange={handleChangeFilters}
                        popupMatchSelectWidth={false}
                    />

                    {!xs ? (
                        <RangePicker
                            onChange={handleDateChange}
                            format={dateFormat}
                            className="w-full md:w-80  xl:w-56"
                            defaultValue={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                            disabledDate={disabledDate}
                            allowClear
                        />
                    ) : (
                        <Flex className="w-full justify-between items-center">
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
                        placeholder="Search"
                        suffix={<SearchOutlined />}
                        onChange={handleSearch}
                        allowClear
                        type="text"
                        variant="outlined"
                        maxLength={100}
                        className="w-full md:w-64 xl:w-72"
                    />
                </Flex>
            </Flex>
        </Flex>
    );
};
export default HistoryHeader;
