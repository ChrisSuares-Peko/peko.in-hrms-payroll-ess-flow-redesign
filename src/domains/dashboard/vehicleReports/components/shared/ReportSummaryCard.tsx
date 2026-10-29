import { ReactNode } from 'react';

import { Button, Divider, Flex, Typography } from 'antd';

import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import FeatureList from './FeatureList';
import SecurePaymentNote from './SecurePaymentNote';

interface Props {
    title: string;
    features: string[];
    price: number;
    onPay: () => void;
    isLoading?: boolean;
    isDisabled?: boolean;
    // Rendered directly above the pay button — the Droom data-sharing consent.
    consent?: ReactNode;
    // Extra block between the feature list and the secure-payment note — the
    // inspection form uses this for its "What Happens Next" panel.
    children?: ReactNode;
}

// The right-rail card on all three report forms. Sticky from `lg` up; stacks
// below the form on smaller screens (there are no mobile designs for these frames).
const ReportSummaryCard = ({
    title,
    features,
    price,
    onPay,
    isLoading,
    isDisabled,
    consent,
    children,
}: Props) => (
    <div className="rounded-2xl bg-white shadow-[0px_2px_20px_rgba(0,0,0,0.04)] lg:sticky lg:top-4">
        <div className="border-b border-[#EFF1F4] px-5 py-4">
            <Typography.Text className="text-base font-medium text-[#0A0A0A]">
                {title}
            </Typography.Text>
        </div>
        <Flex vertical gap={16} className="p-5">
            <FeatureList items={features} />
            {children}
            <SecurePaymentNote />
            <Divider className="!my-0" />
            {consent}
            <Button
                type="primary"
                size="large"
                block
                loading={isLoading}
                disabled={isDisabled}
                onClick={onPay}
            >
                {`Pay ₹${formatNumberWithLocalStringWithoutDecimalPoint(price)}`}
            </Button>
        </Flex>
    </div>
);

export default ReportSummaryCard;
