import React from 'react';

import { Col, Row, Skeleton, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import HeaderBanner from '../components/HeaderBanner';
import HomePageHeader from '../components/HomePageHeader';
import VerificationCard from '../components/VerificationCard';
import VerificationLimitBar from '../components/VerificationLimitBar';
import useGetAllPrice from '../hooks/useGetPriceApi';
import useGetVerificationAddOns from '../hooks/useGetVerificationAddOns';
import useGetVerificationCount from '../hooks/useGetVerificationCount';
import useVerificationPlan from '../hooks/useVerificationPlan';
import { IdentityVerificationItem } from '../types';
import { businessVerification, identityVerification } from '../utils/data';

const HomePage = () => {
    const navigate = useNavigate();
    const { loading, priceData: availableServices } = useGetAllPrice();
    const { countData, loading: countLoading, refresh: refreshCount } = useGetVerificationCount();
    const {
        addOnsData,
        loading: addOnsLoading,
        refresh: refreshAddOns,
    } = useGetVerificationAddOns();
    const { plan } = useVerificationPlan();

    const filteredIdentityVerification = identityVerification.filter(
        item => !!availableServices?.[item.accessKey]
    );
    const filteredBusinessVerification = businessVerification.filter(
        item => !!availableServices?.[item.accessKey]
    );

    const handleModalClose = () => {
        refreshCount();
        refreshAddOns();
    };

    return (
        <>
            <HomePageHeader />
            <HeaderBanner />
            <VerificationLimitBar
                countData={countData}
                maxLimit={addOnsData?.maxLimit}
                loading={countLoading || addOnsLoading}
                showUpgradeButton={!!plan}
            />
            {loading ? (
                <Skeleton />
            ) : (
                <>
                    <Row gutter={[17, 17]} className="mt-3">
                        <Col span={24}>
                            <Typography.Text
                                className="text-lg font-medium"
                                onClick={() =>
                                    navigate(paths.verificationSuite.verificationHistory)
                                }
                            >
                                Identity Verification
                            </Typography.Text>
                        </Col>
                        {filteredIdentityVerification.map((item: IdentityVerificationItem) => (
                            <Col xs={24} md={12} xl={6} key={item.accessKey || item.title}>
                                <VerificationCard
                                    title={item.title}
                                    desc={item.desc}
                                    logo={item.logo}
                                    inputComponents={item.inputComponents}
                                    accessKeys={item.accessKey}
                                    serviceName={item.serviceName}
                                    exhausted={countData?.exhausted}
                                    maxLimit={addOnsData?.maxLimit}
                                    onModalClose={handleModalClose}
                                />
                            </Col>
                        ))}
                    </Row>
                    <Row gutter={[17, 17]} className="mt-6">
                        <Col span={24}>
                            <Typography.Text className="text-lg font-medium">
                                Business Verification
                            </Typography.Text>
                        </Col>
                        {filteredBusinessVerification.map((item: any) => (
                            <Col xs={24} md={12} xl={6} key={item.accessKey || item.title}>
                                <VerificationCard
                                    title={item.title}
                                    desc={item.desc}
                                    logo={item.logo}
                                    inputComponents={item.inputComponents}
                                    accessKeys={item.accessKey}
                                    serviceName={item.serviceName}
                                    exhausted={countData?.exhausted}
                                    maxLimit={addOnsData?.maxLimit}
                                    onModalClose={handleModalClose}
                                />
                            </Col>
                        ))}
                    </Row>
                </>
            )}
        </>
    );
};

export default HomePage;
