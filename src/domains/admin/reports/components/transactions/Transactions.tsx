import React, { useState } from 'react';

import { Flex, Pagination, Table, Typography } from 'antd';
import dayjs from 'dayjs';

import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import useFilter from '../../hooks/useFilter';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';
import useTransactions from '../../hooks/useTransactions';

const Transactions = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        page: 1,
        itemsPerPage: 10,
        from: todayFormatted,
        to: todayFormatted,
        id: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const {
        handleSearch,
        handlePageChange,
        handleDateChange,
        handleChangeFilters,
        searchText,
        setSearchText,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const { corporateDatas } = useGetCorporateDatas(searchText);
    const { isLoading, tableData, count, downloadReport } = useTransactions(filters);

    const columns = [
        {
            title: 'Date',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            render: (data: any) => (
                <Typography.Text>{formattedDateTime(new Date(data))}</Typography.Text>
            ),
        },
        {
            title: 'TransactionID',
            dataIndex: 'corporateTxnId',
        },
        {
            title: 'Corporate Name',
            dataIndex: 'credential',
            render: (data: any) => <Typography.Text>{data.name}</Typography.Text>,
        },

        {
            title: 'Category',
            dataIndex: 'serviceOperator',
            key: 'serviceOperator',
            render: (data: any) => <Typography.Text>{data.serviceCategory}</Typography.Text>,
        },
        {
            title: 'Debit Amount',
            dataIndex: 'order',
            key: 'order',
            render: (data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(Number(data.amountInINR))}
                </Typography.Text>
            ),
        },
        {
            title: 'Cashback',
            dataIndex: 'corporateCashback',
            key: 'corporateCashback',
            render: (data: any) => (
                <Typography.Text>₹ {formatNumberWithLocalString(Number(data))}</Typography.Text>
            ),
        },
        {
            title: 'Balance',
            dataIndex: 'balance',
            key: 'balance',
            render: (data: any) => (
                <Typography.Text>₹ {formatNumberWithLocalString(Number(data))}</Typography.Text>
            ),
        },
        {
            title: 'Remarks',
            dataIndex: 'remarks',
        },
    ];
    return (
        <Flex vertical gap={20}>
            <Header
                corporateData={corporateDatas}
                setSearchText={setSearchText}
                handleChangeFilters={handleChangeFilters}
                handleSearch={handleSearch}
                searchText={filters.searchText}
                handleDateChange={handleDateChange}
                handleDownloadReport={downloadReport}
                from={filters.from}
                to={filters.to}
            />
            <Table
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                scroll={{ x: 756 }}
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

export default Transactions;
