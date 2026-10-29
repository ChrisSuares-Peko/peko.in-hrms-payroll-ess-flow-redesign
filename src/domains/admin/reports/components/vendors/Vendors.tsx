import React, { useState } from 'react';

import { Flex, Pagination, Typography } from 'antd';
import { TableProps } from 'antd/lib';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import useFilter from '../../hooks/useFilter';
import useVendors from '../../hooks/useVendors';
import useVendorsData from '../../hooks/useVendorsData';

const Vendors = () => {
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
        handleSort,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const { searchText: searchTransaction, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, downloadReport } = useVendorsData(filters);
    const debouncedSearchText = useDebounce(searchText, 300);
    const { dropDownData } = useVendors(debouncedSearchText);
    const columns = [
        {
            title: 'Transaction Date',
            sorter: true,
            dataIndex: 'createdAt',
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
            sorter: true,
            dataIndex: 'corporateTxnId',
        },
        {
            title: 'Corporate ID',
            dataIndex: ['credential', 'username'],
            sorter: true,
            render: (_: any, data: any) => (
                <Typography.Text>{data.credential.username}</Typography.Text>
            ),
        },
        {
            title: 'Corporate Name',
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
            title: 'Vendor',
            sorter: true,
            dataIndex: ['serviceOperator', 'vendor', 'vendorName'],
            key: 'vendorName',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.serviceOperator?.vendor.vendorName || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Service Provider',
            sorter: true,
            dataIndex: ['serviceOperator', 'serviceProvider'],
            key: 'serviceProvider',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.serviceOperator.serviceProvider || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Amount',
            sorter: true,
            dataIndex: ['order', 'amountInINR'],
            renkey: 'amountInINR',
            render: (_: any, data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(data?.order.amountInINR)}
                </Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            sorter: true,
        },
        {
            title: 'Remarks',
            dataIndex: 'remarks',
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
                dropDownData={dropDownData}
                setSearchText={setSearchText}
                handleChangeFilters={handleChangeFilters}
                handleSearch={updateSearchText}
                searchText={searchTransaction}
                handleDownloadReport={downloadReport}
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
                // scroll={{ x: 756 }}
                onChange={handleTableChange}
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

export default Vendors;
