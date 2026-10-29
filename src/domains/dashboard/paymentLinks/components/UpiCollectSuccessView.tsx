import { CheckOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

const MOCK_REF_ID = 'TXNgfghrtE';

interface UpiCollectSuccessViewProps {
    amount: string;
    successTime: string;
    onClose: () => void;
}

const UpiCollectSuccessView = ({ amount, successTime, onClose }: UpiCollectSuccessViewProps) => (
    <Flex vertical gap={24} align="center" className="pt-4 pb-2">
        {/* Green concentric circles */}
        <div className="relative flex items-center justify-center">
            <div className="rounded-full" style={{ width: 100, height: 100, background: 'rgba(74,222,128,0.15)' }} />
            <div className="rounded-full absolute" style={{ width: 76, height: 76, background: 'rgba(74,222,128,0.25)' }} />
            <div
                className="rounded-full absolute flex items-center justify-center"
                style={{ width: 54, height: 54, background: '#4ADE80' }}
            >
                <CheckOutlined style={{ color: '#fff', fontSize: 24, fontWeight: 700 }} />
            </div>
        </div>

        <Flex vertical gap={6} align="center">
            <Typography.Title level={3} className="!mb-0 !font-bold text-center">
                Payment Successful
            </Typography.Title>
            <Typography.Text className="text-gray-500 text-center">
                Your payment has been processed successfully
            </Typography.Text>
        </Flex>

        {/* Payment Summary */}
        <div className="w-full rounded-2xl p-5 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
            <Flex vertical gap={16}>
                <Typography.Text className="font-bold text-base">Payment Summary</Typography.Text>
                <Flex vertical gap={12}>
                    <Flex justify="space-between">
                        <Typography.Text className="text-gray-400 text-sm">Amount</Typography.Text>
                        <Typography.Text className="font-medium text-sm">₹{amount}</Typography.Text>
                    </Flex>
                    <Flex justify="space-between">
                        <Typography.Text className="text-gray-400 text-sm">Reference ID</Typography.Text>
                        <Typography.Text className="font-medium text-sm">{MOCK_REF_ID}</Typography.Text>
                    </Flex>
                    <Flex justify="space-between">
                        <Typography.Text className="text-gray-400 text-sm">Date & Time</Typography.Text>
                        <Typography.Text className="font-medium text-sm">{successTime}</Typography.Text>
                    </Flex>
                </Flex>
            </Flex>
        </div>

        <Button size="large" className="w-full" onClick={onClose}>
            View Transactions
        </Button>
    </Flex>
);

export default UpiCollectSuccessView;
