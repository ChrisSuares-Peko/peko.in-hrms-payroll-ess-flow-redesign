import { TableColumnsType, Tag } from 'antd';

import broadcastMsg from '@domains/dashboard/WhatsappForBusiness/assets/images/features/broadcastMsg.png';
import engagement from '@domains/dashboard/WhatsappForBusiness/assets/images/features/engagement.png';
import realtimeAnalytics from '@domains/dashboard/WhatsappForBusiness/assets/images/features/realtimeAnalytics.png';
import seamlessIntegration from '@domains/dashboard/WhatsappForBusiness/assets/images/features/seamlessIntegration.png';
import smartChatbots from '@domains/dashboard/WhatsappForBusiness/assets/images/features/smartChatbots.png';
import { formatCompleteDate } from '@utils/dateFormat';

export const features = [
    {
        icon: broadcastMsg,
        title: 'Broadcast Messaging',
        description: 'Instantly reach thousands of customers with targeted campaigns.',
    },
    {
        icon: smartChatbots,
        title: 'Smart Chatbots ',
        description: 'Automate responses and provide 24/7 support with ease.',
    },
    {
        icon: engagement,
        title: 'Engagement',
        description: 'Send tailored messages for higher conversion rates.',
    },
    {
        icon: realtimeAnalytics,
        title: 'Real-Time Analytics',
        description: 'Track message performance and optimize campaigns on the go.',
    },
    {
        icon: seamlessIntegration,
        title: 'Seamless Integrations',
        description: 'Connect with your CRM and other tools for smooth operations.',
    },
];

export const FirstPlanFeatures = [
    'Broadcast Campaigns',
    'Multi-Agent Live Chat',
    'Free WhatsApp Business API',
    'Free Green Tick Application',
    'Up to 10 Tags',
    'Up to 5 Custom Attributes',
    'Campaign Analytics',
    'Template Messages API',
    '1200 API Calls/min',
    'Canned Messages',
    'Chat & Agent Analytics',
    'Contacts Import & Export',
    'Template Submission Dashboard',
];

export const SecondPlanFeatures = [
    'All Features in Basic Plan',
    'Up to 100 Tags',
    'Up to 20 Custom Attributes',
    'Campaign Budget',
    'Click Tracking',
    'Scheduler',
    'Agent Freezing Feature',
];

export const OrderHistoryColumns: TableColumnsType<any> = [
    {
        title: 'Order ID',
        dataIndex: 'id',
        key: 'id',
    },
    {
        title: 'Order Date',
        dataIndex: 'transactionDate',
        key: 'transactionDate',
        render: date => formatCompleteDate(date),
    },
    {
        title: 'Order Type',
        dataIndex: 'paymentMode',
        key: 'paymentMode',
        render: () => 'WCC credits',
    },
    {
        title: 'Payment Mode',
        dataIndex: 'paymentMode',
        key: 'paymentMode',
        render: paymentMode => (paymentMode === 'PAYMENT GATEWAY' ? 'Card Payment' : paymentMode),
    },
    {
        title: 'Amount',
        dataIndex: 'amountInINR',
        key: 'amountInINR',
        render: amountInINR => parseFloat(amountInINR).toFixed(2),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
            let color;
            let newStatus;
            if (status === 'SUCCESS') {
                newStatus = 'Success';
                color = 'green';
            } else if (status === 'FAILED' || status === 'FAILURE') {
                newStatus = 'Failure';
                color = 'red';
            } else if (status === 'PENDING') {
                newStatus = 'Pending';
                color = 'gold';
            }

            return (
                <Tag color={color} className="rounded-full">
                    • {newStatus}
                </Tag>
            );
        },
    },
];

export const serviceDetails =
    'Our WhatsApp for Business marketing platform helps drive impressive results, with clients seeing up to a 40% increase in engagement rates and a 25% boost in sales within the first three months. By delivering personalized, real-time messages and automated support, you can build stronger customer relationships that translate directly to your bottom line. Harness the power of WhatsApp to elevate your communication strategy and see measurable growth in customer satisfaction and revenue.';
export const subDescription =
    'Experience the power of WhatsApp for Business. Start engaging customers like never before!';

// Staging demo account: its email is already registered at AiSensy (via the UAE platform), so the business
// profile can't be created. Let it browse the flow up to the payment review page, with Pay disabled.
export const WHATSAPP_DEMO_EMAIL = 'allenmullenkuzhyil.ajith@outlook.com';
