import React from 'react';

import { ArrowRightOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import { NEXT_STEPS } from '../../constants/remittance';
import CenteredHeader from '../shared/CenteredHeader';


interface CompleteProps {
    onClose: () => void;
}

const Complete: React.FC<CompleteProps> = ({ onClose }) => (
    <Flex vertical gap={24} className="pt-4 pb-2">
        <CenteredHeader
            icon={<CheckOutlined className="text-white text-lg" />}
            outerClass="bg-[#E8FAF0]"
            middleClass="bg-[#D1F4E0]"
            innerClass="bg-[#45D483]"
            title="Application Submitted!"
            description="Thank you for submitting your international remittance application. Our team is now reviewing your details and documents."
        />

        {/* Review in Progress box */}
        <Flex
            gap={12}
            align="flex-start"
            className="w-full bg-[#FFFBEB] rounded-2xl px-6 py-4 border border-[#FDE68A]"
        >
            <ClockCircleOutlined className="text-[#D97706] text-base mt-0.5 flex-shrink-0" />
            <Flex vertical gap={4}>
                <Typography.Text className="text-sm font-semibold text-[#101828]">
                    Review in Progress
                </Typography.Text>
                <Typography.Text className="text-xs text-[#6A7282] leading-5">
                    Your account will be activated within 48 hours. We&apos;ll send you an email
                    notification once the review is complete.
                </Typography.Text>
            </Flex>
        </Flex>

        {/* What Happens Next — inside a card */}
        <Flex vertical gap={16} className="border border-[#E4E4E7] rounded-2xl px-5 py-5">
            <Typography.Text className="text-base font-semibold text-[#101828] block">
                What Happens Next?
            </Typography.Text>
            <Flex vertical gap={16}>
                {NEXT_STEPS.map(({ step, title, description }) => (
                    <Flex key={step} align="flex-start" gap={12}>
                        <Flex
                            align="center"
                            justify="center"
                            className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFE4E6]"
                        >
                            <span className="text-[#FF4F4F] text-[11px] font-semibold leading-none">
                                {step}
                            </span>
                        </Flex>
                        <Flex vertical gap={2}>
                            <Typography.Text className="text-sm font-semibold text-[#101828]">
                                {title}
                            </Typography.Text>
                            <Typography.Text className="text-xs text-[#6A7282] leading-5">
                                {description}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        </Flex>

        {/* Footer */}
        <Flex vertical align="center" gap={12} className="pt-2">
            <Button
                type="primary"
                danger
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                onClick={onClose}
                className="h-10 px-10 text-sm font-medium"
            >
                Go to Dashboard
            </Button>
            <Typography.Text className="text-xs text-[#A1A1AA] text-center">
                You will be automatically redirected in a few seconds...
            </Typography.Text>
        </Flex>
    </Flex>
);

export default React.memo(Complete);
