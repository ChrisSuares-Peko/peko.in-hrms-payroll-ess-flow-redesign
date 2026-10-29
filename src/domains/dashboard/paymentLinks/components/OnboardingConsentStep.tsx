import { useState } from 'react';

import { ArrowRightOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Flex, Typography } from 'antd';

import { SETTLEMENT_POINTS } from '../types/activateCollectionsTypes';
import { OnboardingRecord } from '../types/paymentLinkTypes';

interface Props {
    onBack: () => void;
    onActivate: () => void;
    loading: boolean;
    initialData?: OnboardingRecord | null;
}

const OnboardingConsentStep = ({ onBack, onActivate, loading, initialData }: Props) => {
    const [agreed, setAgreed] = useState(false);

    const businessName = initialData?.businessName || '–';
    const bankName = initialData?.bankName || '–';
    const accountNumber = initialData?.accountNumber || null;
    const ifsc = initialData?.ifsc || '–';

    return (
        <Flex vertical gap={16}>
            <Flex vertical gap={3}>
                <Typography.Text className="text-[16px] font-semibold leading-[1.35] text-[#1F2A44]">
                    Consent and Confirmation
                </Typography.Text>
                <Typography.Text className="text-[13px] leading-[1.4] text-[#667085]">
                    Please review the settlement terms and authorise Peko to process payments.
                </Typography.Text>
            </Flex>

            {/* Business + Settlement Account summary */}
            <Flex gap={10} wrap="wrap">
                <Card
                    bordered={false}
                    className="min-w-[220px] flex-1 rounded-xl overflow-hidden !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                    styles={{ body: { padding: '12px 16px', background: '#F9FBFF' } }}
                >
                    <Flex vertical gap={4}>
                        <Typography.Text className="text-[11px] leading-[1.35] text-[#98A2B3]">
                            Business
                        </Typography.Text>
                        <Typography.Text className="text-[14px] font-semibold leading-[1.35] text-[#1F2A44]">
                            {businessName}
                        </Typography.Text>
                    </Flex>
                </Card>
                <Card
                    bordered={false}
                    className="min-w-[220px] overflow-hidden flex-1 rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                    styles={{ body: { padding: '12px 16px', background: '#F9FBFF' } }}
                >
                    <Flex vertical gap={1}>
                        <Typography.Text className="text-[11px] leading-[1.35] text-[#98A2B3]">
                            Settlement Account
                        </Typography.Text>
                        <Typography.Text className="text-[14px] font-semibold leading-[1.35] text-[#1F2A44]">
                            {bankName} –{' '}
                            {accountNumber
                                ? `${'*'.repeat(Math.max(0, accountNumber.length - 4))}${accountNumber.slice(-4)}`
                                : '–'}
                        </Typography.Text>
                        <Typography.Text className="text-[11px] leading-[1.35] text-[#98A2B3]">
                            {ifsc}
                        </Typography.Text>
                    </Flex>
                </Card>
            </Flex>

            {/* About Settlements */}
            <Card
                bordered={false}
                className="rounded-xl overflow-hidden !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                styles={{ body: { padding: '16px', background: '#F9FBFF' } }}
            >
                <Flex vertical gap={10}>
                    <Typography.Text className="text-[14px] font-semibold leading-[1.35] text-[#1F2A44]">
                        About Settlements
                    </Typography.Text>
                    {SETTLEMENT_POINTS.map((point, i) => (
                        <Flex key={i} align="flex-start" gap={8}>
                            <CheckCircleOutlined
                                style={{
                                    fontSize: 13,
                                    color: '#22C55E',
                                    flexShrink: 0,
                                    marginTop: 2,
                                }}
                            />
                            <Typography.Text className="text-xs leading-[1.4] text-[#475467]">
                                {point}
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>
            </Card>

            <Flex align="flex-start" gap={8}>
                <Checkbox
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-[#FF4D4F] [&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-[#FF4D4F]"
                />
                <Typography.Text className="text-xs leading-[1.45] text-[#475467]">
                    I confirm that the business details and bank account information provided are
                    accurate. I authorise Peko to process payments on behalf of my business and
                    settle funds to the registered account.
                </Typography.Text>
            </Flex>

            <Flex justify="flex-end" gap={10} className="pt-1">
                <Button className="!h-9 !px-5 !text-[13px]" onClick={onBack}>
                    Back
                </Button>
                <Button
                    type="primary"
                    danger
                    className="!h-9 !px-5 !text-[13px] !font-medium"
                    disabled={!agreed}
                    loading={loading}
                    icon={<ArrowRightOutlined />}
                    onClick={onActivate}
                >
                    Activate Now
                </Button>
            </Flex>
        </Flex>
    );
};

export default OnboardingConsentStep;
