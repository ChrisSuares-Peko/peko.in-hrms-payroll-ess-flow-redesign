import React from 'react';

import { Button, Flex, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import callIcon from '@domains/dashboard/Invoice/assets/details.svg';
import ServiceUnavailable from '@src/domains/failed/pages/ServiceUnavailable';
import { paths } from '@src/routes/paths';

import { useGetDetailsSubscription } from '../../hooks/useGetDetailsSubscription';
import ConversationCharges from '../ConversationCharges';

const { Text } = Typography;

type Props = {
    title: string;
    serviceKey?: string;
    packageName?: string;
    subDescription?: string;
    serviceName: string;
    svgIcon?: string;
    features?: any[];
    children?: React.ReactNode;
    serviceDetails: string;
    packageDetails?: any;
};

const WebSubscription = ({
    serviceKey,
    title,
    serviceName,
    svgIcon,
    features,
    packageName,
    subDescription,
    children,
    serviceDetails,
    packageDetails,
}: Props) => {
    const navigate = useNavigate();
    const { data, isLoading } = useGetDetailsSubscription({ accessKey: serviceKey });

    if (isLoading) {
        return <Skeleton loading active />;
    }

    if (!data || Object.keys(data).length === 0) {
        return <ServiceUnavailable />;
    }
    const formatTitleWithLineBreaks = (mainTitle: string, breakCharacter: string = '|') =>
        mainTitle.split(breakCharacter).map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index !== title.split(breakCharacter).length - 1 && <br />}
            </React.Fragment>
        ));
    return (
        <Content>
            <Row gutter={[32, 16]}>
                <span className="md:-ml-8 md:-mr-8">
                    <Flex vertical gap={30}>
                        <Flex className="w-full px-24" align="center" justify="center">
                            <Text
                                className="text-4xl font-semibold"
                                style={{
                                    textAlign: 'center',
                                }}
                            >
                                {formatTitleWithLineBreaks(title, '|')}
                            </Text>
                        </Flex>

                        {children}
                        <Flex className="w-full px-24" align="center" justify="center">
                            <Text
                                className="text-[#383838]"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '16px',
                                    lineHeight: '1.6',
                                }}
                            >
                                {serviceDetails}
                            </Text>
                        </Flex>
                        <Flex className="w-full " align="center" justify="center">
                            <Text
                                className="text-[#000] font-semibold"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '20px',
                                    lineHeight: '1.6',
                                }}
                            >
                                {subDescription}
                            </Text>
                        </Flex>

                        <Flex className="w-full " align="center" justify="center">
                            <Flex vertical>
                                <Flex gap={15}>
                                    <Button
                                        key="submit"
                                        type="primary"
                                        danger
                                        className="h-10 md:px-6"
                                        size="large"
                                        onClick={() => {
                                            if (typeof Moengage?.track_event === 'function') {
                                                Moengage.track_event('whatsapp_subscribe_clicked');
                                            }
                                            navigate(`${paths.whatsappForBusiness.planDetails}`);
                                        }}
                                    >
                                        Subscribe Now
                                    </Button>
                                </Flex>

                                <Flex className="justify-center mt-5" gap={5}>
                                    <ReactSVG src={callIcon} />
                                    <a
                                        href="tel:02248930373"
                                        style={{ color: 'inherit', textDecoration: 'none' }}
                                    >
                                        <Text className="text-lightRed xs:text-xs md:text-sm">
                                            Request for demo
                                        </Text>
                                    </a>
                                </Flex>
                            </Flex>
                        </Flex>
                        <ConversationCharges />
                    </Flex>
                </span>
            </Row>
        </Content>
    );
};

export default WebSubscription;
