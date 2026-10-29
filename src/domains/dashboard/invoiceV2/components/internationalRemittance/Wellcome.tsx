import React from 'react';

import { InfoCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import globalImg from '../../assets/icons/global.svg';
import CenteredHeader from '../shared/CenteredHeader';

interface CompanyDetailsProps {
    onSkip: () => void;
    onProceed: () => void;
}

const Wellcome: React.FC<CompanyDetailsProps> = ({ onSkip, onProceed }) => (
    <Flex vertical align="center" gap={24} className="pt-4 pb-2">
        <CenteredHeader
            icon={
                <ReactSVG
                    src={globalImg}
                    beforeInjection={svg => {
                        svg.setAttribute('width', '40');
                        svg.setAttribute('height', '40');
                    }}
                />
            }
            outerClass="bg-[#F9F6F5] rounded-3xl"
            innerClass="bg-transparent"
            title="International Remittance Setup"
            description="This step is optional and only required if you need international remittance to be set up at this moment. If not needed, you can skip this step and proceed to the dashboard. You can always set this up later from your account settings."
        />

        {/* Optional Setup info box */}
        <Flex gap={12} align="flex-start" className="w-full bg-[#F8FAFC] rounded-xl px-4 py-3">
            <InfoCircleOutlined className="text-[#475569] text-base mt-0.5 flex-shrink-0" />
            <Flex vertical gap={4}>
                <Typography.Text className="text-sm font-semibold text-[#101828]">
                    Optional Setup
                </Typography.Text>
                <Typography.Text className="text-xs text-[#6A7282] leading-5">
                    International remittance setup involves providing additional documentation and
                    business details. This process may take 48 hours for approval.
                </Typography.Text>
            </Flex>
        </Flex>

        {/* Footer buttons */}
        <Flex justify="flex-end" gap={12} className="w-full pt-2">
            <Button onClick={onSkip} className="px-5 h-9 border-[#CBD5E1] text-[#475569]">
                Skip Setup
            </Button>
            <Button
                type="primary"
                danger
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                onClick={onProceed}
                className="px-5 h-9"
            >
                Proceed to Setup
            </Button>
        </Flex>
    </Flex>
);

export default React.memo(Wellcome);
