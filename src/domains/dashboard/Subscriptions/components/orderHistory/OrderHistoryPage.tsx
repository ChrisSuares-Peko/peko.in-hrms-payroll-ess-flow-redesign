import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Table, Typography, Flex, Input, Pagination, DatePicker } from 'antd';
import dayjs from 'dayjs';

import useFilter from '../../hooks/useFilter';
import { useOrderHistoryTable } from '../../hooks/useOrderHistoryTable';
import { filterState } from '../../types/types';
import { OrderHistoryColumns } from '../../utils/data';

const { Text } = Typography;

type OrderHistoryPageProps = {};

const OrderHistoryPage: React.FC<OrderHistoryPageProps> = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthBefore = today.subtract(1, 'month'); // Subtract 1 month
    const oneMonthBeforeFormatted = oneMonthBefore.format('YYYY-MM-DD');
    const initialValues = {
        search: '',
        start: 0,
        length: 10,
        draw: 1,
        from: oneMonthBeforeFormatted,
        to: todayFormatted,
    };
    const dateFormat = 'YYYY-MM-DD';
    const [filter, setFilter] = useState<filterState>(initialValues);
    const { handleSearch, handlePageChange, handleDateChange } = useFilter({
        setFilter,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });

    const { data, isLoading, count } = useOrderHistoryTable(
        filter.draw,
        filter.start,
        filter.length,
        filter.search,
        filter.from,
        filter.to
    );

    return (
        <Flex vertical gap={10}>
            <Flex justify="space-between" className="">
                <Text className="xl:text-xl lg:text-lg  sm:text-lg text-lg font-medium ">
                    Order History
                </Text>
                <Flex>
                    <DatePicker.RangePicker
                        onChange={handleDateChange as any}
                        format="YYYY-MM-DD"
                        value={[dayjs(filter.from, dateFormat), dayjs(filter.to, dateFormat)]}
                        className="w-full sm:w-fit h-9 sm:mt-[0.7rem] md:mt-0 "
                        disabledDate={current => current && current > dayjs().endOf('day')}
                    />
                    <Flex align="center" style={{ marginLeft: '10px' }}>
                        <Input
                            placeholder="Search for orders"
                            suffix={<SearchOutlined />}
                            allowClear
                            type="text"
                            maxLength={100}
                            value={filter.search}
                            onChange={handleSearch}
                        />
                    </Flex>
                </Flex>
            </Flex>
            <Table
                scroll={{ x: 756 }}
                columns={OrderHistoryColumns}
                dataSource={data.map(item => ({ ...item, key: item.transactionId }))}
                loading={isLoading}
                pagination={false}
            />
            <Pagination
                current={filter.start}
                onChange={handlePageChange}
                size="default"
                className="text-end pt-10"
                total={count}
            />
        </Flex>
    );
};

export default OrderHistoryPage;
