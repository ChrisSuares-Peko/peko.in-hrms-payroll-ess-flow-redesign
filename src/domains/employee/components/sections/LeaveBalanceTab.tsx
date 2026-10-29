import React, { useEffect, useMemo, useState } from 'react';

import {
    CalendarOutlined,
    ExclamationCircleOutlined,
    MedicineBoxOutlined,
    SmileOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Pagination, Select, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import RaiseDisputeModal from './RaiseDisputeModal';
import { useDeductionLog } from '../../hooks/useDeductionLog';
import { AvailableLeave, DeductionLogRecord, DisputeStatus } from '../../types';
import { formatLeaveCount } from '../../utils/leaveMappers';

const { Text } = Typography;

// Icon + tint per leave-type label (fallback cycles the tint list — HR can
// configure custom leave types beyond this default set).
const leaveStyle: Record<string, { icon: React.ReactNode; bg: string }> = {
    'Annual Leave': { icon: <CalendarOutlined />, bg: 'bg-[#FDF6F0]' },
    'Sick Leave': { icon: <MedicineBoxOutlined />, bg: 'bg-[#ECF0FC]' },
    'Emergency Leave': { icon: <ExclamationCircleOutlined />, bg: 'bg-[#F6EBEF]' },
    'Unpaid Leave': { icon: <CalendarOutlined />, bg: 'bg-[#EBF8F1]' },
    'Casual Leave': { icon: <ThunderboltOutlined />, bg: 'bg-green-50' },
    'Maternity Leave': { icon: <SmileOutlined />, bg: 'bg-pink-50' },
    'Paternity Leave': { icon: <SmileOutlined />, bg: 'bg-blue-50' },
};
const fallbackBgs = ['bg-indigo-50', 'bg-orange-50', 'bg-green-50', 'bg-emerald-50', 'bg-blue-50'];

const typeColor: Record<string, string> = {
    late: '#FA8C16',
    absent: '#FF3A3A',
};

const disputeBadge: Record<DisputeStatus, { label: string; color: string; bg: string }> = {
    requestedByEmployee: { label: 'Dispute Pending', color: '#F59E0B', bg: '#FFFBEB' },
    approved: { label: 'Dispute Approved', color: '#027A48', bg: '#ECFDF3' },
    rejected: { label: 'Dispute Rejected', color: '#EF4444', bg: '#FEF2F2' },
};

const typeOptions = [
    { value: 'All', label: 'All' },
    { value: 'late', label: 'Late Arrival' },
    { value: 'absent', label: 'Absent' },
];

const formatLateDuration = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h} hr ${m} min`;
    if (h) return `${h} hr`;
    return `${m} min`;
};

interface LeaveBalanceTabProps {
    availableLeaves: AvailableLeave[];
    fetchBalance: () => Promise<void>;
}

const LeaveBalanceTab: React.FC<LeaveBalanceTabProps> = ({ availableLeaves, fetchBalance }) => {
    const dispatch = useAppDispatch();
    const { records, total, limit, fetchLog, raiseDispute } = useDeductionLog();

    const [typeFilter, setTypeFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [disputeEntry, setDisputeEntry] = useState<DeductionLogRecord | null>(null);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    useEffect(() => {
        fetchLog({ page });
    }, [fetchLog, page]);

    const handleDisputeSubmit = async (reason: string): Promise<boolean> => {
        if (!disputeEntry) return false;
        const ok = await raiseDispute(disputeEntry.id, reason);
        if (ok) {
            setDisputeEntry(null);
            dispatch(
                showToast({ description: 'Dispute submitted for review', variant: 'success' })
            );
        }
        return ok;
    };

    const filtered = useMemo(
        () => (typeFilter === 'All' ? records : records.filter(r => r.status === typeFilter)),
        [records, typeFilter]
    );

    const columns: ColumnsType<DeductionLogRecord> = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 160,
            render: (date: string) => (
                <Text className="text-valueText text-sm font-medium">
                    {dayjs(date).format('ddd MMM D')}
                </Text>
            ),
        },
        {
            title: 'Deduction type',
            key: 'type',
            width: 220,
            render: (_: unknown, row: DeductionLogRecord) => (
                <Text className="text-valueText text-sm">
                    {row.type}
                    {row.status === 'late' && row.lateMinutes
                        ? ` (${formatLateDuration(row.lateMinutes)})`
                        : ''}
                </Text>
            ),
        },
        {
            title: 'Policy',
            key: 'policy',
            width: 180,
            render: (_: unknown, row: DeductionLogRecord) => {
                const color = typeColor[row.status] ?? '#FA8C16';
                return (
                    <span
                        className="text-xs font-medium rounded-full px-3 py-1"
                        style={{ color, backgroundColor: `${color}1A` }}
                    >
                        {row.type}
                    </span>
                );
            },
        },
        {
            title: 'Deduction',
            key: 'deduction',
            width: 140,
            render: (_: unknown, row: DeductionLogRecord) => (
                <Text className="text-valueText text-sm">
                    {row.deduction} {row.deduction === 1 ? 'day' : 'days'}
                </Text>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            width: 190,
            align: 'right',
            render: (_: unknown, row: DeductionLogRecord) => {
                if (row.disputeRaised && row.disputeStatus) {
                    const badge = disputeBadge[row.disputeStatus];
                    return (
                        <span
                            className="text-xs font-medium rounded-full px-3 py-1"
                            style={{ color: badge.color, backgroundColor: badge.bg }}
                        >
                            {badge.label}
                        </span>
                    );
                }
                return (
                    <Button
                        danger
                        icon={<ExclamationCircleOutlined />}
                        className="rounded-xl px-4 h-11 font-semibold"
                        style={{ color: '#FF3A3A', borderColor: '#FF3A3A' }}
                        onClick={() => setDisputeEntry(row)}
                    >
                        Raise a Dispute
                    </Button>
                );
            },
        },
    ];

    return (
        <div className="flex flex-col gap-5 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {availableLeaves
                    .filter(leave => leave.count !== 0 && leave.value !== 'UNPAID')
                    .map((leave, i) => {
                        const style = leaveStyle[leave.label];
                        const bg = style?.bg ?? fallbackBgs[i % fallbackBgs.length];
                        return (
                            <div key={leave.value} className={`rounded-2xl px-6 py-5 ${bg}`}>
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-base text-[#171717]">
                                    {style?.icon ?? <CalendarOutlined />}
                                </div>
                                <div className="flex items-baseline gap-1 mt-5">
                                    <span
                                        className="text-[22px] font-bold leading-none"
                                        style={{ color: '#000000' }}
                                    >
                                        {formatLeaveCount(leave.count)}
                                    </span>
                                    <Text className="text-titleText text-[12px]">
                                        days remaining
                                    </Text>
                                </div>
                                <Text className="text-titleText text-[12px]">{leave.label}</Text>
                            </div>
                        );
                    })}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                    <Text className="text-base font-semibold text-valueText">
                        Leave Deduction Log
                    </Text>
                    <Select
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={typeOptions}
                        style={{ width: 200 }}
                    />
                </div>
                <Text className="text-titleText text-xs block mb-4">
                    Automatic deductions applied to your leave balance due to attendance issues
                    (e.g. late arrivals). Raise a dispute if you believe a deduction is incorrect.
                </Text>

                <GenericTable rowKey="id" dataSource={filtered} columns={columns} />
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

            <RaiseDisputeModal
                open={disputeEntry !== null}
                entry={
                    disputeEntry && {
                        title: disputeEntry.type,
                        date: dayjs(disputeEntry.date).format('ddd MMM D'),
                        deduction: String(disputeEntry.deduction),
                        leaveType: disputeEntry.deduction === 1 ? 'day' : 'days',
                        category: disputeEntry.type,
                    }
                }
                onCancel={() => setDisputeEntry(null)}
                onSubmit={handleDisputeSubmit}
            />
        </div>
    );
};

export default LeaveBalanceTab;
