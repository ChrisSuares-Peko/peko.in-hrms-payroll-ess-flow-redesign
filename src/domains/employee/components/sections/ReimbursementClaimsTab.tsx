import React, { useEffect, useMemo, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Image, Modal, Pagination, Popconfirm, Select, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';

import SubmitClaimModal from './SubmitClaimModal';
import calenderIcon from '../../assets/icons/calender.svg';
import rejectedIcon from '../../assets/icons/rejected.svg';
import verifiedIcon from '../../assets/img/verified.png';
import warningIcon from '../../assets/img/warning.png';
import { useReimbursements } from '../../hooks/useReimbursements';
import {
    ReimbursementUiRow,
    UiReimbursementStatus,
    formatAmount,
    toReimbursementRow,
} from '../../utils/reimbursementMappers';

const { Text, Title } = Typography;

// Only image receipts can be previewed inline; other files (e.g. PDF) get a link.
const isImageUrl = (url: string): boolean =>
    /^data:image\//i.test(url) || /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i.test(url);

const statusColor: Record<UiReimbursementStatus, string> = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'error',
    Cancelled: 'default',
};

const customStatusStyle: Partial<Record<UiReimbursementStatus, { bg: string; color: string }>> = {
    Approved: { bg: '#ECFDF3', color: '#027A48' },
    Pending: { bg: '#FFFBEB', color: '#F59E0B' },
    Rejected: { bg: '#FEF2F2', color: '#EF4444' },
};

const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'requestedByEmployee', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
];

const StatCard: React.FC<{
    label: string;
    amount: number;
    icon: React.ReactNode;
    bg: string;
    labelColor?: string;
}> = ({ label, amount, icon, bg, labelColor }) => (
    <div className={`w-full rounded-2xl px-6 py-5 min-h-[112px] flex flex-col ${bg}`}>
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-base">
            {icon}
        </div>
        <div className="mt-auto pt-4">
            <div className="text-xl font-bold leading-none mb-1" style={{ color: '#000000' }}>
                ₹{formatAmount(amount)}
            </div>
            <Text
                className={labelColor ? 'text-sm' : 'text-titleText text-sm'}
                style={labelColor ? { color: labelColor } : undefined}
            >
                {label}
            </Text>
        </div>
    </div>
);

const ReimbursementClaimsTab: React.FC = () => {
    const { records, total, limit, fetchReimbursements, submitReimbursement, cancelReimbursement } =
        useReimbursements();

    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [submitOpen, setSubmitOpen] = useState(false);
    const [viewRow, setViewRow] = useState<ReimbursementUiRow | null>(null);

    useEffect(() => {
        fetchReimbursements({
            status: statusFilter === 'All' ? undefined : statusFilter,
            page,
        });
    }, [fetchReimbursements, statusFilter, page]);

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setPage(1);
    };

    // Page-scoped: these sum only the currently fetched page, since there's no
    // reimbursement-aggregate endpoint yet to compute true totals independent
    // of pagination (same tradeoff as the Overtime tab's stat cards).
    const rows = useMemo(() => records.map(toReimbursementRow), [records]);

    const sumByStatus = (status: UiReimbursementStatus) =>
        rows.filter(r => r.status === status).reduce((s, r) => s + (r.amount || 0), 0);

    const totalClaimed = rows.reduce((s, r) => s + (r.amount || 0), 0);

    const columns: ColumnsType<ReimbursementUiRow> = [
        {
            title: 'Expense date',
            dataIndex: 'date',
            key: 'date',
            width: 180,
            render: (text: string) => (
                <Text className="text-valueText text-sm font-medium">{text}</Text>
            ),
        },
        {
            title: 'Expense details',
            dataIndex: 'details',
            key: 'details',
            width: 320,
            render: (text: string) => <Text className="text-valueText text-sm">{text}</Text>,
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 160,
            render: (amount: number) => (
                <Text className="text-valueText text-sm font-semibold">
                    ₹{formatAmount(amount)}
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (status: UiReimbursementStatus) => {
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
            width: 110,
            align: 'right',
            render: (_: unknown, row: ReimbursementUiRow) => (
                <Button
                    className="h-9 rounded-lg font-normal text-[12px]"
                    style={{ borderColor: '#CBD5E1', color: '#475569', padding: '0 18px' }}
                    onClick={() => setViewRow(row)}
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <div className="w-full">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
                <div>
                    <Title level={4} className="text-valueText mb-0.5">
                        Reimbursements
                    </Title>
                    <Text className="text-titleText text-sm">
                        Submit and track your reimbursement claims
                    </Text>
                </div>
                <Button
                    type="primary"
                    danger
                    size="large"
                    icon={<PlusOutlined />}
                    className="font-medium"
                    onClick={() => setSubmitOpen(true)}
                >
                    Submit New Claim
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Claimed"
                    amount={totalClaimed}
                    icon={<img src={calenderIcon} alt="" className="w-10 h-10" />}
                    bg="bg-[#FDF6F0]"
                    labelColor="#000000"
                />
                <StatCard
                    label="Approved"
                    amount={sumByStatus('Approved')}
                    icon={<img src={verifiedIcon} alt="" className="w-5 h-5" />}
                    bg="bg-[#ECF0FC]"
                    labelColor="#000000"
                />
                <StatCard
                    label="Pending"
                    amount={sumByStatus('Pending')}
                    icon={<img src={warningIcon} alt="" className="w-5 h-5" />}
                    bg="bg-[#F6EBEF]"
                    labelColor="#000000"
                />
                <StatCard
                    label="Rejected"
                    amount={sumByStatus('Rejected')}
                    icon={<img src={rejectedIcon} alt="" className="w-5 h-5" />}
                    bg="bg-[#EBF8F1]"
                    labelColor="#000000"
                />
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <Text className="text-base font-semibold text-valueText">
                        Reimbursement Claims
                    </Text>
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

            <SubmitClaimModal
                open={submitOpen}
                onClose={() => setSubmitOpen(false)}
                onSubmit={submitReimbursement}
            />

            <Modal
                open={viewRow !== null}
                onCancel={() => setViewRow(null)}
                footer={null}
                centered
                width={460}
                title="Reimbursement Claim"
                styles={{ content: { padding: 24, borderRadius: 24, overflow: 'hidden' } }}
            >
                {viewRow && (
                    <div className="flex flex-col gap-3 pt-2">
                        <div className="flex justify-between">
                            <Text className="text-titleText text-sm">Date</Text>
                            <Text className="text-valueText text-sm font-medium">
                                {viewRow.date}
                            </Text>
                        </div>
                        <div className="flex justify-between">
                            <Text className="text-titleText text-sm">Amount</Text>
                            <Text className="text-valueText text-sm font-semibold">
                                ₹{formatAmount(viewRow.amount)}
                            </Text>
                        </div>
                        {viewRow.method && (
                            <div className="flex justify-between">
                                <Text className="text-titleText text-sm">Transfer method</Text>
                                <Text className="text-valueText text-sm font-medium">
                                    {viewRow.method}
                                </Text>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <Text className="text-titleText text-sm">Status</Text>
                            {(() => {
                                const custom = customStatusStyle[viewRow.status];
                                return (
                                    <Tag
                                        color={custom ? undefined : statusColor[viewRow.status]}
                                        bordered={false}
                                        className="rounded-full px-3"
                                        style={{
                                            marginRight: 0,
                                            marginInlineEnd: 0,
                                            ...(custom
                                                ? {
                                                      backgroundColor: custom.bg,
                                                      color: custom.color,
                                                  }
                                                : {}),
                                        }}
                                    >
                                        {viewRow.status}
                                    </Tag>
                                );
                            })()}
                        </div>
                        <div className="flex justify-between">
                            <Text className="text-titleText text-sm">Details</Text>
                            <Text className="text-valueText text-sm text-right">
                                {viewRow.details}
                            </Text>
                        </div>
                        {viewRow.receiptUrl &&
                            (isImageUrl(viewRow.receiptUrl) ? (
                                <div>
                                    <Text className="text-titleText text-sm block mb-1">
                                        Receipt
                                    </Text>
                                    <Image
                                        src={viewRow.receiptUrl}
                                        alt="Receipt"
                                        style={{ maxHeight: 220, borderRadius: 8 }}
                                    />
                                </div>
                            ) : (
                                <div className="flex justify-between">
                                    <Text className="text-titleText text-sm">Receipt</Text>
                                    <a
                                        href={viewRow.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brandColor text-sm underline"
                                    >
                                        View receipt
                                    </a>
                                </div>
                            ))}
                        {viewRow.canCancel && (
                            <Popconfirm
                                title="Cancel claim"
                                description="Cancel this reimbursement request?"
                                okText="Yes, cancel"
                                cancelText="No"
                                okButtonProps={{ danger: true }}
                                onConfirm={async () => {
                                    const ok = await cancelReimbursement(viewRow.key);
                                    if (ok) setViewRow(null);
                                }}
                            >
                                <Button danger block className="mt-2 rounded-lg">
                                    Cancel Request
                                </Button>
                            </Popconfirm>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ReimbursementClaimsTab;
