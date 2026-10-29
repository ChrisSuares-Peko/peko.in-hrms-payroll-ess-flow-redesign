import { useEffect, useMemo, useState } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Input, InputNumber, Modal, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { formatNumberWithLocalString } from '@src/utils/priceFormat';

import { useLossOfPaySheet } from '../../hooks/employeeSalaryHooks/LossOfPayHooks/useLossOfPaySheet';
import { LossOfPaySheetRow } from '../../types/salaryProfileTypes/lossOfPayTypes';
import { getMonthName } from '../../utils/general/formatter';

interface LossOfPayModalProps {
    open: boolean;
    month: number;
    year: number;
    handleCancel: () => void;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface DraftEntry {
    days: number;
    amount: number;
    isAmountOverridden: boolean;
}

const roundToPaise = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
// Half-day steps, never more than the days the employee is on payroll this month.
const clampDays = (value: number, max: number) => Math.min(Math.max(Math.round((value || 0) * 2) / 2, 0), max);
const formatRupees = (value: number) => `₹ ${formatNumberWithLocalString(value, 0, 2)}`;

const headerWithTip = (label: string, tip: string) => (
    <span>
        {label}{' '}
        <Tooltip title={tip}>
            <InfoCircleOutlined style={{ color: '#98a2b3', cursor: 'help' }} />
        </Tooltip>
    </span>
);

function LossOfPayModal({ open, month, year, handleCancel, reloadTable }: LossOfPayModalProps) {
    const { sheet, isLoading, isSaving, save } = useLossOfPaySheet(month, year, open);
    const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({});
    const [searchText, setSearchText] = useState('');
    const [bulkDays, setBulkDays] = useState<number | null>(null);

    useEffect(() => {
        if (!sheet) return;
        setDrafts(
            Object.fromEntries(
                sheet.rows.map(row => [
                    row.employeeId,
                    { days: row.days, amount: row.amount, isAmountOverridden: row.isAmountOverridden },
                ])
            )
        );
    }, [sheet]);

    const filteredRows = useMemo(() => {
        const rows = sheet?.rows ?? [];
        const query = searchText.trim().toLowerCase();
        if (!query) return rows;
        return rows.filter(row =>
            [row.employeeName, row.employeeCode, row.department].some(value =>
                String(value ?? '').toLowerCase().includes(query)
            )
        );
    }, [sheet, searchText]);

    const employeesWithLop = useMemo(
        () => Object.values(drafts).filter(entry => entry.days > 0).length,
        [drafts]
    );

    // Changing the days always brings the calculated amount back, even if it was typed over.
    const setDays = (row: LossOfPaySheetRow, value: number | null) => {
        const days = clampDays(Number(value ?? 0), row.eligibleDays);
        setDrafts(prev => ({
            ...prev,
            [row.employeeId]: { days, amount: roundToPaise(row.perDayRate * days), isAmountOverridden: false },
        }));
    };

    const setAmount = (row: LossOfPaySheetRow, value: number | null) => {
        const amount = roundToPaise(Math.min(Math.max(Number(value ?? 0), 0), row.grossBeforeLop));
        setDrafts(prev => ({
            ...prev,
            [row.employeeId]: { ...prev[row.employeeId], amount, isAmountOverridden: true },
        }));
    };

    const applyToShown = () => {
        if (bulkDays === null) return;
        setDrafts(prev => {
            const next = { ...prev };
            filteredRows
                .filter(row => !row.isLocked)
                .forEach(row => {
                    const days = clampDays(bulkDays, row.eligibleDays);
                    next[row.employeeId] = {
                        days,
                        amount: roundToPaise(row.perDayRate * days),
                        isAmountOverridden: false,
                    };
                });
            return next;
        });
    };

    const handleSave = async () => {
        if (!sheet) return;
        const entries = sheet.rows
            .filter(row => !row.isLocked && drafts[row.employeeId])
            .map(row => ({ employeeId: row.employeeId, ...drafts[row.employeeId] }));
        const saved = await save(entries);
        if (saved) {
            if (reloadTable) reloadTable(prev => !prev);
            handleCancel();
        }
    };

    const monthLabel = `${getMonthName(month)} ${year}`;

    const columns: ColumnsType<LossOfPaySheetRow> = [
        {
            title: 'Employee',
            dataIndex: 'employeeName',
            render: (_: string, row) => (
                <Flex vertical>
                    <Typography.Text className="text-sm font-medium">{row.employeeName ?? 'N/A'}</Typography.Text>
                    <Typography.Text className="text-xs" style={{ color: '#94a3b8' }}>
                        {[row.employeeCode, row.department].filter(Boolean).join(', ')}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: headerWithTip(
                'Days in month',
                `${sheet?.daysBasis === 'WORKING_DAYS' ? 'Company working days' : 'Calendar days'} in ${monthLabel}. A joiner or leaver shows their days on the payroll out of the month.`
            ),
            dataIndex: 'daysInMonth',
            align: 'right',
            width: 140,
            render: (_: number, row) =>
                row.eligibleDays < row.daysInMonth ? `${row.eligibleDays} of ${row.daysInMonth}` : row.daysInMonth,
        },
        {
            title: headerWithTip('Per-day rate', "Monthly gross ÷ days in the month."),
            dataIndex: 'perDayRate',
            align: 'right',
            width: 140,
            render: (value: number) => formatRupees(value),
        },
        {
            title: headerWithTip(
                'LOP days',
                'Unpaid days, in half-day steps. Editable until the month is paid.'
            ),
            dataIndex: 'days',
            align: 'right',
            width: 140,
            render: (_: number, row) => (
                <InputNumber
                    data-testid={`lop-days-${row.employeeCode ?? row.employeeId}`}
                    style={{ width: 100 }}
                    min={0}
                    max={row.eligibleDays}
                    step={0.5}
                    precision={1}
                    controls={false}
                    disabled={row.isLocked}
                    value={drafts[row.employeeId]?.days ?? 0}
                    onChange={value => setDays(row, value)}
                />
            ),
        },
        {
            title: headerWithTip(
                'Amount',
                'LOP days × per-day rate. You can type a different amount; changing the days brings this back.'
            ),
            dataIndex: 'amount',
            align: 'right',
            width: 180,
            render: (_: number, row) => {
                const draft = drafts[row.employeeId];
                return (
                    <InputNumber
                        data-testid={`lop-amount-${row.employeeCode ?? row.employeeId}`}
                        style={{ width: 150 }}
                        prefix="₹"
                        controls={false}
                        min={0}
                        max={row.grossBeforeLop}
                        precision={2}
                        disabled={row.isLocked || !(draft?.days > 0)}
                        value={draft?.amount ?? 0}
                        formatter={value =>
                            value === undefined || value === null || String(value) === ''
                                ? ''
                                : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })
                        }
                        parser={value => Number(String(value ?? '').replace(/[₹,\s]/g, '')) as unknown as 0}
                        onChange={value => setAmount(row, value)}
                    />
                );
            },
        },
        {
            title: '',
            key: 'status',
            width: 90,
            render: (_: unknown, row) => (row.isLocked ? <Tag color="success">Paid</Tag> : null),
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            width={1040}
            title={`Loss of Pay for ${monthLabel}`}
            destroyOnClose
            footer={
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <Flex align="center" gap={8}>
                        <Typography.Text>Set</Typography.Text>
                        <InputNumber
                            data-testid="lop-bulk-days"
                            style={{ width: 70 }}
                            min={0}
                            step={0.5}
                            precision={1}
                            controls={false}
                            value={bulkDays}
                            onChange={value => setBulkDays(value === null ? null : Number(value))}
                        />
                        <Typography.Text>days for everyone shown</Typography.Text>
                        <Button disabled={bulkDays === null || sheet?.isMonthPaid} onClick={applyToShown}>
                            Apply
                        </Button>
                    </Flex>
                    <Flex gap={8}>
                        <Button onClick={handleCancel}>Cancel</Button>
                        <Button
                            danger
                            type="primary"
                            loading={isSaving}
                            disabled={isLoading || !sheet || sheet.isMonthPaid}
                            onClick={handleSave}
                        >
                            Save for {monthLabel}
                        </Button>
                    </Flex>
                </Flex>
            }
        >
            <Flex vertical gap={14} className="pt-2">
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <Input
                        data-testid="lop-search"
                        allowClear
                        style={{ width: 340 }}
                        placeholder="Search by name, employee ID or department"
                        value={searchText}
                        onChange={event => setSearchText(event.target.value)}
                    />
                    <Typography.Text data-testid="lop-totals" className="text-sm" style={{ color: '#535862' }}>
                        {employeesWithLop} employee{employeesWithLop === 1 ? '' : 's'} with Loss of Pay
                    </Typography.Text>
                </Flex>
                <Table<LossOfPaySheetRow>
                    rowKey="employeeId"
                    size="middle"
                    loading={isLoading}
                    columns={columns}
                    dataSource={filteredRows}
                    pagination={false}
                    scroll={{ y: 420 }}
                />
            </Flex>
        </Modal>
    );
}

export default LossOfPayModal;
