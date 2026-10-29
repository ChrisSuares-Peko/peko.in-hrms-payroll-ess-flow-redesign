import { ArrowRightOutlined } from '@ant-design/icons';
import { Avatar, Button, Flex, Typography } from 'antd';

import BankIcon from '../../assets/icons/bank.svg';
import CallIcon from '../../assets/icons/call.svg';
import UserIcon from '../../assets/icons/user.svg';

interface OnboardingWelcomeProps {
    firstName: string;
    initials: string;
    onGetStarted: () => void;
    // Toggle the checklist rows to match the steps the employee will actually see.
    showBank?: boolean;
    showDocuments?: boolean;
}

const checklist = [
    {
        key: 'documents',
        icon: <img src={UserIcon} alt="" className="size-7" />,
        title: 'Identity Documents',
        subtitle: 'PAN, Aadhaar & other identity documents',
    },
    {
        key: 'bank',
        icon: <img src={BankIcon} alt="" className="size-7" />,
        title: 'Bank Account',
        subtitle: 'For your salary deposits',
    },
    {
        key: 'emergency',
        icon: <img src={CallIcon} alt="" className="size-7" />,
        title: 'Emergency Contact',
        subtitle: 'Someone we can reach for you',
    },
];

const OnboardingWelcome = ({
    firstName,
    initials,
    onGetStarted,
    showBank = true,
    showDocuments = true,
}: OnboardingWelcomeProps) => (
    <Flex vertical align="center" className="w-full max-w-[600px] mx-auto py-10">
        <Avatar size={48} className="bg-[#ffe6e6] mb-4">
            <span className="text-brandColor font-semibold">{initials}</span>
        </Avatar>
        <Typography.Title level={3} className="!mb-1 text-center">
            Welcome aboard, {firstName}!
        </Typography.Title>
        <Typography.Text className="text-center text-gray-500 max-w-[460px]">
            Before you can access your portal, we need a few details to complete your employee
            profile. It only takes about 3 minutes.
        </Typography.Text>

        <Flex vertical gap={16} className="w-full mt-8">
            {checklist
                .filter(
                    item =>
                        (item.key !== 'bank' || showBank) &&
                        (item.key !== 'documents' || showDocuments)
                )
                .map(item => (
                    <Flex
                        key={item.key}
                        align="center"
                        justify="space-between"
                        className="px-5 py-5 bg-white border border-solid border-[#f0f0f0] rounded-2xl"
                        style={{ boxShadow: '0px 1.66px 8px 0px rgba(0, 0, 0, 0.06)' }}
                    >
                        <Flex align="center" gap={14}>
                            <Flex align="center" justify="center" className="size-10">
                                {item.icon}
                            </Flex>
                            <Flex vertical>
                                <Typography.Text className="font-semibold">
                                    {item.title}
                                </Typography.Text>
                                <Typography.Text className="text-xs text-gray-400">
                                    {item.subtitle}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Flex>
                ))}
        </Flex>

        <Button
            type="primary"
            block
            onClick={onGetStarted}
            className="h-12 mt-8 font-medium rounded-lg flex items-center justify-center gap-2"
        >
            <span>Get Started</span>
            <ArrowRightOutlined />
        </Button>
    </Flex>
);

export default OnboardingWelcome;
