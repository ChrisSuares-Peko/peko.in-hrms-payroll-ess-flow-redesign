import React, { useState } from 'react';

import { Flex, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import formatString from '@utils/wordFormat';

import Header from './Header';
import useCorporates from '../../hooks/useCorporates';
import useFilter from '../../hooks/useFilter';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';

const Corporate = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        sortField: 'createdAt',
        page: 1,
        itemsPerPage: 10,
        from: oneMonthAgoFormatted,
        to: todayFormatted,
        id: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleChangeFilters,
        searchText,
        setSearchText,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const debouncedSearchText = useDebounce(searchText, 300);
    const { corporateDatas } = useGetCorporateDatas(debouncedSearchText);
    const { searchText: searchTransaction, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, downloadReport } = useCorporates(filters);
    const columns = [
        {
            title: 'Transaction Date',
            dataIndex: 'transactionDate',
            sorter: true,
            key: 'transactionDate',
            render: (date: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(date))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(date))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Transaction ID',
            sorter: true,
            dataIndex: 'corporateTxnId',
        },
        {
            title: 'Corporate ID',
            sorter: true,
            dataIndex: ['credential', 'username'],
            render: (_: any, data: any) => (
                <Typography.Text>{data?.credential?.username || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Corporate Name',
            sorter: true,
            dataIndex: ['credential', 'name'],
            render: (_: any, data: any) => (
                <Typography.Text>{data?.credential?.name || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Partner Name',
            sorter: true,
            dataIndex: ['credential', 'registeredBy'],
            render: (_: any, data: any) => (
                <Typography.Text>
                    {data?.credential?.registeredByCredential?.name ?? '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Service Category',
            sorter: true,
            dataIndex: ['serviceOperator', 'serviceCategory'],
            key: 'serviceCategory',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.serviceOperator?.serviceCategory}</Typography.Text>
            ),
        },
        {
            title: 'Service Provider',
            sorter: true,
            dataIndex: ['serviceOperator', 'serviceProvider'],
            key: 'serviceProvider',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.serviceOperator?.serviceProvider}</Typography.Text>
            ),
        },
        {
            title: 'Account Number',
            sorter: true,
            dataIndex: ['order', 'accountNo'],
            key: 'accountNo',
            render: (_: any, data: any) => data?.order.accountNo || 'N/A',
        },
        {
            title: 'Amount',
            sorter: true,
            dataIndex: ['order', 'amountInINR'],
            key: 'amountInINR',
            render: (_: any, data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(Number(data?.order?.amountInINR))}
                </Typography.Text>
            ),
        },
        {
            title: 'Payment Mode',
            sorter: true,
            dataIndex: ['order', 'paymentMode'],
            key: 'paymentMode',
            render: (_: any, data: any) => data?.order.paymentMode || 'N/A',
        },
        {
            title: 'Corporate Cashback',
            sorter: true,
            dataIndex: 'corporateCashback',
            key: 'corporateCashback',
            render: (data: any) => (
                <Typography.Text>₹ {formatNumberWithLocalString(Number(data))}</Typography.Text>
            ),
        },
        {
            title: 'Admin Cashback',
            sorter: true,
            dataIndex: 'systemCashback',
            key: 'systemCashback',
            render: (data: any) => (
                <Typography.Text>₹ {formatNumberWithLocalString(Number(data))}</Typography.Text>
            ),
        },
        {
            title: 'Balance',
            sorter: true,
            dataIndex: 'balance',
            key: 'balance',
            render: (data: any) => `₹ ${formatNumberWithLocalString(data)}`,
        },
        {
            title: 'Status',
            sorter: true,
            dataIndex: 'status',
            key: 'status',
            render: (data: any) => formatString(data),
        },
    ];
    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                corporateData={corporateDatas}
                setSearchText={setSearchText}
                handleChangeFilters={handleChangeFilters}
                handleSearch={updateSearchText}
                searchText={searchTransaction}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from}
                to={filters.to}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                onChange={handleTableChange}
                pagination={false}
                loading={isLoading}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default Corporate;
