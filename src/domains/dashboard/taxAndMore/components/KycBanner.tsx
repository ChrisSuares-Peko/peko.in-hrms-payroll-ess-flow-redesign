import { SafetyCertificateOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

interface KycBannerProps {
    onStartKyc: () => void;
}

const KycBanner = ({ onStartKyc }: KycBannerProps) => (
    <Flex
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={16}
        className="w-full rounded-xl border px-6 py-4"
        style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
    >
        <Flex align="center" gap={12}>
            <Flex
                align="center"
                justify="center"
                className="rounded-lg flex-shrink-0"
                style={{ backgroundColor: '#FEF3C7', width: 36, height: 36 }}
            >
                <SafetyCertificateOutlined className="text-textOrange text-base" />
            </Flex>
            <Flex vertical gap={2}>
                <Typography.Text className="font-semibold text-sm" style={{ color: '#92400E' }}>
                    Complete your KYC to get started
                </Typography.Text>
                <Typography.Text className="text-xs" style={{ color: '#B45309' }}>
                    Verify your PAN once to unlock all three services — GST, TDS, and Income Tax.
                </Typography.Text>
            </Flex>
        </Flex>
        <Button
            type="primary"
            size="middle"
            onClick={onStartKyc}
            className="bg-textOrange border-textOrange hover:opacity-90"
        >
            Complete KYC →
        </Button>
    </Flex>
);

export default KycBanner;
