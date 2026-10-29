import React from 'react';

import { Col, Empty, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import AboutSection from '@src/domains/dashboard/Subscriptions/components/subscriptionDetails/AboutSection';
import SelectPlanSection from '@src/domains/dashboard/Subscriptions/components/subscriptionDetails/SelectPlanSection';

import FeaturesSection from '../components/subscriptionDetails/FeaturesSection';
import GetUserDetails from '../hooks/useGetUserDetailsApi';
import GetPlanDetails from '../hooks/usePlanDetailsApi';
import GetSingleSubscriptionDetails from '../hooks/useSubscriptionDetailsApi';
import { setSubscriptionDetails, setUserDetails } from '../slice/paymentSlice';
import { PlanDetailsTable } from '../types/types';
import '@domains/dashboard/Subscriptions/assets/styles/styles.css';

const { Title } = Typography;

function SubscriptionsDetailedView() {
    const dispatch = useDispatch();
    const { id } = useParams();
    let data;
    let planData: PlanDetailsTable | undefined;
    let isLoading;

    if (id) {
        ({ data, isLoading } = GetSingleSubscriptionDetails(id));
        ({ planData } = GetPlanDetails(id));
        dispatch(setSubscriptionDetails(data));
    }
    const { userData } = GetUserDetails();
    dispatch(setUserDetails(userData));

    return (
        <Content className="mb-20 mt-14">
            <Row gutter={[20, 20]}>
                {isLoading ? (
                    <Col span={24}>
                        <Skeleton active avatar />
                    </Col>
                ) : (
                    <>
                        <AboutSection
                            name={data?.data.name}
                            description={data?.data.description}
                            productImage={data?.data.image}
                        />
                        <FeaturesSection feature={data?.data.features} />
                        <Col span={24} className="">
                            <Title level={5} className="mt-6">
                                Choose a Plan
                            </Title>
                            {planData?.length === 0 ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={<span>No Data</span>}
                                />
                            ) : (
                                <Row
                                    gutter={[20, 20]}
                                    justify="start"
                                    className="equal-height-cards "
                                >
                                    {planData?.map((item, i) => (
                                        <Col
                                            key={i}
                                            xs={24}
                                            sm={12}
                                            md={12}
                                            lg={12}
                                            xl={8}
                                            xxl={6}
                                            className="mt-6 "
                                        >
                                            <SelectPlanSection
                                                id={item.id}
                                                title={item.title}
                                                period={item.period}
                                                noOfUser={item.noOfUsers}
                                                amount={item.amount}
                                                monthlyCost={item.monthlyCost}
                                                features={item.features}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </Col>
                    </>
                )}
            </Row>
        </Content>
    );
}

export default SubscriptionsDetailedView;
