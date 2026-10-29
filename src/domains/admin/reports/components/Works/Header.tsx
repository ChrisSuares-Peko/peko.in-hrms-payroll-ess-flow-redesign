import { useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, Flex, DatePicker, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import { DownloadType } from '@customtypes/general';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import useScreenSize from '@src/hooks/useScreenSize';

import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    setAdditionalFilters: (v: any) => void;
    additionalFilters: any;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    from: string;
    to: string;
    handleDownloadReport: (type: string) => void;
};
const disabledDate = (current: any) => current && current > dayjs().endOf('day');
const dateFormat = 'YYYY-MM-DD';
const Header = ({
    searchText,
    setAdditionalFilters,
    additionalFilters,
    handleSearch,
    from,
    to,
    handleDateChange,
    handleFromChange,
    handleToChange,
    handleDownloadReport,
}: Props) => {
    const { xs } = useScreenSize();
    const [corporateSearchText, setCorporateSearchText] = useState<string>('');
    const { corporateDatas, loading } = useGetCorporateDatas(corporateSearchText);

    const [partnerSearchText, setPartnerSearchText] = useState('');
    const { partnerData } = usePartnersForCorporate(partnerSearchText);

    const filteredCorporateData = (corporateDatas || []).filter(d => {
        const { partnerId } = additionalFilters;
        if (!partnerId) return true;
        if (partnerId === 'default') {
            return d?.registeredById === null;
        }
        // eslint-disable-next-line eqeqeq
        return d?.registeredById == partnerId;
    });

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
                {partnerData && (
                    <Select
                        allowClear
                        showSearch
                        placeholder="Select Partner"
                        className="min-w-52"
                        options={partnerData}
                        onChange={v => {
                            if (!v) setPartnerSearchText('');
                            setAdditionalFilters((prevState: any) => ({
                                ...prevState,
                                partnerId: v,
                            }));
                        }}
                        filterOption={false}
                        onSearch={v => setPartnerSearchText(v)}
                        defaultActiveFirstOption={false}
                    />
                )}
                {filteredCorporateData && (
                    <Select
                        allowClear
                        showSearch
                        options={(filteredCorporateData || []).map(d => ({
                            value: d.credentialId,
                            label: `${d.name} - ${d.username}`,
                        }))}
                        placeholder="Select Corporate"
                        loading={loading}
                        className="min-w-52"
                        onChange={v => {
                            if (!v) setCorporateSearchText('');
                            setAdditionalFilters((prevState: any) => ({
                                ...prevState,
                                corporateId: v,
                            }));
                        }}
                        onSearch={setCorporateSearchText}
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
                        className="md:w-fit"
                        disabledDate={disabledDate}
                    />
                )}

                <Input
                    value={searchText}
                    placeholder="Search"
                    className="md:w-fit"
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
export default Header;
