import React, { useState } from 'react';

import { Button, Flex, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import useFilter from '../../hooks/useFilter';
import useGetCategories from '../../hooks/useGetCategories';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';
import useOrders from '../../hooks/useOrders';

const Orders = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        sortField: '',
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
        handleCategoryFilters,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const { searchText: searchTransaction, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, downloadReport, resendEmail } = useOrders(filters);
    const debouncedSearchText = useDebounce(searchText, 300);
    const { corporateDatas } = useGetCorporateDatas(debouncedSearchText);
    const { categoryDatas } = useGetCategories('');
    const columns = [
        {
            title: 'Transaction Date',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            sorter: true,
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
            key: 'corporateTxnId',
        },
        {
            title: 'Corporate ID',
            key: 'corporateId',
            sorter: true,
            dataIndex: ['credential', 'username'],
            render: (_: any, data: any) => (
                <Typography.Text>{data.credential.username || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Account Number',
            key: 'accountNo',
            sorter: true,
            dataIndex: ['order', 'accountNo'],
            render: (_: any, data: any) => (
                <Typography.Text>{data.order?.accountNo ?? '-'}</Typography.Text>
            ),
        },
        {
            title: 'Corporate Name',
            key: 'corporateName',
            sorter: true,
            dataIndex: ['credential', 'name'],
            render: (_: any, data: any) => (
                <Typography.Text>{data.credential.name}</Typography.Text>
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
            title: 'Category',
            sorter: true,
            dataIndex: 'transactionCategory',
            key: 'transactionCategory',
        },
        {
            title: 'Service Provider',
            sorter: true,
            dataIndex: ['serviceOperator', 'serviceProvider'],
            key: 'serviceOperator',
            render: (_: any, data: any) => (
                <Typography.Text>{data.serviceOperator.serviceProvider}</Typography.Text>
            ),
        },
        {
            title: 'Amount',
            sorter: true,
            dataIndex: ['order', 'amountInINR'],
            key: 'order',
            render: (_: any, data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(Number(data.order.amountInINR))}
                </Typography.Text>
            ),
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
            title: 'Status',
            sorter: true,
            dataIndex: ['order', 'status'],
            key: 'order',
            render: (_: any, data: any) => <Typography.Text>{data.order.status}</Typography.Text>,
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center' as const,
            render: (_: any, data: any) => (
                <Button size="small" danger onClick={() => resendEmail(data.corporateTxnId)}>
                    Resend Email
                </Button>
            ),
        },
    ];
    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                handleCategoryFilters={handleCategoryFilters}
                categoryDatas={categoryDatas}
                dropDownData={corporateDatas}
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
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default Orders;
