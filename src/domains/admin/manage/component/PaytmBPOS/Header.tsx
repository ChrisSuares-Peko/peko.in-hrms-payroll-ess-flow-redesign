import { useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Row } from 'antd';
import dayjs from 'dayjs';

import useScreenSize from '@src/hooks/useScreenSize';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    from: string;
    to: string;
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
}: Props) => {
    const { xs } = useScreenSize();
    const [searchInput, setSearchInput] = useState(searchText);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setSearchInput(value);
        handleSearch(value); // debounced search function
    };
    return (
        <Row className="w-full gap-5" justify="end">
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
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
                    value={searchInput}
                    placeholder="Search for requests..."
                    suffix={<SearchOutlined />}
                    onChange={handleInputChange}
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
