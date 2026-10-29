import { BellOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Button, Flex, message, Tag, Typography } from 'antd';

import { UpiCollectFormState } from '../types/paymentLinkTypes';


const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

interface UpiCollectPendingViewProps {
    form: UpiCollectFormState;
    timeLeft: number;
    onCancel: () => void;
    onSwitchToPaymentLink: () => void;
}

const UpiCollectPendingView = ({ form, timeLeft, onCancel, onSwitchToPaymentLink }: UpiCollectPendingViewProps) => (
    <Flex vertical gap={24} align="center" className="pt-4 pb-2">
        {/* Yellow concentric circles with clock icon */}
        <div className="relative flex items-center justify-center">
            <div className="rounded-full" style={{ width: 100, height: 100, background: 'rgba(234,179,8,0.15)' }} />
            <div className="rounded-full absolute" style={{ width: 76, height: 76, background: 'rgba(234,179,8,0.25)' }} />
            <div
                className="rounded-full absolute flex items-center justify-center"
                style={{ width: 54, height: 54, background: '#D97706' }}
            >
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            </div>
        </div>

        <Flex vertical gap={6} align="center">
            <Typography.Title level={3} className="!mb-0 !font-bold text-center">
                Payment request sent to customer
            </Typography.Title>
            <Typography.Text className="text-gray-500 text-center">
                The customer will receive a notification on their UPI app and can approve or decline the request
            </Typography.Text>
        </Flex>

        {/* Request Details */}
        <div className="w-full rounded-2xl p-5 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
            <Flex vertical gap={16}>
                <Typography.Text className="font-bold text-base">Request Details</Typography.Text>
                <Flex vertical gap={12}>
                    <Flex justify="space-between">
                        <Typography.Text className="text-gray-400 text-sm">Amount</Typography.Text>
                        <Typography.Text className="font-medium text-sm">₹{form.amount}</Typography.Text>
                    </Flex>
                    <Flex justify="space-between">
                        <Typography.Text className="text-gray-400 text-sm">Customer UPI ID</Typography.Text>
                        <Typography.Text className="font-medium text-sm">{form.upiId}</Typography.Text>
                    </Flex>
                    <Flex justify="space-between" align="center">
                        <Typography.Text className="text-gray-400 text-sm">Status</Typography.Text>
                        <Tag
                            style={{
                                background: '#FFFBEB',
                                color: '#D97706',
                                border: '1px solid #FDE68A',
                                borderRadius: 20,
                                fontWeight: 500,
                            }}
                            className="!m-0"
                        >
                            Pending Customer Approval
                        </Tag>
                    </Flex>
                </Flex>
            </Flex>
        </div>

        {/* Countdown timer */}
        <div className="w-full rounded-2xl p-5 text-center" style={{ background: '#F8FAFC' }}>
            <Flex vertical gap={4} align="center">
                <Typography.Text className="text-gray-400 text-sm">Expires in</Typography.Text>
                <Typography.Title
                    level={2}
                    className="!mb-0 !font-bold"
                    style={{ color: timeLeft <= 60 ? '#EF4444' : '#111827', letterSpacing: 2 }}
                >
                    {formatTime(timeLeft)}
                </Typography.Title>
            </Flex>
        </div>

        {/* Action buttons */}
        <Flex gap={12} wrap="wrap" className="w-full">
            <Button size="large" className="flex-1" icon={<CloseCircleOutlined />} onClick={onCancel}>
                Cancel Request
            </Button>
            <Button
                size="large"
                className="flex-1"
                icon={<BellOutlined />}
                onClick={() => message.success('Reminder sent!')}
            >
                Send Reminder
            </Button>
        </Flex>

        <Button size="large" className="w-full" onClick={onSwitchToPaymentLink}>
            Switch to Payment Link
        </Button>
    </Flex>
);

export default UpiCollectPendingView;
