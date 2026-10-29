import React, { useEffect, useState } from 'react';

import { Checkbox, DatePicker, Flex, InputNumber, Modal, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import { monthNames } from '../../utils/salaryTable/data';

const { Text } = Typography;

interface EditTdsModalProps {
    open: boolean;
    month: number;
    year: number;
    currentAmount: number;
    // Shows an "Apply from" month picker (defaulting to month/year) — for screens not tied
    // to one payroll month, like the Salary Structure tab. Off on the Salary Profile, where
    // the amount applies from the month being viewed.
    allowMonthChange?: boolean;
    // Initial state of "Apply for all future months" — the saved choice when this month
    // already has its own entry, unticked otherwise.
    defaultApplyToFutureMonths?: boolean;
    onCancel: () => void;
    onSave: (amount: number, month: number, year: number, applyToFutureMonths: boolean) => Promise<boolean>;
}

// Old Tax Regime employees only: the platform doesn't compute old-regime TDS yet, so HR
// enters the monthly amount worked out outside the platform — for the chosen month only,
// or (with "Apply for all future months") for it and every later month until changed again.
const EditTdsModal = ({
    open,
    month,
    year,
    currentAmount,
    allowMonthChange,
    defaultApplyToFutureMonths = false,
    onCancel,
    onSave,
}: EditTdsModalProps) => {
    const [amount, setAmount] = useState<number | null>(currentAmount);
    const [applyToFutureMonths, setApplyToFutureMonths] = useState(defaultApplyToFutureMonths);
    const [applyFrom, setApplyFrom] = useState<Dayjs>(dayjs(new Date(year, month - 1, 1)));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setAmount(currentAmount);
            setApplyFrom(dayjs(new Date(year, month - 1, 1)));
            setApplyToFutureMonths(defaultApplyToFutureMonths);
        }
    }, [open, currentAmount, month, year, defaultApplyToFutureMonths]);

    const fromMonth = applyFrom.month() + 1;
    const fromYear = applyFrom.year();
    const monthLabel = `${monthNames[fromMonth - 1] || ''} ${fromYear}`;

    const handleSave = async () => {
        if (amount == null) return;
        setSaving(true);
        const saved = await onSave(amount, fromMonth, fromYear, applyToFutureMonths);
        setSaving(false);
        if (saved) onCancel();
    };

    return (
        <Modal
            open={open}
            title="Edit Income Tax (TDS)"
            okText="Save"
            onOk={handleSave}
            onCancel={onCancel}
            confirmLoading={saving}
            okButtonProps={{ danger: true, disabled: amount == null }}
            destroyOnClose
        >
            <Flex vertical gap={12} className="pt-2">
                <Text className="text-sm" type="secondary">
                    Enter the monthly TDS calculated for this employee under the Old Tax Regime.
                </Text>
                <Flex vertical gap={4}>
                    <Text className="text-sm font-medium">Monthly TDS amount</Text>
                    <InputNumber
                        data-testid="tds-amount-input"
                        className="w-full"
                        min={0}
                        precision={0}
                        controls={false}
                        prefix="₹"
                        value={amount}
                        onChange={value => setAmount(value)}
                        formatter={value => (value == null ? '' : formatNumberWithLocalStringWithoutDecimalPoint(value))}
                        parser={value => Number((value || '').replace(/,/g, ''))}
                        autoFocus
                    />
                </Flex>
                {allowMonthChange && (
                    <Flex vertical gap={4}>
                        <Text className="text-sm font-medium">Apply from</Text>
                        <DatePicker
                            data-testid="tds-apply-from"
                            picker="month"
                            format="MMMM YYYY"
                            allowClear={false}
                            className="w-full"
                            value={applyFrom}
                            onChange={value => value && setApplyFrom(value)}
                        />
                    </Flex>
                )}
                <Checkbox
                    data-testid="tds-apply-future"
                    checked={applyToFutureMonths}
                    onChange={e => setApplyToFutureMonths(e.target.checked)}
                >
                    Apply for all future months
                </Checkbox>
                <Text className="text-xs" type="secondary">
                    {applyToFutureMonths
                        ? `Applies to ${monthLabel} and every month after it, until you change it again for a later month.`
                        : `Applies to ${monthLabel} only.`}{' '}
                    Months that are already approved or paid are not affected.
                </Text>
            </Flex>
        </Modal>
    );
};

export default EditTdsModal;
