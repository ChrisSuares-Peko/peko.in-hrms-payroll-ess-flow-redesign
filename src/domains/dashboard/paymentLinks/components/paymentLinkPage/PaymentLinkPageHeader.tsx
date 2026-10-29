import { LinkOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

interface PaymentLinkPageHeaderProps {
    onCreatePaymentLink: () => void;
}

const PaymentLinkPageHeader = ({ onCreatePaymentLink }: PaymentLinkPageHeaderProps) => (
    <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
        <Flex vertical gap={4}>
            <Typography.Title level={3} className="!mb-0 !font-bold">
                Payment Links
            </Typography.Title>
            <Typography.Text className="text-gray-500">
                Manage payment links, QR codes, and track payment collections
            </Typography.Text>
        </Flex>
        <Button
            type="primary"
            danger
            icon={<LinkOutlined />}
            size="large"
            onClick={onCreatePaymentLink}
            className="flex items-center"
        >
            New Payment Link
        </Button>
    </Flex>
);

export default PaymentLinkPageHeader;
