import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Typography } from 'antd';
import dayjs from 'dayjs';

import { IOrderDetailsFilter } from '../../hooks/order/useOrderHistory';

type Props = {
    handleFilterChange: (dates: any) => void;
    handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    filter: IOrderDetailsFilter;
    searchInput: string;
};
const Header = ({ handleFilterChange, handleSearchChange, filter, searchInput }: Props) => {
    const dateFormat = 'YYYY-MM-DD';

    return (
        <Flex className="mt-3 justify-start items-start flex-col md:flex-row gap-2 ">
            <Typography.Text className="text-start  text-lg  xl:text-xl md:w-[50%] font-medium ">
                Order History
            </Typography.Text>
            <Flex className="gap-1 flex-1 flex-col sm:flex-row w-full">
                <DatePicker.RangePicker
                    onChange={handleFilterChange}
                    format={dateFormat}
                    value={[filter.from ? dayjs(filter.from) : null, dayjs(filter.to)]}
                    className="w-full"
                    disabledDate={current => current && current > dayjs().endOf('day')}
                    allowClear={false}
                />
                <Input
                    placeholder="Search for orders"
                    suffix={<SearchOutlined />}
                    allowClear
                    type="text"
                    maxLength={100}
                    value={searchInput}
                    onChange={handleSearchChange}
                />
            </Flex>
        </Flex>
    );
};

export default Header;
