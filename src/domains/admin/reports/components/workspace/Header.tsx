import React, { useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, Flex, DatePicker, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import { DownloadType } from '@customtypes/general';
import useScreenSize from '@src/hooks/useScreenSize';

import { PartnerDataType } from '../../hooks/usePartnersForCorporate';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    handleChangeFilters: (e: any) => void;
    from: string;
    to: string;
    handleDownloadReport: (type: string) => void;
    categoryDatas: PartnerDataType[] | undefined;
    setPartnerSearchText: (e: any) => void;
};
const disabledDate = (current: any) => current && current > dayjs().endOf('day');
const dateFormat = 'YYYY-MM-DD';
const Header = ({
    searchText,
    handleSearch,
    handleDateChange,
    handleFromChange,
    handleToChange,
    from,
    to,
    handleDownloadReport,
    categoryDatas,
    setPartnerSearchText,
    handleChangeFilters,
}: Props) => {
    const [partnerSelected] = useState<string | number>('');
    const [isDisabled] = useState(false);
    const formatPartnerSelected = (selectedPartner: string | number | undefined) => {
        if (selectedPartner === '') {
            return null;
        }
        const parsedValue = Number(selectedPartner);

        if (!Number.isNaN(parsedValue) && selectedPartner !== 'default') {
            return parsedValue;
        }
        return selectedPartner;
    };

    const { xs } = useScreenSize();
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
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
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
                        value={formatPartnerSelected(partnerSelected || undefined)}
                        onSearch={setPartnerSearchText}
                        defaultActiveFirstOption={false}
                        filterOption={false}
                        disabled={isDisabled}
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
                    placeholder="Search "
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    className="w-fit"
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
        </Row>
    );
};
export default Header;
