import { useState } from 'react';

import { Button, Flex, Pagination, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import ApplicationDetailDrawer from './ApplicationDetailDrawer';
import {
    ENTITY_TYPE_LABEL,
    PAYMENT_STATUS_COLOR,
    STATUS_COLOR,
    VENDOR_STATUS_COLOR,
} from './constants';
import Header from './Header';
import { BRAdminApplication, retryVendorSync } from '../../api/businessRegistration';
import useBusinessRegistrationReport from '../../hooks/useBusinessRegistrationReport';
import useFilter from '../../hooks/useFilter';

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
    entityType: '',
    paymentStatus: '',
};

const BusinessRegistrationReport = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [filters, setFilters] = useState(initialValues);
    const [selectedApplication, setSelectedApplication] = useState<BRAdminApplication | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [retryLoading, setRetryLoading] = useState(false);

    const { isLoading, tableData, count, detailLoading, fetchDetail } =
        useBusinessRegistrationReport(filters);

    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const setFilter = (key: 'status' | 'entityType' | 'paymentStatus') => (val: string) => {
        setFilters(prev => ({ ...prev, [key]: val ?? '', page: 1 }));
    };

    const handleViewDetails = async (record: BRAdminApplication) => {
        setDrawerOpen(true);
        setSelectedApplication(record);
        const detail = await fetchDetail(record.applicationId);
        if (detail) setSelectedApplication(detail);
    };

    // Restart the vendor chain in the background, then refresh the timeline once
    // the chain has had time to progress. The BE guards double-triggers.
    const handleRetry = async (forceSmartForm2 = false) => {
        if (!selectedApplication) return;
        const { applicationId } = selectedApplication;
        setRetryLoading(true);
        const ok = await retryVendorSync({ userId: id, userType: role, applicationId, forceSmartForm2 });
        setRetryLoading(false);
        const successMsg = forceSmartForm2
            ? 'Filing application (documents skipped) — stages will update shortly'
            : 'Vendor sync restarted — stages will update shortly';
        dispatch(
            showToast({
                description: ok ? successMsg : 'Could not restart the vendor sync',
                variant: ok ? 'success' : 'error',
            })
        );
        if (!ok) return;
        setSelectedApplication(prev =>
            prev && prev.applicationId === applicationId
                ? { ...prev, vendorStatus: 'SENDING' }
                : prev
        );
        setTimeout(async () => {
            const detail = await fetchDetail(applicationId);
            if (detail) {
                setSelectedApplication(prev =>
                    prev && prev.applicationId === applicationId ? detail : prev
                );
            }
        }, 10_000);
    };

    const columns = [
        {
            title: 'Created On',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            render: (_: any, data: BRAdminApplication) => (
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
            render: (_: any, data: BRAdminApplication) => (
                <Flex vertical>
                    <Typography.Text code>{data.applicationId}</Typography.Text>
                    {data.vendorApplicationId && (
                        <Typography.Text type="secondary" className="text-xs">
                            IndiaFilings: {data.vendorApplicationId}
                        </Typography.Text>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Corporate',
            dataIndex: ['credential', 'name'],
            key: 'corporate',
            render: (_: any, data: BRAdminApplication) => (
                <Flex vertical>
                    <Typography.Text>{data.credential?.name || '-'}</Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                        {data.credential?.username || '-'}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Entity Type',
            dataIndex: 'entityType',
            key: 'entityType',
            render: (_: any, data: BRAdminApplication) => (
                <Tag>{ENTITY_TYPE_LABEL[data.entityType] ?? data.entityType}</Tag>
            ),
        },
        {
            title: 'Business Name',
            dataIndex: 'businessName',
            key: 'businessName',
            render: (_: any, data: BRAdminApplication) => (
                <Typography.Text>{data.businessName || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            render: (_: any, data: BRAdminApplication) => (
                <Tag color={STATUS_COLOR[data.status]}>{data.status}</Tag>
            ),
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (_: any, data: BRAdminApplication) => (
                <Tag color={PAYMENT_STATUS_COLOR[data.paymentStatus ?? 'PENDING']}>
                    {data.paymentStatus ?? 'PENDING'}
                </Tag>
            ),
        },
        {
            title: 'Vendor Status',
            dataIndex: 'vendorStatus',
            key: 'vendorStatus',
            render: (_: any, data: BRAdminApplication) => (
                <Tag color={VENDOR_STATUS_COLOR[data.vendorStatus ?? 'NOT_SENT']}>
                    {data.vendorStatus ?? 'NOT_SENT'}
                </Tag>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            sorter: true,
            render: (_: any, data: BRAdminApplication) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(data.totalAmount ?? 0)}
                </Typography.Text>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, data: BRAdminApplication) => (
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
                handleEntityTypeChange={setFilter('entityType')}
                handlePaymentStatusChange={setFilter('paymentStatus')}
            />
            <GenericTable
                rowKey={record => record.applicationId}
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
                onRetry={() => handleRetry(false)}
                onForceFile={() => handleRetry(true)}
                retryLoading={retryLoading}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedApplication(null);
                }}
            />
        </Flex>
    );
};

export default BusinessRegistrationReport;
