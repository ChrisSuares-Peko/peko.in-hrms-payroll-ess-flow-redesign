import { useEffect, useState } from 'react';

import { CheckOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Select, Typography } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import { useLocation, useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useGetVirtualAccountBalance from '@src/domains/dashboard/paymentLinks/hooks/useGetVirtualAccountBalance';
import EditSalaryDrawer from '@src/domains/dashboard/Payroll/components/drawers/EditSalaryDrawer';
import ProceedSalaryModal from '@src/domains/dashboard/Payroll/components/modals/ProceedSalaryModal';
import { useScrollToTop } from '@src/hooks/useScrollToTop';
import { paths } from '@src/routes/paths';


import { useGetProcessSalaryEmployeesApi } from '../hooks/processSalary/useGetProcessSalaryEmployeesApi';
import { useProcessSalaryApi } from '../hooks/processSalary/useProcessSalaryApi';
import { SalaryRecord } from '../types/processSalary';
import {
    formatCurrency,
    getSalaryColumns,
    mapEmployeeRowToSalaryRecord,
    maskAccountNumber,
    monthOptions,
    monthShortLabel,
    parseMonthValue,
} from '../utils/processSalary';

const { Text } = Typography;

const NUM_TO_MONTH_KEY: Record<number, string> = {
    1: 'jan', 2: 'feb', 3: 'mar', 4: 'apr', 5: 'may', 6: 'jun',
    7: 'jul', 8: 'aug', 9: 'sep', 10: 'oct', 11: 'nov', 12: 'dec',
};

const SalaryProcess = () => {
    useScrollToTop();
    const location = useLocation();
    const routeState = (location.state || {}) as { month?: number; year?: number };
    // Falls back to the previous (last) month when no month/year was passed via navigation state.
    const getPrevMonthValue = () => {
        const now = new Date();
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth(), 0);
        const year = prevMonthDate.getFullYear();
        const shortMonth = prevMonthDate.toLocaleString('en-US', { month: 'short' }).toLowerCase();
        return `${shortMonth}-${year}`;
    };
    const defaultMonth = (() => {
        const m = Number(routeState.month);
        const y = Number(routeState.year);
        const key = NUM_TO_MONTH_KEY[m];
        if (key && y > 0) return `${key}-${y}`;
        return getPrevMonthValue();
    })();
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
    const [checkedRowKeys, setCheckedRowKeys] = useState<React.Key[]>([]);
    const [selectedBank, setSelectedBank] = useState<string | undefined>();
    const [confirmed, setConfirmed] = useState(false);
    const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
    const [showProceedModal, setShowProceedModal] = useState(false);
    const [salaryDone, setSalaryDone] = useState(false);
    const [completedSummary, setCompletedSummary] = useState({ count: 0, total: 0 });
    const navigate = useNavigate();
    const selectedMonthParams = parseMonthValue(selectedMonth);
    const {
        rows,
        count,
        page,
        setPage,
        isLoading,
        refetch,
    } = useGetProcessSalaryEmployeesApi({
        month: selectedMonthParams.month,
        year: selectedMonthParams.year,
        limit: 10,
    });
    const { processSalary, isProcessing } = useProcessSalaryApi();
    const {
        balance: availableBalance,
        accountName: vaAccountName,
        virtualAccountNumber: vaNumber,
        ifsc: vaIfsc,
        isLoading: isBalanceLoading,
        fetchBalance: refetchBalance,
    } = useGetVirtualAccountBalance();
    const salaryRecords = rows.map(mapEmployeeRowToSalaryRecord);
    const hasVirtualAccount = Boolean(vaNumber);
    const payFromOptions = vaNumber
        ? [
            {
                value: vaNumber,
                label: (
                    <Flex vertical gap={2}>
                        <Text style={{ fontSize: 13, fontWeight: 500, color: '#101828' }}>
                            {vaAccountName || 'Payroll Virtual Account'} - {maskAccountNumber(vaNumber)}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6B788E' }}>
                            IFSC: {vaIfsc || '—'} | Balance: {formatCurrency(availableBalance)}
                        </Text>
                    </Flex>
                ),
            },
        ]
        : [];
    useEffect(() => {
        setCheckedRowKeys(
            rows
                .map(mapEmployeeRowToSalaryRecord)
                .filter(record => !record.disabled)
                .map(record => record.key)
        );
    }, [rows]);

    useEffect(() => {
        setSelectedBank(vaNumber || undefined);
    }, [vaNumber]);

    const handleMonthChange = (value: string) => {
        setSelectedMonth(value);
        setPage(1);
        setCheckedRowKeys([]);
    };

    const checkedKeySet = new Set(checkedRowKeys.map(String));
    const includedRecords = salaryRecords.filter(
        r => !r.disabled && checkedKeySet.has(r.key)
    );
    const totalPayout = includedRecords.reduce((sum, r) => sum + r.netSalary, 0);
    const canProceedSalary = confirmed && includedRecords.length > 0 && hasVirtualAccount && !isProcessing;

    if (salaryDone) {
        return (
            <Flex
                align="center"
                justify="center"
                style={{ padding: '48px 16px', width: '100%', minHeight: '70vh' }}
            >
                <Flex
                    vertical
                    align="center"
                    gap={28}
                    style={{
                        background: '#FFFFFF',
                        border: '1px solid #EFF1F4',
                        borderRadius: 20,
                        padding: '48px 40px',
                        width: '100%',
                        maxWidth: 540,
                    }}
                >
                    {/* Green success icon */}
                    <Flex align="center" justify="center" style={{
                        width: 80, height: 80, borderRadius: '50%', background: '#E8FAF0',
                    }}>
                        <Flex align="center" justify="center" style={{
                            width: 60, height: 60, borderRadius: '50%', background: '#D1F4E0',
                        }}>
                            <Flex align="center" justify="center" style={{
                                width: 42, height: 42, borderRadius: '50%', background: '#45D483',
                            }}>
                                <CheckOutlined style={{ fontSize: 18, color: '#FFFFFF' }} />
                            </Flex>
                        </Flex>
                    </Flex>

                    <Flex vertical align="center" gap={8}>
                        <Text style={{ fontSize: 22, fontWeight: 600, color: '#101828' }}>Done</Text>
                        <Text style={{ fontSize: 14, color: '#6B788E' }}>Salary distributed successfully</Text>
                    </Flex>

                    {/* Summary card */}
                    <Flex
                        style={{
                            width: '100%',
                            background: '#FFFFFF',
                            border: '1px solid #D9D9D9',
                            boxShadow: '0px 1px 12px 1px rgba(122,122,122,0.06)',
                            borderRadius: 16,
                            padding: '16px 20px',
                        }}
                    >
                        <Flex vertical gap={6} style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, color: '#6B788E' }}>Employees</Text>
                            <Text style={{ fontSize: 15, fontWeight: 600, color: '#101828' }}>{completedSummary.count}</Text>
                        </Flex>
                        <div style={{ width: 1, background: '#EAECF0', marginInline: 20 }} />
                        <Flex vertical gap={6} style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, color: '#6B788E' }}>Total</Text>
                            <Text style={{ fontSize: 15, fontWeight: 600, color: '#101828' }}>₹{completedSummary.total.toLocaleString('en-IN')}</Text>
                        </Flex>
                    </Flex>

                    <Button
                        style={{
                            height: 38, borderRadius: 8, fontSize: 14, fontWeight: 500,
                            border: '1px solid #FF4F4F', color: '#FF4F4F', background: '#FFFFFF',
                            paddingInline: 24,
                        }}
                        onClick={() => navigate(`/${paths.payroll.index}/${paths.payroll.salaryDashboard}`)}
                    >
                        Back to dashboard
                    </Button>
                </Flex>
            </Flex>
        );
    }

    const rowSelection: TableRowSelection<SalaryRecord> = {
        selectedRowKeys: checkedRowKeys,
        onChange: keys => setCheckedRowKeys(keys),
        getCheckboxProps: record => ({
            disabled: record.disabled,
        }),
    };

    const columns = getSalaryColumns({
        selectedRowKeys: checkedRowKeys,
        setEditingRecord,
        month: selectedMonthParams.month,
        year: selectedMonthParams.year,
    });

    return (
        <><Flex vertical gap={24} style={{ width: '100%' }}>
            {/* Header */}
            <Flex justify="space-between" align="center">
                <Text className="text-2xl font-semibold">
                    Process Salary
                </Text>
            </Flex>

            {/* Warning banner */}
            <Flex align="center" gap={8} style={{
                background: '#FFFCEC', borderRadius: 16, padding: '10px 16px',
            }}>
                <ExclamationCircleOutlined style={{ fontSize: 16, color: '#FFA940', flexShrink: 0 }} />
                <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)' }}>
                    Heads up — your account balance may fall short. Please top up before triggering payroll.
                </Text>
            </Flex>

            {/* Prerequisite banner */}
            <Flex align="center" gap={8} style={{
                background: '#EFF6FF', borderRadius: 16, padding: '10px 16px',
            }}>
                <InfoCircleOutlined style={{ fontSize: 16, color: '#3B82F6', flexShrink: 0 }} />
                <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)' }}>
                    Only employees who are approved on{' '}
                    <Text
                        onClick={() => navigate(`/${paths.payroll.index}/${paths.payroll.employeesSalary}`)}
                        style={{ color: '#FF4F4F', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
                    >
                        Employee Salary
                    </Text>
                    {' '}and have a beneficiary added on{' '}
                    <Text
                        onClick={() => navigate(`/${paths.payroll.index}/${paths.payroll.salaryEmployees}`)}
                        style={{ color: '#FF4F4F', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
                    >
                        Salary Employees
                    </Text>
                    {' '}will appear here. Approve employees and add beneficiaries to include them.
                </Text>
            </Flex>

            {/* Table Card */}
            <Flex vertical style={{
                background: '#FFFFFF',
                border: '1px solid #EFF1F4',
                borderRadius: 20,
                padding: 'clamp(18px, 4vw, 28px) clamp(16px, 4vw, 32px)',
                width: '100%',
            }}>
                {/* Title + Month select */}
                <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 24 }}>
                    <Text style={{ flex: '1 1 220px', fontSize: 20, fontWeight: 500, color: '#171717' }}>
                        Salary Payments —{' '}
                        <Text style={{ fontSize: 20, fontWeight: 500, color: '#FF4F4F' }}>
                            {monthShortLabel[selectedMonth] ?? ''}
                        </Text>
                    </Text>
                    <Select
                        value={selectedMonth}
                        onChange={handleMonthChange}
                        options={monthOptions}
                        className="w-full sm:w-[180px]"
                        style={{ height: 40 }}
                    />
                </Flex>

                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <GenericTable
                        rowKey="key"
                        rowSelection={rowSelection}
                        columns={columns}
                        dataSource={salaryRecords}
                        loading={isLoading}
                        style={{ minWidth: 720 }}
                        pagination={{
                            current: page,
                            pageSize: 10,
                            total: count,
                            showSizeChanger: false,
                            onChange: (currentPage: number) => setPage(currentPage),
                        }}
                    />
                </div>

                {/* Summary row */}
                <Flex
                    align="flex-end"
                    wrap="wrap"
                    gap={20}
                    style={{
                        marginTop: 8,
                        padding: '20px 24px',
                        background: '#FFFFFF',
                        borderRadius: 12,
                        border: '1px solid #EFF1F4',
                    }}
                >
                    {/* Employees Included */}
                    <Flex vertical gap={8} style={{ flex: '1 1 180px' }}>
                        <Text style={{ fontSize: 13, color: '#6B788E' }}>Employees Included</Text>
                        <Flex
                            align="center"
                            style={{
                                height: 40,
                                padding: '0 14px',
                                background: '#FFFFFF',
                                borderRadius: 8,
                            }}
                            className="!bg-[#FAFAFA]"
                        >
                            <Text style={{ fontSize: 14, color: '#101828' }}>
                                {includedRecords.length} employees
                            </Text>
                        </Flex>
                    </Flex>

                    {/* Total Payout */}
                    <Flex vertical gap={8} style={{ flex: '1 1 180px' }}>
                        <Text style={{ fontSize: 13, color: '#6B788E' }}>Total Payout</Text>
                        <Flex
                            align="center"
                            style={{
                                height: 40,
                                padding: '0 14px',
                                background: '#FFFFFF',
                                borderRadius: 8,
                            }}
                            className="!bg-[#FAFAFA]"
                        >
                            <Text style={{ fontSize: 14, color: '#101828' }}>
                                ₹{totalPayout.toLocaleString('en-IN')}
                            </Text>
                        </Flex>
                    </Flex>

                    {/* Pay From */}
                    <Flex vertical gap={8} style={{ flex: '1 1 260px', minWidth: 0 }}>
                        <Flex justify="space-between" align="center" wrap="wrap" gap={6}>
                            <Text style={{ fontSize: 13, color: '#6B788E' }}>Pay From</Text>
                            <Text style={{ fontSize: 13, color: '#43B75D', fontWeight: 500 }}>
                                Available: {formatCurrency(availableBalance)}
                            </Text>
                        </Flex>
                        <Select
                            value={selectedBank}
                            onChange={setSelectedBank}
                            options={payFromOptions}
                            loading={isBalanceLoading}
                            disabled={!hasVirtualAccount || isBalanceLoading}
                            placeholder={isBalanceLoading ? 'Fetching virtual account...' : 'Virtual account not available'}
                            style={{ width: '100%', height: 40 }}
                        />
                    </Flex>
                </Flex>

                {/* Confirmation row */}
                <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginTop: 20 }}>
                    <Flex align="center" gap={10} style={{ flex: '1 1 260px', minWidth: 0 }}>
                        <Checkbox
                            checked={confirmed}
                            onChange={e => setConfirmed(e.target.checked)}
                        />
                        <Text style={{ fontSize: 14, color: '#475569' }}>
                            I&apos;ve reviewed all details and they&apos;re good to go.
                        </Text>
                    </Flex>
                    <Button
                        type="primary"
                        danger
                        disabled={!canProceedSalary}
                        className="w-full sm:w-auto"
                        style={{
                            height: 44,
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            background: canProceedSalary ? '#FF4F4F' : undefined,
                            borderColor: canProceedSalary ? '#FF4F4F' : undefined,
                            paddingInline: 32,
                        }}
                        onClick={() => canProceedSalary && setShowProceedModal(true)}
                    >
                        Proceed salary
                    </Button>
                </Flex>
            </Flex>
        </Flex>

        <EditSalaryDrawer
            open={!!editingRecord}
            onClose={() => setEditingRecord(null)}
            record={editingRecord}
        />
        <ProceedSalaryModal
            open={showProceedModal}
            onClose={() => {
                if (!isProcessing) setShowProceedModal(false);
            }}
            onConfirm={async () => {
                const snapshot = {
                    count: includedRecords.length,
                    total: totalPayout,
                };
                const resp = await processSalary({
                    month: selectedMonthParams.month,
                    year: selectedMonthParams.year,
                    salaryIds: includedRecords.map(r => r.salaryId),
                });
                if (resp) {
                    setCompletedSummary(snapshot);
                    setShowProceedModal(false);
                    setSalaryDone(true);
                    refetch();
                    refetchBalance();
                }
            }}
            isProcessing={isProcessing}
            employeeCount={includedRecords.length}
            totalPayout={totalPayout}
        /></>
    );
};

export default SalaryProcess;
