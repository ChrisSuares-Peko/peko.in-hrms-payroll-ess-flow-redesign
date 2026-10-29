/* eslint-disable react/no-unused-prop-types */
import React, { useEffect, useState } from 'react';

import { Button, Col, Flex, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import callIcon from '@domains/dashboard/Invoice/assets/details.svg';
import { FRONTEND_BASE_URL } from '@src/config-global';
import { PlanType } from '@src/domains/dashboard/plans/types';
import { PLAN_DETAILS_SESSION_KEY } from '@src/domains/dashboard/plans/utils';
import { paths } from '@src/routes/paths';

import PricingTable from '../../Invoice/components/PricingTable';
import SwitchPlan from '../components/SwitchPlan';
import { featureType, PackageDetails } from '../types';

type Props = {
    title: string;
    subDescription?: string;
    serviceName: string;
    serviceKey?: string;
    svgIcon?: string;
    features?: featureType[];
    children?: React.ReactNode;
    serviceDetails: string;
    packageDetails?: PackageDetails;
    invoiceCommissionData?: {
        isPercentage: boolean;
        charge: string;
        fixedSurcharge: number;
        uaeCardsCharge: number;
        internationalCardsCharge: number;
    };
    onContinue?: () => void;
};

const AdaptiveCommonLandingPage = ({
    title,
    serviceName,
    subDescription,
    children,
    serviceDetails,
    invoiceCommissionData,
    packageDetails,
    onContinue,
}: Props) => {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState<PlanType>(PlanType.Monthly);

    useEffect(() => {
        const planData = sessionStorage.getItem(PLAN_DETAILS_SESSION_KEY);
        if (planData) {
            const { selectedType: planType } = JSON.parse(planData);
            if (planType) setSelectedType(planType);
        }
        return () => {
            if (
                window.location.href !==
                `${FRONTEND_BASE_URL}/${paths.plans.index}/${paths.plans.reviewOrder}`
            ) {
                sessionStorage.removeItem(PLAN_DETAILS_SESSION_KEY);
            }
        };
    }, []);

    const handleChange = (tab: PlanType) => {
        setSelectedType(tab);
    };

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
                            <Typography.Text
                                className="font-semibold"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '15px',
                                }}
                            >
                                {formatTitleWithLineBreaks(title, '|')}
                            </Typography.Text>
                        </Flex>

                        {children}
                        <Flex className="w-full " align="center" justify="center">
                            <Typography.Text
                                className="text-[#383838]"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '12.5px',
                                    lineHeight: '1.6',
                                }}
                            >
                                {serviceDetails}
                            </Typography.Text>
                        </Flex>
                        <Flex className="w-full " align="center" justify="center">
                            <Typography.Text
                                className="text-[#000] font-semibold"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '16px',
                                    lineHeight: '1.6',
                                }}
                            >
                                {subDescription}
                            </Typography.Text>
                        </Flex>

                        {!onContinue && (
                            <Col xs={24} sm={24}>
                                {packageDetails?.packagePrices ? (
                                    <SwitchPlan
                                        handleChange={handleChange}
                                        selectedType={selectedType}
                                        price={packageDetails?.packagePrices}
                                        discount={packageDetails?.discount}
                                    />
                                ) : (
                                    <Skeleton />
                                )}
                            </Col>
                        )}

                        <Flex className="w-full " align="center" justify="center">
                            <Flex vertical>
                                <Flex gap={15}>
                                    {onContinue ? (
                                        <>
                                            <Button
                                                key="continue"
                                                type="primary"
                                                danger
                                                className="h-10 md:px-10"
                                                size="large"
                                                onClick={onContinue}
                                            >
                                                Continue
                                            </Button>
                                            <Button
                                                key="back"
                                                className="h-10 md:px-10"
                                                size="large"
                                                danger
                                                onClick={() => {
                                                    onContinue();
                                                    navigate(`/${paths.plans.index}`);
                                                }}
                                            >
                                                View Plans
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                key="submit"
                                                type="primary"
                                                danger
                                                className="h-10 md:px-6"
                                                size="large"
                                                onClick={() => {
                                                    const currentPageUrl = window.location.href;
                                                    sessionStorage.setItem(
                                                        PLAN_DETAILS_SESSION_KEY,
                                                        JSON.stringify({
                                                            url: currentPageUrl,
                                                            service: serviceName,
                                                            planId: packageDetails?.id,
                                                            selectedType,
                                                            isAddOns: false,
                                                        })
                                                    );
                                                    navigate(
                                                        `/${paths.plans.index}/${paths.plans.reviewOrder}`
                                                    );
                                                }}
                                            >
                                                Subscribe Now
                                            </Button>

                                            <Button
                                                key="back"
                                                className="h-10 md:px-10"
                                                size="large"
                                                danger
                                            >
                                                <Link to={`/${paths.plans.index}`}>
                                                    Get Peko Plus
                                                </Link>
                                            </Button>
                                        </>
                                    )}
                                </Flex>

                                {!onContinue && (
                                    <Flex className="justify-center mt-5" gap={5}>
                                        <ReactSVG src={callIcon} />
                                        <a
                                            href="tel:02248930373"
                                            style={{ color: 'inherit', textDecoration: 'none' }}
                                        >
                                            <Typography.Text className="text-lightRed xs:text-xs md:text-sm">
                                                Request for demo
                                            </Typography.Text>
                                        </a>
                                    </Flex>
                                )}
                            </Flex>
                        </Flex>
                    </Flex>
                    {serviceName === 'Invoicing' && invoiceCommissionData ? (
                        <Col>
                            <PricingTable
                                commissionFlatAmount={Number(invoiceCommissionData.fixedSurcharge)}
                                uaeCardsCharge={Number(invoiceCommissionData.uaeCardsCharge)}
                                internationalCardsCharge={Number(
                                    invoiceCommissionData.internationalCardsCharge
                                )}
                            />
                        </Col>
                    ) : (
                        ''
                    )}
                </span>
            </Row>
        </Content>
    );
};

export default React.memo(AdaptiveCommonLandingPage);
