import { useState } from 'react';

import { InfoCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Input, Modal, Pagination, Select, Tag, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly } from '@utils/dateFormat';

import { decideClosureRequest } from '../../api/corporateCardClosures';
import useClosureRequests from '../../hooks/useClosureRequests';
import { DECISION_NOTE_MAX, decisionNoteError } from '../../schema/closureDecisionSchema';
import { ClosureRequestRow, ClosureRequestStatus } from '../../types/corporateCardClosures';

const STATUS_META: Record<ClosureRequestStatus, { color: string; bg: string; label: string }> = {
    PENDING: { color: '#D97706', bg: '#FFFBEB', label: 'Awaiting review' },
    APPROVED: { color: '#DC2626', bg: '#FEF2F2', label: 'Closed' },
    REJECTED: { color: '#3AB75E', bg: '#ECFDF3', label: 'Rejected' },
    CANCELLED: { color: '#64748B', bg: '#F1F5F9', label: 'Cancelled' },
};

const FILTERABLE_STATUSES: ClosureRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

const STATUS_OPTIONS: { label: string; value: ClosureRequestStatus | '' }[] = [
    { value: '', label: 'All' },
    ...FILTERABLE_STATUSES.map(value => ({ value, label: STATUS_META[value].label })),
];

const emptyMessageFor = (status: ClosureRequestStatus | '') => {
    if (status === 'PENDING') return 'No open account closure requests.';
    if (!status) return 'No account closure requests yet.';
    return 'No closure requests match this filter.';
};

const initialFilters = {
    status: 'PENDING' as ClosureRequestStatus | '',
    page: 1,
    itemsPerPage: 10,
};

type Decision = 'approve' | 'reject';

const CorporateCardClosures = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [filters, setFilters] = useState(initialFilters);
    const [pending, setPending] = useState<{ row: ClosureRequestRow; decision: Decision } | null>(
        null
    );
    const [note, setNote] = useState('');
    const noteError = decisionNoteError(note);
    const [isDeciding, setIsDeciding] = useState(false);

    const { isLoading, tableData, count, refetch } = useClosureRequests(filters);

    const open = (row: ClosureRequestRow, decision: Decision) => {
        setPending({ row, decision });
        setNote('');
    };

    const close = () => {
        setPending(null);
        setNote('');
    };

    const handleDecide = async () => {
        if (!pending) return;
        setIsDeciding(true);
        const res = await decideClosureRequest(
            role,
            id,
            pending.row.id,
            pending.decision,
            note.trim() || undefined
        );
        setIsDeciding(false);
        if (!res) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Could not record this decision. Please try again.',
                })
            );
            return;
        }

        const applied = res.data?.applied;
        const frozenCount = applied?.cards?.frozen ?? 0;
        dispatch(
            showToast({
                variant: 'success',
                description:
                    pending.decision === 'approve'
                        ? `Account closed successfully. ${frozenCount} card${
                              frozenCount === 1 ? ' was' : 's were'
                          } frozen, and KYB has been reset.`
                        : 'Closure request rejected.',
            })
        );
        if (pending.decision === 'approve' && applied?.cards?.vendorUnavailable) {
            dispatch(
                showToast({
                    variant: 'warning',
                    description:
                        'The KYB was reset but the cards could not be frozen — freeze them manually from the Cards screen.',
                })
            );
        }
        close();
        refetch();
    };

    const columns = [
        {
            title: 'Corporate',
            dataIndex: 'companyName',
            key: 'companyName',
            width: 200,
            render: (val: string | null, row: ClosureRequestRow) => (
                <Flex vertical gap={2}>
                    <Typography.Text
                        ellipsis={{ tooltip: val || undefined }}
                        className="font-medium text-textHeadings"
                    >
                        {val || `Corporate #${row.corporateId}`}
                    </Typography.Text>
                    {row.email && (
                        <Typography.Text className="text-xs text-textGreyLight">
                            {row.email}
                        </Typography.Text>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Reason',
            dataIndex: 'reasonLabel',
            key: 'reasonLabel',
            width: 200,
            render: (val: string) => (
                <Typography.Text ellipsis={{ tooltip: val }} className="text-sm text-textBody">
                    {val || '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Details',
            dataIndex: 'details',
            key: 'details',
            width: 240,
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
            title: 'Requested by',
            dataIndex: 'requestedByName',
            key: 'requestedByName',
            width: 170,
            render: (val: string | null) => (
                <Typography.Text ellipsis={{ tooltip: val || undefined }} className="text-sm">
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
            width: 140,
            render: (status: ClosureRequestStatus) => {
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
            width: 190,
            render: (_: unknown, row: ClosureRequestRow) =>
                row.status === 'PENDING' ? (
                    <Flex gap={8}>
                        <Button size="small" danger onClick={() => open(row, 'approve')}>
                            Approve
                        </Button>
                        <Button size="small" onClick={() => open(row, 'reject')}>
                            Reject
                        </Button>
                    </Flex>
                ) : (
                    <Typography.Text
                        ellipsis={{ tooltip: row.decisionNote || undefined }}
                        className="text-xs italic text-textGreyLight"
                    >
                        {row.decisionNote || 'Decided'}
                    </Typography.Text>
                ),
        },
    ];

    const approving = pending?.decision === 'approve';
    const companyLabel =
        pending?.row.companyName || (pending ? `Corporate #${pending.row.corporateId}` : '');

    return (
        <Flex vertical gap={20}>
            <Flex align="center" gap={12}>
                <div className="flex size-10 items-center justify-center rounded-xl bg-bgIconCard">
                    <LogoutOutlined className="text-xl text-brandColor" />
                </div>
                <Flex vertical gap={2}>
                    <Typography.Title level={4} className="!mb-0">
                        Account Closure Requests
                    </Typography.Title>
                    <Typography.Text className="text-sm text-textBody">
                        Corporates that have asked to close their Peko account. Approving freezes
                        their cards and resets KYB — their documents are kept so they can restart.
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
                    <Select<ClosureRequestStatus | ''>
                        placeholder="Filter by status"
                        options={STATUS_OPTIONS}
                        value={filters.status}
                        onChange={value =>
                            setFilters(prev => ({ ...prev, status: value ?? '', page: 1 }))
                        }
                        className="w-full sm:w-[180px]"
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
                                    description={emptyMessageFor(filters.status)}
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
                open={pending !== null}
                onCancel={close}
                onOk={handleDecide}
                okText={approving ? 'Approve closure' : 'Reject request'}
                okButtonProps={{
                    danger: approving,
                    loading: isDeciding,
                    disabled: noteError !== null,
                }}
                title={approving ? 'Approve account closure' : 'Reject closure request'}
                destroyOnHidden
            >
                <Flex vertical gap={14}>
                    <Typography.Text className="text-sm text-textBody">
                        {approving ? (
                            <>
                                <span className="font-semibold text-textHeadings">
                                    {companyLabel}
                                </span>{' '}
                                will be closed.
                            </>
                        ) : (
                            <>
                                <span className="font-semibold text-textHeadings">
                                    {companyLabel}
                                </span>{' '}
                                keeps full access and may request closure again later.
                            </>
                        )}
                    </Typography.Text>

                    {approving && (
                        <Flex
                            gap={8}
                            align="start"
                            className="rounded-xl border border-errorTextRed/30 bg-bgLightPink px-4 py-3"
                        >
                            <InfoCircleOutlined className="mt-0.5 shrink-0 text-errorTextRed" />
                            <Typography.Text className="text-sm text-errorTextRed">
                                All their cards will be frozen and KYB reset to the beginning, so no
                                employee can transact. Uploaded documents and agreement details are
                                kept, so the corporate can restart KYB with its data prefilled.
                            </Typography.Text>
                        </Flex>
                    )}

                    <Flex vertical gap={6}>
                        <Typography.Text className="text-sm text-textBody">
                            Decision note (optional)
                        </Typography.Text>
                        <Input.TextArea
                            rows={3}
                            maxLength={DECISION_NOTE_MAX}
                            value={note}
                            placeholder="Why this was approved or rejected"
                            status={noteError ? 'error' : undefined}
                            onChange={event => setNote(event.target.value)}
                        />
                        {noteError && (
                            <Typography.Text className="text-xs text-errorTextRed">
                                {noteError}
                            </Typography.Text>
                        )}
                    </Flex>
                </Flex>
            </Modal>
        </Flex>
    );
};

export default CorporateCardClosures;
