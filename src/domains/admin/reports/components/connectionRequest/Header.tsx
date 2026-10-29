import React from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import { DownloadType } from '@customtypes/general';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import useScreenSize from '@src/hooks/useScreenSize';

import { AccountInfo } from '../../types/corporates';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDownloadReport: (type: string) => void;
    corporateData: AccountInfo[] | undefined;
    setSearchText: (val: string) => void;
    handleChangeFilters: (val: string) => void;
    handlePartnerChange: (val: string) => void;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    from: string;
    to: string;
};
const dateFormat = 'YYYY-MM-DD';
const disabledDate = (current: any) => current && current > dayjs().endOf('day');
const Header = ({
    searchText,
    handleSearch,
    handleDownloadReport,
    corporateData,
    setSearchText,
    handleChangeFilters,
    handlePartnerChange,
    handleDateChange,
    handleFromChange,
    handleToChange,
    from,
    to,
}: Props) => {
    const { xs } = useScreenSize();
    const { partnerData } = usePartnersForCorporate('');
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
                {corporateData && (
                    <Select
                        allowClear
                        showSearch
                        options={(corporateData || []).map(d => ({
                            value: d.credentialId,
                            label: `${d.name} - ${d.username}`,
                        }))}
                        placeholder="Select a Corporate"
                        loading={corporateData.length < 0}
                        className="w-full min-w-52"
                        onChange={value => handleChangeFilters(value)}
                        onSearch={setSearchText}
                        defaultActiveFirstOption={false}
                        filterOption={false}
                    />
                )}
                <Select
                    placeholder="Select Partner"
                    className="min-w-52"
                    options={partnerData}
                    allowClear
                    onChange={value => handlePartnerChange(value)}
                />
                <Input
                    value={searchText}
                    placeholder="Search "
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    className="w-full"
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
        </Row>
    );
};
export default Header;
