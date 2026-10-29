import { ReactNode } from 'react';

import { Flex, Typography } from 'antd';

import BeforeCommissionNote from '@components/atomic/BeforeCommissionNote';
import PriceAfterDiscount from '@components/atomic/PriceAfterDiscount';

import { CommissionBlockValues, CommissionFormValues } from './ConfigureCommissionDrawer';
import { CommissionBlock, ServicePlan } from '../../types/services';
import { formatCommissionLabel, formatInr, toAmountField } from '../../utils/commission';
import { COMMISSION_MODE_OPTIONS } from '../../utils/serviceDetailData';

// The table cells and form values the Plans and Add-ons tabs share.
export const NotConfigured = () => (
    <Typography.Text className="text-amber-600">Not configured</Typography.Text>
);

const EMPTY_BLOCK_VALUES: CommissionBlockValues = {
    commissionMode: 'MARGIN',
    commissionType: 'PERCENTAGE',
    providerCommission: '',
    fixedCommissionPerTransaction: '',
    isCommissionInclGST: false,
};

// Boolean(...) normalizes isCommissionInclGST, which comes back as a raw MySQL 1/0.
const toBlockFormValues = (block?: CommissionBlock): CommissionBlockValues =>
    block
        ? {
              commissionMode: block.commissionMode,
              commissionType: block.commissionType,
              providerCommission: toAmountField(block.commission),
              fixedCommissionPerTransaction: toAmountField(block.fixedCommissionPerTransaction),
              isCommissionInclGST: Boolean(block.isCommissionInclGST),
          }
        : EMPTY_BLOCK_VALUES;

export const toFormValues = (plan: ServicePlan | null): CommissionFormValues => ({
    commissionMode: plan?.commissionMode ?? 'MARGIN',
    commissionType: plan?.commissionType ?? 'PERCENTAGE',
    providerCommission: toAmountField(plan?.commission),
    fixedCommissionPerTransaction: toAmountField(plan?.fixedCommissionPerTransaction),
    isCommissionInclGST: Boolean(plan?.isCommissionInclGST),
    price: toAmountField(plan?.monthlyPrice),
    annualPrice: toAmountField(plan?.annualPrice),
    discount: toAmountField(plan?.monthlyDiscount) || '0',
    annualDiscount: toAmountField(plan?.annualDiscount) || '0',
    useSplitCommission: Boolean(plan?.splitCommission),
    monthly: toBlockFormValues(plan?.splitCommission?.monthly),
    annually: toBlockFormValues(plan?.splitCommission?.annually),
});

const SplitLines = ({ monthly, annually }: { monthly: ReactNode; annually: ReactNode }) => (
    <Flex vertical gap={2}>
        <Typography.Text>M: {monthly}</Typography.Text>
        <Typography.Text>A: {annually}</Typography.Text>
    </Flex>
);

const blockLabel = (block: CommissionBlock) =>
    formatCommissionLabel({
        commissionType: block.commissionType,
        providerCommission: block.commission,
        fixedCommissionPerTransaction: block.fixedCommissionPerTransaction,
    });

export const commissionLabel = (plan: ServicePlan) => {
    if (plan.splitCommission) {
        return (
            <SplitLines
                monthly={blockLabel(plan.splitCommission.monthly) ?? '—'}
                annually={blockLabel(plan.splitCommission.annually) ?? '—'}
            />
        );
    }
    return formatCommissionLabel({
        commissionType: plan.commissionType,
        providerCommission: plan.commission,
        fixedCommissionPerTransaction: plan.fixedCommissionPerTransaction,
    });
};

const blockModeLabel = (block: CommissionBlock) =>
    COMMISSION_MODE_OPTIONS.find(option => option.value === block.commissionMode)?.label ?? '—';

export const commissionModeLabel = (plan: ServicePlan) => {
    if (plan.splitCommission) {
        return (
            <SplitLines
                monthly={blockModeLabel(plan.splitCommission.monthly)}
                annually={blockModeLabel(plan.splitCommission.annually)}
            />
        );
    }
    return COMMISSION_MODE_OPTIONS.find(option => option.value === plan.commissionMode)?.label;
};

export const gstCell = (plan: ServicePlan) => {
    if (plan.splitCommission) {
        const monthly = plan.splitCommission.monthly.isCommissionInclGST ? 'Included' : 'Excluded';
        const annually = plan.splitCommission.annually.isCommissionInclGST
            ? 'Included'
            : 'Excluded';
        return <SplitLines monthly={monthly} annually={annually} />;
    }
    if (plan.isCommissionInclGST == null) return <NotConfigured />;
    return plan.isCommissionInclGST ? 'Included' : 'Excluded';
};

// The price after the markup commission (and the discount), with what it was before the commission under it.
export const PlanPrice = ({
    price,
    markup,
    discount,
}: {
    price: number | string;
    markup?: number | null;
    discount?: number | string | null;
}) => {
    const added = Number(markup) || 0;
    const afterCommission = (Number(price) || 0) + added;
    return (
        <Flex vertical>
            <PriceAfterDiscount price={afterCommission} discount={discount} format={formatInr} />
            <BeforeCommissionNote amount={afterCommission} totalCommission={added} />
        </Flex>
    );
};
