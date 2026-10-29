import { Button, Flex, Image, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import LandingPageImg from '@domains/dashboard/eSign/assets/landing.png';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

interface Props {
    isPurchased?: boolean;
    scrollToPricing?: () => void;
}

const ESignHeader = ({ isPurchased, scrollToPricing }: Props) => {
    const { md } = useScreenSize();
    const navigate = useNavigate();
    return (
        <Content className="xl:px-14">
            <Flex className="flex-col-reverse md:flex-row  gap-[4rem]">
                <Flex className="w-full md:w-7/12 ">
                    <Flex vertical gap={25}>
                        <Typography.Text className="text-2xl font-semibold sm:text-4xl">
                            Signing made simple and secure
                        </Typography.Text>

                        <Typography.Text className="text-sm   sm:text-base   font-normal  text-[#425466] ">
                            Use our service to e-sign invoices, offer letters, agreements, and other
                            important documents conveniently from anywhere, anytime. Adopt e-sign,
                            eliminate paperwork, and go green.
                        </Typography.Text>

                        <Flex gap={15} className="justify-center sm:justify-start">
                            <Button
                                danger
                                type="primary"
                                className="h-10 px-6"
                                size="large"
                                onClick={() => navigate(paths.eSign.uploadPage)}
                            >
                                Sign a Document
                            </Button>
                            <Button
                                key="back"
                                className="h-10 px-10"
                                size="large"
                                danger
                                onClick={() => navigate(paths.eSign.historyPage)}
                            >
                                eSign Status
                            </Button>
                        </Flex>
                    </Flex>
                </Flex>
                <Flex className="justify-center w-full md:w-5/12 md:justify-end">
                    <Image
                        src={LandingPageImg}
                        preview={false}
                        width={md ? '15rem' : '15rem'}
                        height={md ? '15rem' : '15rem'}
                    />
                </Flex>
            </Flex>
        </Content>
    );
};

export default ESignHeader;
