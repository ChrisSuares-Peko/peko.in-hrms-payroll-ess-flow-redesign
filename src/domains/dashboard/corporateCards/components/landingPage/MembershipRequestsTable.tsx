import { useState } from 'react';

import { Button, Typography } from 'antd';
import type { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';
import { formatCompleteDate } from '@utils/dateFormat';

import InitialsAvatar from './InitialsAvatar';
import { CardRequestItem } from '../../api/admin/requestsApi';
import ConfirmActionModal from '../common/ConfirmActionModal';

const { Text } = Typography;

type PendingDecision = { request: CardRequestItem; action: 'approve' | 'reject' } | null;

export interface MembershipRequestsTableProps {
    requests: CardRequestItem[];
    isLoading?: boolean;
    approvingIds: number[];
    rejectingIds: number[];
    onApprove: (requestId: number) => void;
    onReject: (requestId: number) => void;
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

const CONFIRM_COPY = {
    approve: {
        title: 'Approve Access Request?',
        description:
            'The employee will receive access to Corporate Cards with the Employee role and can begin the KYC process immediately.',
        confirmLabel: 'Approve Access',
        danger: false,
    },
    reject: {
        title: 'Reject Access Request?',
        description:
            'The employee will be notified that their access request has been rejected. They can submit a new request if needed.',
        confirmLabel: 'Yes, Reject',
        danger: true,
    },
};

/** Employees who have asked for Corporate Cards access and are waiting on a decision. */
const MembershipRequestsTable = ({
    requests,
    isLoading,
    approvingIds,
    rejectingIds,
    onApprove,
    onReject,
    page,
    pageSize,
    total,
    onPageChange,
}: MembershipRequestsTableProps) => {
    const [pending, setPending] = useState<PendingDecision>(null);

    const confirm = () => {
        if (!pending) return;
        if (pending.action === 'approve') onApprove(pending.request.id);
        else onReject(pending.request.id);
        setPending(null);
    };

    const columns: ColumnsType<CardRequestItem> = [
        {
            key: 'member',
            title: 'Employee',
            dataIndex: 'member',
            width: 280,
            render: (member: string | null, row) => (
                <div className="flex min-w-0 items-center gap-3">
                    <InitialsAvatar name={member || '—'} />
                    <div className="flex min-w-0 flex-col">
                        <Text className="truncate text-sm text-textHeadings">{member || '—'}</Text>
                        {row.memberEmail && (
                            <Text className="truncate text-xs text-textGreyLight">
                                {row.memberEmail}
                            </Text>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'date',
            title: 'Requested On',
            dataIndex: 'date',
            width: 220,
            render: (date: string) => (
                <Text className="whitespace-nowrap text-sm text-textBody">
                    {formatCompleteDate(date)}
                </Text>
            ),
        },
        {
            key: 'actions',
            title: 'Action',
            width: 170,
            // The queue is fetched PENDING-only, so this guards the row that was decided between the fetch
            // and the click — in another tab, or by a second admin.
            render: (_: unknown, row) =>
                row.status !== 'PENDING' ? (
                    <Text className="text-sm text-textGreyLight">–</Text>
                ) : (
                    <div className="flex flex-nowrap gap-2 [&_.ant-btn]:shrink-0">
                        <Button
                            danger
                            size="small"
                            onClick={() => setPending({ request: row, action: 'reject' })}
                            loading={rejectingIds.includes(row.id)}
                            disabled={approvingIds.includes(row.id)}
                        >
                            Reject
                        </Button>
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => setPending({ request: row, action: 'approve' })}
                            loading={approvingIds.includes(row.id)}
                            disabled={rejectingIds.includes(row.id)}
                        >
                            Approve
                        </Button>
                    </div>
                ),
        },
    ];

    return (
        <>
            <GenericTable
                columns={columns}
                dataSource={requests.map(request => ({ ...request, key: request.id }))}
                rowKey="key"
                loading={isLoading}
                scroll={{ x: 'max-content' }}
                pagination={{
                    current: page,
                    pageSize,
                    total,
                    onChange: onPageChange,
                    showSizeChanger: false,
                }}
            />

            <ConfirmActionModal
                open={!!pending}
                title={pending ? CONFIRM_COPY[pending.action].title : ''}
                description={pending ? CONFIRM_COPY[pending.action].description : ''}
                confirmLabel={pending ? CONFIRM_COPY[pending.action].confirmLabel : ''}
                danger={!!pending && CONFIRM_COPY[pending.action].danger}
                loading={
                    !!pending &&
                    (approvingIds.includes(pending.request.id) ||
                        rejectingIds.includes(pending.request.id))
                }
                onConfirm={confirm}
                onCancel={() => setPending(null)}
            />
        </>
    );
};

export default MembershipRequestsTable;
