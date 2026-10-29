import React from 'react';

import { ArrowRightOutlined, CheckOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';

interface Props {
    onContinue: () => void;
}

const ProcureActivationSuccess: React.FC<Props> = ({ onContinue }) => (
    <Flex align="center" justify="center" className="w-full px-4 py-10">
        <Card
            className="w-full max-w-[640px] rounded-[24px] border border-[#E4EAF2] shadow-sm"
            styles={{ body: { padding: '52px 48px' } }}
        >
            <Flex vertical align="center" gap={0}>
                <Flex
                    align="center"
                    justify="center"
                    className="mb-7 h-[90px] w-[90px] rounded-full"
                    style={{ background: '#DCFCE7' }}
                >
                    <Flex
                        align="center"
                        justify="center"
                        className="h-[64px] w-[64px] rounded-full"
                        style={{ background: '#22C55E' }}
                    >
                        <CheckOutlined style={{ color: '#fff', fontSize: 28, fontWeight: 700 }} />
                    </Flex>
                </Flex>

                <Typography.Title
                    level={3}
                    className="!mb-3 !text-center !text-[22px] !font-bold !leading-[1.25] !text-[#1E293B]"
                >
                    Payment Collections Activated
                </Typography.Title>

                <Typography.Text className="mb-8 block text-center text-[14px] leading-[1.6] text-[#667085]">
                    Your virtual account has been created successfully
                </Typography.Text>

                <Button
                    type="primary"
                    danger
                    icon={<ArrowRightOutlined />}
                    className="!h-[44px] !rounded-xl !border-0 !bg-[#FF4D4F] !px-8 !text-[14px] !font-semibold shadow-none hover:!bg-[#FF4D4F]"
                    onClick={onContinue}
                >
                    Continue to Dashboard
                </Button>
            </Flex>
        </Card>
    </Flex>
);

export default ProcureActivationSuccess;
