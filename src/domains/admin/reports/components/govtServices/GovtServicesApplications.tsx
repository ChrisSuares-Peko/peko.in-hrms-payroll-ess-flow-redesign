import { useState } from 'react';

import { Button, Flex, Pagination, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import ApplicationDetailDrawer from './ApplicationDetailDrawer';
import { PAYMENT_STATUS_COLOR, STATUS_COLOR } from './constants';
import Header from './Header';
import { GSV2AdminApplication } from '../../api/governmentServicesApplicationV2';
import useFilter from '../../hooks/useFilter';
import useGovernmentServicesApplicationV2Report from '../../hooks/useGovernmentServicesApplicationV2Report';

const today = dayjs();

const initialValues = {
    searchText: '',
    sort: 'DESC',
    sortField: 'createdAt',
    page: 1,
    itemsPerPage: 10,
    from: today.subtract(30, 'day').format('YYYY-MM-DD'),
    to: today.format('YYYY-MM-DD'),
    id: '',
    status: '',
    paymentStatus: '',
};

// Gov Services V2 (vendor catalog, e.g. Trademark Registration) — same list/detail/report shape as BusinessRegistration's report.
const GovtServicesApplications = () => {
    const [filters, setFilters] = useState(initialValues);
    const [selectedApplication, setSelectedApplication] = useState<GSV2AdminApplication | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { isLoading, tableData, count, detailLoading, fetchDetail } =
        useGovernmentServicesApplicationV2Report(filters);

    const { handlePageChange, handleDateChange, handleFromChange, handleToChange, handleTableChange } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const setFilter = (key: 'status' | 'paymentStatus') => (val: string) => {
        setFilters(prev => ({ ...prev, [key]: val ?? '', page: 1 }));
    };

    const handleViewDetails = async (record: GSV2AdminApplication) => {
        setDrawerOpen(true);
        setSelectedApplication(record);
        const detail = await fetchDetail(record.id);
        if (detail) setSelectedApplication(detail);
    };

    const columns = [
        {
            title: 'Created On',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            render: (_: any, data: GSV2AdminApplication) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(data.createdAt))}</Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                        {formattedTime(new Date(data.createdAt))}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Application ID',
            dataIndex: 'applicationId',
            key: 'applicationId',
            sorter: true,
            render: (_: any, data: GSV2AdminApplication) => (
                <Typography.Text code>{data.applicationId || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Service',
            key: 'service',
            render: (_: any, data: GSV2AdminApplication) => (
                <Flex vertical>
                    <Typography.Text>{data.serviceName || '-'}</Typography.Text>
                    {data.variantName && (
                        <Typography.Text type="secondary" className="text-xs">
                            {data.variantName}
                        </Typography.Text>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Corporate',
            key: 'corporate',
            render: (_: any, data: GSV2AdminApplication) => (
                <Flex vertical>
                    <Typography.Text>{data.credential?.name || '-'}</Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                        {data.credential?.username || '-'}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Business Name',
            dataIndex: 'legalBusinessName',
            key: 'legalBusinessName',
            render: (_: any, data: GSV2AdminApplication) => (
                <Typography.Text>{data.legalBusinessName || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            render: (_: any, data: GSV2AdminApplication) => (
                <Tag color={STATUS_COLOR[data.status]}>{data.status}</Tag>
            ),
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (_: any, data: GSV2AdminApplication) => (
                <Tag color={PAYMENT_STATUS_COLOR[data.paymentStatus ?? 'PENDING']}>
                    {data.paymentStatus ?? 'PENDING'}
                </Tag>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            sorter: true,
            render: (_: any, data: GSV2AdminApplication) => (
                <Typography.Text>₹ {formatNumberWithLocalString(Number(data.amount) || 0)}</Typography.Text>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, data: GSV2AdminApplication) => (
                <Button type="default" size="small" onClick={() => handleViewDetails(data)}>
                    View
                </Button>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Header
                searchText={searchText}
                handleSearch={updateSearchText}
                from={filters.from ?? initialValues.from}
                to={filters.to ?? initialValues.to}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                handleStatusChange={setFilter('status')}
                handlePaymentStatusChange={setFilter('paymentStatus')}
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
            <ApplicationDetailDrawer
                open={drawerOpen}
                application={selectedApplication}
                loading={detailLoading}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedApplication(null);
                }}
            />
        </Flex>
    );
};

export default GovtServicesApplications;
