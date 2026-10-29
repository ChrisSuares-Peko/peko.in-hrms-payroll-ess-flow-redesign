import React from 'react';

import { LoadingOutlined, RightOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import { COLLECT_PAYMENT_OPTIONS } from '../../constants/collectPayment';
import { CollectPaymentStep } from '../../types/CollectPayment';

type Props = {
    onSelect: (step: CollectPaymentStep) => void;
    loadingStep?: CollectPaymentStep | null;
};

const CollectPaymentOptions: React.FC<Props> = ({ onSelect, loadingStep }) => (
    <Flex vertical gap={12}>
        {COLLECT_PAYMENT_OPTIONS.map(opt => {
            const isLoading = loadingStep === opt.id;

            return (
                <Flex
                    key={opt.id}
                    justify="space-between"
                    align="center"
                    className={`border border-[#E2E8F0] rounded-2xl px-5 py-4 transition-colors ${
                        isLoading
                            ? 'cursor-not-allowed border-[#FFD6D6] bg-[#FFF7F7] opacity-80'
                            : 'cursor-pointer hover:border-[#ff4f4f]'
                    }`}
                    onClick={() => {
                        if (!isLoading) onSelect(opt.id as CollectPaymentStep);
                    }}
                >
                    <Flex align="center" gap={14}>
                        <Flex
                            justify="center"
                            align="center"
                            className={`w-12 h-12 rounded-2xl flex-shrink-0 ${
                                isLoading ? 'bg-[#FFEAEA]' : opt.iconBg
                            }`}
                        >
                            <ReactSVG src={opt.icon} className="w-6 h-6" />
                        </Flex>
                        <Flex vertical gap={4}>
                            <Typography.Text className="text-[#101828] text-base font-semibold block">
                                {opt.title}
                            </Typography.Text>
                            <Typography.Text className="text-[#475569] text-sm font-normal block">
                                {opt.description}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    {isLoading ? (
                        <LoadingOutlined className="text-[#FF4F4F] text-base" spin />
                    ) : (
                        <RightOutlined className="text-gray-400 text-sm" />
                    )}
                </Flex>
            );
        })}
    </Flex>
);

export default CollectPaymentOptions;
