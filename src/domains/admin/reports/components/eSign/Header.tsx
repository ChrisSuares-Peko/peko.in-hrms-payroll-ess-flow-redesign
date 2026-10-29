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
    from: string;
    to: string;
    dropDownData: AccountInfo[] | undefined;
    handleChangeFilters: (val: string) => void;
    setSearchText: (val: string) => void;
    handleDownloadReport: (type: string) => void;
};
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
                        defaultValue={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                        className="w-full"
                    />
                )}

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
