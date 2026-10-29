import { BellOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Tag, Typography } from 'antd';

import { UPICollectPendingData } from '../../../types/invoiceDetails';
import { formatAmount, formatCountdown } from '../../../utils/helperFunctions';
import CenteredHeader from '../../shared/CenteredHeader';
import SummaryCard from '../../shared/SummaryCard';

type Props = {
    pendingData: UPICollectPendingData;
    countdown: number;
    onCancel: () => void;
    onSendReminder: () => void;
    onSwitchToPaymentLink: () => void;
};

const PaymentRequest = ({
    pendingData,
    countdown,
    onCancel,
    onSendReminder,
    onSwitchToPaymentLink,
}: Props) => (
    <Flex vertical gap={32}>
        <CenteredHeader
            icon={<ClockCircleOutlined className="text-[#FFFFFF] text-xl" />}
            outerClass="bg-[#FEF9C3]"
            middleClass="bg-[#FEF08A]"
            innerClass="bg-[#EAB308]"
            title="Payment request sent to customer"
            description="The customer will receive a notification on their UPI app and can approve or decline the request"
        />

        <Flex vertical gap={12}>
            <SummaryCard
                title="Request Details"
                rows={[
                    { label: 'Amount', value: formatAmount(Number(pendingData.amount)) },
                    { label: 'Customer UPI ID', value: pendingData.upiId },
                    {
                        label: 'Status',
                        value: (
                            <Tag
                                color="warning"
                                className="rounded-full px-3 py-1 text-xs border-0 m-0"
                            >
                                Pending Customer Approval
                            </Tag>
                        ),
                    },
                ]}
            />

            <Card className="bg-[#f8fafc] rounded-2xl border-0">
                <Flex vertical align="center" justify="center" gap={4}>
                    <Typography.Text className="text-[#94aba2] text-sm block">
                        Expires in
                    </Typography.Text>
                    <Typography.Text className="text-3xl font-semibold block">
                        {formatCountdown(countdown)}
                    </Typography.Text>
                </Flex>
            </Card>
        </Flex>

        <Flex vertical gap={10}>
            <Flex gap={12}>
                <Button
                    block
                    className="h-10 bg-[#F4F4F5]"
                    icon={<CloseCircleOutlined />}
                    onClick={onCancel}
                >
                    Cancel Request
                </Button>
                <Button
                    block
                    className="h-10 bg-[#F4F4F5]"
                    icon={<BellOutlined />}
                    onClick={onSendReminder}
                >
                    Send Reminder
                </Button>
            </Flex>
            <Button block className="h-10 text-[#475569]" onClick={onSwitchToPaymentLink}>
                Switch to Payment Link
            </Button>
        </Flex>
    </Flex>
);

export default PaymentRequest;
