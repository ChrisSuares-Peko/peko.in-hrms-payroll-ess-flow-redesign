import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import { AccountInfo } from '../../types/corporates';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    from: string;
    to: string;
    corporateData: AccountInfo[] | undefined;
    setSearchText: (val: string) => void;
    handleChangeFilters: (val: string) => void;
    handleDownloadReport: () => void;
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
}: Props) => (
    <Row gutter={[20, 20]} justify="space-between">
        <Col className="w-full sm:w-fit">
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
            <Button className="w-full" danger onClick={() => handleDownloadReport()}>
                Download Excel
            </Button>
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
        </Col>
    </Row>
);
export default Header;
