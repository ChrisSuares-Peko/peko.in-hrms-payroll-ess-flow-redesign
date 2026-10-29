import React, { useCallback, useMemo, useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Flex, Input, Table, Typography, Pagination, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { capitalize } from 'lodash';
import moment from 'moment';
import { useSearchParams } from 'react-router-dom';

import useDebounce from '@src/hooks/useDebounce';
import useScreenSize from '@src/hooks/useScreenSize';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import useFilter from '../hooks/useFilter';
import { useGetEmailDomainHistoryApi } from '../hooks/useGetEmailDomainHistoryApi';
import { filterState } from '../types/index';

const { Text, Paragraph } = Typography;

const EmailDomainHistory = () => {
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('id') || undefined;
    const generatePaymentStatusBtn = (status: string) => {
        const statusColors: Record<string, { badgeColor: string; textColor: string }> = {
            SUCCESS: { badgeColor: '#EBFFE7', textColor: '#26A411' },
            FAILURE: { badgeColor: '#FFF4F3', textColor: '#D7341E' },
        };

        const { textColor } = statusColors[status.toUpperCase()] || {
            badgeColor: 'gray',
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
            title: 'Purchased On',
            dataIndex: 'date',
            key: 'date',
            width: '10%',
            render: (date: any) => (
                <Flex vertical>
                    <Text>{formattedDateOnly(new Date(date))}</Text>
                    <Text>{formattedTime(new Date(date))}</Text>
                </Flex>
            ),
        },
        {
            title: 'Product Name',
            dataIndex: ['emailDomain', 'softwares_subscription'],
            key: 'emailDomain',
            width: '10%',
            render: (data: any) => data?.name ?? '-',
        },
        {
            title: 'Plan Name',
            dataIndex: ['emailDomain', 'name'],
            key: 'emailDomain',
            width: '10%',
        },
        {
            title: 'Order ID',
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
            width: '10%',
        },
        {
            title: 'Payment Mode',
            dataIndex: 'paymentMode',
            key: 'paymentMode',
            width: '10%',
            render: (data: any) => <Text>{capitalize(data) ?? '-'}</Text>,
        },
        {
            title: 'Total Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: '15%',
            render: (totalAmount: string) => (
                <Text className="text-sm text-neutral-600">
                    INR {parseFloat(totalAmount).toFixed(2)}
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

    const calculateInitialDates = () => {
        const today = dayjs();
        return {
            todayFormatted: today.format('YYYY-MM-DD'),
            oneMonthBeforeFormatted: today.subtract(1, 'month').format('YYYY-MM-DD'),
        };
    };

    const { todayFormatted, oneMonthBeforeFormatted } = calculateInitialDates();

    const initialValues = useMemo(
        () => ({
            searchText: '',
            page: 1,
            itemsPerPage: 5,
            from: oneMonthBeforeFormatted,
            to: todayFormatted,
        }),
        [oneMonthBeforeFormatted, todayFormatted]
    );

    const dateFormat = 'YYYY-MM-DD';
    const [filter, setFilter] = useState<filterState>(initialValues);

    const debouncedSearchText = useDebounce(filter.searchText, 500);

    const { historyData, total, isLoading } = useGetEmailDomainHistoryApi({
        itemsPerPage: filter.itemsPerPage,
        page: filter.page,
        search: debouncedSearchText,
        from: filter.from,
        to: filter.to,
        productId,
    });
    const disabledDate = useCallback(
        (current: any) => current && current > moment().startOf('day'),
        []
    );
    const { handleSearch, handlePageChange, handleDateChange, handleFromChange, handleToChange } =
        useFilter({
            setFilter,
            initalStartDate: initialValues.from,
            initalEndDate: initialValues.to,
        });

    const memoizedHandleSearch = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            handleSearch(e);
        },
        [handleSearch]
    );

    return (
        <Flex vertical gap={10}>
            {xs ? (
                <>
                    <Paragraph className="w-full  text-lg font-medium">Order History</Paragraph>
                    <Flex justify="space-between" className="">
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
                            onChange={memoizedHandleSearch}
                            suffix={<SearchOutlined />}
                        />
                    </Flex>
                </>
            ) : (
                <Flex justify="space-between" className="">
                    <Paragraph className="text-xl font-medium">Order History</Paragraph>
                    <Flex align="center">
                        <DatePicker.RangePicker
                            onChange={handleDateChange}
                            format="YYYY-MM-DD"
                            value={[dayjs(filter.from, dateFormat), dayjs(filter.to, dateFormat)]}
                            className="w-full mr-3"
                            disabledDate={current => current && current > dayjs().endOf('day')}
                        />
                        <Input
                            placeholder="Search"
                            allowClear
                            suffix={<SearchOutlined />}
                            variant="outlined"
                            style={{
                                width: 'calc(100% - 10px)',
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                            }}
                            value={filter.searchText}
                            onChange={handleSearch}
                        />
                    </Flex>
                </Flex>
            )}
            <Table
                scroll={{ x: 756 }}
                loading={isLoading}
                dataSource={historyData}
                columns={columns}
                pagination={false}
            />
            <Pagination
                className="mt-10 text-center sm:text-end"
                total={total}
                current={filter.page}
                onChange={handlePageChange}
            />
        </Flex>
    );
};

export default EmailDomainHistory;
