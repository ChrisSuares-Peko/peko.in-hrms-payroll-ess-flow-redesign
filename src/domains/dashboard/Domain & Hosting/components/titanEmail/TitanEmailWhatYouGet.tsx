import { Flex, Typography } from 'antd';

const { Text, Title, Paragraph } = Typography;

const BENEFITS = [
    {
        title: 'Guaranteed email Delivery',
        desc: "With Titan's flawless IP reputation, your email will always reach its destination.",
    },
    {
        title: 'Advanced Security',
        desc: 'Titan uses advanced security measures such as 2FA, Custom DKIM, and Data Encryption to keep your accounts safe.',
    },
    {
        title: 'High Responsiveness',
        desc: 'Manage your inbox with powerful webmail & mobile applications.',
    },
    {
        title: 'Amazing Support',
        desc: 'Our dedicated support staff is available so you never miss a beat.',
    },
];

const TitanEmailWhatYouGet = () => (
    <Flex vertical gap={24} className="mt-10 rounded-[24px] bg-white px-6 py-8 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.06)] lg:px-[60px] lg:py-[50px]">
        <Flex vertical gap={16}>
            <Title level={3} className="!mb-0 !mt-0 !text-[20px] !font-medium !leading-[38px] !text-[#1e293b] lg:!text-[28px]">
                What Do You Get with Titan?
            </Title>
            <Paragraph className="!mb-0 !text-[14px] !font-normal !leading-[28px] !text-[#6f6c8f] lg:!text-[18px]">
                Titan, the highest-rated email platform for small businesses, is a robust and reliable professional business email service that enables you to keep your communication going, no matter where you are. Titan enables you to send your first email from your domain within minutes and comes with fast webmail and mobile apps that require zero setup.
            </Paragraph>
        </Flex>
        <div className="grid grid-cols-1 gap-x-6 gap-y-[22px] sm:grid-cols-2 lg:gap-x-[24px]">
            {BENEFITS.map((item, i) => (
                <Flex key={i} vertical gap={6}>
                    <Text className="text-[15px] font-medium leading-[38px] text-[#1e293b] lg:text-[18px]">{item.title}</Text>
                    <Text className="block text-[13px] leading-[26px] text-[#6f6c8f] lg:text-[16px]">{item.desc}</Text>
                </Flex>
            ))}
        </div>
    </Flex>
);

export default TitanEmailWhatYouGet;
