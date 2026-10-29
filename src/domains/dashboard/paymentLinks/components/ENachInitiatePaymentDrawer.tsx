import { Button, DatePicker, Drawer, Flex, InputNumber, Space, Typography } from 'antd';
import type { Dayjs } from 'dayjs';

import { formatAmount } from '../utils/data';

interface ENachInitiatePaymentDrawerProps {
    open: boolean;
    width: number | string;
    onClose: () => void;
    onSubmit: () => void;
    isInitiating: boolean;
    isInitiateDisabled: boolean;
    mandateAmount: number;
    isAmountRuleMax: boolean;
    initiateAmount: number;
    onAmountChange: (value: number | null) => void;
    amountError: string;
    debitDate: Dayjs | null;
    onDebitDateChange: (value: Dayjs | null) => void;
    debitDateError: string;
    isDateDisabled: boolean;
    disabledDate: (current: any) => boolean;
    minDebitDateLabel: string;
    initiationEligibilityMessage: string;
    initiationEligibilityToneColor: string;
    showNextAllowedAt: boolean;
    nextAllowedAtLabel: string | null;
}

const ENachInitiatePaymentDrawer = ({
    open,
    width,
    onClose,
    onSubmit,
    isInitiating,
    isInitiateDisabled,
    mandateAmount,
    isAmountRuleMax,
    initiateAmount,
    onAmountChange,
    amountError,
    debitDate,
    onDebitDateChange,
    debitDateError,
    isDateDisabled,
    disabledDate,
    minDebitDateLabel,
    initiationEligibilityMessage,
    initiationEligibilityToneColor,
    showNextAllowedAt,
    nextAllowedAtLabel,
}: ENachInitiatePaymentDrawerProps) => (
    <Drawer
        title="Initiate Mandate Payment"
        placement="right"
        width={width}
        open={open}
        onClose={onClose}
        destroyOnClose={false}
        zIndex={1100}
        footer={
            <Flex gap={10}>
                <Button style={{ flex: 1 }} onClick={onClose} disabled={isInitiating}>
                    Cancel
                </Button>
                <Button
                    type="primary"
                    danger
                    style={{ flex: 1 }}
                    onClick={onSubmit}
                    loading={isInitiating}
                    disabled={isInitiateDisabled}
                >
                    Initiate Payment
                </Button>
            </Flex>
        }
    >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Text type="secondary">
                Choose a valid debit date and initiate payment for this mandate.
            </Typography.Text>
            <Typography.Text style={{ fontSize: 11, color: initiationEligibilityToneColor }}>
                {initiationEligibilityMessage}
            </Typography.Text>
            {showNextAllowedAt && nextAllowedAtLabel ? (
                <Typography.Text style={{ fontSize: 11 }} type="secondary">
                    Next allowed at: {nextAllowedAtLabel}
                </Typography.Text>
            ) : null}

            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Typography.Text type="secondary">Amount</Typography.Text>
                <InputNumber
                    size="large"
                    style={{ width: '100%' }}
                    value={initiateAmount}
                    min={0.01}
                    max={mandateAmount}
                    precision={2}
                    controls={isAmountRuleMax}
                    disabled={!isAmountRuleMax}
                    onChange={onAmountChange}
                    addonBefore="₹"
                />
                <Typography.Text style={{ fontSize: 11 }} type="secondary">
                    {isAmountRuleMax
                        ? `Amount rule is max. You can enter any amount up to ${formatAmount(mandateAmount)}.`
                        : 'Amount rule is fixed. This amount cannot be changed.'}
                </Typography.Text>
                {amountError ? (
                    <Typography.Text type="danger">{amountError}</Typography.Text>
                ) : null}
            </Space>

            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Typography.Text type="secondary">Debit Date</Typography.Text>
                <DatePicker
                    size="large"
                    style={{ width: '100%' }}
                    status={debitDateError ? 'error' : ''}
                    value={debitDate}
                    format="YYYY-MM-DD"
                    onChange={value => onDebitDateChange(value ? value.startOf('day') : null)}
                    disabled={isDateDisabled}
                    disabledDate={disabledDate}
                    allowClear={false}
                />
                <Typography.Text style={{ fontSize: 11 }} type="secondary">
                    Debit date must be today or at least 2 days after mandate start date, whichever
                    is later.
                </Typography.Text>
                <Typography.Text style={{ fontSize: 11 }} type="secondary">
                    Earliest allowed debit date: {minDebitDateLabel}
                </Typography.Text>
                {debitDateError ? (
                    <Typography.Text type="danger">{debitDateError}</Typography.Text>
                ) : null}
            </Space>
        </Space>
    </Drawer>
);

export default ENachInitiatePaymentDrawer;
