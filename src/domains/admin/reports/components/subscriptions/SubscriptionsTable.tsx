import React, { useState } from 'react';

import { Flex, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import useFilter from '../../hooks/useFilter';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';
import useSubscriptionListing from '../../hooks/useSubscriptionListing';
import { StatusData } from '../../utils/subscription';

const SubscriptionsTable = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        category: '',
        sort: '',
        sortField: 'subscriptionEndDate',
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
    const colors = (data: string) => {
        if (data === 'ACTIVE')
            return <Typography.Text className="font-normal text-textGreen">{data}</Typography.Text>;
        if (data === 'UPGRADED')
            return <Typography.Text className="font-normal text-blue-500">{data}</Typography.Text>;
        if (data === 'DUE')
            return (
                <Typography.Text className="font-normal text-orange-300">{data}</Typography.Text>
            );
        return <Typography.Text className="font-normal text-textRed">{data}</Typography.Text>;
    };
    const debouncedSearchText = useDebounce(searchText, 300);
    const { corporateDatas } = useGetCorporateDatas(debouncedSearchText);
    const { searchText: searchTransaction, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, downloadReport } = useSubscriptionListing(filters);
    const columns = [
        {
            title: 'Transaction Date',
            dataIndex: 'createdAt',
            sorter: true,
            key: 'createdAt',
            render: (date: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(date))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(date))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Transaction ID',
            dataIndex: 'subscriptionPaymentRefId',
            sorter: true,
            key: 'subscriptionPaymentRefId',
            render: (data: string) => <Typography.Text>{data ?? '-'}</Typography.Text>,
        },
         {
            title: 'Order ID',
            dataIndex: 'corporateTxnId',
            sorter: true,
            key: 'corporateTxnId',
            render: (data: string) => <Typography.Text>{data ?? '-'}</Typography.Text>,
        },
        {
            title: 'Corporate ID',
            sorter: true,
            dataIndex: 'corporateUsername',
            key: 'corporateUsername',
            render: (data: string) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Corporate Name',
            dataIndex: 'corporateName',
            sorter: true,
            key: 'corporateName',
            render: (data: string) => <Typography.Text>{data}</Typography.Text>,
        },
        {
            title: 'Partner Name',
            sorter: true,
            dataIndex: 'registeredByUsername',
            key: 'registeredByUsername',
            render: (data: string) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Package',
            sorter: true,
            dataIndex: 'packageName',
            key: 'packageName',
            render: (data: string) => <Typography.Text>{data}</Typography.Text>,
        },
        {
            title: 'Start Date',
            dataIndex: 'subscriptionStartDate',
            sorter: true,
            key: 'subscriptionStartDate',
            render: (data: string) => (
                <Typography.Text>{formattedDateOnly(new Date(data))}</Typography.Text>
            ),
        },
        {
            title: 'End Date',
            dataIndex: 'subscriptionEndDate',
            sorter: true,
            key: 'subscriptionEndDate',
            render: (data: string) => (
                <Typography.Text>{formattedDateOnly(new Date(data))}</Typography.Text>
            ),
        },
        {
            title: 'Actual Price',
            dataIndex: 'subscriptionPrice',
            sorter: true,
            key: 'subscriptionPrice',
            render: (data: string) => (
                <Typography.Text>₹ {formatNumberWithLocalString(data)}</Typography.Text>
            ),
        },
        {
            title: 'Discount',
            dataIndex: 'discount',
            sorter: true,
            key: 'discount',
            render: (data: string) => (
                <Typography.Text>₹ {formatNumberWithLocalString(data)}</Typography.Text>
            ),
        },
        {
            title: 'Payment Mode',
            dataIndex: 'paymentMode',
            sorter: true,
            key: 'paymentMode',
        },
        {
            title: 'Paid Amount',
            dataIndex: 'subscriptionAmountPaid',
            sorter: true,
            key: 'subscriptionAmountPaid',
            render: (data: any) => (
                <Typography.Text>₹ {formatNumberWithLocalString(data)}</Typography.Text>
            ),
        },
        {
            title: 'Voucher Code',
            dataIndex: 'voucherCode',
            sorter: true,
            key: 'voucherCode',
            render: (voucherCode: string) => (
                <Typography.Text>{voucherCode || 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'Coupon used',
            dataIndex: 'couponCode',
            sorter: true,
            key: 'couponCode',
            render: (data: string) => <Typography.Text>{data ?? 'N/A'}</Typography.Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            sorter: true,
            key: 'status',
            render: (data: any) => colors(data),
        },
    ];
    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                dropDownData={corporateDatas}
                statusData={StatusData}
                setSearchText={setSearchText}
                handleChangeFilters={handleChangeFilters}
                handleSearch={updateSearchText}
                searchText={searchTransaction}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from}
                to={filters.to}
                handleCategoryFilters={handleCategoryFilters}
            />
            <GenericTable
                handleSort={handleTableChange}
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
                // scroll={{ x: 'max-content' }}
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

export default SubscriptionsTable;
