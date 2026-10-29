import { useState } from 'react';

import { Col, Pagination, Row, Select, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@src/components/atomic/GenericTable';

import { useDailyLog } from '../../../hooks/dashboardHooks/useDailyLog';
import { useAttendanceMetrics } from '../../../hooks/employeeHooks/useAttendanceMetrics';
import { ATTENDANCE_STAT_META, attendanceColumns } from '../../../utils/employeeDetails/attendanceData';
import { monthsArray } from '../../../utils/salaryTable/data';
import type { TimesheetRecord } from '../../../utils/timesheet/data';
import EditAttendanceModal from '../../modals/EditAttendanceModal';

interface AttendanceTabProps {
    employeeId: string;
    // Attendance can only be viewed from the employee's joining date onward.
    dateOfJoin?: string;
}

const AttendanceTab = ({ employeeId, dateOfJoin }: AttendanceTabProps) => {
    const initialMonth = new Date().getMonth() + 1;
    const initialYear = new Date().getFullYear();

    const joinDate = dateOfJoin && dayjs(dateOfJoin).isValid() ? dayjs(dateOfJoin) : null;
    const joinYear = joinDate ? joinDate.year() : null;
    const joinMonth = joinDate ? joinDate.month() + 1 : null;

    // Years from the joining year (or last year if unknown) up to the current
    // year — never any future year.
    const startYear = Math.min(joinYear ?? initialYear - 1, initialYear);
    const yearsOptions = Array.from({ length: initialYear - startYear + 1 }, (_, i) => {
        const y = String(startYear + i);
        return { label: y, value: y };
    });

    const [selectedYear, setSelectedYear] = useState(String(initialYear));
    const [selectedMonth, setSelectedMonth] = useState(String(initialMonth));

    // Month range for the selected year: hide months before the joining month
    // (in the joining year) and after the current month (in the current year),
    // so neither pre-join nor future months are selectable.
    const monthOptions = monthsArray.filter(m => {
        const mv = Number(m.value);
        if (joinMonth !== null && Number(selectedYear) === joinYear && mv < joinMonth) return false;
        if (Number(selectedYear) === initialYear && mv > initialMonth) return false;
        return true;
    });

    const handleYearChange = (value: string) => {
        setSelectedYear(String(value));
        // Clamp the selected month into the valid range for the newly chosen year.
        const y = Number(value);
        let m = Number(selectedMonth);
        if (joinMonth !== null && y === joinYear && m < joinMonth) m = joinMonth;
        if (y === initialYear && m > initialMonth) m = initialMonth;
        if (m !== Number(selectedMonth)) setSelectedMonth(String(m));
    };

    const monthYear = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const from = dayjs(monthYear).startOf('month').format('YYYY-MM-DD');
    const to = dayjs(monthYear).endOf('month').format('YYYY-MM-DD');

    const [editRecord, setEditRecord] = useState<TimesheetRecord | null>(null);
    const [page, setPage] = useState(1);

    const { metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useAttendanceMetrics(employeeId, monthYear);

    const { rows, isLoading: tableLoading, pagination, refetch } = useDailyLog({
        employee: employeeId,
        from,
        to,
        page,
    });

    return (
        <div className="flex flex-col gap-6 pt-4">
            <Row gutter={[12, 12]} justify="end">
                <Col xs={10} sm={5} md={3}>
                    <Select
                        options={monthOptions}
                        className="w-full"
                        onChange={v => setSelectedMonth(v)}
                        value={selectedMonth}
                    />
                </Col>
                <Col xs={8} sm={4} md={2}>
                    <Select
                        options={yearsOptions}
                        className="w-full"
                        onChange={handleYearChange}
                        value={selectedYear}
                    />
                </Col>
            </Row>

            <Row gutter={[8, 8]} style={{ paddingLeft: 16 }}>
                {ATTENDANCE_STAT_META.map(stat => (
                    <Col key={stat.key}>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                backgroundColor: stat.bg,
                                borderRadius: 9999,
                                padding: '6px 14px',
                            }}
                        >
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: stat.color,
                                    flexShrink: 0,
                                    display: 'inline-block',
                                }}
                            />
                            {metricsLoading ? (
                                <Skeleton.Input active size="small" style={{ width: 24 }} />
                            ) : (
                                <Typography.Text style={{ color: stat.color, fontWeight: 700, fontSize: 14 }}>
                                    {metrics[stat.key]}
                                </Typography.Text>
                            )}
                            <Typography.Text style={{ color: stat.color, fontSize: 13 }}>
                                {stat.label}
                            </Typography.Text>
                        </div>
                    </Col>
                ))}
            </Row>

            <div style={{ paddingLeft: 16, overflowX: 'hidden' }}>
                <GenericTable
                    columns={attendanceColumns(record => setEditRecord(record))}
                    dataSource={rows}
                    loading={tableLoading}
                    rowExpandable
                    size="middle"
                    tableLayout="fixed"
                    pagination={false}
                    rowHoverable={false}
                    onRow={() => ({ style: { cursor: 'default' } })}
                />
                {pagination.total > pagination.limit && (
                    <div className="flex justify-end mt-4">
                        <Pagination
                            current={page}
                            pageSize={pagination.limit}
                            total={pagination.total}
                            showSizeChanger={false}
                            onChange={p => setPage(p)}
                        />
                    </div>
                )}
            </div>

            <EditAttendanceModal
                open={editRecord !== null}
                initialValues={editRecord ? {
                    attendanceId: editRecord.key,
                    employeeId: editRecord.employeeId,
                    employeeName: editRecord.name,
                    date: editRecord.rawDate,
                    status: editRecord.rawStatus,
                    checkIn: editRecord.rawCheckIn,
                    checkOut: editRecord.rawCheckOut,
                    lateMinutes: editRecord.lateMinutes,
                    notes: editRecord.rawNotes,
                } : null}
                onCancel={() => setEditRecord(null)}
                onSuccess={() => { setEditRecord(null); refetch(); refetchMetrics(); }}
            />
        </div>
    );
};

export default AttendanceTab;
