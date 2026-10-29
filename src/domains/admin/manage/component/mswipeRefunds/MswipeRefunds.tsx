import { useEffect, useState } from 'react';

import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tag, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import MswipeRefundsHeader from './MswipeRefundsHeader';
import MswipeRefundStatusModal from './MswipeRefundStatusModal';
import useMswipeRefunds from '../../hooks/mswipeRefunds/useMswipeRefunds';
import useFilter from '../../hooks/useFilters';
import { MswipeRefund, MswipeRefundFilters, MswipeRefundStatus } from '../../types/mswipeRefunds';

const STATUS_COLORS: Record<MswipeRefundStatus, string> = {
    PENDING: 'warning',
    IN_PROGRESS: 'processing',
    SUCCESS: 'success',
    FAILED: 'error',
};

const MswipeRefunds = () => {
    const [filters, setFilters] = useState<MswipeRefundFilters>({
        searchText: '',
        page: 1,
        itemsPerPage: 10,
    });
    const [selectedRefund, setSelectedRefund] = useState<MswipeRefund | null>(null);
    const [accessPermission, setAccessPermission] = useState<any>();

    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Mswipe Refunds');

    useEffect(() => {
        if (service) setAccessPermission(service);
    }, [service]);

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { handlePageChange, handlePartnerChange, handleDateChange } = useFilter({ setFilters });
    const { rows, statuses, count, isLoading, isUpdating, updateStatus } =
        useMswipeRefunds(filters);

    const handleStatusChange = (status?: string) =>
        setFilters(prevState => ({ ...prevState, status, page: 1 }));

    const canUpdate = (record: MswipeRefund) =>
        Boolean(accessPermission?.update) && record.nextStatuses.length > 0;

    const columns = [
        {
            title: 'Requested On',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text type="secondary">
                        {formattedTime(new Date(createdAt))}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Transaction ID',
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
            render: (corporateTxnId: string) => <Typography.Text>{corporateTxnId}</Typography.Text>,
        },
        {
            title: 'Customer',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (_: unknown, record: MswipeRefund) => (
                <Flex vertical>
                    <Typography.Text>{record.customerName || 'N/A'}</Typography.Text>
                    {record.customerEmail && (
                        <Typography.Text type="secondary">{record.customerEmail}</Typography.Text>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Partner',
            dataIndex: 'partnerName',
            key: 'partnerName',
            render: (partnerName: string | null) => (
                <Typography.Text>{partnerName || 'Default'}</Typography.Text>
            ),
        },
        {
            title: 'Service',
            dataIndex: 'serviceName',
            key: 'serviceName',
            render: (serviceName: string | null) => (
                <Typography.Text>{serviceName || 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'Refund Amount',
            dataIndex: 'refundAmount',
            key: 'refundAmount',
            render: (refundAmount: number) => (
                <Typography.Text>₹ {formatNumberWithLocalString(refundAmount)}</Typography.Text>
            ),
        },
        {
            title: 'Mswipe IPG ID',
            dataIndex: 'gatewayOrderId',
            key: 'gatewayOrderId',
            render: (gatewayOrderId: string | null) => (
                <Typography.Text>{gatewayOrderId || 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'statusName',
            key: 'status',
            render: (statusName: string, record: MswipeRefund) => (
                <Tag color={STATUS_COLORS[record.status]}>{statusName}</Tag>
            ),
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (_: unknown, record: MswipeRefund) =>
                canUpdate(record) ? (
                    <EditOutlined
                        className="cursor-pointer"
                        onClick={() => setSelectedRefund(record)}
                    />
                ) : (
                    <EyeOutlined
                        className="cursor-pointer"
                        onClick={() => setSelectedRefund(record)}
                    />
                ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <MswipeRefundsHeader
                searchText={searchText}
                handleSearch={updateSearchText}
                statuses={statuses}
                handleStatusChange={handleStatusChange}
                handlePartnerChange={handlePartnerChange}
                handleDateChange={handleDateChange}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={rows}
                pagination={false}
                loading={isLoading}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="justify-end text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {selectedRefund && (
                <MswipeRefundStatusModal
                    refund={selectedRefund}
                    statuses={statuses}
                    canUpdate={canUpdate(selectedRefund)}
                    isUpdating={isUpdating}
                    handleCancel={() => setSelectedRefund(null)}
                    handleSubmit={updateStatus}
                />
            )}
        </Flex>
    );
};

export default MswipeRefunds;
