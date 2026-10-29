import React, { memo, useEffect, useMemo, useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Col, Row, Button, Input, DatePicker, Flex, Select } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';

import { DownloadType } from '@customtypes/general';
import useDebounce from '@src/hooks/useDebounce';
import useScreenSize from '@src/hooks/useScreenSize';

// import { filterOption } from '../types/index';
import { filterOption } from '../types/index';
import { filterOptions } from '../utils/data';

type Props = {
    isLoading: boolean;
    subscription: filterOption[];
    handleChangeFilters: (selectedOption: string) => void;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    handleDownloadReport: (type: string, isCashbackTable?: boolean) => void;
    from: string;
    to: string;
    searchText: string;
    handleSearch: (searchKey: string) => void; // Fixed type
    text: string;
    initialFrom: string;
    initialTo: string;
    isCashbackTable?: boolean;
    hasData: boolean;
};
const dateFormat = 'YYYY-MM-DD';
const disabledDate = (current: any) => current && current > moment().startOf('day');
const { RangePicker } = DatePicker;

const SubscriptionHeader = ({
    isLoading,
    subscription,
    handleChangeFilters,
    handleDateChange,
    from,
    to,
    searchText,
    handleSearch,
    handleFromChange,
    handleToChange,
    handleDownloadReport,
    text,
    initialFrom,
    initialTo,
    isCashbackTable = false,
    hasData,
}: Props) => {
    const { md } = useScreenSize();
    const [searchKey, setSearchKey] = useState<string>(searchText);
    const debouncedSearchKey = useDebounce(searchKey, 500);
    const [downloadLoadingType, setDownloadLoadingType] = useState<string | null>(null);

    useEffect(() => {
        if (debouncedSearchKey !== searchText) {
            handleSearch(debouncedSearchKey);
        }
    }, [debouncedSearchKey, searchText, handleSearch]);
    const removeEmojis = (str: any) =>
        str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = removeEmojis(e.target.value);
        setSearchKey(value);
    };

    const fromDate = useMemo(() => dayjs(from, dateFormat), [from]);
    const toDate = useMemo(() => dayjs(to, dateFormat), [to]);
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} md={12} xl={6}>
                <Flex gap={20} className="xl:justify-end">
                    <Button
                        danger
                        disabled={!hasData}
                        loading={downloadLoadingType === DownloadType.Excel}
                        onClick={async () => {
                            setDownloadLoadingType(DownloadType.Excel);
                            await handleDownloadReport(DownloadType.Excel, isCashbackTable);
                            setDownloadLoadingType(null);
                        }}
                    >
                        Excel
                    </Button>

                    <Button
                        danger
                        disabled={!hasData}
                        loading={downloadLoadingType === DownloadType.Csv}
                        onClick={async () => {
                            setDownloadLoadingType(DownloadType.Csv);
                            await handleDownloadReport(DownloadType.Csv, isCashbackTable);
                            setDownloadLoadingType(null);
                        }}
                    >
                        CSV
                    </Button>

                    <Button
                        danger
                        disabled={!hasData}
                        loading={downloadLoadingType === DownloadType.Pdf}
                        onClick={async () => {
                            setDownloadLoadingType(DownloadType.Pdf);
                            await handleDownloadReport(DownloadType.Pdf, isCashbackTable);
                            setDownloadLoadingType(null);
                        }}
                    >
                        PDF
                    </Button>
                </Flex>
            </Col>

            <Col xs={24} md={12} xl={6}>
                <Select
                    loading={isLoading}
                    defaultValue={filterOptions[0].value}
                    options={subscription}
                    className="w-full"
                    onChange={handleChangeFilters}
                    popupMatchSelectWidth={false} // Avoid dropdown affecting layout width
                />
            </Col>

            <Col xs={24} md={12} xl={7}>
                {md ? (
                    <RangePicker
                        disabledDate={disabledDate}
                        onChange={handleDateChange}
                        format={dateFormat}
                        value={[fromDate, toDate]}
                        className="w-full"
                    />
                ) : (
                    <Flex className="w-full" justify="space-between" align="center">
                        <DatePicker
                            className="w-full"
                            disabledDate={disabledDate}
                            onChange={handleFromChange}
                            format={dateFormat}
                            value={fromDate}
                        />
                        <SwapRightOutlined />
                        <DatePicker
                            className="w-full"
                            minDate={dayjs(from, dateFormat)}
                            disabledDate={disabledDate}
                            onChange={handleToChange}
                            format={dateFormat}
                            value={toDate}
                        />
                    </Flex>
                )}
            </Col>

            <Col xs={24} md={12} xl={5}>
                <Input
                    value={searchKey}
                    placeholder="Search"
                    suffix={<SearchOutlined />}
                    onChange={handleSearchChange}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Col>
        </Row>
    );
};

export default memo(SubscriptionHeader);
