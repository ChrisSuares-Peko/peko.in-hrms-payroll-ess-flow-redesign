import React, { useState } from 'react';

import { Button, Flex, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';
import { formattedDateTime } from '@utils/dateFormat';

import Header from '../components/Header';
import useFilter from '../hooks/useFilter';
import useGetPendingApplications from '../hooks/usePendingApplications';
import {
    resetApplication,
    setApplicationId,
    setCountryData,
    setMetrics,
    setProvider,
} from '../slices/globalBusinessSetupSlice';
import { Company } from '../types/index';

const PendingApplications = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    // const [searchText, setSearchText] = useState('');
    const dispatch = useDispatch();
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        page: 1,
        itemsPerPage: 10,
        from: oneMonthAgoFormatted,
        to: todayFormatted,
    };
    const [filters, setFilters] = useState(initialValues);
    const {
        handlePageChange,
        handleDateChange,
        handleTableChange,
        handleFromChange,
        handleToChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading: isTableLoading, tableData, count } = useGetPendingApplications(filters);
    const navigate = useNavigate();

    function formatLabel(str?: string | null) {
        if (!str) return '';
        return str
            .split('_')
            .map(word =>
                word.toUpperCase() === word ? word : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join(' ');
    }

    const columns = [
        {
            title: 'Date',

            dataIndex: 'created_at',
            key: 'created_at',
            render: (data: string) => (
                <Typography.Text>{formattedDateTime(new Date(data))}</Typography.Text>
            ),
        },
        {
            title: 'Proposed Name',

            dataIndex: 'proposed_name',
            render: (data: number) => <Typography.Text>{data || 'N/A'}</Typography.Text>,
        },
        {
            title: 'Company Type ',

            dataIndex: 'type',
            render: (data: string) => (
                <Typography.Text>
                    {data === 'freezone' ? 'Free Zone' : formatLabel(data) || 'N/A'}
                </Typography.Text>
            ),
        },
        {
            title: 'Jurisdiction / Location',

            dataIndex: 'freezone',
            render: (data: string) => (
                <Typography.Text>{formatLabel(data) || 'N/A'}</Typography.Text>
            ),
        },

        // {
        //     title: 'Amount',

        //     dataIndex: 'totalAmount',
        //     render: (data: number) => (
        //         <Typography.Text>INR {data.toFixed(2) || 'N/A'}</Typography.Text>
        //     ),
        // },

        {
            title: 'Payment Status',

            dataIndex: 'is_paid',
            render: (data: string) => (
                <Typography.Text> {data ? 'Paid' : 'Pending'}</Typography.Text>
            ),
        },
        {
            title: 'Action',
            dataIndex: '_id',
            key: 'id',
            render: (id: string, record: Company) => (
                <Flex gap="small">
                    <Button
                        type="primary"
                        danger
                        onClick={() => {
                            if (record.status?.toLowerCase() === 'saved') {
                                // Completed application → details page, where the
                                // consent/compliance gate controls Proceed to Pay.
                                // Route is param-driven (no redux needed here).
                                navigate(
                                    `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}/${paths.globalBusinessSetup.viewRequest}/${id}`
                                );
                            } else {
                                // Draft → resume editing. EditSetup self-hydrates
                                // redux, but seed it here to avoid a flash of the
                                // previous application's state.
                                dispatch(resetApplication());
                                dispatch(setApplicationId(id!));
                                dispatch(setProvider(record.provider));
                                dispatch(
                                    setCountryData({
                                        country: record.country._id,
                                        type: record.type,
                                        freezone: record.freezone,
                                    })
                                );
                                dispatch(setMetrics(record.metrics));
                                navigate(
                                    `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}/${paths.globalBusinessSetup.edit}/${id}`,
                                    {
                                        state: {
                                            from: 'pendingApplications',
                                        },
                                    }
                                );
                            }
                        }}
                    >
                        Continue
                    </Button>
                    <Button
                        onClick={() =>
                            navigate(
                                `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}/${paths.globalBusinessSetup.viewRequest}/${id}`
                            )
                        }
                    >
                        View
                    </Button>
                </Flex>
            ),
        },
    ];

    return (
        <>
            <Header
                isPending
                handleSearch={updateSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                from={filters.from}
                to={filters.to}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
            />
            <GenericTable
                rowKey={record => record._id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isTableLoading}
                style={{ overflow: 'auto' }}
                scroll={{ x: 768 }}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="md:text-end text-center mt-5"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
        </>
    );
};

export default PendingApplications;
