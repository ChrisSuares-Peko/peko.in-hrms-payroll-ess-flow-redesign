import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import useScreenSize from '@src/hooks/useScreenSize';

import { ENTITY_TYPE_OPTIONS, PAYMENT_STATUS_OPTIONS, STATUS_OPTIONS } from './constants';

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
    handleEntityTypeChange: (val: string) => void;
    handlePaymentStatusChange: (val: string) => void;
};

const Header = ({
    searchText,
    handleSearch,
    from,
    to,
    handleDateChange,
    handleFromChange,
    handleToChange,
    handleStatusChange,
    handleEntityTypeChange,
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
                <Select
                    allowClear
                    options={ENTITY_TYPE_OPTIONS}
                    placeholder="Filter by Entity Type"
                    className="w-full min-w-44"
                    onChange={handleEntityTypeChange}
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
                    placeholder="Search by ID, Business, Corporate"
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
