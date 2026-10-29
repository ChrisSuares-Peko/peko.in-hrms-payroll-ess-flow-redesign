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

const AdaptiveSubscription = ({
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
            <Row gutter={[32, 0]}>
                <span>
                    <Flex vertical gap={30}>
                        <Flex className="w-full" align="center" justify="center">
                            <Text
                                className="font-semibold"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '18px',
                                }}
                            >
                                {formatTitleWithLineBreaks(title, '|')}
                            </Text>
                        </Flex>
                        <Flex className="w-full" align="center" justify="center">
                            <Flex vertical align="center" gap={20} className="w-full">
                                <Flex wrap="wrap" justify="center" gap={12} className="w-full">
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

                                    {/* Hidden — desktop (WebSubscription) doesn't show this CTA, keeping the mobile view consistent */}
                                    {/* <Button
                                        key="back"
                                        className="h-10 md:px-10"
                                        size="large"
                                        danger
                                    >
                                        <Link to={`/${paths.plans.index}`}>Get Peko Plus</Link>
                                    </Button> */}
                                </Flex>

                                <Flex justify="center" align="center" gap={5}>
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

                        {children}
                        <Flex className="w-full " align="center" justify="center">
                            <Text
                                className="text-[#383838]"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '14px',
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
                                    fontSize: '16px',
                                    lineHeight: '1.6',
                                }}
                            >
                                {subDescription}
                            </Text>
                        </Flex>
                        <ConversationCharges />
                    </Flex>
                </span>
            </Row>
        </Content>
    );
};

export default AdaptiveSubscription;
