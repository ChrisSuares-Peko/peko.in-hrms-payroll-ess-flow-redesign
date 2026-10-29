import React, { useEffect, useMemo, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Modal, Pagination, Select, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { LeaveDoc } from '../../types';
import {
    LeaveUiRow,
    UiLeaveStatus,
    formatDateRange,
    mapLeaveStatus,
} from '../../utils/leaveMappers';

const { Text } = Typography;

interface MyRequestsTabProps {
    leaves: LeaveDoc[];
    total: number;
    limit: number;
    fetchLeaves: (params?: { status?: string; page?: number }) => Promise<void>;
    cancelLeave: (leaveId: string) => Promise<boolean>;
}

const statusColor: Record<UiLeaveStatus, string> = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'error',
    Cancelled: 'default',
};

const customStatusStyle: Partial<Record<UiLeaveStatus, { bg: string; color: string }>> = {
    Approved: { bg: '#ECFDF3', color: '#027A48' },
    Pending: { bg: '#FFFBEB', color: '#F59E0B' },
    Rejected: { bg: '#FEF2F2', color: '#EF4444' },
};

const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'applied', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
];

const MyRequestsTab: React.FC<MyRequestsTabProps> = ({
    leaves,
    total,
    limit,
    fetchLeaves,
    cancelLeave,
}) => {
    const dispatch = useAppDispatch();
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [viewRow, setViewRow] = useState<LeaveUiRow | null>(null);
    const [cancelTarget, setCancelTarget] = useState<LeaveUiRow | null>(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        fetchLeaves({ status: statusFilter === 'All' ? undefined : statusFilter, page });
    }, [fetchLeaves, statusFilter, page]);

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleConfirmCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        const ok = await cancelLeave(cancelTarget.key);
        setCancelling(false);
        if (ok) {
            setCancelTarget(null);
            dispatch(showToast({ description: 'Leave request cancelled', variant: 'success' }));
        }
    };

    const rows = useMemo<LeaveUiRow[]>(
        () =>
            leaves.map(doc => ({
                key: doc.id,
                dateRange: formatDateRange(doc.start, doc.end),
                type: doc.typeOfLeave?.leaveType ?? 'Leave',
                days: doc.leaveCount,
                status: mapLeaveStatus(doc.status),
                notes: doc.notes,
                canCancel: doc.status === 'applied',
            })),
        [leaves]
    );

    const columns: ColumnsType<LeaveUiRow> = [
        {
            title: 'Date',
            dataIndex: 'dateRange',
            key: 'date',
            width: 200,
            render: (text: string) => (
                <Text className="text-valueText text-sm font-medium">{text}</Text>
            ),
        },
        {
            title: 'Leave type',
            dataIndex: 'type',
            key: 'type',
            width: 180,
            render: (text: string) => <Text className="text-valueText text-sm">{text}</Text>,
        },
        {
            title: 'Days',
            dataIndex: 'days',
            key: 'days',
            width: 120,
            render: (days: number) => (
                <Text className="text-valueText text-sm">
                    {days} {days === 1 ? 'day' : 'days'}
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (status: UiLeaveStatus) => {
                const custom = customStatusStyle[status];
                if (custom) {
                    return (
                        <Tag
                            bordered={false}
                            className="rounded-full px-3"
                            style={{ backgroundColor: custom.bg, color: custom.color }}
                        >
                            {status}
                        </Tag>
                    );
                }
                return (
                    <Tag color={statusColor[status]} bordered={false} className="rounded-full px-3">
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            width: 140,
            align: 'right',
            render: (_: unknown, row: LeaveUiRow) => (
                <div className="flex justify-end gap-2">
                    <Button
                        className="h-9 rounded-lg font-normal text-[12px]"
                        style={{ borderColor: '#CBD5E1', color: '#475569', padding: '0 18px' }}
                        onClick={() => setViewRow(row)}
                    >
                        View
                    </Button>
                    {row.canCancel && (
                        <Button
                            className="inline-flex items-center gap-1 h-9 rounded-lg font-normal text-[12px]"
                            style={{
                                borderColor: '#EF4444',
                                color: '#EF4444',
                                borderWidth: 0.5,
                                padding: '2.56px 4px 2.56px 8px',
                            }}
                            onClick={() => setCancelTarget(row)}
                        >
                            Cancel
                            <CloseOutlined className="text-[10px]" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="mt-2">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <Text className="text-base font-semibold text-valueText">Leave History</Text>
                    <Select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        options={statusOptions}
                        style={{ width: 160 }}
                    />
                </div>

                <GenericTable rowKey="key" dataSource={rows} columns={columns} />
                {total > limit && (
                    <div className="flex justify-end mt-4">
                        <Pagination
                            current={page}
                            pageSize={limit}
                            total={total}
                            showSizeChanger={false}
                            onChange={p => setPage(p)}
                        />
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={cancelTarget !== null}
                handleCancel={() => setCancelTarget(null)}
                title="Cancel leave request"
                description={
                    cancelTarget
                        ? `Cancel your ${cancelTarget.type} request for ${cancelTarget.dateRange}?`
                        : undefined
                }
                handleSubmit={handleConfirmCancel}
                isLoading={cancelling}
            />

            <Modal
                open={viewRow !== null}
                onCancel={() => setViewRow(null)}
                footer={null}
                centered
                width={440}
                title="Leave Details"
                styles={{ content: { padding: 24, borderRadius: 24, overflow: 'hidden' } }}
            >
                {viewRow && (
                    <div className="flex flex-col gap-2 pt-2">
                        <Text className="text-titleText text-sm">
                            {viewRow.type} · {viewRow.dateRange}
                        </Text>
                        <Text className="text-valueText text-sm">
                            {viewRow.notes || 'No additional notes provided.'}
                        </Text>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyRequestsTab;
