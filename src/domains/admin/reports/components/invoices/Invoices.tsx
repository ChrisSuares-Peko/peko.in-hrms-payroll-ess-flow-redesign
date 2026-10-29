import React, { useState } from 'react';

import { Flex, Pagination, Table, Typography } from 'antd';
import dayjs from 'dayjs';

import { formattedDateOnly, formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import useFilter from '../../hooks/useFilter';
import useInvoice from '../../hooks/useInvoice';

const Invoices = () => {
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
    };
    const [filters, setFilters] = useState(initialValues);
    const { isLoading, tableData, count } = useInvoice(filters);
    const { handleSearch, handlePageChange, handleDateChange } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (data: any) => (
                <Typography.Text>{formattedDateTime(new Date(data))}</Typography.Text>
            ),
        },
        {
            title: 'Invoice Date',
            dataIndex: 'invoiceDetails',
            key: 'invoiceDetails',
            render: (data: any) => (
                <Typography.Text>
                    {formattedDateOnly(new Date(JSON.parse(data).invoiceDate))}
                </Typography.Text>
            ),
        },
        {
            title: 'Invoice Due Date',
            dataIndex: 'invoiceDetails',
            key: 'invoiceDetails',
            render: (data: any) => (
                <Typography.Text>
                    {formattedDateOnly(new Date(JSON.parse(data).dueDate))}
                </Typography.Text>
            ),
        },
        {
            title: 'Total Amount',
            dataIndex: 'paymentDetails',
            key: 'paymentDetails',
            render: (data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(Number(JSON.parse(data).total))}
                </Typography.Text>
            ),
        },
        {
            title: 'Amount Paid',
            dataIndex: 'paymentDetails',
            key: 'paymentDetails',
            render: (data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(Number(JSON.parse(data).amountPaid || 0))}
                </Typography.Text>
            ),
        },
        {
            title: 'Amount Due',
            dataIndex: 'paymentDetails',
            key: 'paymentDetails',
            render: (data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(Number(JSON.parse(data).amountDue || 0))}
                </Typography.Text>
            ),
        },
        {
            title: 'Biller Name',
            dataIndex: 'recipientDetails',
            key: 'recipientDetails',
            render: (data: any) => <Typography.Text>{JSON.parse(data).billerName}</Typography.Text>,
        },
        {
            title: 'Customer Name',
            dataIndex: 'recipientDetails',
            key: 'recipientDetails',
            render: (data: any) => (
                <Typography.Text>{JSON.parse(data).customerName}</Typography.Text>
            ),
        },
    ];
    return (
        <Flex vertical gap={20}>
            <Header
                handleSearch={handleSearch}
                searchText={filters.searchText}
                handleDateChange={handleDateChange}
                from={filters.from}
                to={filters.to}
            />
            <Table
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                style={{ overflow: 'auto' }}
                scroll={{ x: 992 }}
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

export default Invoices;
