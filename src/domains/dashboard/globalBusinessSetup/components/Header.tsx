import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { DatePicker, Input, Row, Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import useScreenSize from '@src/hooks/useScreenSize';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    from: string;
    to: string;
    handleToChange: any;
    handleFromChange: any;
    isPending?: boolean;
    title?: string;
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
    isPending = false,
    title,
}: Props) => {
    const { xs } = useScreenSize();

    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex className="flex justify-start gap-3">
                <Typography.Text className="text-lg font-medium">
                    {title || (isPending ? 'Pending Applications' : 'Your Applications')}
                </Typography.Text>
            </Flex>
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                {xs ? (
                    <Flex justify="space-between" className="mb-2">
                        <DatePicker
                            onChange={handleFromChange}
                            format={dateFormat}
                            value={dayjs(from, dateFormat)}
                            className="w-full"
                            disabledDate={disabledDate}
                        />
                        <SwapRightOutlined />
                        <DatePicker
                            onChange={handleToChange}
                            format={dateFormat}
                            value={dayjs(to, dateFormat)}
                            className="w-full"
                            disabledDate={disabledDate}
                        />
                    </Flex>
                ) : (
                    <DatePicker.RangePicker
                        onChange={handleDateChange}
                        format={dateFormat}
                        value={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                        className="w-full"
                        disabledDate={disabledDate}
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
