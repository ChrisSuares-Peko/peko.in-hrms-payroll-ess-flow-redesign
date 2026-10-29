import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import useScreenSize from '@src/hooks/useScreenSize';

import { PAYMENT_STATUS_OPTIONS, STATUS_OPTIONS } from './constants';

const dateFormat = 'YYYY-MM-DD';

type Props = {
    searchText: string;
    handleSearch: (e: any) => void;
    from: string;
    to: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    handleStatusChange: (val: string) => void;
    handlePaymentStatusChange: (val: string) => void;
};

// Same layout as BusinessRegistration's Header — Status + Payment Status filters, date range, debounced search (no Entity Type here).
const Header = ({
    searchText,
    handleSearch,
    from,
    to,
    handleDateChange,
    handleFromChange,
    handleToChange,
    handleStatusChange,
    handlePaymentStatusChange,
}: Props) => {
    const { xs } = useScreenSize();

    return (
        <Row justify="end" className="w-full gap-3">
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                <Select
                    allowClear
                    options={STATUS_OPTIONS}
                    placeholder="Filter by Status"
                    className="w-full min-w-40"
                    onChange={handleStatusChange}
                />
                <Select
                    allowClear
                    options={PAYMENT_STATUS_OPTIONS}
                    placeholder="Filter by Payment"
                    className="w-full min-w-40"
                    onChange={handlePaymentStatusChange}
                />
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
                    placeholder="Search by Application ID, Business, Corporate"
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    className="min-w-64"
                    maxLength={100}
                />
            </Flex>
        </Row>
    );
};

export default Header;
