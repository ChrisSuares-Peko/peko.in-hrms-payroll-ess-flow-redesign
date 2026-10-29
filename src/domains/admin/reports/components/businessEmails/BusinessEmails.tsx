import React, { useState } from 'react';

import { Flex, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import useFilter from '../../hooks/useFilter';
import useGetAllBusinessEmails from '../../hooks/useGetAllBusinessEmails';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';

const BusinessEmails = () => {
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
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const { corporateDatas } = useGetCorporateDatas(searchText);
    const { isLoading, tableData, count, downloadReport } = useGetAllBusinessEmails(filters);
    const columns = [
        {
            title: 'Purchased On',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            sorter: true,
            render: (data: any) => (
                <Typography.Text>{formattedDateTime(new Date(data))}</Typography.Text>
            ),
        },
        {
            title: 'Company Name',
            dataIndex: ['credential', 'name'],
            key: 'transactionID',
            sorter: true,
            render: (data: any) => <Typography.Text>{data}</Typography.Text>,
        },
        {
            title: 'Email ID',
            dataIndex: ['credential', 'email'],
            key: 'policyName',
            render: (data: any) => <Typography.Text>{data}</Typography.Text>,
        },
        {
            title: 'Mobile Number',
            dataIndex: ['order', 'orderResponse'],
            key: 'policyPremium',
            render: (_: any, data: any) => {
                const orderResponse = JSON.parse(data?.order.orderResponse);
                return <Typography.Text>{orderResponse?.mobileNo || '-'}</Typography.Text>;
            },
        },
        {
            title: 'Product',
            dataIndex: ['order', 'orderResponse'],
            key: 'policyTenure',
            render: (_: any, data: any) => {
                const orderResponse = JSON.parse(data?.order.orderResponse);
                return (
                    <Typography.Text>
                        {orderResponse?.emailDomainsDetails?.softwares_subscription?.name || '-'}
                    </Typography.Text>
                );
            },
        },
        {
            title: 'Plan',
            dataIndex: ['order', 'orderResponse'],
            key: 'insuranceStatus',

            render: (_: any, data: any) => {
                const orderResponse = JSON.parse(data?.order.orderResponse);
                return (
                    <Typography.Text>
                        {orderResponse?.emailDomainsDetails?.name || '-'}
                    </Typography.Text>
                );
            },
        },
        {
            title: 'Billing Cycle',
            dataIndex: ['order', 'orderResponse'],
            key: 'credential',
            render: (_: any, data: any) => {
                const orderResponse = JSON.parse(data?.order.orderResponse);
                return <Typography.Text>{orderResponse?.billingType || '-'}</Typography.Text>;
            },
        },
        {
            title: 'No. of Email Accounts',
            dataIndex: ['order', 'orderResponse'],
            key: 'credential',
            render: (_: any, data: any) => {
                const orderResponse = JSON.parse(data?.order.orderResponse);
                return (
                    <Typography.Text>
                        {orderResponse?.formDetails?.numberOfUsers || '-'}
                    </Typography.Text>
                );
            },
        },
        {
            title: 'Status',
            sorter: true,
            dataIndex: 'status',
            key: 'status',
            render: (data: any) => (
                <Typography.Text
                    className={data === 'SUCCESS' ? 'text-green-500' : 'text-yellow-500'}
                >
                    {data === 'SUCCESS' ? 'Complete' : 'In-progress'}
                </Typography.Text>
            ),
        },
        {
            title: 'Amount Paid',
            dataIndex: ['order', 'amountInINR'],
            key: 'credential',
            sorter: true,
            render: (data: any) => (
                <Typography.Text>₹ {formatNumberWithLocalString(Number(data))}</Typography.Text>
            ),
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
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                onChange={handleTableChange}
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

export default BusinessEmails;
