import { useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Flex, Input, Table, Typography, Pagination, DatePicker } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';

import useDebounce from '@src/hooks/useDebounce';
import useScreenSize from '@src/hooks/useScreenSize';

import useFilter from '../hooks/useFilter';
import { useGetHikeHistoryApi } from '../hooks/useGetHikeHistoryApi';
import { filterState } from '../types/index';

const { Text, Paragraph } = Typography;

const HikeHistory = () => {
    const generatePaymentStatusBtn = (status: string) => {
        const statusColors: Record<string, { badgeColor: string; textColor: string }> = {
            SUCCESS: { badgeColor: '#EBFFE7', textColor: '#26A411' },
            FAILURE: { badgeColor: '#FFF4F3', textColor: '#D7341E' },
        };

        const { textColor } = statusColors[status.toUpperCase()] || {
            textColor: 'white',
        };

        return (
            <Text
                className="capitalize"
                style={{
                    fontWeight: 500,
                    color: textColor,
                }}
            >
                {status}
            </Text>
        );
    };
    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => dayjs(date).format('MMMM D, YYYY'),
            width: '10%',
        },
        {
            title: 'Name',
            dataIndex: 'hikes',
            key: 'hikes',
            width: '20%',
            render: (hikes: any[]) => (
                <ul>
                    {hikes.map((hike, index) => (
                        <li key={index}>
                            {index + 1}. {hike.name}
                        </li>
                    ))}
                </ul>
            ),
        },
        {
            title: 'No. of orders',
            dataIndex: 'hikes',
            key: 'hikes',
            width: '10%',
            render: (hikes: any[]) => (
                <ul>
                    {hikes.map((hike, index) => (
                        <li key={index}>{hike.quantity}</li>
                    ))}
                </ul>
            ),
        },
        {
            title: 'Amount per user',
            dataIndex: 'hikes',
            key: 'hikes',
            width: '15%',
            render: (hikes: any[]) => (
                <ul>
                    {hikes.map((hike, index) => (
                        <li key={index}>₹ {parseFloat(hike?.price).toFixed(2)}</li>
                    ))}
                </ul>
            ),
        },
        {
            title: 'Amount per Voucher',
            dataIndex: 'hikes',
            key: 'hikes',
            width: '15%',
            render: (hikes: any[]) => (
                <ul>
                    {hikes.map((hike, index) => (
                        <li key={index}>₹ {parseFloat(hike?.totalPrice).toFixed(2)}</li>
                    ))}
                </ul>
            ),
        },
        {
            title: 'Total Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: '15%',
            render: (totalAmount: string) => (
                <Text className="text-sm text-neutral-600">
                    ₹ {parseFloat(totalAmount).toFixed(2)}
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => generatePaymentStatusBtn(status.toLowerCase()),
            width: '10%',
        },
    ];

    const { xs } = useScreenSize();
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 5,
        from: todayFormatted,
        to: todayFormatted,
    };
    const dateFormat = 'YYYY-MM-DD';
    const [filter, setFilter] = useState<filterState>(initialValues);
    const debouncedSearchText = useDebounce(filter.searchText, 300);
    // You can handle API fetching here if needed for additional side effects
    const { hikeHistoryData, total, isLoading } = useGetHikeHistoryApi({
        itemsPerPage: filter.itemsPerPage,
        page: filter.page,
        search: debouncedSearchText,
        from: filter.from,
        to: filter.to,
    });
    const disabledDate = (current: any) => current && current > moment().startOf('day');
    const { handleSearch, handlePageChange, handleDateChange, handleFromChange, handleToChange } =
        useFilter({
            setFilter,
            initalStartDate: initialValues.from,
            initalEndDate: initialValues.to,
        });
    return (
        <>
            <Flex vertical>
                {xs ? (
                    <>
                        <Paragraph className="w-full py-5 text-lg font-medium">
                            Order History
                        </Paragraph>
                        <Flex justify="space-between" className="mb-5">
                            <DatePicker
                                onChange={handleFromChange}
                                format={dateFormat}
                                defaultValue={dayjs(filter.from, dateFormat)}
                                disabledDate={disabledDate}
                            />
                            <SwapRightOutlined />
                            <DatePicker
                                onChange={handleToChange}
                                format={dateFormat}
                                defaultValue={dayjs(filter.to, dateFormat)}
                                disabledDate={disabledDate}
                            />
                        </Flex>
                        <Flex align="center" className="mb-3">
                            <Input
                                placeholder="Search"
                                style={{
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0,
                                }}
                                value={filter.searchText}
                                onChange={handleSearch}
                                suffix={<SearchOutlined />}
                            />
                        </Flex>
                    </>
                ) : (
                    <Flex justify="space-between" className="">
                        <Text className="text-lg font-medium xl:text-xl lg:text-lg sm:text-lg ">
                            Order History
                        </Text>
                        <Flex>
                            <DatePicker.RangePicker
                                onChange={handleDateChange}
                                format="YYYY-MM-DD"
                                value={[
                                    dayjs(filter.from, dateFormat),
                                    dayjs(filter.to, dateFormat),
                                ]}
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
                                    value={filter.searchText}
                                    onChange={handleSearch}
                                />
                            </Flex>
                        </Flex>
                    </Flex>
                )}
            </Flex>
            <Table
                scroll={{ x: 756 }}
                loading={isLoading}
                dataSource={hikeHistoryData.map(item => ({ key: item.id, ...item }))}
                columns={columns}
                pagination={false}
                className="mt-5"
            />
            <Pagination
                className="mt-10 text-center sm:text-end"
                total={total}
                current={filter.page}
                onChange={handlePageChange}
            />
        </>
    );
};

export default HikeHistory;
