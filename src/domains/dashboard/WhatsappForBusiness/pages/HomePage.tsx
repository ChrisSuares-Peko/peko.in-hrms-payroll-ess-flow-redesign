import React, { useEffect, useState } from 'react';

import { Col, Row, Skeleton } from 'antd';
import { Content } from 'antd/es/layout/layout';

import LandingPageImg from '@domains/dashboard/Payroll/assets/images/landingicon.svg';
import useScreenSize from '@src/hooks/useScreenSize';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import LandingPage from './LandingPage';
import AdaptiveSubscription from '../components/subscription/AdaptiveSubscription';
import FeatureCard from '../components/subscription/FeatureCard';
import FeatureCardMob from '../components/subscription/FeatureCardMob';
import WebSubscription from '../components/subscription/WebSubscription';
import { useCreateBusinessProfileApi } from '../hooks/useCreateBusinessProfile';
import { features, serviceDetails, subDescription } from '../utils/index';

const HomePage = () => {
    const { BusinessProfile } = useCreateBusinessProfileApi();
    const [isPurchased, setIsPurchased] = useState<boolean | null>(null); // Set initial state to null (unknown state)
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        BusinessProfile(setIsPurchased);
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { xs } = useScreenSize();

    if (isLoading || isPurchased === null) {
        // Check if loading or still determining purchase status
        return <Skeleton active />;
    }

    return !isPurchased ? (
        <Content style={{ maxWidth: '1500px', margin: '0 auto', padding: '0 20px' }}>
            {xs ? (
                <AdaptiveSubscription
                    features={features}
                    serviceKey={packageAccessKeys['Whatsapp for Business']}
                    serviceName="Whatsapp for business"
                    svgIcon={LandingPageImg}
                    title="Reach customers directly on WhatsApp – boost engagement, drive sales, and provide seamless support"
                    serviceDetails={serviceDetails}
                    subDescription={subDescription}
                >
                    <Row gutter={[15, 15]}>
                        {features.map((feature, index) => (
                            <Col xs={12} key={index}>
                                <FeatureCardMob
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.description}
                                />
                            </Col>
                        ))}
                    </Row>
                </AdaptiveSubscription>
            ) : (
                <WebSubscription
                    features={features}
                    serviceKey={packageAccessKeys['Whatsapp for Business']}
                    serviceName="Whatsapp for business"
                    svgIcon={LandingPageImg}
                    title="Reach customers directly on WhatsApp – boost engagement, drive sales, and provide seamless support"
                    serviceDetails={serviceDetails}
                    subDescription={subDescription}
                >
                    <Row className="gap-10" justify="center">
                        {features.map((feature, index) => (
                            <Col className="" key={index} xs={8} md={8} xl={7} xxl={4}>
                                <FeatureCard
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.description}
                                />
                            </Col>
                        ))}
                    </Row>
                </WebSubscription>
            )}
        </Content>
    ) : (
        <LandingPage />
    );
};

export default HomePage;
