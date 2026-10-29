import React, { useEffect, useState } from 'react';

import { Flex, Pagination, Tag, Typography } from 'antd';
import { TableProps } from 'antd/lib';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import useFilter from '../../hooks/useFilter';
import useTransactionData from '../../hooks/useTransactionData';

const TransactionsReport = () => {
    const { user } = useAppSelector(state => state.reducer.user);
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        sortField: 'transactionDate',
        page: 1,
        itemsPerPage: 10,
        from: oneMonthAgoFormatted,
        to: todayFormatted,
        partnerId: user?.partnerId || '',
    };

    const [isDisabled, setIsDisabled] = useState<boolean>(false);
    const [filters, setFilters] = useState(initialValues);
    useEffect(() => {
        setFilters({
            searchText: '',
            category: '',
            page: 1,
            itemsPerPage: 10,
            sort: 'DESC',
            from: oneMonthAgoFormatted,
            to: todayFormatted,
            sortField: 'transactionDate',
            partnerId: user?.partnerId || '',
        });

        if (user?.partnerId) setIsDisabled(true);
    }, [todayFormatted, oneMonthAgoFormatted, user]);

    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleChangeFilters,
        setSearchText,
        handleSort,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });

    const { searchText: searchTransaction, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, downloadReport } = useTransactionData(filters);
    const columns = [
        // {
        //     title: 'Transaction ID',
        //     dataIndex: 'id',
        // },
        {
            title: 'Transaction Date',
            dataIndex: 'transactionDate',
            sorter: true,
            key: 'transactionDate',
            render: (date: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(date))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(date))}</Typography.Text>
                </Flex>
            ),
        },        
        {
            title: 'Customer Name',
            sorter: true,
            dataIndex: 'customerName',
            render: (_: any, data: any) => <Typography.Text>{data.customerName}</Typography.Text>,
        },
        {
            title: 'Service Category',
            sorter: true,
            dataIndex: 'serviceCategory',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.serviceCategory || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Service',
            sorter: true,
            dataIndex: 'service',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.service || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Partner',
            sorter: true,
            dataIndex: 'partner',
            render: (_: any, data: any) => (
                <Typography.Text>{data.partner || 'N/A'}</Typography.Text>
            ),
        },

        {
            title: 'Payment Mode',
            sorter: true,
            // Sort key stays paymentMode — paymentInstrument lives on orders, not the report view.
            dataIndex: 'paymentMode',
            render: (_: any, data: any) => (
                <Typography.Text>{data.paymentInstrument || data.paymentMode}</Typography.Text>
            ),
        },
        {
            title: 'Vendor Name',
            sorter: true,
            dataIndex: 'vendorName',
            render: (_: any, data: any) => <Typography.Text>{data.vendorName}</Typography.Text>,
        },
        {
            title: 'Amount',
            sorter: true,
            dataIndex: 'Amount',
            renkey: 'Amount',
            render: (_: any, data: any) => (
                <Typography.Text>₹ {formatNumberWithLocalString(data?.Amount)}</Typography.Text>
            ),
        },
        {
            title: 'Total Amount',
            dataIndex: 'totalAmount',
            render: (_: any, data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(data?.totalAmount || 0)}
                </Typography.Text>
            ),
        },
        {
            title: 'Status',
            sorter: true,
            dataIndex: 'status',
            render: (_: any, data: any) => {
                const statusColors: Record<string, string> = {
                    SUCCESS: 'green',
                    FAILURE: 'red',
                    PENDING: 'gold',
                };

                return (
                    <Tag color={statusColors[data?.status] || 'default'}>
                        {data?.status || '-'}
                    </Tag>
                );
            },
        },
    ];

    const handleTableChange: TableProps<any>['onChange'] = (pagination, filter, sorter) => {
        let sort;
        let field;

        if (Array.isArray(sorter)) {
            if (sorter.length > 0) {
                ({ field } = sorter[0]);
                sort = sorter[0].order === 'ascend' ? 'ASC' : 'DESC';
            }
        } else {
            ({ field } = sorter);
            sort = sorter.order === 'ascend' ? 'ASC' : 'DESC';
        }

        if (field) {
            handleSort(field.toString(), sort);
        }
    };

    return (
        <Flex vertical gap={20}>
            <Header
                handleSearch={updateSearchText}
                setSearchText={setSearchText}
                searchText={searchTransaction}
                handleDownloadReport={downloadReport}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                handleChangeFilters={handleChangeFilters}
                from={filters.from}
                to={filters.to}
                isDisabled={isDisabled}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                // scroll={{ x: 756 }}
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

export default TransactionsReport;
