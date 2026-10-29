import { useMemo, useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Typography } from 'antd';
import dayjs from 'dayjs';

import useDebounce from '@src/hooks/useDebounce';
import useScreenSize from '@src/hooks/useScreenSize';

import NotificationTable from '../components/NotificationTable';
import useFilter from '../hooks/useFilter';
import { useNotificationListingApi } from '../hooks/useNotificationListing';

const { Text } = Typography;

const NotificationsList = () => {
    const dateFormat = 'YYYY-MM-DD';
    const disabledDate = (current: any) => current && current > dayjs().endOf('day');

    const initialFilters = useMemo(() => {
        const today = new Date();
        return {
            page: 1,
            itemsPerPage: 10,
            filter: '',
            search: '',
            from: today.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0],
            sortField: '',
        };
    }, []);
    const [filters, setFilters] = useState(initialFilters);
    const { handleSearch, handlePageChange, handleDateChange, handleFromChange, handleToChange } =
        useFilter({
            setFilters,
            initalStartDate: filters.from,
            initalEndDate: filters.to,
        });
    const debouncedSearchText = useDebounce(filters.search, 500);
    const { data, isLoading, count } = useNotificationListingApi(
        filters.from,
        filters.to,
        filters.page,
        debouncedSearchText,
        filters.sortField
    );
    const { xs } = useScreenSize();

    return (
        <Flex vertical gap={4} className="flex flex-col gap-4 md:gap-10">
            <Flex
                vertical
                className="flex flex-col items-center justify-between w-full gap-4 md:flex-row md:gap-0"
                justify="space-between"
            >
                <Text className="w-full text-base font-medium md:w-fit sm:text-lg lg:text-xl">
                    Notifications
                </Text>
                <Flex
                    gap={2.5}
                    className="flex-col w-full gap-2 mb-5 align-middle sm:mt-5 sm:flex-row md:w-auto"
                >
                    {!xs ? (
                        <DatePicker.RangePicker
                            onChange={handleDateChange}
                            className="w-full"
                            defaultValue={[
                                dayjs(filters.from, dateFormat),
                                dayjs(filters.to, dateFormat),
                            ]}
                            disabledDate={disabledDate}
                        />
                    ) : (
                        <Flex
                            className="w-full mb-5 sm:mb-auto sm:w-auto"
                            justify="space-between"
                            align="center"
                        >
                            <DatePicker
                                disabledDate={disabledDate}
                                onChange={handleFromChange}
                                format={dateFormat}
                                defaultValue={dayjs(filters.from, dateFormat)}
                            />
                            <SwapRightOutlined />
                            <DatePicker
                                disabledDate={disabledDate}
                                onChange={handleToChange}
                                format={dateFormat}
                                defaultValue={dayjs(filters.to, dateFormat)}
                            />
                        </Flex>
                    )}
                    <Input
                        className="w-full md:ml-6 ml-0"
                        value={filters.search}
                        placeholder="Search"
                        onChange={handleSearch}
                        allowClear
                        maxLength={25}
                        suffix={<SearchOutlined />}
                    />
                </Flex>
            </Flex>
            <NotificationTable
                data={data}
                isLoading={isLoading}
                count={count}
                current={filters.page}
                handlePageChange={handlePageChange}
            />
        </Flex>
    );
};

export default NotificationsList;
