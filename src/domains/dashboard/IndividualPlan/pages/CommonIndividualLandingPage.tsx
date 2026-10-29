import React, { useEffect, useState } from 'react';

import { Button, Col, Flex, Image, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import PekoOne from '@assets/PekoOne.png';
import voucher from '@assets/svg/voucher.svg';
// import sideArrow from '@domains/dashboard/Payroll/assets/images/purchase-page/sideArrow.svg';
import { FRONTEND_BASE_URL } from '@src/config-global';
import { PlanType } from '@src/domains/dashboard/plans/types';
import ServiceUnavailable from '@src/domains/failed/pages/ServiceUnavailable';
import { paths } from '@src/routes/paths';

import PlansCompareTable from '../components/PlansCompareTable';
import SwitchPlan from '../components/SwitchPlan';
import { useGetDetailsSubscription } from '../hooks/useGetDetailsSubscription';
import { featureType } from '../types';

type Props = {
    title: string;
    serviceKey?: string;
    packageName?: string;
    description: string;
    subDescription?: string;
    serviceName: string;
    svgIcon: string;
    features: featureType[];
};

const CommonIndividualLandingPage = ({
    serviceKey,
    title,
    description,
    serviceName,
    svgIcon,
    features,
    packageName,
    subDescription,
}: Props) => {
    const navigate = useNavigate();
    const { subscriptionData, isLoading } = useGetDetailsSubscription(serviceKey!);
    const data = subscriptionData?.packageDetails[0];
    const [selectedType, setSelectedType] = useState<PlanType>(PlanType.Monthly);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [openVoucherModal, setOpenModal] = useState(false);

    useEffect(() => {
        const storedUrl = sessionStorage.getItem('PurchaseUrl');
        if (storedUrl) {
            const { planType } = JSON.parse(storedUrl);
            if (planType) setSelectedType(planType);
        }
        return () => {
            if (
                window.location.href !==
                `${FRONTEND_BASE_URL}/${paths.plans.index}/${paths.plans.reviewOrder}`
            ) {
                sessionStorage.removeItem('PurchaseUrl');
            }
        };
    }, []);

    const handleChange = (tab: PlanType) => {
        setSelectedType(tab);
    };
    if (isLoading) {
        return <Skeleton loading active />;
    }

    if (!data || Object.keys(data).length === 0) {
        return <ServiceUnavailable />;
    }
    return (
        <Content className="xl:px-14">
            <Row>
                <Col xl={12}>
                    <Flex vertical gap={30}>
                        <Typography.Text className="text-3xl font-semibold">
                            {title}
                        </Typography.Text>
                        <Typography.Text className="w-5/6 text-base text-textGreyColor">
                            {description}
                        </Typography.Text>
                        <Col span={24} className="flex flex-wrap justify-center sm:justify-start">
                            {data?.packagePrices ? (
                                <SwitchPlan
                                    handleChange={handleChange}
                                    selectedType={selectedType}
                                    price={data?.packagePrices}
                                    discount={data?.discount}
                                />
                            ) : (
                                <Skeleton />
                            )}
                        </Col>
                        <div>
                            <Flex gap={30} className="justify-center sm:justify-start">
                                <Button
                                    key="submit"
                                    type="primary"
                                    danger
                                    className="h-10 px-6"
                                    size="large"
                                    onClick={() => {
                                        const currentPageUrl = window.location.href;
                                        const details = {
                                            url: currentPageUrl,
                                            service: serviceName,
                                            planType: selectedType,
                                        };
                                        sessionStorage.setItem(
                                            'PurchaseUrl',
                                            JSON.stringify(details)
                                        );
                                        sessionStorage.setItem(
                                            'PlanDetails',
                                            JSON.stringify({
                                                planId: data?.id,
                                                selectedType,
                                                isAddOns: false,
                                            })
                                        );
                                        navigate(
                                            `/${paths.plans.index}/${paths.plans.reviewOrder}`,
                                            {
                                                state: {
                                                    planId: data?.id,
                                                    selectedType,
                                                    isAddOns: false,
                                                },
                                            }
                                        );
                                    }}
                                >
                                    Purchase {serviceName}
                                </Button>

                                <Button key="back" className="h-10 px-10" size="large" danger>
                                    <Link to={`/${paths.plans.index}`}>Get Peko One</Link>
                                </Button>
                            </Flex>
                            <Flex
                                align="center"
                                gap={5}
                                className="mt-5 justify-center sm:justify-start sm:ml-32 cursor-pointer"
                                onClick={() => setOpenModal(true)}
                            >
                                <ReactSVG src={voucher} />
                                <Typography.Text>I have a voucher code</Typography.Text>
                            </Flex>
                        </div>
                    </Flex>
                </Col>
                <Col xl={12} className="justify-center hidden xl:flex ">
                    <Image src={svgIcon} preview={false} height="20rem" />
                </Col>
            </Row>
            {features && features.length > 0 ? (
                <Col span={24} className="px-0 my-16 xl:px-10 xxl:px-40">
                    <Flex vertical className="w-full text-center">
                        <Typography.Text className="text-2xl font-semibold">
                            Key Features
                        </Typography.Text>
                        <Typography.Text className="text-lg font-normal text-[#757575]">
                            {/* {`${subDescription || 'Smart tools for efficient and personalized management'}`} */}
                            {`${subDescription || ''}`}
                        </Typography.Text>
                    </Flex>
                    <div className="grid my-16 md:grid-cols-2 gap-x-10 gap-y-8">
                        {features.map((feature, index) => (
                            <Flex
                                key={index}
                                className="p-6 duration-300 ease-in-out transform shadow-sm rounded-xl "
                                gap={20}
                            >
                                <ReactSVG src={feature.icon} className="pt-2" />
                                <Flex vertical gap={10}>
                                    <Typography.Text className="text-lg font-semibold">
                                        {feature.title}{' '}
                                    </Typography.Text>

                                    <Typography.Text className="text-base font-normal text-[#425466]">
                                        {feature.description}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        ))}
                    </div>
                    {/* <Flex align="center" justify="center" className="w-full text-center ">
                        <Typography.Text className="mr-3 text-base text-bgOrange2">
                            Know complete feature of {serviceName}
                        </Typography.Text>
                        <ReactSVG src={sideArrow} />
                        <ReactSVG src={sideArrow} />
                    </Flex> */}
                    <Flex
                        align="center"
                        justify="center"
                        gap={10}
                        wrap="wrap"
                        className="w-full my-3 mt-16 text-center"
                    >
                        <Typography.Text className="text-2xl ">
                            Upgrade to{' '}
                            <Image
                                src={PekoOne}
                                preview={false}
                                className=""
                                style={{ width: '100%', height: '100%', maxHeight: '1.3rem' }}
                            />
                        </Typography.Text>

                        <Typography.Text className="text-2xl">
                            and save on all services
                        </Typography.Text>
                    </Flex>
                </Col>
            ) : (
                <Col className="my-10"> </Col>
            )}
            <Col>
                <PlansCompareTable />
            </Col>
        </Content>
    );
};

export default CommonIndividualLandingPage;
