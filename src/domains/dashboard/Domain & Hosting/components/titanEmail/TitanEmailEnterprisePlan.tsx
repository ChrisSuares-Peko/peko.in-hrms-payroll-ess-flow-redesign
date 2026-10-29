import { Flex, Typography } from 'antd';

const { Text, Title } = Typography;

const FEATURES = [
    {
        title: 'Know when your emails are read',
        desc: "Don't lose sleep, wondering if your prospect read that crucial quote. Get notified the moment your email gets opened with Read Receipts.",
    },
    {
        title: "Don't reinvent the wheel for every email",
        desc: 'Save time by saving your frequently sent responses as email templates for easy access.',
    },
    {
        title: 'Generate a higher customer response rate',
        desc: 'Make your emails more visually engaging. Use HTML codes to include forms, CTA buttons, and other interactive elements.',
    },
    {
        title: 'Write now, send later',
        desc: "Give your messages the attention they deserve by making sure they're sent at the optimal time for your recipient.",
    },
    {
        title: 'Follow up on time, every time',
        desc: 'Never drop the ball midway through a conversation with Follow-up Reminders that let you circle back on important emails at the right time, every time.',
    },
    {
        title: 'Save time when sending emails',
        desc: 'Group frequently emailed recipients to reach out to them simultaneously, so you no longer have to add each email address when composing a new message.',
    },
    {
        title: 'Add an additional layer of security',
        desc: 'Two-Factor Authentication ensures only you can access your account by entering both a dynamic secret code and your account password.',
    },
];

const TitanEmailEnterprisePlan = () => (
    <>
        <Title level={3} className="!mb-4 !mt-10 !font-bold !text-gray-900">
            Do More with Our Enterprise plan
        </Title>
        <div className="mt-4 rounded-[20px] border border-[#EEF1F5] bg-white px-6 py-6 shadow-[0_4px_20px_rgba(15,23,42,0.07)] lg:px-[50px] lg:py-[50px]">
            <Flex vertical gap={24} className="lg:gap-[50px]">
                {FEATURES.map((item, i) => (
                    <Flex key={i} vertical gap={10}>
                        <Text className="text-[16px] font-medium text-[#1e293b] lg:text-[20px]">{item.title}</Text>
                        <Text className="block text-[14px] leading-[28px] text-[#6f6c8f] lg:text-[18px]">{item.desc}</Text>
                    </Flex>
                ))}
            </Flex>
        </div>
    </>
);

export default TitanEmailEnterprisePlan;
