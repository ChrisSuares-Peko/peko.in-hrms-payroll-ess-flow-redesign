import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Typography, Input, DatePicker, Grid, Flex, DatePickerProps } from 'antd';
import dayjs from 'dayjs';

type Props = {
    searchText: string;
    handleSearch: (e: any) => void;
    handleDateChange: (start: any, end: any) => void;
    handleFromChange: DatePickerProps['onChange'];
    handleToChange: DatePickerProps['onChange'];

    fromDate: any;
    toDate: any;
};

const OrderHeader = ({
    handleSearch,
    handleDateChange,
    searchText,
    handleFromChange,
    handleToChange,
    fromDate,
    toDate,
}: Props) => {
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const { RangePicker } = DatePicker;
    const dateFormat = 'YYYY-MM-DD';
    const disabledDate = (current: any): boolean =>
        // Can not select days after today
        current && current > dayjs().endOf('day');
    return (
        <Flex vertical>
            {screens.xs ? (
                <>
                    <Typography.Paragraph className="w-full py-5 text-lg font-medium">
                        Order History
                    </Typography.Paragraph>
                    <Flex justify="space-between" className="mt-5">
                        <DatePicker
                            onChange={handleFromChange}
                            format={dateFormat}
                            defaultValue={dayjs(fromDate, dateFormat)}
                            disabledDate={disabledDate}
                            // className="ml-3"
                        />
                        <SwapRightOutlined />
                        <DatePicker
                            onChange={handleToChange}
                            format={dateFormat}
                            defaultValue={dayjs(toDate, dateFormat)}
                            disabledDate={disabledDate}
                            allowClear={false}
                            // className="mr-3"
                        />
                    </Flex>
                    <Flex align="center" className="mb-3 mt-5">
                        <Input
                            allowClear
                            suffix={<SearchOutlined />}
                            variant="outlined"
                            placeholder="Search"
                            // className="md:w-56"
                            onChange={handleSearch} // Use onChange instead of onSearch
                        />
                    </Flex>
                </>
            ) : (
                <Flex justify="space-between" className="">
                    <Typography.Text className="text-lg font-medium xl:text-xl lg:text-lg sm:text-lg ">
                        Order History
                    </Typography.Text>
                    <Flex>
                        <RangePicker
                            onChange={handleDateChange}
                            format="YYYY-MM-DD"
                            value={[dayjs(fromDate), dayjs(toDate)]}
                            className="w-full sm:w-fit h-9 sm:mt-[0.7rem] md:mt-0 "
                            disabledDate={disabledDate}
                            allowClear={false}
                        />
                        <Flex align="center" style={{ marginLeft: '10px' }}>
                            <Input
                                allowClear
                                value={searchText}
                                suffix={<SearchOutlined />}
                                variant="outlined"
                                placeholder="Search"
                                onChange={handleSearch} // Use onChange instead of onSearch
                            />
                        </Flex>
                    </Flex>
                </Flex>
            )}
        </Flex>
    );
};

export default OrderHeader;
