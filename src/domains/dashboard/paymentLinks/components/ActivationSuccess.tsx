import { ArrowRightOutlined, CheckOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';

interface Props {
    virtualAccountNumber: string | null;
    onContinue: () => void;
}

const ActivationSuccess = ({ virtualAccountNumber, onContinue }: Props) => (
    <Flex align="center" justify="center" className="w-full px-4 py-10">
        <Card
            bordered={false}
            className="w-full max-w-[640px] rounded-[24px] !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
            styles={{ body: { padding: '52px 48px' } }}
        >
            <Flex vertical align="center" gap={0}>
                {/* Outer light ring */}
                <Flex
                    align="center"
                    justify="center"
                    className="mb-7 h-[90px] w-[90px] rounded-full"
                    style={{ background: '#DCFCE7' }}
                >
                    {/* Inner solid circle */}
                    <Flex
                        align="center"
                        justify="center"
                        className="h-[64px] w-[64px] rounded-full"
                        style={{ background: '#22C55E' }}
                    >
                        <CheckOutlined style={{ color: '#fff', fontSize: 28, fontWeight: 700 }} />
                    </Flex>
                </Flex>

                {/* Title */}
                <Typography.Title
                    level={3}
                    className="!mb-3 !text-center !text-[22px] !font-bold !leading-[1.25] !text-[#1E293B]"
                >
                    Payment Collections Activated
                </Typography.Title>

                {/* Subtitle */}
                <Typography.Text className="mb-4 block text-center text-[14px] leading-[1.6] text-[#667085]">
                    Your virtual account has been created successfully
                </Typography.Text>

                {/* Virtual Account line */}
                {virtualAccountNumber && (
                    <Flex gap={4} align="center" justify="center" className="mb-8">
                        <Typography.Text className="text-[14px] text-[#667085]">
                            Virtual Account:
                        </Typography.Text>
                        <Typography.Text className="text-[14px] font-semibold text-[#1E293B]">
                            {virtualAccountNumber}
                        </Typography.Text>
                    </Flex>
                )}

                {/* Button */}
                <Button
                    type="primary"
                    danger
                    icon={<ArrowRightOutlined />}
                    className="!h-[44px] !border-0 !bg-[#FF4D4F] !px-8 !text-[14px] !font-semibold shadow-none hover:!bg-[#FF4D4F]"
                    onClick={onContinue}
                >
                    Continue to Dashboard
                </Button>
            </Flex>
        </Card>
    </Flex>
);

export default ActivationSuccess;
