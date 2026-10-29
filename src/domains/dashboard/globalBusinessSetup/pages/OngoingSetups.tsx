import React, { useState } from 'react';

import { Button, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';
import { formattedDateTime } from '@utils/dateFormat';

import Header from '../components/Header';
import useFilter from '../hooks/useFilter';
import useGetOngoingSetups from '../hooks/useOngoingSetups';
import { Company } from '../types';

const OngoingSetups = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
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
    const { isLoading, tableData, count } = useGetOngoingSetups(filters);
    const navigate = useNavigate();

    const formatLabel = (value?: string) => {
        if (!value) return 'N/A';

        return value
            .split('_')
            .map(word =>
                word.toUpperCase() === word ? word : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join(' ');
    };

    const getApplicationDisplayId = (record: Company) =>
        record.application_id || record.tracking_id || record._id || 'N/A';

    const columns = [
        {
            title: 'Application No.',
            key: 'application_id',
            render: (_: unknown, record: Company) => (
                <Typography.Text>{getApplicationDisplayId(record)}</Typography.Text>
            ),
        },
        {
            title: 'Date Added',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (value: string) => (
                <Typography.Text>
                    {value ? formattedDateTime(new Date(value)) : 'N/A'}
                </Typography.Text>
            ),
        },
        {
            title: 'Proposed Name',
            dataIndex: 'proposed_name',
            key: 'proposed_name',
            render: (value: string) => <Typography.Text>{value || 'N/A'}</Typography.Text>,
        },
        {
            title: 'Country',
            key: 'country',
            render: (_: unknown, record: Company) => (
                <Typography.Text>{record.country?.name || 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'Type of Company',
            dataIndex: 'type',
            key: 'type',
            render: (value: string) => (
                <Typography.Text>
                    {value === 'freezone' ? 'Free Zone' : formatLabel(value)}
                </Typography.Text>
            ),
        },
        {
            title: 'Actions',
            dataIndex: '_id',
            key: 'id',
            render: (id: string) => (
                <Button
                    danger
                    type="default"
                    size="small"
                    disabled={!id}
                    onClick={() =>
                        navigate(
                            `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.ongoingSetups}/${paths.globalBusinessSetup.viewRequest}/${id}`
                        )
                    }
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <>
            <Header
                title="Ongoing Setups"
                handleSearch={updateSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                from={filters.from}
                to={filters.to}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
            />
            <GenericTable
                rowKey={record =>
                    record._id ||
                    record.reference_id ||
                    record.application_id ||
                    record.tracking_id ||
                    record.proposed_name
                }
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
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

export default OngoingSetups;
