import { useState } from 'react';

import { StopOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Modal, Pagination, Select, Tag, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly } from '@utils/dateFormat';

import { completeTermination } from '../../api/corporateCardTerminations';
import useTerminationRequests from '../../hooks/useTerminationRequests';
import {
    TerminationRequestRow,
    TerminationRequestStatus,
} from '../../types/corporateCardTerminations';

const STATUS_META: Record<TerminationRequestStatus, { color: string; bg: string; label: string }> =
    {
        PENDING: { color: '#D97706', bg: '#FFFBEB', label: 'Requested' },
        APPROVED: { color: '#3AB75E', bg: '#ECFDF3', label: 'Completed' },
    };

const STATUS_OPTIONS: { label: string; value: TerminationRequestStatus }[] = (
    Object.keys(STATUS_META) as TerminationRequestStatus[]
).map(value => ({ value, label: STATUS_META[value].label }));

const initialFilters = {
    status: 'PENDING' as TerminationRequestStatus | '',
    page: 1,
    itemsPerPage: 10,
};

const CorporateCardTerminations = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [filters, setFilters] = useState(initialFilters);
    const [confirmRow, setConfirmRow] = useState<TerminationRequestRow | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);

    const { isLoading, tableData, count, refetch } = useTerminationRequests(filters);

    const handleStatusFilter = (value: TerminationRequestStatus | '') => {
        setFilters(prev => ({ ...prev, status: value, page: 1 }));
    };

    const handleConfirmComplete = async () => {
        if (!confirmRow) return;
        setIsCompleting(true);
        const res = await completeTermination(role, id, confirmRow.id);
        setIsCompleting(false);
        if (res) {
            dispatch(
                showToast({ variant: 'success', description: 'Termination marked as completed.' })
            );
            setConfirmRow(null);
            refetch();
        } else {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Could not complete this termination. Please try again.',
                })
            );
        }
    };

    const columns = [
        {
            title: 'Corporate',
            dataIndex: 'companyName',
            key: 'companyName',
            width: 200,
            render: (val: string | null, row: TerminationRequestRow) => (
                <Typography.Text
                    ellipsis={{ tooltip: val || undefined }}
                    className="font-medium text-textHeadings"
                >
                    {val || `Corporate #${row.corporateId}`}
                </Typography.Text>
            ),
        },
        {
            title: 'Cardholder',
            dataIndex: 'cardholder',
            key: 'cardholder',
            width: 180,
            render: (val: string | null) => (
                <Typography.Text ellipsis={{ tooltip: val || undefined }}>
                    {val || '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Card',
            dataIndex: 'cardLast4',
            key: 'cardLast4',
            width: 130,
            render: (val: string | null) =>
                val ? <Typography.Text className="font-mono">•••• {val}</Typography.Text> : '-',
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            width: 220,
            render: (val: string | null) => (
                <Typography.Text
                    ellipsis={{ tooltip: val || undefined }}
                    className="text-sm text-textBody"
                >
                    {val || '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Requested',
            dataIndex: 'requestedAt',
            key: 'requestedAt',
            width: 130,
            render: (val: string) => (
                <Typography.Text className="text-sm">
                    {val ? formattedDateOnly(new Date(val)) : '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: TerminationRequestStatus) => {
                const meta = STATUS_META[status] ?? STATUS_META.PENDING;
                return (
                    <Tag
                        className="rounded-full border-0 px-3 py-0.5 text-xs font-medium"
                        style={{ color: meta.color, backgroundColor: meta.bg }}
                    >
                        {meta.label}
                    </Tag>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            width: 150,
            render: (_: unknown, row: TerminationRequestRow) =>
                row.status === 'PENDING' ? (
                    <Button size="small" onClick={() => setConfirmRow(row)}>
                        Mark Completed
                    </Button>
                ) : (
                    <Typography.Text className="text-xs italic text-textGreyLight">
                        Done
                    </Typography.Text>
                ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Flex align="center" gap={12}>
                <div className="flex size-10 items-center justify-center rounded-xl bg-bgIconCard">
                    <StopOutlined className="text-xl text-brandColor" />
                </div>
                <Flex vertical gap={2}>
                    <Typography.Title level={4} className="!mb-0">
                        Card Termination Requests
                    </Typography.Title>
                    <Typography.Text className="text-sm text-textBody">
                        Cards a corporate has requested to terminate. The vendor-side closure is a
                        manual process — mark a request Completed once it&apos;s confirmed done.
                    </Typography.Text>
                </Flex>
            </Flex>

            <div className="rounded-2xl border border-borderCard bg-white p-4 sm:p-6">
                <Flex
                    gap={12}
                    wrap
                    align="center"
                    justify="space-between"
                    className="border-b border-borderDivider pb-4"
                >
                    <Select<TerminationRequestStatus | undefined>
                        allowClear
                        placeholder="Filter by status"
                        options={STATUS_OPTIONS}
                        value={filters.status || undefined}
                        onChange={value => handleStatusFilter(value || '')}
                        className="w-full sm:w-[170px]"
                    />
                    {!isLoading && (
                        <Tag className="rounded-full border-0 bg-bgLightGray px-3 py-1 text-xs font-medium text-textGreyColor">
                            {count} {count === 1 ? 'request' : 'requests'}
                        </Tag>
                    )}
                </Flex>

                <div className="pt-4">
                    <GenericTable
                        columns={columns}
                        dataSource={tableData}
                        loading={isLoading}
                        rowKey="id"
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        filters.status === 'PENDING'
                                            ? 'No open termination requests.'
                                            : 'No termination requests match this filter.'
                                    }
                                />
                            ),
                        }}
                    />

                    {count > 0 && (
                        <Flex justify="end" className="pt-4">
                            <Pagination
                                current={filters.page}
                                pageSize={filters.itemsPerPage}
                                total={count}
                                showSizeChanger={false}
                                hideOnSinglePage
                                onChange={page => setFilters(prev => ({ ...prev, page }))}
                            />
                        </Flex>
                    )}
                </div>
            </div>

            <Modal
                open={confirmRow !== null}
                onCancel={() => setConfirmRow(null)}
                onOk={handleConfirmComplete}
                okText="Mark Completed"
                okButtonProps={{ danger: true, loading: isCompleting }}
                title="Mark termination completed"
                destroyOnHidden
            >
                <Typography.Text>
                    Confirm the vendor-side closure for card{' '}
                    <span className="font-semibold">
                        {confirmRow?.cardLast4 ? `•••• ${confirmRow.cardLast4}` : 'this card'}
                    </span>{' '}
                    is done. This cannot be undone.
                </Typography.Text>
            </Modal>
        </Flex>
    );
};

export default CorporateCardTerminations;
