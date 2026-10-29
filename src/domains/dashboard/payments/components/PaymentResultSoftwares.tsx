
import { Button, Card, Flex, Typography, Image } from 'antd';
import { Link } from 'react-router-dom';

import download from '@src/domains/dashboard/softwares/assets/icons/download.png';
import email from '@src/domains/dashboard/softwares/assets/icons/email.png';
import resource from '@src/domains/dashboard/softwares/assets/icons/resource.png';
import { paths } from '@src/routes/paths';

const { Text, Title } = Typography;

type Props = {
    productName?: string;
};

const steps = [
    {
        icon: <Image src={email} preview={false} height={20} width={20} />,
        title: <Text className="text-base font-medium text-[#212121]">Check your email</Text>,
        description: (
            <Text className="text-sm text-[#425466]">
                License details and login credentials have been sent to your email
            </Text>
        ),
    },
    {
        icon: <Image src={download} preview={false} height={20} width={20} />,
        title: <Text className="text-base font-medium text-[#212121]">Download & Install</Text>,
        description: (
            <Text className="text-sm text-[#425466]">
                Follow the setup instructions to get started
            </Text>
        ),
    },
    {
        icon: <Image src={resource} preview={false} height={20} width={20} />,
        title: <Text className="text-base font-medium text-[#212121]">Explore Resources</Text>,
        description: (
            <Text className="text-sm text-[#425466]">
                Check out tutorials and documentation to maximize your experience
            </Text>
        ),
    },
];

const PaymentResultSoftwares = ({ productName }: Props) => (
    <Flex vertical gap={24} className="lg:w-2/3 w-full mt-5">
        <Card className="rounded-2xl border border-[#E5E7EB]" styles={{ body: { padding: 24 } }}>
            <Flex vertical gap={20}>
                <Text strong className="text-xl font-semibold text-[#111827]">
                    What&apos;s Next?
                </Text>
                <Flex vertical gap={16}>
                    {steps.map(({ icon, title, description }) => (
                        <Flex align="flex-start" gap={12}>
                            <Flex
                                align="center"
                                justify="center"
                                className="shrink-0 w-9 h-9 rounded-lg bg-[#FFF5F5] text-[#FF4D4F]"
                            >
                                {icon}
                            </Flex>
                            <Flex vertical gap={2}>
                                <Text strong className="text-sm text-[#111827]">
                                    {title}
                                </Text>
                                <Text className="text-sm text-[#6B7280]">{description}</Text>
                            </Flex>
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </Card>

        <Flex vertical align="center" gap={8}>
            <Title level={4} className="!mb-0 text-[#111827]">
                Need Help?
            </Title>
            <Text className="text-sm text-[#6B7280] text-center">
                Our support team is here to help you get started
                {productName ? ` with ${productName}` : ''}.
            </Text>
            <Flex gap={12} className="mt-2">
                <Link to={paths.dashboard.needHelp}>
                    <Button>Contact Support</Button>
                </Link>
            </Flex>
        </Flex>
    </Flex>
);

export default PaymentResultSoftwares;
