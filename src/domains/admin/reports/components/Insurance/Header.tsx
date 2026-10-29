import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import { DownloadType } from '@customtypes/general';
import useScreenSize from '@src/hooks/useScreenSize';

import { AccountInfo } from '../../types/corporates';

export type ExcelCsvtype = {
    searchText: string;
    sort: string;
    sortField: string;
    type: string;
};
type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    from: string;
    to: string;
    corporateData: AccountInfo[] | undefined;
    setSearchText: (val: string) => void;
    handleChangeFilters: (val: string) => void;
    handleDownloadReport: (type: string) => void;
};
const dateFormat = 'YYYY-MM-DD';
const Header = ({
    searchText,
    handleSearch,
    from,
    to,
    handleDateChange,
    corporateData,
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
            {/* <Col className="w-full sm:w-fit">
            {corporateData && (
                <Select
                    allowClear
                    showSearch
                    options={(corporateData || []).map(d => ({
                        value: d.credentialId,
                        label: d.name,
                    }))}
                    placeholder="Select a Corporate user"
                    loading={corporateData.length < 0}
                    className="w-full"
                    onChange={handleChangeFilters}
                    onSearch={setSearchText}
                    defaultActiveFirstOption={false}
                    filterOption={false}
                />
            )}
        </Col>

        <Col className="w-full sm:w-fit">
            <DatePicker.RangePicker
                onChange={handleDateChange}
                format={dateFormat}
                defaultValue={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                className="w-full"
            />
        </Col>
        <Col xs={24} sm={12} md={6}>
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
        </Col> */}

            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
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
                        onChange={handleChangeFilters}
                        defaultActiveFirstOption={false}
                        filterOption={false}
                        onSearch={setSearchText}
                    />
                )}
                {xs ? (
                    <Flex className="w-full sm:w-fit" justify="space-between" align="center">
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
                        <SwapRightOutlined />
                        <DatePicker.RangePicker
                            onChange={handleDateChange}
                            format={dateFormat}
                            defaultValue={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                            className="w-full"
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
                    placeholder="Search by Transaction Id"
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
