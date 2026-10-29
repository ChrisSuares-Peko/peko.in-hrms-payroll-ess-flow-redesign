import React from 'react';

import { Button, Flex, Image, Typography } from 'antd';
import DOMPurify from 'dompurify';
import { Link } from 'react-router-dom';

import DashboardSnap from '@assets/DashboardSnap.png';
import PekoPlus from '@assets/PekoPlus.png';
import { paths } from '@src/routes/paths';

import { Banner } from '../../types/index';

type PekoOneHeaderProps = {
    subscriptionBanner: Banner[];
};
const PekoOneHeader = ({ subscriptionBanner }: PekoOneHeaderProps) => {
    const { Text } = Typography;
    const description =
        subscriptionBanner?.[0]?.description ||
        'Simplify your processes, and enjoy a seamless journey with Peko. Upgrade today for a more efficient way to manage your tasks with ease';

    return (
        <Flex
            className="relative mb-5 pt-  rounded-2xl overflow-hidden"
            justify="space-between"
            align="center"
            style={{ background: 'linear-gradient(90deg, #F0F7FF 0%, #FFF2F2 100%)' }}
        >
            <Flex vertical gap={16} className="w-full px-8 sm:px-10 md:w-fit pt-8 sm:pt-10">
                <Flex gap={5} align="center">
                    <Text className="text-2xl font-medium text-nowrap">
                        {subscriptionBanner[0].bannerTitle || 'Upgrade to '}
                    </Text>
                    <Image
                        src={PekoPlus}
                        preview={false}
                        height={32}
                        width={80}
                        className="object-contain pb-1"
                    />
                </Flex>

                <Typography
                    className="max-w-xl text-xs font-normal xxl:max-w-lg"
                    style={{ lineHeight: '1.4rem' }}
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(description),
                    }}
                />
                <Flex className="pb-7">
                    <Link to={paths.dashboard.plans}>
                        <Button danger type="primary" className="w-32 font-medium">
                            {subscriptionBanner[0].buttonText || 'Get Started'}
                        </Button>
                    </Link>
                </Flex>
            </Flex>
            <Flex className="hidden sm:flex sm:w-6/12 justify-end h-full md:w-fi pr-2 md:pr-8 sm:-my-10">
                <Image
                    src={subscriptionBanner[0]?.bannerImage || DashboardSnap}
                    preview={false}
                    className="rounded-br-xl"
                    width={250}
                    height={250}
                />
            </Flex>
        </Flex>
    );
};

export default PekoOneHeader;
