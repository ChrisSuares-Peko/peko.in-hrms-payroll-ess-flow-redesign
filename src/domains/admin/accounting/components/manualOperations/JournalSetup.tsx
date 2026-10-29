import { ReactNode } from 'react';

import { CalculatorOutlined } from '@ant-design/icons';
import { Button, Col, Flex, InputNumber, Row, Select, Typography } from 'antd';

import { SETUP_LABELS } from './manualJournalColumns';
import {
    ManualJournalAccount,
    ManualJournalBillingType,
    ManualJournalCommissionMode,
    ManualJournalCommissionType,
    ManualJournalFeeType,
    ManualJournalPaymentThrough,
    ManualJournalSetup,
} from '../../types/manualJournal';

type Option<T extends string> = { value: T; label: string };

type Props = {
    value: ManualJournalSetup;
    accounts: ManualJournalAccount[];
    disabled: boolean;
    generating: boolean;
    stale: boolean;
    onChange: (next: ManualJournalSetup) => void;
    onGenerate: () => void;
};

const YES_NO = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
];

const PAYMENT_THROUGH_OPTIONS: Option<ManualJournalPaymentThrough>[] = [
    { value: 'GATEWAY', label: 'Gateway' },
    { value: 'WALLET', label: 'Wallet' },
    { value: 'BOTH', label: 'Gateway and wallet' },
];

const COMMISSION_TYPE_OPTIONS: Option<ManualJournalCommissionType>[] = [
    { value: 'PERCENTAGE', label: 'Percentage of the amount' },
    { value: 'FLAT', label: 'Flat amount' },
];

const COMMISSION_MODE_OPTIONS: Option<ManualJournalCommissionMode>[] = [
    { value: 'MARGIN', label: 'Margin' },
    { value: 'PRINCIPAL_MARKUP', label: 'Principal markup' },
    { value: 'MIXED', label: 'Mixed' },
];

const BILLING_OPTIONS: Option<ManualJournalBillingType>[] = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'ANNUALLY', label: 'Annually' },
];

const FEE_TYPE_OPTIONS: Option<ManualJournalFeeType>[] = [
    { value: 'FLAT', label: 'Flat amount' },
    { value: 'PERCENTAGE', label: 'Percentage of the amount' },
];

const yesNo = (value: boolean) => (value ? 'yes' : 'no');

const chargeTerms = (percentage: number | null, fixed: number | null) =>
    percentage === null && fixed === null ? null : { percentage, fixed };

const pgAmountFor = (
    paymentThrough: string,
    orderAmount: number | null,
    pgAmount: number | null
) => {
    if (paymentThrough === 'WALLET') return 0;
    if (paymentThrough === 'GATEWAY') return orderAmount;
    return pgAmount;
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <Col xs={24} sm={12} xl={6}>
        <Flex vertical gap={2}>
            <Typography.Text className="text-xs text-textBody">{label}</Typography.Text>
            {children}
        </Flex>
    </Col>
);

type NumberFieldProps = {
    label: string;
    value: number | null;
    enabled: boolean;
    disabled: boolean;
    max?: number;
    onValue: (next: number | null) => void;
};

const NumberField = ({ label, value, enabled, disabled, max, onValue }: NumberFieldProps) => (
    <Field label={label}>
        <InputNumber
            className="w-full"
            min={0}
            max={max}
            precision={2}
            value={value}
            disabled={disabled || !enabled}
            onChange={next => onValue(next === null || next === undefined ? null : Number(next))}
            aria-label={label}
        />
    </Field>
);

type SelectFieldProps<T extends string> = {
    label: string;
    value: T;
    options: Option<T>[];
    enabled: boolean;
    disabled: boolean;
    onValue: (next: T) => void;
};

const SelectField = <T extends string>({
    label,
    value,
    options,
    enabled,
    disabled,
    onValue,
}: SelectFieldProps<T>) => (
    <Field label={label}>
        <Select
            className="w-full"
            value={value}
            options={options}
            disabled={disabled || !enabled}
            onChange={onValue}
            aria-label={label}
        />
    </Field>
);

// Stating how the order was sold. Fields that do not apply to the choices made are shown
// disabled rather than hidden, so every set-up reads the same way.
const JournalSetup = ({
    value,
    accounts,
    disabled,
    generating,
    stale,
    onChange,
    onGenerate,
}: Props) => {
    const subscription = value.subscription.is;
    const vendor = !subscription && value.vendor.present;
    const commission = vendor && value.commission.present;
    const mixed = vendor && value.commission.mode === 'MIXED';
    const walletOnly = value.paymentThrough === 'WALLET';
    const both = value.paymentThrough === 'BOTH';
    const percentage = value.commission.type === 'PERCENTAGE';
    const feePercentage = value.platformFee.type === 'PERCENTAGE';

    const gatewayOptions = accounts
        .filter(account => (account.type || '').toLowerCase() === 'bank')
        .map(account => ({ value: account.id, label: account.name }));
    if (
        value.gateway.accountId &&
        !gatewayOptions.some(option => option.value === value.gateway.accountId)
    ) {
        gatewayOptions.push({
            value: value.gateway.accountId,
            label: value.gateway.name || value.gateway.accountId,
        });
    }

    const patch = (next: Partial<ManualJournalSetup>) => onChange({ ...value, ...next });
    const field = { disabled };

    return (
        <Flex vertical gap={8}>
            <Row gutter={[12, 12]}>
                <SelectField
                    {...field}
                    label={SETUP_LABELS.paymentThrough}
                    value={value.paymentThrough}
                    options={PAYMENT_THROUGH_OPTIONS}
                    enabled
                    onValue={next =>
                        patch({
                            paymentThrough: next,
                            pgAmount: pgAmountFor(next, value.orderAmount, value.pgAmount),
                        })
                    }
                />
                <Field label={SETUP_LABELS.gatewayAccount}>
                    <Select
                        className="w-full"
                        showSearch
                        optionFilterProp="label"
                        placeholder="Pick the gateway account"
                        value={value.gateway.accountId || undefined}
                        options={gatewayOptions}
                        disabled={disabled || walletOnly}
                        onChange={accountId =>
                            patch({
                                gateway: {
                                    accountId,
                                    name:
                                        gatewayOptions.find(option => option.value === accountId)
                                            ?.label || value.gateway.name,
                                },
                            })
                        }
                        aria-label={SETUP_LABELS.gatewayAccount}
                    />
                </Field>
                <NumberField
                    {...field}
                    label={SETUP_LABELS.orderAmount}
                    value={value.orderAmount}
                    enabled
                    onValue={orderAmount =>
                        patch({
                            orderAmount,
                            pgAmount:
                                value.paymentThrough === 'GATEWAY' ? orderAmount : value.pgAmount,
                        })
                    }
                />
                <NumberField
                    {...field}
                    label={SETUP_LABELS.pgAmount}
                    value={value.pgAmount}
                    enabled={both}
                    onValue={pgAmount => patch({ pgAmount })}
                />

                <SelectField
                    {...field}
                    label={SETUP_LABELS.subscription}
                    value={yesNo(subscription)}
                    options={YES_NO}
                    enabled
                    onValue={next =>
                        patch({
                            subscription: {
                                is: next === 'yes',
                                billingType:
                                    next === 'yes'
                                        ? value.subscription.billingType || 'MONTHLY'
                                        : null,
                            },
                        })
                    }
                />
                <SelectField
                    {...field}
                    label={SETUP_LABELS.billingType}
                    value={value.subscription.billingType || 'MONTHLY'}
                    options={BILLING_OPTIONS}
                    enabled={subscription}
                    onValue={billingType =>
                        patch({ subscription: { ...value.subscription, billingType } })
                    }
                />
                <SelectField
                    {...field}
                    label={SETUP_LABELS.vendor}
                    value={yesNo(value.vendor.present)}
                    options={YES_NO}
                    enabled={!subscription}
                    onValue={next => patch({ vendor: { present: next === 'yes' } })}
                />
                <SelectField
                    {...field}
                    label={SETUP_LABELS.commission}
                    value={yesNo(value.commission.present)}
                    options={YES_NO}
                    enabled={vendor}
                    onValue={next =>
                        patch({ commission: { ...value.commission, present: next === 'yes' } })
                    }
                />
                <SelectField
                    {...field}
                    label={SETUP_LABELS.commissionType}
                    value={value.commission.type}
                    options={COMMISSION_TYPE_OPTIONS}
                    enabled={commission}
                    onValue={type => patch({ commission: { ...value.commission, type } })}
                />
                <SelectField
                    {...field}
                    label={SETUP_LABELS.commissionMode}
                    value={value.commission.mode}
                    options={COMMISSION_MODE_OPTIONS}
                    enabled={vendor}
                    onValue={mode => patch({ commission: { ...value.commission, mode } })}
                />
                <NumberField
                    {...field}
                    label={`${SETUP_LABELS.commissionValue}${commission && percentage ? ' (%)' : ''}`}
                    value={value.commission.value}
                    enabled={commission}
                    max={percentage ? 100 : undefined}
                    onValue={next => patch({ commission: { ...value.commission, value: next } })}
                />
                <NumberField
                    {...field}
                    label={SETUP_LABELS.commissionFixed}
                    value={value.commission.fixed}
                    enabled={commission}
                    onValue={fixed => patch({ commission: { ...value.commission, fixed } })}
                />
                <SelectField
                    {...field}
                    label={SETUP_LABELS.commissionInclGst}
                    value={yesNo(value.commission.inclusiveOfGst)}
                    options={YES_NO}
                    enabled={commission}
                    onValue={next =>
                        patch({
                            commission: { ...value.commission, inclusiveOfGst: next === 'yes' },
                        })
                    }
                />
                <NumberField
                    {...field}
                    label={SETUP_LABELS.principalAmount}
                    value={value.mixed.principalAmount}
                    enabled={mixed}
                    onValue={principalAmount =>
                        patch({ mixed: { ...value.mixed, principalAmount } })
                    }
                />
                <NumberField
                    {...field}
                    label={SETUP_LABELS.marginAmount}
                    value={value.mixed.marginAmount}
                    enabled={mixed}
                    onValue={marginAmount => patch({ mixed: { ...value.mixed, marginAmount } })}
                />
                <SelectField
                    {...field}
                    label={SETUP_LABELS.platformFeeType}
                    value={value.platformFee.type}
                    options={FEE_TYPE_OPTIONS}
                    enabled={vendor}
                    onValue={type => patch({ platformFee: { ...value.platformFee, type } })}
                />
                <NumberField
                    {...field}
                    label={`${SETUP_LABELS.platformFeeValue}${feePercentage ? ' (%)' : ''}`}
                    value={value.platformFee.value}
                    enabled={vendor}
                    max={feePercentage ? 100 : undefined}
                    onValue={next => patch({ platformFee: { ...value.platformFee, value: next } })}
                />
                <SelectField
                    {...field}
                    label={SETUP_LABELS.partner}
                    value={yesNo(value.partner.present)}
                    options={YES_NO}
                    enabled={false}
                    onValue={() => undefined}
                />
                <NumberField
                    {...field}
                    label={`${SETUP_LABELS.partnerShare} (%)`}
                    value={value.partner.sharePercentage}
                    enabled={value.partner.present}
                    max={100}
                    onValue={sharePercentage =>
                        patch({ partner: { ...value.partner, sharePercentage } })
                    }
                />
                <NumberField
                    {...field}
                    label={`${SETUP_LABELS.gatewayCharge} (%)`}
                    value={value.partner.gatewayCharge?.percentage ?? null}
                    enabled={value.partner.present}
                    max={100}
                    onValue={chargePercentage =>
                        patch({
                            partner: {
                                ...value.partner,
                                gatewayCharge: chargeTerms(
                                    chargePercentage,
                                    value.partner.gatewayCharge?.fixed ?? null
                                ),
                            },
                        })
                    }
                />
                <NumberField
                    {...field}
                    label={`${SETUP_LABELS.gatewayChargeFixed} (₹)`}
                    value={value.partner.gatewayCharge?.fixed ?? null}
                    enabled={value.partner.present}
                    onValue={fixed =>
                        patch({
                            partner: {
                                ...value.partner,
                                gatewayCharge: chargeTerms(
                                    value.partner.gatewayCharge?.percentage ?? null,
                                    fixed
                                ),
                            },
                        })
                    }
                />
                <SelectField
                    {...field}
                    label={SETUP_LABELS.coupon}
                    value={yesNo(value.coupon.used)}
                    options={YES_NO}
                    enabled
                    onValue={next => patch({ coupon: { ...value.coupon, used: next === 'yes' } })}
                />
                <NumberField
                    {...field}
                    label={SETUP_LABELS.couponTotal}
                    value={value.coupon.totalDiscount}
                    enabled={value.coupon.used}
                    onValue={totalDiscount => patch({ coupon: { ...value.coupon, totalDiscount } })}
                />
            </Row>
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                <Typography.Text className="text-xs text-textBody">
                    GST at {value.gstRatePct}%. Nothing here is posted; it only works the split
                    figures out.
                    {stale ? ' The set-up changed: generate the split figures again.' : ''}
                </Typography.Text>
                <Button
                    type="primary"
                    icon={<CalculatorOutlined />}
                    loading={generating}
                    disabled={disabled}
                    onClick={onGenerate}
                >
                    Generate split figures
                </Button>
            </Flex>
        </Flex>
    );
};

export default JournalSetup;
