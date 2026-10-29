import React, { useCallback, useMemo, useState } from 'react';

import { DownloadOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Empty, Select, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch } from '@src/hooks/store';
import { useEssAuth } from '@src/prototype/essSession';
import { showToast } from '@src/slices/apiSlice';

import { downloadMyPayslipApi } from '../api/payslips';
import PayslipDetailModal, { PayslipDetail } from '../components/PayslipDetailModal';
import { useEmployeeProfile } from '../hooks/useEmployeeProfile';
import { useMyPayslips } from '../hooks/useMyPayslips';
import { PayslipRow } from '../types';

const { Text, Title } = Typography;

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const MONTH_OPTIONS = [
    { value: 'all', label: 'All Months' },
    ...MONTHS.map((m, i) => ({ value: String(i + 1), label: m })),
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(y => ({
    value: String(y),
    label: String(y),
}));

const salaryIdOf = (row: PayslipRow): string | null => row.id;
const isGenerated = (row: PayslipRow): boolean => Boolean(salaryIdOf(row));
const rowKeyOf = (row: PayslipRow): string => salaryIdOf(row) ?? `${row.year}-${row.month}`;

// "29 (LOP 2)" — Loss of Pay is unpaid days, so it shows here and never under Deductions.
const paidDaysOf = (row: PayslipRow): string | undefined => {
    const paid = row.payDays?.paidDays;
    if (paid === undefined || paid === null) return undefined;
    const fmtDays = (d: number) => (Number.isInteger(d) ? String(d) : d.toFixed(1));
    const lop = row.payDays?.lopDays || 0;
    return lop > 0 ? `${fmtDays(paid)} (LOP ${fmtDays(lop)})` : fmtDays(paid);
};

const creditedDateOf = (row: PayslipRow): string =>
    row.payingDate ? dayjs(row.payingDate).format('DD MMMM YYYY') : '—';

// Mirrors the backend's own findOneSalary deduction breakdown, so per-row and
// YTD deduction totals stay consistent with each other and with the real PDF.
const totalDeductionsOf = (row: PayslipRow): number => {
    const info = row.salaryInformation;
    const otherDeductionAmount =
        (info?.deductionAmount ?? 0) -
        (info?.epfAmount ?? 0) -
        (info?.esiAmount ?? 0) -
        (info?.lwfAmount ?? 0);
    return (
        (info?.epfAmount ?? 0) +
        (info?.esiAmount ?? 0) +
        (info?.lwfAmount ?? 0) +
        (otherDeductionAmount > 0 ? otherDeductionAmount : 0) +
        (row.leaveDeduction ?? 0) +
        (row.nonWorkingDaysDeduction ?? 0) +
        (info?.tdsAmount ?? 0) +
        (row.oneTimeDeductions ?? []).reduce((sum, d) => sum + (d.amount ?? 0), 0)
    );
};

const Payslips: React.FC = () => {
    const dispatch = useAppDispatch();
    // PROTOTYPE-SETUP: ESS identity comes from useEssAuth (DEMO_EMPLOYEE when there is no token).
    const { role, id } = useEssAuth();
    const { profile } = useEmployeeProfile();

    const [visibleRows, setVisibleRows] = useState<Record<string, boolean>>({});
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<PayslipRow | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const { rows, loading } = useMyPayslips(selectedYear);

    const filtered = useMemo(
        () =>
            selectedMonth === 'all' ? rows : rows.filter(r => String(r.month) === selectedMonth),
        [rows, selectedMonth]
    );

    const toggleRowVisibility = (key: string) =>
        setVisibleRows(prev => ({ ...prev, [key]: !prev[key] }));

    const buildDetail = useCallback(
        (row: PayslipRow): PayslipDetail => {
            // Mirrors the backend's own findOneSalary row-construction (used by
            // the corporate payslip PDF) so the drawer reflects IN's actual
            // configured salary components, not a fixed AE-style row list.
            const info = row.salaryInformation;
            const earnings = [
                { label: 'Basic Pay', amount: info?.basicPay ?? 0 },
                { label: 'Increment', amount: info?.increamentAmount ?? 0 },
                { label: 'House Rent Allowance', amount: info?.hraAmount ?? 0 },
                { label: 'Dearness Allowance', amount: info?.daAmount ?? 0 },
                { label: 'Other Allowance', amount: info?.other ?? 0 },
                { label: 'Bonus', amount: row.totalBonus ?? 0 },
                { label: 'Incentives', amount: row.totalIncentive ?? 0 },
                { label: 'Overtime Allowance', amount: row.totalOvertime ?? 0 },
                { label: 'Reimbursement', amount: row.totalReimbursement ?? 0 },
            ].filter(e => e.amount > 0);
            const grossPay = earnings.reduce((s, e) => s + e.amount, 0);

            const otherDeductionAmount =
                (info?.deductionAmount ?? 0) -
                (info?.epfAmount ?? 0) -
                (info?.esiAmount ?? 0) -
                (info?.lwfAmount ?? 0);
            const deductions = [
                { label: 'Provident Fund (PF)', amount: info?.epfAmount ?? 0 },
                { label: 'ESI', amount: info?.esiAmount ?? 0 },
                { label: 'LWF', amount: info?.lwfAmount ?? 0 },
                {
                    label: 'Other Deductions',
                    amount: otherDeductionAmount > 0 ? otherDeductionAmount : 0,
                },
                { label: 'Leave Deduction', amount: row.leaveDeduction ?? 0 },
                { label: 'Non-Working Days Deduction', amount: row.nonWorkingDaysDeduction ?? 0 },
                // One-time recoveries — named by type, with HR's note next to it.
                ...(row.oneTimeDeductions ?? []).map(d => ({
                    label: d.note ? `${d.label} (${d.note})` : d.label,
                    amount: d.amount ?? 0,
                })),
                { label: 'TDS', amount: info?.tdsAmount ?? 0 },
            ].filter(d => d.amount > 0);
            const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);

            const ytdRows = rows.filter(
                r => isGenerated(r) && r.year === row.year && r.month <= row.month
            );
            const ytdNet = ytdRows.reduce((s, r) => s + (r.totalPayable || 0), 0);
            const ytdDeductions = ytdRows.reduce((s, r) => s + totalDeductionsOf(r), 0);

            const empInfo = profile?.employeeInformation;
            const department =
                empInfo?.department && typeof empInfo.department === 'object'
                    ? (empInfo.department.departmentName ?? '—')
                    : '—';

            return {
                payPeriod: `${MONTHS[row.month - 1]} ${row.year}`,
                payslipNumber: `PS-${row.year}-${String(row.month).padStart(2, '0')}`,
                employeeName: profile?.personalInformation?.fullName ?? '—',
                employeeId: empInfo?.employeeId ?? '—',
                designation: empInfo?.designation ?? '—',
                department,
                company: profile?.corporateUser?.companyName ?? '—',
                creditedDate: creditedDateOf(row),
                paidDays: paidDaysOf(row),
                earnings,
                grossPay,
                deductions,
                totalDeductions,
                netPay: row.totalPayable ?? grossPay - totalDeductions,
                ytdGross: ytdNet + ytdDeductions,
                ytdDeductions,
                ytdNet,
            };
        },
        [rows, profile]
    );

    const handleDownload = useCallback(
        async (row: PayslipRow) => {
            const salaryId = salaryIdOf(row);
            if (!salaryId) return;
            setDownloadingId(salaryId);
            try {
                const blob = await downloadMyPayslipApi({ userType: role, userId: id }, salaryId);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payslip-${MONTHS[row.month - 1]}-${row.year}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            } catch (err) {
                dispatch(
                    showToast({ description: 'Could not download payslip', variant: 'error' })
                );
            } finally {
                setDownloadingId(null);
            }
        },
        [role, id, dispatch]
    );

    const openDrawer = (row: PayslipRow) => {
        setSelectedRow(row);
        setDrawerOpen(true);
    };

    const columns: ColumnsType<PayslipRow> = [
        {
            title: 'Date',
            key: 'date',
            width: 220,
            render: (_: unknown, row: PayslipRow) => (
                <Text className="text-valueText text-sm font-medium">
                    {MONTHS[row.month - 1]} {row.year}
                </Text>
            ),
        },
        {
            title: 'Credited',
            key: 'created',
            width: 200,
            render: (_: unknown, row: PayslipRow) => (
                <Text className="text-titleText text-sm">{creditedDateOf(row)}</Text>
            ),
        },
        {
            title: 'Amount',
            key: 'amount',
            width: 200,
            render: (_: unknown, row: PayslipRow) => {
                if (!isGenerated(row)) {
                    return (
                        <Tag bordered={false} className="rounded-full px-3 -ml-3 capitalize">
                            {(row.paymentStatus || 'pending').replace(/_/g, ' ').toLowerCase()}
                        </Tag>
                    );
                }
                const key = rowKeyOf(row);
                const visible = !!visibleRows[key];
                return (
                    <div className="flex items-center gap-2 pl-1">
                        {visible ? (
                            <Text className="text-valueText text-sm font-semibold">
                                {`₹${row.totalPayable.toLocaleString()}`}
                            </Text>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: 5 }).map((__, i) => (
                                    <span key={i} className="rounded-full size-1 bg-titleText" />
                                ))}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => toggleRowVisibility(key)}
                            className="bg-transparent border-0 p-0 cursor-pointer text-titleText hover:text-valueText transition-colors"
                            aria-label={visible ? 'Hide amount' : 'Show amount'}
                        >
                            {visible ? (
                                <EyeOutlined className="text-sm" />
                            ) : (
                                <EyeInvisibleOutlined className="text-sm" />
                            )}
                        </button>
                    </div>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            width: 140,
            align: 'right',
            render: (_: unknown, row: PayslipRow) => {
                if (!isGenerated(row)) return <Text className="text-titleText text-sm">—</Text>;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            loading={downloadingId === salaryIdOf(row)}
                            onClick={() => handleDownload(row)}
                            className="text-titleText hover:!text-valueText"
                            title="Download PDF"
                        />
                        <Button
                            className="h-9 rounded-lg font-normal text-[12px]"
                            style={{ borderColor: '#CBD5E1', color: '#475569', padding: '0 18px' }}
                            onClick={() => openDrawer(row)}
                        >
                            View
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <div className="w-full flex flex-col gap-5">
                <div>
                    <Title level={4} className="!text-valueText !mb-0.5 !font-bold">
                        My Pay
                    </Title>
                    <Text className="text-titleText text-sm">
                        View and download your monthly payslips
                    </Text>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                        <Text className="text-base font-semibold text-valueText">
                            Payslip History
                        </Text>
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedMonth}
                                onChange={setSelectedMonth}
                                options={MONTH_OPTIONS}
                                style={{ width: 140 }}
                            />
                            <Select
                                value={selectedYear}
                                onChange={setSelectedYear}
                                options={YEAR_OPTIONS}
                                style={{ width: 120 }}
                            />
                        </div>
                    </div>

                    <GenericTable
                        rowKey={rowKeyOf}
                        loading={loading}
                        dataSource={filtered}
                        columns={columns}
                        locale={{
                            emptyText: <Empty description="No payslips for this period" />,
                        }}
                    />
                </div>
            </div>

            <PayslipDetailModal
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                payslip={selectedRow ? buildDetail(selectedRow) : null}
                onDownload={() => selectedRow && handleDownload(selectedRow)}
                downloading={!!selectedRow && downloadingId === salaryIdOf(selectedRow)}
            />
        </>
    );
};

export default Payslips;
