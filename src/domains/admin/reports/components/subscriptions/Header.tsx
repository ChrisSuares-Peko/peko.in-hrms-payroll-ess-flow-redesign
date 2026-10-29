import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import { DownloadType, DropDown } from '@customtypes/general';
import useScreenSize from '@src/hooks/useScreenSize';

import { AccountInfo } from '../../types/corporates';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    from: string;
    to: string;
    dropDownData: AccountInfo[] | undefined;
    statusData: DropDown | undefined;
    handleChangeFilters: (val: string) => void;
    handleCategoryFilters: (val: string) => void;
    setSearchText: (val: string) => void;
    handleDownloadReport: (type: string) => void;
};
const disabledDate = (current: any) => current && current > dayjs().endOf('day');
const dateFormat = 'YYYY-MM-DD';
const Header = ({
    searchText,
    handleSearch,
    from,
    to,
    handleDateChange,
    dropDownData,
    handleChangeFilters,
    statusData,
    setSearchText,
    handleCategoryFilters,
    handleDownloadReport,
    handleFromChange,
    handleToChange,
}: Props) => {
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
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row sm:w-auto">
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
                        onChange={handleChangeFilters}
                        defaultActiveFirstOption={false}
                        filterOption={false}
                        className="min-w-52"
                        onSearch={setSearchText}
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
                        className="min-w-40"
                        value={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                        disabledDate={disabledDate}
                    />
                )}

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

                <Input
                    value={searchText}
                    placeholder="Search "
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    className="w-fit"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
        </Row>
    );
};
export default Header;
