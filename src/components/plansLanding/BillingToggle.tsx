import React from 'react';

import { Flex, Tag, Typography } from 'antd';

import { billingToggle, type BillingCycle } from '@utils/plansLandingData';
import { formatNumberWithLocalString } from '@utils/priceFormat';

interface Props {
    value: BillingCycle;
    onChange: (value: BillingCycle) => void;
    /** Max annual discount % across plans — rendered as the "Up to X% off" tag on the Annual option. */
    annualDiscountPercent: number;
}

// Responsive pill toggle mirroring the app's billing switch (IndividualPlan/SwitchPlan):
// options size to their content (no fixed width) and use responsive padding, so the track
// never overflows a narrow mobile screen. Selected option is a raised pill.
const optionClass = (selected: boolean) =>
    `flex cursor-pointer items-center gap-1 rounded-full bg-white px-3 py-1.5 transition-all duration-200 ease-out motion-reduce:transition-none sm:px-5 ${
        selected
            ? 'border border-gray-300 shadow-sm'
            : 'border border-transparent hover:border-gray-200'
    }`;

const BillingToggle: React.FC<Props> = ({ value, onChange, annualDiscountPercent }) => (
    <Flex className="w-full" align="center" justify="center">
        <Flex className="w-fit max-w-full rounded-full border p-1" justify="center">
            <Flex onClick={() => onChange('monthly')} className={optionClass(value === 'monthly')}>
                <Typography.Text className="whitespace-nowrap text-xs font-medium sm:text-sm">
                    {billingToggle.monthly}
                </Typography.Text>
            </Flex>

            <Flex
                onClick={() => onChange('annually')}
                className={optionClass(value === 'annually')}
            >
                <Typography.Text className="flex items-center whitespace-nowrap text-xs font-medium sm:text-sm">
                    {billingToggle.annual}
                    {annualDiscountPercent > 0 && (
                        <Tag
                            bordered={false}
                            className="mx-1 rounded-sm bg-green-50 text-green-700"
                            style={{ fontSize: '0.7rem', padding: '2px 4px', marginRight: 0 }}
                        >
                            Up to {formatNumberWithLocalString(annualDiscountPercent, 0, 0)}% off
                        </Tag>
                    )}
                </Typography.Text>
            </Flex>
        </Flex>
    </Flex>
);

export default BillingToggle;
