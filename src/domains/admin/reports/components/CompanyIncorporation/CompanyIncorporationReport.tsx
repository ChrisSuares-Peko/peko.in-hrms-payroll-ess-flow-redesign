import { useState } from 'react';

import { Button, Flex, Pagination, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import ApplicationDetailDrawer from './ApplicationDetailDrawer';
import Header from './Header';
import { AdminApplication } from '../../api/companyIncorporation';
import useCompanyIncorporationReport from '../../hooks/useCompanyIncorporationReport';
import useFilter from '../../hooks/useFilter';

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'orange',
    SUBMITTED: 'blue',
    UNDER_REVIEW: 'purple',
    APPROVED: 'green',
    REJECTED: 'red',
};

const VENDOR_STATUS_COLOR: Record<string, string> = {
    NOT_SENT: 'default',
    SENDING: 'blue',
    SENT: 'green',
    FAILED: 'red',
};

const ENTITY_TYPE_LABEL: Record<string, string> = {
    private_limited: 'Private Limited',
    public_limited: 'Public Limited',
    opc: 'OPC',
    llp: 'LLP',
};

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
};

const CompanyIncorporationReport = () => {
    const [filters, setFilters] = useState(initialValues);
    const [selectedApplication, setSelectedApplication] = useState<AdminApplication | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { isLoading, tableData, count, detailLoading, fetchDetail } =
        useCompanyIncorporationReport(filters);

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

    const handleStatusChange = (val: string) => {
        setFilters(prev => ({ ...prev, status: val ?? '', page: 1 }));
    };

    const handleEntityTypeChange = (val: string) => {
        setFilters(prev => ({ ...prev, entityType: val ?? '', page: 1 }));
    };

    const handleViewDetails = async (record: AdminApplication) => {
        setDrawerOpen(true);
        setSelectedApplication(record);
        const detail = await fetchDetail(record.applicationId);
        if (detail) setSelectedApplication(detail);
    };

    const columns = [
        {
            title: 'Submitted On',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            render: (_: any, data: AdminApplication) => (
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
            render: (_: any, data: AdminApplication) => (
                <Typography.Text code>{data.applicationId}</Typography.Text>
            ),
        },
        {
            title: 'Corporate',
            dataIndex: ['credential', 'name'],
            key: 'corporate',
            render: (_: any, data: AdminApplication) => (
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
            render: (_: any, data: AdminApplication) => (
                <Tag>{ENTITY_TYPE_LABEL[data.entityType] ?? data.entityType}</Tag>
            ),
        },
        {
            title: 'Proposed Name',
            dataIndex: 'proposedNames',
            key: 'proposedNames',
            render: (_: any, data: AdminApplication) => (
                <Typography.Text>{data.proposedNames?.firstChoice || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Applicant',
            dataIndex: 'applicantDetails',
            key: 'applicantDetails',
            render: (_: any, data: AdminApplication) => (
                <Typography.Text>{data.applicantDetails?.fullName || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            render: (_: any, data: AdminApplication) => (
                <Tag color={STATUS_COLOR[data.status]}>{data.status}</Tag>
            ),
        },
        {
            title: 'Vendor Status',
            dataIndex: 'vendorStatus',
            key: 'vendorStatus',
            render: (_: any, data: AdminApplication) => (
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
            render: (_: any, data: AdminApplication) => (
                <Typography.Text>₹ {formatNumberWithLocalString(data.totalAmount ?? 0)}</Typography.Text>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, data: AdminApplication) => (
                <Button
                    type="default"
                    size="small"
                    onClick={() => handleViewDetails(data)}
                >
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
                handleStatusChange={handleStatusChange}
                handleEntityTypeChange={handleEntityTypeChange}
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
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedApplication(null);
                }}
            />
        </Flex>
    );
};

export default CompanyIncorporationReport;
