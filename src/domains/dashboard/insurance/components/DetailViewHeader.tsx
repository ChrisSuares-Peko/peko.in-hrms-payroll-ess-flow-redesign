import React from 'react';

import { Col, Flex, Image, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { ReactSVG } from 'react-svg';

import shareIcon from '@domains/dashboard/insurance/assets/svg/ShareAlt.svg';

const { Text, Title } = Typography;

interface ViewPageProps {
    logo: string;
    title: string;
    description: string;
}
const DetailViewHeader = ({ logo, title, description }: ViewPageProps) => (
    <Col span={24} className="flex sm:flex-row flex-col justify-between items-center">
        <Flex align="center" className="flex sm:flex-row flex-col" gap={30}>
            <Image src={logo} preview={false} height={80} className="w-full" />
            <Content>
                <Title level={4}>{title}</Title>
                <Text className="text-gray-400 font-normal   text-base">{description}</Text>
            </Content>
        </Flex>
        <Flex gap="small" className="cursor-pointer mt-6 sm:mt-0">
            <ReactSVG src={shareIcon} />
            <Text className="font-medium text-base ">Share</Text>
        </Flex>
    </Col>
);

export default DetailViewHeader;
