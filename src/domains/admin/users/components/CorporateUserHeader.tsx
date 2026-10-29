import React from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import { DownloadType } from '@customtypes/general';
import useScreenSize from '@src/hooks/useScreenSize';

import { PartnerDataType } from '../hooks/usePartnersForCorporate';

type Props = {
    handleSearch: (e: any) => void;
    handleChangeFilters: (e: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    handleDateChange: (dates: any, dateStrings: any) => void;
    categoryDatas: PartnerDataType[] | undefined;
    setSearchText: (e: any) => void;
    searchText: string;
    partnerSelected: string;
    from: string;
    to: string;
    handleDownloadReport: (type: string) => void;
    setAddCorporateModalOpen?: (val: boolean) => void;
    isDisabled: boolean;
    accessPermission: any;
};
const dateFormat = 'YYYY-MM-DD';
const disabledDate = (current: any) => current && current > dayjs().endOf('day');
const CorporateUserHeader = ({
    searchText,
    categoryDatas,
    setSearchText,
    handleSearch,
    handleChangeFilters,
    handleDownloadReport,
    handleFromChange,
    handleToChange,
    handleDateChange,
    isDisabled,
    partnerSelected,
    from,
    to,
    setAddCorporateModalOpen,
    accessPermission,
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
                {accessPermission && accessPermission.write && setAddCorporateModalOpen && (
                    <Button
                        danger
                        type="primary"
                        onClick={() => {
                            setAddCorporateModalOpen(true);
                        }}
                    >
                        Create New Corporate
                    </Button>
                )}
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
                {xs ? (
                    <Flex className="w-full sm:w-fit" justify="space-between" align="center">
                        <DatePicker
                            className="w-full"
                            onChange={handleFromChange}
                            format={dateFormat}
                            defaultValue={dayjs(from, dateFormat)}
                            disabledDate={disabledDate}
                        />
                        <SwapRightOutlined />
                        <DatePicker
                            className="w-full"
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
                        className="w-full"
                        disabledDate={disabledDate}
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
            </Flex>
        </Row>
    );
};
export default CorporateUserHeader;
