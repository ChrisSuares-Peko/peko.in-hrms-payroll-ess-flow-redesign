import type { CSSProperties, Key } from 'react';

import { CheckOutlined, MinusOutlined } from '@ant-design/icons';
import { Button, Flex, Popover, Spin, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';

import { useGetSalaryDetailsByEmployee } from '../../hooks/employeeSalaryHooks/salaryTableHooks/useGetSalaryDetailsByEmployee';
import { ProcessSalaryEmployeeRow, SalaryRecord } from '../../types/processSalary';

interface SalaryColumnsParams {
    selectedRowKeys: Key[];
    setEditingRecord: (record: SalaryRecord | null) => void;
    month: number;
    year: number;
}

const { Text } = Typography;

export const statusConfig: Record<string, { bg: string; color: string }> = {
    Paid: { bg: '#ECFDF5', color: '#03A254' },
    Pending: { bg: '#FFFBEB', color: '#D97706' },
    Failed: { bg: '#FEF2F2', color: '#EF4444' },
};

export const monthOptions = [
    { value: 'jan-2026', label: 'January 2026' },
    { value: 'feb-2026', label: 'February 2026' },
    { value: 'mar-2026', label: 'March 2026' },
    { value: 'apr-2026', label: 'April 2026' },
    { value: 'may-2026', label: 'May 2026' },
    { value: 'jun-2026', label: 'June 2026' },
];

export const monthShortLabel: Record<string, string> = {
    'jan-2026': 'Jan 2026',
    'feb-2026': 'Feb 2026',
    'mar-2026': 'Mar 2026',
    'apr-2026': 'Apr 2026',
    'may-2026': 'May 2026',
    'jun-2026': 'Jun 2026',
};

export const monthMap: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
};

export const popoverInnerStyle: CSSProperties = {
    padding: '16px 16px 12px',
    borderRadius: 24,
    borderTop: 'none',
    borderRight: '1px solid #FFECEC',
    borderBottom: '1px solid #FFECEC',
    borderLeft: '1px solid #FFECEC',
    boxShadow: '0px 2px 20px rgba(0, 0, 0, 0.05)',
    width: 218,
};

export const parseMonthValue = (value: string) => {
    const [monthKey, yearValue] = value.split('-');

    return {
        month: monthMap[monthKey] ?? new Date().getMonth() + 1,
        year: Number(yearValue) || new Date().getFullYear(),
    };
};

export const getInitials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('') || '--';

export const avatarColors = ['#FFF5F5', '#FFF2EA', '#F0F4FF', '#F5F3FF', '#ECFDF5'];

export const getAvatarBg = (value: string) => {
    const charCodeSum = value
        .split('')
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return avatarColors[charCodeSum % avatarColors.length];
};

export const maskAccountNumber = (accountNumber?: string | null) => {
    if (!accountNumber) return '';
    const normalizedAccountNumber = accountNumber.trim();
    const lastFourDigits = normalizedAccountNumber.slice(-4);

    return `XXXX${lastFourDigits}`;
};

export const formatCurrency = (amount?: number | null) =>
    amount !== null && amount !== undefined
        ? `₹${amount.toLocaleString('en-IN')}`
        : '—';

export const mapPaymentStatus = (row: ProcessSalaryEmployeeRow): SalaryRecord['status'] => {
    const salaryStatus = row.salaryPaymentStatus?.toUpperCase();
    const payoutStatus = row.latestPayoutStatus?.toUpperCase();

    if (salaryStatus === 'PAID' || payoutStatus === 'SUCCESS') return 'Paid';
    if (salaryStatus === 'FAILD' || payoutStatus === 'FAILED') return 'Failed';
    return 'Pending';
};

export const mapEmployeeRowToSalaryRecord = (row: ProcessSalaryEmployeeRow): SalaryRecord => {
    const name = row.employeeName || 'Unknown employee';
    const { bankDetails } = row;
    const maskedAccountNumber = maskAccountNumber(bankDetails?.accountNumber);

    return {
        key: row.salaryId,
        salaryId: row.salaryId,
        employeeId: row.employeeId,
        empId: row.employeeCode || row.employeeId,
        name,
        email: row.employeeEmail || '',
        initials: getInitials(name),
        avatarBg: getAvatarBg(row.employeeId || name),
        accountNumber: maskedAccountNumber
            ? `${bankDetails?.bankName || 'Account'} – ${maskedAccountNumber}`
            : '',
        bankName: bankDetails?.bankName || 'Account No.',
        transactionType: bankDetails?.transactionType || null,
        // Gross = Net payable + total deductions (gross − deductions = net).
        // Derived from the reliable stored totals so it shows the true gross.
        grossSalary: Number(row.totalPayable || 0) + Number(row.totalDeduction || 0),
        deduction: Number(row.totalDeduction || 0),
        netSalary: Number(row.totalPayable || 0),
        remark: row.isPayoutReady
            ? 'Ready for payout'
            : row.payoutBlockReason || 'Not ready for payout',
        status: mapPaymentStatus(row),
        payoutBlockReason: row.payoutBlockReason,
        disabled: !row.isPayoutReady,
    };
};

type BreakdownItem = { label: string; value: number };

type BreakdownAccent = { bg: string; border: string; color: string };

const GROSS_ACCENT: BreakdownAccent = { bg: '#ECFDF5', border: '#CEF7E3', color: '#43B75D' };
const DEDUCTION_ACCENT: BreakdownAccent = { bg: '#FEF2F2', border: '#F7CECE', color: '#EF4444' };

// Pulls the exact component-level breakdown from the same endpoint the Employee
// Salary Profile page uses (useGetSalaryDetailsByEmployee → salaryProfileEmpV2),
// so the popover is guaranteed identical. Fetches lazily when the popover opens.
const EmployeeBreakdownPopover = ({
    employeeId,
    month,
    year,
    variant,
    fallbackTotal,
}: {
    employeeId: string;
    month: number;
    year: number;
    variant: 'gross' | 'deduction';
    fallbackTotal: number;
}) => {
    const { salaryRows, totals, tableLoading } = useGetSalaryDetailsByEmployee(employeeId, month, year);
    const isDeduction = variant === 'deduction';
    const accent = isDeduction ? DEDUCTION_ACCENT : GROSS_ACCENT;
    const title = isDeduction ? 'Deduction Breakdown' : 'Gross Salary Breakdown';

    const items: BreakdownItem[] = (salaryRows || [])
        .filter(row => (isDeduction ? row.category === 'Deduction' : row.category !== 'Deduction'))
        .map(row => ({ label: row.componentName, value: row.amount }));

    const total = isDeduction
        ? totals?.totalDeductions ?? fallbackTotal
        : totals?.totalEarnings ?? fallbackTotal;

    return (
        <Flex vertical gap={8} style={{ width: 186 }}>
            <Text style={{ fontSize: 12, fontWeight: 500, color: '#4A5565', textTransform: 'uppercase', lineHeight: '22px' }}>
                {title}
            </Text>
            <div style={{ height: 1, background: '#CBD5E1', width: '100%' }} />
            {tableLoading ? (
                <Flex align="center" justify="center" style={{ minHeight: 60 }}>
                    <Spin size="small" />
                </Flex>
            ) : (
                <Flex vertical gap={4}>
                    {items.length ? (
                        items.map((item, i) => (
                            <Flex key={i} justify="space-between" align="center" style={{ minHeight: 24 }}>
                                <Text style={{ fontSize: 12, color: '#4A5565' }}>{item.label}</Text>
                                <Text style={{ fontSize: 12, fontWeight: 500, color: '#101828' }}>₹{item.value.toLocaleString('en-IN')}</Text>
                            </Flex>
                        ))
                    ) : (
                        <Text style={{ fontSize: 12, color: '#94A3B8' }}>No components</Text>
                    )}
                </Flex>
            )}
            <Flex justify="space-between" align="center" style={{
                background: accent.bg, border: `0.5px solid ${accent.border}`,
                borderRadius: 8, padding: '4px 8px', minHeight: 32,
            }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: accent.color }}>Total</Text>
                <Text style={{ fontSize: 14, fontWeight: 600, color: accent.color }}>₹{total.toLocaleString('en-IN')}</Text>
            </Flex>
        </Flex>
    );
};

export const getSalaryColumns = ({
    selectedRowKeys,
    setEditingRecord,
    month,
    year,
}: SalaryColumnsParams): ColumnsType<SalaryRecord> => {
    const selectedKeySet = new Set(selectedRowKeys.map(String));
    const isRowExcluded = (record: SalaryRecord) => record.disabled || !selectedKeySet.has(record.key);

    return [
    {
        title: 'EMP ID',
        dataIndex: 'empId',
        key: 'empId',
        render: (empId: string, record) => (
            <Text style={{
                fontSize: 14,
                color: isRowExcluded(record) ? '#CBD5E1' : '#42526D',
            }}>
                {empId}
            </Text>
        ),
    },
    {
        title: 'Employee Name & Email',
        dataIndex: 'name',
        key: 'name',
        render: (name: string, record) => (
            <Flex align="center" gap={10} style={{
                opacity: isRowExcluded(record) ? 0.3 : 1,
            }}>
                <Flex align="center" justify="center" style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: record.avatarBg, flexShrink: 0,
                }}>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: '#FF9F9F' }}>
                        {record.initials}
                    </Text>
                </Flex>
                <Flex vertical gap={1}>
                    <Text style={{ fontSize: 14, fontWeight: 500, color: '#1E293B' }}>{name}</Text>
                    <Text style={{ fontSize: 12, color: '#8993A4' }}>{record.email}</Text>
                </Flex>
            </Flex>
        ),
    },
    {
        title: 'Account Detail',
        dataIndex: 'accountNumber',
        key: 'accountNumber',
        render: (accountNumber: string, record) =>
            accountNumber ? (
                <Flex vertical gap={1} style={{
                    opacity: isRowExcluded(record) ? 0.3 : 1,
                }}>
                    <Text style={{ fontSize: 14, color: '#42526D' }}>{accountNumber}</Text>
                    <Text style={{ fontSize: 12, color: '#8993A4' }}>{record.bankName}</Text>
                </Flex>
            ) : (
                <Text style={{ fontSize: 14, color: '#CBD5E1' }}>—</Text>
            ),
    },
    {
        title: 'Trans. Type',
        dataIndex: 'transactionType',
        key: 'transactionType',
        align: 'center' as const,
        render: (type: string | null, record) => {
            if (!type) {
                return <span style={{ color: '#8993A4', fontSize: 14 }}>—</span>;
            }
            const faded = isRowExcluded(record);
            return (
                <Tag style={{
                    background: faded ? '#F9F9F9' : '#F7EEFF',
                    border: `1px solid ${faded ? '#E4E4E7' : '#ECD3FF'}`,
                    borderRadius: 24, padding: '3px 12px',
                    fontSize: 13, color: faded ? '#CBD5E1' : '#171717',
                    fontWeight: 400, margin: 0,
                }}>
                    {type}
                </Tag>
            );
        },
    },
    {
        title: 'Gross Salary',
        dataIndex: 'grossSalary',
        key: 'grossSalary',
        render: (salary: number, record) => {
            const faded = isRowExcluded(record);
            return (
                <Popover
                    content={
                        <EmployeeBreakdownPopover
                            employeeId={record.employeeId}
                            month={month}
                            year={year}
                            variant="gross"
                            fallbackTotal={record.grossSalary}
                        />
                    }
                    trigger="hover"
                    placement="bottom"
                    overlayInnerStyle={popoverInnerStyle}
                >
                    <Flex align="center" gap={6} style={{ opacity: faded ? 0.3 : 1, cursor: 'pointer' }}>
                        <Text style={{ fontSize: 14, color: '#1E293B' }}>
                            ₹{salary.toLocaleString('en-IN')}
                        </Text>
                        <Flex align="center" justify="center" style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#ECFDF5', border: '0.5px solid #43B75D', flexShrink: 0,
                        }}>
                            <CheckOutlined style={{ fontSize: 8, color: '#43B75D' }} />
                        </Flex>
                    </Flex>
                </Popover>
            );
        },
    },
    {
        title: 'Deduction',
        dataIndex: 'deduction',
        key: 'deduction',
        render: (deduction: number, record) => {
            const faded = isRowExcluded(record);
            return (
                <Popover
                    content={
                        <EmployeeBreakdownPopover
                            employeeId={record.employeeId}
                            month={month}
                            year={year}
                            variant="deduction"
                            fallbackTotal={record.deduction}
                        />
                    }
                    trigger="hover"
                    placement="bottom"
                    overlayInnerStyle={popoverInnerStyle}
                >
                    <Flex align="center" gap={6} style={{ opacity: faded ? 0.3 : 1, cursor: 'pointer' }}>
                        <Text style={{ fontSize: 14, color: '#1E293B' }}>
                            ₹{deduction.toLocaleString('en-IN')}
                        </Text>
                        <Flex align="center" justify="center" style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#FEF2F2', border: '0.5px solid #EF4444', flexShrink: 0,
                        }}>
                            <MinusOutlined style={{ fontSize: 8, color: '#EF4444' }} />
                        </Flex>
                    </Flex>
                </Popover>
            );
        },
    },
    {
        title: 'Net Payable\nSalary',
        dataIndex: 'netSalary',
        key: 'netSalary',
        render: (net: number, record) => {
            const faded = isRowExcluded(record);
            return (
                <Text style={{ fontSize: 14, fontWeight: 500, color: faded ? '#CBD5E1' : '#1E293B' }}>
                    ₹{net.toLocaleString('en-IN')}
                </Text>
            );
        },
    },
    {
        title: 'Remark',
        dataIndex: 'remark',
        key: 'remark',
        render: (remark: string) => (
            <Text style={{ fontSize: 13, color: '#A1A1AA' }}>{remark}</Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string, record) => {
            if (isRowExcluded(record)) {
                return <Text style={{ fontSize: 13, color: '#CBD5E1' }}>Excluded</Text>;
            }
            const cfg = statusConfig[status] ?? { bg: '#F4F4F5', color: '#42526D' };
            return (
                <Flex align="center" justify="center" style={{
                    background: cfg.bg, borderRadius: 20,
                    padding: '3px 12px', display: 'inline-flex',
                }}>
                    <Text style={{ fontSize: 13, fontWeight: 500, color: cfg.color }}>
                        {status}
                    </Text>
                </Flex>
            );
        },
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
            <Flex gap={8}>
                <Button
                    size="small"
                    style={{
                        height: 28, borderRadius: 6, fontSize: 12,
                        border: '1px solid #CBD5E1',
                        color: record.disabled ? '#CBD5E1' : '#475569',
                        background: '#FFFFFF',
                    }}
                    onClick={() => !record.disabled && setEditingRecord(record)}
                >
                    Edit
                </Button>
            </Flex>
        ),
    },
    ];
};
