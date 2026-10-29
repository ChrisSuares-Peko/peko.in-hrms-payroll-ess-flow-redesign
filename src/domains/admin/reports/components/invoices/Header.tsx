import { SearchOutlined } from '@ant-design/icons';
import { Col, DatePicker, Input, Row } from 'antd';
import dayjs from 'dayjs';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    from: string;
    to: string;
};
const dateFormat = 'YYYY-MM-DD';
const Header = ({ searchText, handleSearch, from, to, handleDateChange }: Props) => (
    <Row gutter={[20, 20]} justify="space-between">
        <Col className="w-full sm:w-fit">
            <DatePicker.RangePicker
                onChange={handleDateChange}
                format={dateFormat}
                defaultValue={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                className="w-full"
            />
        </Col>
        <Col xs={24} sm={12} md={8}>
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
