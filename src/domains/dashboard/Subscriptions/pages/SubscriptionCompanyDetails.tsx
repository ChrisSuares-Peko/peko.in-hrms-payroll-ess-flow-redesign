import React from 'react';

import { Col, Row, Skeleton } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import CompanyDetails from '@src/domains/dashboard/Subscriptions/components/subscriptionSummary/CompanyDetails';
import PlanSummaryCard from '@src/domains/dashboard/Subscriptions/components/subscriptionSummary/PlanSummaryCard';

import GetSingleSelectedPlanDetails from '../hooks/useSelectedPlanDetailsApi';
import { setAmount, setPlanId } from '../slice/paymentSlice';

function SubscriptionCompanyDetails() {
    const dispatch = useDispatch();
    const { id } = useParams();
    let data;
    let isLoading;
    if (id) {
        ({ data, isLoading } = GetSingleSelectedPlanDetails(id));
        dispatch(setAmount(data?.data?.price || ''));
        dispatch(setPlanId(id));
    }

    return (
        <Content className="mb-20 mt-14">
            <Row gutter={[40, 20]}>
                {isLoading ? (
                    <Col span={24}>
                        <Skeleton active avatar />
                    </Col>
                ) : (
                    <>
                        <PlanSummaryCard
                            id={data?.data?.id}
                            name={data?.data?.name}
                            validity={data?.data?.validity}
                            subscriptionType={data?.data?.subscriptionType}
                            price={data?.data?.price}
                            features={data?.data?.features}
                        />
                        <CompanyDetails />
                    </>
                )}
            </Row>
        </Content>
    );
}

export default SubscriptionCompanyDetails;
