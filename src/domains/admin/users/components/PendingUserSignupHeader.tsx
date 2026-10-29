import React from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Row, Select } from 'antd';
import { DatePickerProps } from 'antd/lib';
import dayjs from 'dayjs';

import { DownloadType, DropDown } from '@customtypes/general';
import useScreenSize from '@src/hooks/useScreenSize';

import { dateFormat, disabledDate } from '../../accounts/utils/data';
import { PartnerDataType } from '../hooks/usePartnersForCorporate';

type Props = {
    handleSearch: (e: any) => void;
    handleChangeFilters: (e: any) => void;
    categoryDatas: PartnerDataType[] | undefined;
    setSearchText: (e: any) => void;
    searchText: string;
    partnerSelected: string;
    handleDownloadReport: (type: string) => void;
    isDisabled: boolean;
    handleDateChange: (dates: any, dateStrings: [string, string]) => void;
    handleFromChange: DatePickerProps['onChange'];
    handleToChange: DatePickerProps['onChange'];
    handleStatusChange: (val: string) => void;
    statusData: DropDown | undefined;
    from: string;
    to: string;
};

const PendingUserSignupHeader = ({
    searchText,
    categoryDatas,
    setSearchText,
    handleSearch,
    handleChangeFilters,
    handleDownloadReport,
    isDisabled,
    partnerSelected,
    handleFromChange,
    handleDateChange,
    handleToChange,
    handleStatusChange,
    statusData,
    from,
    to,
}: Props) => {
    const { xs } = useScreenSize();
    const formatPartnerSelected = (selectedPartner: string | number) => {
        if (selectedPartner === '') {
            return null;
        }
        const parsedValue = Number(selectedPartner);

        if (!Number.isNaN(parsedValue) && selectedPartner !== 'default') {
            return parsedValue;
        }
        return selectedPartner;
    };
    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex className="flex justify-start gap-3">
                <Button danger onClick={() => handleDownloadReport(DownloadType.Excel)}>
                    Excel
                </Button>
                <Button danger onClick={() => handleDownloadReport(DownloadType.Csv)}>
                    CSV
                </Button>
                <Button danger onClick={() => handleDownloadReport(DownloadType.Pdf)}>
                    PDF
                </Button>
            </Flex>
            <Flex className="flex-col justify-end gap-3 px-0 md:flex-row">
                <Select
                    className="w-full md:w-auto min-w-32"
                    placeholder="Select Status"
                    showSearch
                    onChange={handleStatusChange}
                    options={statusData}
                    defaultValue="PENDING"
                />

                {categoryDatas && (
                    <Select
                        allowClear
                        showSearch
                        options={(categoryDatas || []).map(d => ({
                            value: d.value,
                            label: d.label,
                        }))}
                        placeholder="Select a Partner"
                        loading={categoryDatas.length < 0}
                        className="w-full md:w-auto min-w-52"
                        onChange={handleChangeFilters}
                        value={formatPartnerSelected(partnerSelected)}
                        onSearch={setSearchText}
                        defaultActiveFirstOption={false}
                        filterOption={false}
                        disabled={isDisabled}
                    />
                )}

                <Input
                    value={searchText}
                    placeholder="Search For Corporates"
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    className="w-full md:w-auto min-w-52"
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
                {xs ? (
                    <Flex className="w-full sm:w-fit" justify="space-between" align="center">
                        <DatePicker
                            onChange={handleFromChange}
                            format={dateFormat}
                            defaultValue={dayjs(from, dateFormat)}
                        />
                        <SwapRightOutlined />
                        <DatePicker
                            onChange={handleToChange}
                            format={dateFormat}
                            defaultValue={dayjs(to, dateFormat)}
                        />
                    </Flex>
                ) : (
                    <DatePicker.RangePicker
                        onChange={handleDateChange}
                        format={dateFormat}
                        value={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                        disabledDate={disabledDate}
                        className="w-full md:w-auto"
                    />
                )}
            </Flex>
        </Row>
    );
};
export default PendingUserSignupHeader;
