import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Pagination, Popconfirm, Tabs, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { AttendanceMetrics, getAttendanceMetrics } from '../api/attendance';
import clockIcon from '../assets/icons/clock.svg';
import calendarIcon from '../assets/icons/google-calendar.svg';
import presentTickIcon from '../assets/icons/profile-tick.svg';
import lateClockIcon from '../assets/img/late-clock.png';
import verifiedIcon from '../assets/img/verified.png';
import warningIcon from '../assets/img/warning.png';
import AttendanceFilters, { AttendanceDateRange } from '../components/AttendanceFilters';
import RequestOvertimeModal from '../components/RequestOvertimeModal';
import RaiseDisputeModal from '../components/sections/RaiseDisputeModal';
import { useAttendance } from '../hooks/useAttendance';
import { useEmployeeProfile } from '../hooks/useEmployeeProfile';
import { useOvertime } from '../hooks/useOvertime';
import { DisputeStatus } from '../types';
import {
    AttendanceUiRow,
    DISPUTE_DEDUCTION_DAYS,
    UiAttendanceStatus,
} from '../utils/attendanceMappers';
import { OvertimeUiRow, formatOtHours } from '../utils/overtimeMappers';

const { Text, Title } = Typography;

const disputeBadge: Record<DisputeStatus, { label: string; color: string; bg: string }> = {
    requestedByEmployee: { label: 'Dispute Pending', color: '#F59E0B', bg: '#FFFBEB' },
    approved: { label: 'Dispute Approved', color: '#027A48', bg: '#ECFDF3' },
    rejected: { label: 'Dispute Rejected', color: '#EF4444', bg: '#FEF2F2' },
};

const formatLateDuration = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h} hr ${m} min`;
    if (h) return `${h} hr`;
    return `${m} min`;
};

/* ------------------------------------------------------------------ */
/* Shared building blocks (reused by both the History & Overtime tabs) */
/* ------------------------------------------------------------------ */

interface AttendanceStatCardProps {
    value: React.ReactNode;
    label: string;
    icon: React.ReactNode;
    bg: string;
}

const AttendanceStatCard: React.FC<AttendanceStatCardProps> = ({ value, label, icon, bg }) => (
    <div
        className={`flex-1 min-w-[140px] rounded-2xl px-4 sm:px-6 py-5 min-h-[120px] flex flex-col ${bg}`}
    >
        <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm text-lg">
            {icon}
        </div>
        <div className="mt-auto pt-4">
            <div className="text-2xl font-bold leading-none mb-1" style={{ color: '#000000' }}>
                {value}
            </div>
            <Text className="text-titleText text-sm">{label}</Text>
        </div>
    </div>
);

const statusTagColor: Record<string, string> = {
    Late: 'warning',
    Leave: 'blue',
    Absent: 'error',
    'Half Day': 'default',
    Cancelled: 'default',
};

const customStatusStyle: Record<string, { bg: string; color: string }> = {
    Present: { bg: '#ECFDF3', color: '#027A48' },
    Approved: { bg: '#ECFDF3', color: '#027A48' },
    Pending: { bg: '#FFFBEB', color: '#F59E0B' },
    Rejected: { bg: '#FEF2F2', color: '#EF4444' },
};

const renderStatusTag = (status: string) => {
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
        <Tag
            color={statusTagColor[status] ?? 'default'}
            bordered={false}
            className="rounded-full px-3"
        >
            {status}
        </Tag>
    );
};

const TablePanel: React.FC<{
    title: string;
    filters: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, filters, action, children }) => (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <Text className="text-base font-semibold text-valueText">{title}</Text>
            <div className="flex items-center gap-2 flex-wrap">
                {filters}
                {action}
            </div>
        </div>
        {children}
    </div>
);

/* ------------------------------------------------------------------ */
/* History tab                                                         */
/* ------------------------------------------------------------------ */

const historyStatusOptions = [
    { label: 'All', value: 'All' },
    { label: 'Present', value: 'present' },
    { label: 'Late', value: 'late' },
    { label: 'Leave', value: 'on-leave' },
    { label: 'Absent', value: 'absent' },
];

const EMPTY_METRICS: AttendanceMetrics = {
    totalCheckIns: 0,
    totalLateArrivals: 0,
    totalLeaves: 0,
    onTime: 0,
    late: 0,
    notPresent: 0,
    total: 0,
};

const HistoryTab: React.FC = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const { records: rows, total, limit, fetchAttendance, raiseDispute } = useAttendance();
    const [status, setStatus] = useState('All');
    const [range, setRange] = useState<AttendanceDateRange>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [metrics, setMetrics] = useState<AttendanceMetrics>(EMPTY_METRICS);
    const [disputeEntry, setDisputeEntry] = useState<AttendanceUiRow | null>(null);

    const from = range?.[0] ?? null;
    const to = range?.[1] ?? null;

    const refetch = useCallback(
        () =>
            fetchAttendance({
                from: from ? from.toISOString() : undefined,
                to: to ? to.toISOString() : undefined,
                status: status === 'All' ? undefined : status,
                page,
            }),
        [fetchAttendance, from, to, status, page]
    );

    useEffect(() => {
        refetch();
    }, [refetch]);

    const handleDisputeSubmit = async (reason: string): Promise<boolean> => {
        if (!disputeEntry) return false;
        const ok = await raiseDispute(disputeEntry.key, reason);
        if (ok) {
            setDisputeEntry(null);
            await refetch();
            dispatch(
                showToast({ description: 'Dispute submitted for review', variant: 'success' })
            );
        }
        return ok;
    };

    useEffect(() => {
        getAttendanceMetrics(
            { userType: role, userId: id },
            { from: from ? from.toISOString() : undefined, to: to ? to.toISOString() : undefined }
        ).then(setMetrics);
    }, [role, id, from, to]);

    const handleStatusChange = (value: string) => {
        setStatus(value);
        setPage(1);
    };

    const handleRangeChange = (value: AttendanceDateRange) => {
        setRange(value);
        setPage(1);
    };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return rows.filter(r => !term || r.date.toLowerCase().includes(term));
    }, [rows, search]);

    const columns: ColumnsType<AttendanceUiRow> = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 220,
            render: (text: string) => (
                <Text className="text-valueText text-sm font-medium">{text}</Text>
            ),
        },
        {
            title: 'Check in',
            dataIndex: 'checkIn',
            key: 'checkIn',
            width: 200,
            render: (_: unknown, row: AttendanceUiRow) =>
                row.checkIn ? (
                    <Text
                        className={`text-sm font-medium ${row.isLate ? 'text-orange-500' : 'text-valueText'}`}
                    >
                        {row.checkIn}
                    </Text>
                ) : (
                    <Text className="text-titleText text-sm">–</Text>
                ),
        },
        {
            title: 'Check out',
            dataIndex: 'checkOut',
            key: 'checkOut',
            width: 200,
            render: (val: string | null) =>
                val ? (
                    <Text className="text-valueText text-sm font-medium">{val}</Text>
                ) : (
                    <Text className="text-titleText text-sm">–</Text>
                ),
        },
        {
            title: 'Hours',
            dataIndex: 'hours',
            key: 'hours',
            width: 160,
            render: (val: string | null) =>
                val ? (
                    <Text className="text-valueText text-sm font-semibold">{val}</Text>
                ) : (
                    <Text className="text-titleText text-sm">–</Text>
                ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (s: UiAttendanceStatus) => renderStatusTag(s),
        },
        {
            title: '',
            key: 'action',
            width: 190,
            align: 'right',
            render: (_: unknown, row: AttendanceUiRow) => {
                if (row.status !== 'Late' && row.status !== 'Absent') return null;

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
            <div className="flex flex-wrap gap-4">
                <AttendanceStatCard
                    value={metrics.onTime}
                    label="Present Days"
                    icon={<img src={presentTickIcon} alt="" className="w-5 h-5" />}
                    bg="bg-[#F0ECF5]"
                />
                <AttendanceStatCard
                    value={metrics.late}
                    label="Late Arrivals"
                    icon={<img src={lateClockIcon} alt="" className="w-5 h-5" />}
                    bg="bg-[#FDF6F0]"
                />
                <AttendanceStatCard
                    value={metrics.totalLeaves}
                    label="Leave Days"
                    icon={<img src={calendarIcon} alt="" className="w-5 h-5" />}
                    bg="bg-[#F6EBEF]"
                />
                <AttendanceStatCard
                    value={metrics.notPresent}
                    label="Absent Days"
                    icon={<img src={warningIcon} alt="" className="w-5 h-5" />}
                    bg="bg-[#EBF8F1]"
                />
            </div>

            <TablePanel
                title="History"
                filters={
                    <AttendanceFilters
                        statusValue={status}
                        statusOptions={historyStatusOptions}
                        onStatusChange={handleStatusChange}
                        range={range}
                        onRangeChange={handleRangeChange}
                        search={search}
                        onSearchChange={setSearch}
                    />
                }
            >
                <GenericTable dataSource={filtered} columns={columns} />
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
            </TablePanel>

            <RaiseDisputeModal
                open={disputeEntry !== null}
                entry={
                    disputeEntry && {
                        title: disputeEntry.status,
                        date: disputeEntry.date,
                        deduction: String(
                            DISPUTE_DEDUCTION_DAYS[
                                disputeEntry.status === 'Late' ? 'late' : 'absent'
                            ]
                        ),
                        leaveType:
                            DISPUTE_DEDUCTION_DAYS[
                                disputeEntry.status === 'Late' ? 'late' : 'absent'
                            ] === 1
                                ? 'day'
                                : 'days',
                        category:
                            disputeEntry.status === 'Late'
                                ? `Late Arrival${disputeEntry.lateMinutes ? ` (${formatLateDuration(disputeEntry.lateMinutes)})` : ''}`
                                : 'Absent',
                    }
                }
                onCancel={() => setDisputeEntry(null)}
                onSubmit={handleDisputeSubmit}
            />
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Overtime tab                                                        */
/* ------------------------------------------------------------------ */

const overtimeStatusOptions = [
    { label: 'All', value: 'All' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Pending', value: 'requestedByEmployee' },
    { label: 'Cancelled', value: 'cancelledByEmployee' },
];

const OvertimeTab: React.FC = () => {
    const {
        records: rows,
        total,
        summary,
        limit,
        fetchOvertime,
        requestOvertime,
        cancelOvertime,
    } = useOvertime();
    const { profile } = useEmployeeProfile();
    const [status, setStatus] = useState('All');
    const [range, setRange] = useState<AttendanceDateRange>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [requestOpen, setRequestOpen] = useState(false);

    const from = range?.[0] ?? null;
    const to = range?.[1] ?? null;

    useEffect(() => {
        fetchOvertime({
            from: from ? from.toISOString() : undefined,
            to: to ? to.toISOString() : undefined,
            status: status === 'All' ? undefined : status,
            page,
        });
    }, [fetchOvertime, from, to, status, page]);

    const handleStatusChange = (value: string) => {
        setStatus(value);
        setPage(1);
    };

    const handleRangeChange = (value: AttendanceDateRange) => {
        setRange(value);
        setPage(1);
    };

    // Sourced from the backend summary (all matching records for the active date
    // filter, independent of both pagination and the status filter) — not the
    // current page of rows.
    const { approvedCount, pendingCount, totalOtHours: totalHours } = summary;

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return rows.filter(
            r =>
                !term ||
                r.description.toLowerCase().includes(term) ||
                r.date.toLowerCase().includes(term)
        );
    }, [rows, search]);

    const columns: ColumnsType<OvertimeUiRow> = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 200,
            render: (text: string) => (
                <Text className="text-valueText text-sm font-medium">{text}</Text>
            ),
        },
        {
            title: 'Hours',
            dataIndex: 'hours',
            key: 'hours',
            width: 140,
            render: (val: string) => (
                <Text className="text-valueText text-sm font-semibold">{val}</Text>
            ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 320,
            render: (val: string) => <Text className="text-titleText text-sm">{val}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (s: string) => renderStatusTag(s),
        },
        {
            title: '',
            dataIndex: 'actions',
            key: 'actions',
            width: 120,
            render: (_: unknown, row: OvertimeUiRow) =>
                row.canCancel ? (
                    <Popconfirm
                        title="Cancel request"
                        description="Cancel this overtime request?"
                        okText="Yes, cancel"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => cancelOvertime(row.key)}
                    >
                        <Button type="text" size="small" danger className="text-xs font-medium">
                            Cancel
                        </Button>
                    </Popconfirm>
                ) : null,
        },
    ];

    return (
        <div className="flex flex-col gap-5 mt-2">
            <div className="flex flex-wrap gap-4">
                <AttendanceStatCard
                    value={formatOtHours(totalHours)}
                    label="Total OT Hours"
                    icon={<img src={clockIcon} alt="" className="w-5 h-5" />}
                    bg="bg-[#F0ECF5]"
                />
                <AttendanceStatCard
                    value={approvedCount}
                    label="Approved Sessions"
                    icon={<img src={verifiedIcon} alt="" className="w-5 h-5" />}
                    bg="bg-[#EBF8F1]"
                />
                <AttendanceStatCard
                    value={pendingCount}
                    label="Pending Requests"
                    icon={<img src={warningIcon} alt="" className="w-5 h-5" />}
                    bg="bg-[#FDF6F0]"
                />
            </div>

            <TablePanel
                title="Overtime Log"
                filters={
                    <AttendanceFilters
                        statusValue={status}
                        statusOptions={overtimeStatusOptions}
                        onStatusChange={handleStatusChange}
                        range={range}
                        onRangeChange={handleRangeChange}
                        search={search}
                        onSearchChange={setSearch}
                    />
                }
                action={
                    <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined />}
                        onClick={() => setRequestOpen(true)}
                    >
                        Request Overtime
                    </Button>
                }
            >
                <GenericTable dataSource={filtered} columns={columns} />
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
            </TablePanel>

            <RequestOvertimeModal
                open={requestOpen}
                onClose={() => setRequestOpen(false)}
                onSubmit={requestOvertime}
                dateOfJoin={profile?.employeeInformation?.dateOfJoin}
            />
        </div>
    );
};

/* ------------------------------------------------------------------ */

const Attendance: React.FC = () => (
    <div className="w-full flex flex-col gap-5">
        <div>
            <Title level={4} className="!text-valueText !mb-0.5 !font-bold">
                Attendance
            </Title>
            <Text className="text-titleText text-sm">Track your attendance log and overtime</Text>
        </div>

        <Tabs
            defaultActiveKey="history"
            items={[
                { key: 'history', label: 'History', children: <HistoryTab /> },
                { key: 'overtime', label: 'Overtime', children: <OvertimeTab /> },
            ]}
        />
    </div>
);

export default Attendance;
