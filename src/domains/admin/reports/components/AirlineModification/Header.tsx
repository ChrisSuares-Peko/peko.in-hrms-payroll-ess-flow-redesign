import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, Flex, DatePicker, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import { DownloadType } from '@customtypes/general';
import useScreenSize from '@src/hooks/useScreenSize';

import { AccountInfo } from '../../types/corporates';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    from: string | undefined;
    to: string | undefined;
    dropDownData: AccountInfo[] | undefined;
    handleChangeFilters: (val: string) => void;
    setSearchText: (val: string) => void;
    handleDownloadReport: (type: string) => void;
    partnerDropDownData?: any[];
    handlePartnerChange: (val?: string) => void;
};
const disabledDate = (current: any) => current && current > dayjs().endOf('day');
const dateFormat = 'YYYY-MM-DD';
const Header = ({
    searchText,
    handleSearch,
    from,
    to,
    handleDateChange,
    handleFromChange,
    handleToChange,
    dropDownData,
    setSearchText,
    handleChangeFilters,
    handleDownloadReport,
    partnerDropDownData,
    handlePartnerChange,
}: Props) => {
    const { xs } = useScreenSize();
    const defaultFrom = from ? dayjs(from, dateFormat) : undefined;
    const defaultTo = from ? dayjs(to, dateFormat) : undefined;
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
                {dropDownData && (
                    <Select
                        allowClear
                        showSearch
                        options={(dropDownData || []).map(d => ({
                            value: d.credentialId,
                            label: `${d.name} - ${d.username}`,
                        }))}
                        placeholder="Select a Corporate"
                        loading={dropDownData.length < 0}
                        className="w-full min-w-52"
                        onChange={handleChangeFilters}
                        defaultActiveFirstOption={false}
                        filterOption={false}
                        onSearch={setSearchText}
                    />
                )}
                {partnerDropDownData && (
                    <Select
                        allowClear
                        showSearch
                        options={(partnerDropDownData || []).map(p => ({
                            value: p.value,
                            label: p.label,
                        }))}
                        placeholder="Select a Partner"
                        className="w-full md:w-auto min-w-52"
                        onChange={handlePartnerChange}
                        onSearch={setSearchText}
                        filterOption={false}
                    />
                )}

                {xs ? (
                    <Flex className="w-full sm:w-fit" justify="space-between" align="center">
                        <DatePicker
                            onChange={handleFromChange}
                            format={dateFormat}
                            defaultValue={defaultFrom}
                            disabledDate={disabledDate}
                        />
                        <SwapRightOutlined />
                        <DatePicker
                            onChange={handleToChange}
                            format={dateFormat}
                            defaultValue={defaultTo}
                            disabledDate={disabledDate}
                        />
                    </Flex>
                ) : (
                    <DatePicker.RangePicker
                        onChange={handleDateChange}
                        format={dateFormat}
                        value={[defaultFrom, defaultTo]}
                        className="w-full"
                        disabledDate={disabledDate}
                    />
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
                />
            </Flex>
        </Row>
    );
};
export default Header;
