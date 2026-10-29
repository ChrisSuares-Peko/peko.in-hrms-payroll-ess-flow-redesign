import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Input, Row, Flex, Button, Select } from 'antd';
import dayjs from 'dayjs';

import { DownloadType } from '@customtypes/general';

import { PartnerDataType } from '../../hooks/usePartnersForCorporate';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    from: string;
    to: string;
    handleDownloadReport: (type: string) => void;
    categoryDatas: PartnerDataType[] | undefined;
    setSearchText: (e: any) => void;
    onPartnerChange: (partnerId: string | number) => void;
};
const disabledDate = (current: any) => current && current > dayjs().endOf('day');
const dateFormat = 'YYYY-MM-DD';
const Header = ({
    searchText,
    handleSearch,
    from,
    to,
    handleDateChange,
    handleDownloadReport,
    categoryDatas,
    setSearchText,
    onPartnerChange,
}: Props) => {
    const [partnerSelected, setPartnerSelected] = useState<string | number>('');
    const [isDisabled] = useState(false);
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
    const handleChangeFilters = (value: string | number) => {
        setPartnerSelected(value);
        onPartnerChange(value);
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
                        value={formatPartnerSelected(partnerSelected)}
                        onSearch={setSearchText}
                        defaultActiveFirstOption={false}
                        filterOption={false}
                        disabled={isDisabled}
                    />
                )}
                <DatePicker.RangePicker
                    onChange={handleDateChange}
                    format={dateFormat}
                    value={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                    className="w-full"
                    disabledDate={disabledDate}
                />
                <Input
                    value={searchText}
                    placeholder="Search "
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
