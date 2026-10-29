import { Result, Card, Steps, Typography, Button, Flex } from 'antd';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import getAssistanceSuccessBadge from '@assets/animation/paymentSuccess2.json';
import { paths } from '@src/routes/paths';

const { Text } = Typography;
const weburl = 'Salesforce';

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: getAssistanceSuccessBadge,
};

const GetAssistanceSuccess = () => {
    const navigate = useNavigate();
    return (
        <Flex className="min-h-screen items-start justify-center px-6 pt-8 ">
            <Flex vertical className="w-full max-w-2xl">
                {/* Result Section */}
                <Result
                    icon={<Lottie options={defaultOptions} height={80} />}
                    title={<span className="text-2xl">Thank You for Your Interest!</span>}
                    subTitle={
                        <span className="text-base  leading-6">
                            We&apos;ve received your information. A Salesforce specialist from our
                            team will reach out to you within 24 hours to discuss the perfect plan
                            for your business needs.
                        </span>
                    }
                    className="pb-10 !pt-0"
                />

                {/* What's Next */}
                <Card className="rounded-xl shadow-sm mb-8 ">
                    <Text className="font-semibold text-xl">What&apos;s Next?</Text>

                    <Steps
                        direction="vertical"
                        size="small"
                        current={-1}
                        className="gap-2 mt-5 "
                        items={[
                            {
                                icon: (
                                    <Flex className="w-7 h-7 rounded-full bg-red-100 text-lightRed flex items-center justify-center text-xs">
                                        1
                                    </Flex>
                                ),
                                title: (
                                    <Text className="font-medium text-base text-navTextColor">
                                        Personal consultation
                                    </Text>
                                ),
                                description: (
                                    <Text className="text-sm text-[#425466]">
                                        Our specialist will call you to understand your requirements
                                    </Text>
                                ),
                            },
                            {
                                icon: (
                                    <Flex className="w-7 h-7 rounded-full bg-red-100 text-lightRed flex items-center justify-center text-xs">
                                        2
                                    </Flex>
                                ),
                                title: (
                                    <Text className="font-medium text-base text-navTextColor">
                                        Customized proposal
                                    </Text>
                                ),
                                description: (
                                    <Text className="text-sm text-[#425466]">
                                        Receive a tailored plan with pricing specific to your needs
                                    </Text>
                                ),
                            },
                            {
                                icon: (
                                    <Flex className="w-7 h-7 rounded-full bg-red-100 text-lightRed flex items-center justify-center text-xs">
                                        3
                                    </Flex>
                                ),
                                title: (
                                    <Text className="font-medium text-base text-navTextColor">
                                        Quick onboarding
                                    </Text>
                                ),
                                description: (
                                    <Text className="text-sm text-[#425466]">
                                        Get started with your new {weburl} subscription
                                    </Text>
                                ),
                            },
                        ]}
                    />
                </Card>

                {/* Help Section */}
                <Flex vertical className="text-center">
                    <Text className="text-xl font-medium text-[#101828]">Need Help?</Text>

                    <Text className="text-gray-500">
                        Our support team is here to help you get started with {weburl}.
                    </Text>

                    <div className="flex justify-center gap-4 mt-4">
                        <Button
                            onClick={() => {
                                navigate(paths.dashboard.needHelp);
                            }}
                        >
                            Contact Support
                        </Button>
                    </div>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default GetAssistanceSuccess;
